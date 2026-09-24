from typing import List
from uuid import UUID, uuid4
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo, dict_to_user_model
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Application, User, ApplicationTemplate, PaidLeaveLedger
from app.models.leave import LeaveLedger
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationUpdate
from app.services.workflow import approve_application, reject_application, dict_to_application_model, _load_relations
from app.services.auditor import auditor

router = APIRouter(redirect_slashes=False)


async def _find_application_item_full(repo: DynamoDBRepository, application_id: str):
    table = await repo.get_table()
    response = await table.scan()
    items = response.get("Items", [])
    for item in items:
        if item.get("SK") == f"APP#{application_id}" or item.get("id") == application_id:
            return item
    return None


@router.get("/", response_model=List[ApplicationResponse])
async def get_all_applications(
    status: str | None = None,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    全ての申請を取得します。（管理者・マネージャー用）
    """
    if current_user.role.lower() not in ["admin", "manager"]:
        if status != "Approved":
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # 全スキャンして APP# を探す
    table = await repo.get_table()
    scan_res = await table.scan()
    items = scan_res.get("Items", [])
    
    applications = []
    for item in items:
        if item.get("SK", "").startswith("APP#"):
            if status and item.get("status") != status:
                continue
            app_obj = dict_to_application_model(item)
            await _load_relations(repo, app_obj)
            applications.append(app_obj)

    # 作成日時の降順ソート
    applications.sort(key=lambda x: x.created_at or datetime.min, reverse=True)

    # 動的テンプレートのマッピング処理
    for app in applications:
        if app.template and app.template.schema_definition:
            mapped = app.input_data.copy()
            should_update = False
            for item in app.template.schema_definition:
                target_field = None
                name = None
                if isinstance(item, dict):
                    target_field = item.get("target_field")
                    name = item.get("name")
                else:
                    target_field = getattr(item, "target_field", None)
                    name = getattr(item, "name", None)

                if target_field and name in mapped:
                    mapped[target_field] = mapped[name]
                    should_update = True
            
            if should_update:
                app.input_data = mapped

    return applications


@router.get("/my-applications", response_model=List[ApplicationResponse])
async def get_my_applications(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    ログインユーザー自身の申請履歴を取得します。
    """
    pk = f"USER#{current_user.cognito_sub}"
    items = await repo.query_items_by_pk_and_sk_prefix(pk, "APP#")
    
    applications = []
    for item in items:
        app_obj = dict_to_application_model(item)
        await _load_relations(repo, app_obj)
        applications.append(app_obj)

    applications.sort(key=lambda x: x.created_at or datetime.min, reverse=True)

    for app in applications:
        if app.template and app.template.schema_definition:
            mapped = app.input_data.copy()
            should_update = False
            for item in app.template.schema_definition:
                target_field = None
                name = None
                if isinstance(item, dict):
                    target_field = item.get("target_field")
                    name = item.get("name")
                else:
                    target_field = getattr(item, "target_field", None)
                    name = getattr(item, "name", None)

                if target_field and name in mapped:
                    mapped[target_field] = mapped[name]
                    should_update = True
            
            if should_update:
                app.input_data = mapped

    return applications


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application_by_id(
    application_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    特定の申請を取得します。
    """
    item = await _find_application_item_full(repo, str(application_id))
    if not item:
        raise HTTPException(status_code=404, detail="Application not found")
        
    application = dict_to_application_model(item)
    await _load_relations(repo, application)
    
    if current_user.role.lower() not in ["admin", "manager"] and str(application.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return application


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application_in: ApplicationCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    新しい申請を作成します。
    """
    temp_pk = f"APP_TEMP#{application_in.template_id}"
    template_item = await repo.get_item(temp_pk, "METADATA")
    if not template_item:
        raise HTTPException(status_code=404, detail="Template not found")

    schema = template_item.get("schema_definition", [])
    try:
        import jsonschema
        if isinstance(schema, list):
            properties = {}
            required_fields = []
            for item in schema:
                if isinstance(item, dict):
                    name = item.get("name")
                    itype = item.get("type")
                    irequired = item.get("required", False)
                else:
                    name = getattr(item, "name", None)
                    itype = getattr(item, "type", "text")
                    irequired = getattr(item, "required", False)

                if name:
                    if itype == "time":
                         field_schema = {"type": ["string", "number", "integer"]}
                    else:
                         field_schema = {"type": "string"}
                    properties[name] = field_schema
                    if irequired:
                        required_fields.append(name)
            
            schema_dict = {
                "type": "object",
                "properties": properties,
                "required": required_fields,
                "additionalProperties": True 
            }
        else:
            schema_dict = schema

        jsonschema.validate(instance=application_in.input_data, schema=schema_dict)
    except ImportError:
        print("Warning: jsonschema module not found. Skipping validation.")
    except jsonschema.ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input data: {e.message}")

    is_paid_leave = False
    if application_in.type in ["PaidLeave", "有給休暇申請"]:
        is_paid_leave = True
    elif template_item.get("name") in ["PaidLeave", "有給休暇申請"]:
        is_paid_leave = True
        
    if is_paid_leave:
        input_data = application_in.input_data
        start_date_str = input_data.get("leave_start_date") or input_data.get("開始日")
        end_date_str = input_data.get("leave_end_date") or input_data.get("終了日")
        leave_type = input_data.get("leave_type") or input_data.get("休暇タイプ") or "FullDay"
        
        if isinstance(schema, list):
            for item in schema:
                if isinstance(item, dict):
                    target_field = item.get("target_field")
                    name = item.get("name")
                else:
                    target_field = getattr(item, "target_field", None)
                    name = getattr(item, "name", None)
                
                if target_field and name in input_data:
                    if target_field == "leave_start_date":
                        start_date_str = input_data[name]
                    elif target_field == "leave_end_date":
                        end_date_str = input_data[name]
                    elif target_field == "leave_type":
                        leave_type = input_data[name]

        if start_date_str and end_date_str:
            try:
                if isinstance(start_date_str, str):
                    start_date = date.fromisoformat(start_date_str)
                else:
                    start_date = start_date_str
                if isinstance(end_date_str, str):
                    end_date = date.fromisoformat(end_date_str)
                else:
                    end_date = end_date_str
            except ValueError:
                raise HTTPException(status_code=400, detail="日付形式が正しくありません。 (YYYY-MM-DD)")

            days = (end_date - start_date).days + 1
            if leave_type in ["HalfDayMorning", "HalfDayAfternoon", "午前半休", "午後半休"]:
                days_to_deduct = float(days) * 0.5
            else:
                days_to_deduct = float(days)

            # 有給台帳を取得
            pk = f"USER#{current_user.cognito_sub}"
            ledger_items = await repo.query_items_by_pk_and_sk_prefix(pk, "LEAVE_LEDGER#")
            
            # 有効な有給台帳の合算
            # ここでは leave_type_id は有給休暇のID
            # 有給休暇の LeaveType ID を特定
            leave_types = await repo.scan_items_by_type("LEAVE_TYPE#", "METADATA")
            paid_leave_type_id = None
            for lt in leave_types:
                if lt.get("name") == "有給休暇":
                    paid_leave_type_id = lt.get("id")
                    break
            
            total_granted = 0.0
            total_used = 0.0
            for item in ledger_items:
                if item.get("leave_type_id") == paid_leave_type_id:
                    expire_d = date.fromisoformat(item["expire_date"])
                    if expire_d >= start_date:
                        total_granted += float(item.get("days_granted", 0.0))
                        total_used += float(item.get("days_used", 0.0))
                        
            current_remaining = total_granted - total_used

            # 承認待ち (Pending) の申請を合算
            app_items = await repo.query_items_by_pk_and_sk_prefix(pk, "APP#")
            pending_days = 0.0
            for app_item in app_items:
                if app_item.get("status") == "Pending" and app_item.get("type") in ["PaidLeave", "有給休暇申請"]:
                    p_data = app_item.get("input_data", {})
                    p_start_str = p_data.get("leave_start_date") or p_data.get("開始日")
                    p_end_str = p_data.get("leave_end_date") or p_data.get("終了日")
                    p_type = p_data.get("leave_type") or p_data.get("休暇タイプ") or "FullDay"
                    
                    if p_start_str and p_end_str:
                        try:
                            p_start = date.fromisoformat(p_start_str) if isinstance(p_start_str, str) else p_start_str
                            p_end = date.fromisoformat(p_end_str) if isinstance(p_end_str, str) else p_end_str
                            p_days = (p_end - p_start).days + 1
                            if p_type in ["HalfDayMorning", "HalfDayAfternoon", "午前半休", "午後半休"]:
                                pending_days += float(p_days) * 0.5
                            else:
                                pending_days += float(p_days)
                        except Exception:
                            pass

            if current_remaining - (pending_days + days_to_deduct) < 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"有給休暇の残日数が不足しています。（残日数: {current_remaining}日, 申請中: {pending_days}日, 今回申請: {days_to_deduct}日）"
                )

    app_id = str(uuid4())
    pk = f"USER#{current_user.cognito_sub}"
    sk = f"APP#{app_id}"
    created_at_str = datetime.utcnow().isoformat()
    
    new_item = {
        "PK": pk,
        "SK": sk,
        "id": app_id,
        "user_id": str(current_user.id),
        "template_id": str(application_in.template_id),
        "type": application_in.type,
        "status": "Pending",
        "input_data": application_in.input_data,
        "created_at": created_at_str
    }
    
    await repo.put_item(new_item)
    app_obj = dict_to_application_model(new_item)
    await _load_relations(repo, app_obj)

    # Audit Log
    await auditor.record_audit_log(
        db=repo,
        event_type="APPLICATION_CREATED",
        user_id=current_user.id,
        target_resource_type="Application",
        target_resource_id=app_id,
        details={"type": application_in.type},
        result="Success"
    )

    return app_obj


@router.patch("/{application_id}/approve", response_model=ApplicationResponse)
async def approve_single_application(
    application_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    申請を承認します。承認処理には副作用が含まれます。
    """
    if current_user.role not in ["Admin", "Manager"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    approved_application = await approve_application(repo, application_id, current_user.id)

    await auditor.record_audit_log(
        db=repo,
        event_type="APPLICATION_APPROVED",
        user_id=current_user.id,
        target_resource_type="Application",
        target_resource_id=str(application_id),
        result="Success"
    )

    return approved_application


@router.patch("/{application_id}/reject", response_model=ApplicationResponse)
async def reject_single_application(
    application_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    申請を却下します。
    """
    if current_user.role not in ["Admin", "Manager"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    rejected_application = await reject_application(repo, application_id, current_user.id)

    await auditor.record_audit_log(
        db=repo,
        event_type="APPLICATION_REJECTED",
        user_id=current_user.id,
        target_resource_type="Application",
        target_resource_id=str(application_id),
        result="Success"
    )

    return rejected_application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    指定された申請を削除します。（管理者のみ）
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    item = await _find_application_item_full(repo, str(application_id))
    if not item:
        raise HTTPException(status_code=404, detail="Application not found")

    await repo.delete_item(item["PK"], item["SK"])

    await auditor.record_audit_log(
        db=repo,
        event_type="APPLICATION_DELETED",
        user_id=current_user.id,
        target_resource_type="Application",
        target_resource_id=str(application_id),
        result="Success"
    )


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: UUID,
    application_in: ApplicationUpdate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    申請内容を更新します。（管理者のみ）
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    item = await _find_application_item_full(repo, str(application_id))
    if not item:
        raise HTTPException(status_code=404, detail="Application not found")

    if application_in.status:
        item["status"] = application_in.status
    if application_in.input_data:
        item["input_data"] = application_in.input_data

    await repo.put_item(item)
    app_obj = dict_to_application_model(item)
    await _load_relations(repo, app_obj)

    await auditor.record_audit_log(
        db=repo,
        event_type="APPLICATION_UPDATED",
        user_id=current_user.id,
        target_resource_type="Application",
        target_resource_id=str(application_id),
        details={"status": app_obj.status, "input_data": app_obj.input_data},
        result="Success"
    )

    return app_obj
