from datetime import date, datetime, time
from typing import Dict
from uuid import UUID

from fastapi import HTTPException, status

from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Application, User, ApplicationTemplate
from app.schemas.application import PaidLeaveInputData, StampCorrectionInputData
from app.services.side_effect import SideEffectService
from app.core.exceptions import ResourceNotFoundError, BusinessRuleError
from app.api.deps import dict_to_user_model

def dict_to_application_model(item: dict) -> Application:
    """
    DynamoDBのアイテム辞書からSQLAlchemyのApplicationモデルを生成します。
    """
    app_obj = Application(
        id=UUID(item["id"]) if "id" in item else None,
        user_id=UUID(item["user_id"]) if "user_id" in item else None,
        approver_id=UUID(item["approver_id"]) if item.get("approver_id") else None,
        template_id=UUID(item["template_id"]) if item.get("template_id") else None,
        type=item.get("type", ""),
        status=item.get("status", "Pending"),
        input_data=item.get("input_data", {}),
    )
    if "created_at" in item:
        try:
            app_obj.created_at = datetime.fromisoformat(item["created_at"])
        except ValueError:
            app_obj.created_at = datetime.utcnow()
    return app_obj

async def _find_application_item(repo: DynamoDBRepository, application_id: str):
    table = await repo.get_table()
    response = await table.scan()
    items = response.get("Items", [])
    for item in items:
        if item.get("SK") == f"APP#{application_id}" or item.get("id") == application_id:
            return item
    return None

async def _load_relations(repo: DynamoDBRepository, app_obj: Application):
    """
    Applicationモデルの関連（user, approver, template）をDynamoDBからロードします。
    """
    user_items = await repo.scan_items_by_type("USER#", "METADATA")
    
    # ユーザーロード
    for item in user_items:
        if item.get("id") == str(app_obj.user_id):
            app_obj.user = dict_to_user_model(item)
            break
            
    # 承認者ロード
    if app_obj.approver_id:
        for item in user_items:
            if item.get("id") == str(app_obj.approver_id):
                app_obj.approver = dict_to_user_model(item)
                break
                
    # テンプレートロード
    if app_obj.template_id:
        temp_item = await repo.get_item(f"APP_TEMP#{app_obj.template_id}", "METADATA")
        if temp_item:
            from app.models import ApplicationTemplate
            app_obj.template = ApplicationTemplate(
                id=UUID(temp_item["id"]),
                name=temp_item.get("name", ""),
                schema_definition=temp_item.get("schema_definition", []),
                settings=temp_item.get("settings")
            )

async def approve_application(
    repo: DynamoDBRepository, application_id: UUID, approver_id: UUID
) -> Application:
    """
    申請を承認し、申請種別に応じた副作用を適用します。
    """
    app_id_str = str(application_id)
    item = await _find_application_item(repo, app_id_str)

    if not item:
        raise ResourceNotFoundError("Application not found")
    
    if item.get("status") == "Approved":
        app_obj = dict_to_application_model(item)
        await _load_relations(repo, app_obj)
        return app_obj
    
    if item.get("status") != "Pending":
        raise BusinessRuleError("Application is not pending.")

    # 承認状態の更新
    item["status"] = "Approved"
    item["approver_id"] = str(approver_id)
    await repo.put_item(item)

    app_obj = dict_to_application_model(item)
    await _load_relations(repo, app_obj)

    # 副作用の適用
    try:
        await _apply_application_side_effects(repo, app_obj)
    except Exception as e:
        # ロールバックとしてステータスを戻す
        item["status"] = "Pending"
        item.pop("approver_id", None)
        await repo.put_item(item)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply side effects: {e}",
        )
        
    return app_obj

async def _apply_application_side_effects(repo: DynamoDBRepository, application: Application):
    """
    申請タイプごとの副作用適用ロジック。
    """
    # input_data が辞書型の場合、値が空文字列 "" のものを None にクレンジングする
    cleaned_input = {}
    if isinstance(application.input_data, dict):
        cleaned_input = {k: (None if v == "" else v) for k, v in application.input_data.items()}
    else:
        cleaned_input = application.input_data

    if application.type in ["PaidLeave", "有給休暇申請"]:
        paid_leave_data = PaidLeaveInputData.model_validate(cleaned_input)
        await SideEffectService.apply_paid_leave_side_effects(repo, application, application.user_id, paid_leave_data)
    elif application.type == "StampCorrection":
        stamp_correction_data = StampCorrectionInputData.model_validate(cleaned_input)
        await SideEffectService.apply_stamp_correction_side_effects(repo, application, application.user_id, stamp_correction_data)

async def reject_application(
    repo: DynamoDBRepository, application_id: UUID, approver_id: UUID
) -> Application:
    """
    申請を却下します。
    """
    app_id_str = str(application_id)
    item = await _find_application_item(repo, app_id_str)

    if not item:
        raise ResourceNotFoundError("Application not found")
    if item.get("status") != "Pending":
        raise BusinessRuleError("Application is not pending.")

    item["status"] = "Rejected"
    item["approver_id"] = str(approver_id)
    await repo.put_item(item)
    
    app_obj = dict_to_application_model(item)
    await _load_relations(repo, app_obj)
    return app_obj
