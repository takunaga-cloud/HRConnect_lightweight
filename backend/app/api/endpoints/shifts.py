from datetime import date, timedelta, time
from typing import List, Optional
from uuid import UUID, uuid4
import jpholiday

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role, check_manager_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Shift, User
from app.schemas.shift import ShiftBulkCreate, ShiftResponse, ShiftCreate, ShiftTypeUpdate
from app.schemas.shift import HolidayGenerationRequest, ShiftGenerationRequest, ShiftBatchDeleteRequest, ShiftRequestBulkCreate
from app.services.auditor import auditor

router = APIRouter()


def dict_to_shift_model(item: dict) -> Shift:
    """
    DynamoDBのアイテム辞書からSQLAlchemyのShiftモデルを生成します。
    """
    # timeのパース
    start_time = time(9, 0)
    if item.get("start_time"):
        if isinstance(item["start_time"], str):
            start_time = time.fromisoformat(item["start_time"])
        
    end_time = time(18, 0)
    if item.get("end_time"):
        if isinstance(item["end_time"], str):
            end_time = time.fromisoformat(item["end_time"])

    return Shift(
        id=UUID(item["id"]) if "id" in item else None,
        user_id=UUID(item["user_id"]) if "user_id" in item else None,
        target_date=date.fromisoformat(item["target_date"]) if "target_date" in item else None,
        start_time=start_time,
        end_time=end_time,
        is_holiday=bool(item.get("is_holiday", False)),
        shift_type=item.get("shift_type", "日勤"),
        remarks=item.get("remarks", ""),
        status=item.get("status", "Approved")
    )


@router.post(
    "/bulk", response_model=List[ShiftResponse], status_code=status.HTTP_201_CREATED
)
async def bulk_upsert_shifts(
    shifts_in: ShiftBulkCreate,
    current_user: User = Depends(check_admin_role),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    シフトデータを一括で登録または更新します。
    """
    if not shifts_in.shifts:
        return []

    upserted_shifts: List[Shift] = []
    # ユーザー名/CognitoSub等のマッピングを取得するため、全ユーザーをスキャン
    user_items = await repo.scan_items_by_type("USER#", "METADATA")
    # user_id (UUID) -> cognito_sub のマップを作成
    user_sub_map = {item["id"]: item["cognito_sub"] for item in user_items if "id" in item}

    for shift_data in shifts_in.shifts:
        user_uuid_str = str(shift_data.user_id)
        cognito_sub = user_sub_map.get(user_uuid_str)
        if not cognito_sub:
            continue

        pk = f"USER#{cognito_sub}"
        sk = f"SHIFT#{shift_data.target_date.isoformat()}"
        
        # 既存チェック
        existing = await repo.get_item(pk, sk)
        
        shift_id = existing["id"] if existing else str(uuid4())
        
        new_item = {
            "PK": pk,
            "SK": sk,
            "id": shift_id,
            "user_id": user_uuid_str,
            "target_date": shift_data.target_date.isoformat(),
            "start_time": shift_data.start_time.isoformat() if shift_data.start_time else "09:00:00",
            "end_time": shift_data.end_time.isoformat() if shift_data.end_time else "18:00:00",
            "is_holiday": bool(shift_data.is_holiday),
            "shift_type": shift_data.shift_type,
            "remarks": shift_data.remarks if shift_data.remarks else "",
            "status": "Approved"
        }
        await repo.put_item(new_item)
        upserted_shifts.append(dict_to_shift_model(new_item))

    # 監査ログ
    await auditor.record_audit_log(
        db=repo,
        event_type="SHIFTS_UPSERTED",
        user_id=current_user.id,
        target_resource_type="Shift",
        details={"count": len(upserted_shifts)},
        result="Success"
    )

    return [ShiftResponse.model_validate(s) for s in upserted_shifts]


@router.get("/", response_model=List[ShiftResponse])
async def get_shifts(
    start_date: date = Query(...),
    end_date: date = Query(...),
    user_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    指定された期間とユーザーのシフトデータを取得します。
    """
    # 簡易的に全スキャンで取得してフィルタリング
    table = await repo.get_table()
    response = await table.scan()
    items = response.get("Items", [])
    
    shifts = []
    for item in items:
        if item.get("SK", "").startswith("SHIFT#"):
            # フィルター適用
            if user_id and item.get("user_id") != str(user_id):
                continue
            if status and item.get("status") != status:
                continue
                
            work_date_obj = date.fromisoformat(item["target_date"])
            if start_date <= work_date_obj <= end_date:
                shifts.append(dict_to_shift_model(item))
                
    return shifts


@router.put("/{shift_id}", response_model=ShiftResponse)
async def update_shift(
    shift_id: UUID,
    shift_in: ShiftCreate,
    current_user: User = Depends(check_admin_role),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    指定されたシフトを更新します。
    """
    # Scanで該当IDのシフトを探す
    table = await repo.get_table()
    response = await table.scan()
    items = response.get("Items", [])
    
    target_item = None
    for item in items:
        if item.get("id") == str(shift_id) and item.get("SK", "").startswith("SHIFT#"):
            target_item = item
            break
            
    if not target_item:
        raise HTTPException(status_code=404, detail="Shift not found")

    target_item["start_time"] = shift_in.start_time.isoformat() if shift_in.start_time else "09:00:00"
    target_item["end_time"] = shift_in.end_time.isoformat() if shift_in.end_time else "18:00:00"
    target_item["shift_type"] = shift_in.shift_type
    target_item["is_holiday"] = bool(shift_in.is_holiday)

    await repo.put_item(target_item)

    await auditor.record_audit_log(
        db=repo,
        event_type="SHIFT_UPDATED",
        user_id=current_user.id,
        target_resource_type="Shift",
        target_resource_id=str(shift_id),
        details=shift_in.model_dump(mode="json"),
        result="Success"
    )

    return ShiftResponse.model_validate(dict_to_shift_model(target_item))


@router.delete("/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shift(
    shift_id: UUID,
    current_user: User = Depends(check_admin_role),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    指定されたシフトを削除します。
    """
    table = await repo.get_table()
    response = await table.scan()
    items = response.get("Items", [])
    
    target_item = None
    for item in items:
        if item.get("id") == str(shift_id) and item.get("SK", "").startswith("SHIFT#"):
            target_item = item
            break
            
    if not target_item:
        raise HTTPException(status_code=404, detail="Shift not found")

    await repo.delete_item(target_item["PK"], target_item["SK"])

    await auditor.record_audit_log(
        db=repo,
        event_type="SHIFT_DELETED",
        user_id=current_user.id,
        target_resource_type="Shift",
        target_resource_id=str(shift_id),
        result="Success"
    )


@router.post("/generate-holidays", response_model=List[ShiftResponse], status_code=status.HTTP_201_CREATED)
async def generate_holidays(
    request: HolidayGenerationRequest,
    current_user: User = Depends(check_admin_role),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    指定された期間と条件に基づいて休日シフトを一括生成・更新します。
    """
    upserted_shifts: List[Shift] = []
    
    # 期間内の日付をイテレート
    current_date = request.start_date
    dates_to_process = []
    while current_date <= request.end_date:
        is_holiday = False
        
        # 曜日判定 (0=Monday, 6=Sunday)
        weekday = current_date.weekday()
        if request.include_saturdays and weekday == 5:
            is_holiday = True
        elif request.include_sundays and weekday == 6:
            is_holiday = True
            
        # 祝日判定
        if request.include_public_holidays and jpholiday.is_holiday(current_date):
            is_holiday = True
            
        if is_holiday:
            dates_to_process.append(current_date)
            
        current_date += timedelta(days=1)
        
    if not dates_to_process:
        return []

    # ユーザーのCognitoSubマッピング
    user_items = await repo.scan_items_by_type("USER#", "METADATA")
    user_sub_map = {item["id"]: item["cognito_sub"] for item in user_items if "id" in item}
    
    for user_id in request.user_ids:
        cognito_sub = user_sub_map.get(str(user_id))
        if not cognito_sub:
            continue
            
        pk = f"USER#{cognito_sub}"
        
        for d in dates_to_process:
            sk = f"SHIFT#{d.isoformat()}"
            existing = await repo.get_item(pk, sk)
            
            holiday_name = jpholiday.is_holiday_name(d)
            remarks_val = holiday_name if holiday_name else "公休"

            shift_id = existing["id"] if existing else str(uuid4())
            new_item = {
                "PK": pk,
                "SK": sk,
                "id": shift_id,
                "user_id": str(user_id),
                "target_date": d.isoformat(),
                "start_time": "09:00:00",
                "end_time": "18:00:00",
                "is_holiday": True,
                "shift_type": "公休",
                "remarks": remarks_val,
                "status": "Approved"
            }
            await repo.put_item(new_item)
            upserted_shifts.append(dict_to_shift_model(new_item))
    
    await auditor.record_audit_log(
        db=repo,
        event_type="HOLIDAYS_GENERATED",
        user_id=current_user.id,
        target_resource_type="Shift",
        details={
            "count": len(upserted_shifts),
            "range_start": str(request.start_date),
            "range_end": str(request.end_date)
        },
        result="Success"
    )
    
    return [ShiftResponse.model_validate(s) for s in upserted_shifts]


@router.post(
    "/generate-work-shifts",
    response_model=List[ShiftResponse],
    status_code=status.HTTP_201_CREATED,
)
async def generate_work_shifts(
    request: ShiftGenerationRequest,
    current_user: User = Depends(check_admin_role),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    指定された期間・曜日・条件に基づいて通常シフトを一括生成・更新します。
    """
    upserted_shifts: List[Shift] = []
    target_weekdays = set(request.weekdays)

    current_date = request.start_date
    dates_to_process = []
    while current_date <= request.end_date:
        weekday = current_date.weekday()
        if weekday in target_weekdays:
            if not (request.exclude_public_holidays and jpholiday.is_holiday(current_date)):
                dates_to_process.append(current_date)
        current_date += timedelta(days=1)

    if not dates_to_process:
        return []

    # ユーザーのCognitoSubマッピング
    user_items = await repo.scan_items_by_type("USER#", "METADATA")
    user_sub_map = {item["id"]: item["cognito_sub"] for item in user_items if "id" in item}

    for user_id in request.user_ids:
        cognito_sub = user_sub_map.get(str(user_id))
        if not cognito_sub:
            continue
            
        pk = f"USER#{cognito_sub}"

        for d in dates_to_process:
            sk = f"SHIFT#{d.isoformat()}"
            existing = await repo.get_item(pk, sk)

            shift_id = existing["id"] if existing else str(uuid4())
            new_item = {
                "PK": pk,
                "SK": sk,
                "id": shift_id,
                "user_id": str(user_id),
                "target_date": d.isoformat(),
                "start_time": request.start_time.isoformat() if request.start_time else "09:00:00",
                "end_time": request.end_time.isoformat() if request.end_time else "18:00:00",
                "is_holiday": False,
                "shift_type": request.shift_type,
                "remarks": request.remarks if request.remarks else "",
                "status": "Approved"
            }
            await repo.put_item(new_item)
            upserted_shifts.append(dict_to_shift_model(new_item))

    await auditor.record_audit_log(
        db=repo,
        event_type="WORK_SHIFTS_GENERATED",
        user_id=current_user.id,
        target_resource_type="Shift",
        details={
            "count": len(upserted_shifts),
            "range_start": str(request.start_date),
            "range_end": str(request.end_date),
            "shift_type": request.shift_type,
        },
        result="Success",
    )

    return [ShiftResponse.model_validate(s) for s in upserted_shifts]


@router.get("/my-daily/{target_date}", response_model=ShiftResponse)
async def get_my_daily_shift(
    target_date: date,
    current_user: User = Depends(get_current_user),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    自身の指定日のシフトを取得します。
    """
    pk = f"USER#{current_user.cognito_sub}"
    sk = f"SHIFT#{target_date.isoformat()}"
    item = await repo.get_item(pk, sk)
    if not item:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    return ShiftResponse.model_validate(dict_to_shift_model(item))


@router.get("/my-shifts", response_model=List[ShiftResponse])
async def get_my_shifts(
    start_date: date = Query(...),
    end_date: date = Query(...),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    自身の指定期間のシフトを取得します。
    """
    pk = f"USER#{current_user.cognito_sub}"
    items = await repo.query_items_by_pk_and_sk_prefix(pk, "SHIFT#")
    
    shifts = []
    for item in items:
        if status and item.get("status") != status:
            continue
        work_date_obj = date.fromisoformat(item["target_date"])
        if start_date <= work_date_obj <= end_date:
            shifts.append(dict_to_shift_model(item))
            
    return [ShiftResponse.model_validate(s) for s in shifts]


@router.put("/my-daily/{target_date}", response_model=ShiftResponse)
async def update_my_daily_shift(
    target_date: date,
    shift_update: ShiftTypeUpdate,
    current_user: User = Depends(get_current_user),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    自身の指定日のシフトタイプを更新します。
    """
    pk = f"USER#{current_user.cognito_sub}"
    sk = f"SHIFT#{target_date.isoformat()}"
    
    existing = await repo.get_item(pk, sk)
    is_holiday = shift_update.shift_type == "公休"

    if existing:
        existing["shift_type"] = shift_update.shift_type
        existing["is_holiday"] = is_holiday
        await repo.put_item(existing)
        shift = dict_to_shift_model(existing)
    else:
        shift_id = str(uuid4())
        new_item = {
            "PK": pk,
            "SK": sk,
            "id": shift_id,
            "user_id": str(current_user.id),
            "target_date": target_date.isoformat(),
            "start_time": "09:00:00",
            "end_time": "18:00:00",
            "shift_type": shift_update.shift_type,
            "is_holiday": is_holiday,
            "status": "Approved"
        }
        await repo.put_item(new_item)
        shift = dict_to_shift_model(new_item)

    await auditor.record_audit_log(
        db=repo,
        event_type="SHIFT_UPDATED_BY_USER",
        user_id=current_user.id,
        target_resource_type="Shift",
        target_resource_id=str(shift.id),
        details={"date": str(target_date), "type": shift_update.shift_type},
        result="Success"
    )

    return ShiftResponse.model_validate(shift)


@router.post("/batch-delete", status_code=status.HTTP_204_NO_CONTENT)
async def batch_delete_shifts(
    request: ShiftBatchDeleteRequest,
    current_user: User = Depends(check_admin_role),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    指定された期間とユーザーのシフトを一括削除します。
    """
    # ユーザーのCognitoSubマッピング
    user_items = await repo.scan_items_by_type("USER#", "METADATA")
    user_sub_map = {item["id"]: item["cognito_sub"] for item in user_items if "id" in item}

    for user_id in request.user_ids:
        cognito_sub = user_sub_map.get(str(user_id))
        if not cognito_sub:
            continue
            
        pk = f"USER#{cognito_sub}"
        
        # 期間内のシフトを削除
        current_date = request.start_date
        while current_date <= request.end_date:
            sk = f"SHIFT#{current_date.isoformat()}"
            await repo.delete_item(pk, sk)
            current_date += timedelta(days=1)

    await auditor.record_audit_log(
        db=repo,
        event_type="SHIFTS_BATCH_DELETED",
        user_id=current_user.id,
        target_resource_type="Shift",
        details={
            "user_ids": [str(uid) for uid in request.user_ids],
            "start_date": str(request.start_date),
            "end_date": str(request.end_date),
        },
        result="Success"
    )


@router.post("/my-requests", response_model=List[ShiftResponse], status_code=status.HTTP_201_CREATED)
async def create_my_shift_requests(
    requests_in: ShiftRequestBulkCreate,
    current_user: User = Depends(get_current_user),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    従業員が自身の希望シフトを登録・申請します（複数日一括）。
    """
    upserted_shifts: List[Shift] = []
    pk = f"USER#{current_user.cognito_sub}"
    
    for req in requests_in.requests:
        sk = f"SHIFT#{req.target_date.isoformat()}"
        existing = await repo.get_item(pk, sk)
        
        shift_id = existing["id"] if existing else str(uuid4())
        
        new_item = {
            "PK": pk,
            "SK": sk,
            "id": shift_id,
            "user_id": str(current_user.id),
            "target_date": req.target_date.isoformat(),
            "start_time": req.start_time.isoformat() if req.start_time else "09:00:00",
            "end_time": req.end_time.isoformat() if req.end_time else "18:00:00",
            "is_holiday": bool(req.is_holiday),
            "shift_type": req.shift_type,
            "remarks": req.remarks if req.remarks else "",
            "status": "Requested",
        }
        await repo.put_item(new_item)
        upserted_shifts.append(dict_to_shift_model(new_item))
        
    await auditor.record_audit_log(
        db=repo,
        event_type="SHIFT_REQUESTS_CREATED",
        user_id=current_user.id,
        target_resource_type="Shift",
        details={"count": len(upserted_shifts)},
        result="Success"
    )
    
    return [ShiftResponse.model_validate(s) for s in upserted_shifts]
