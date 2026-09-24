from datetime import date, timedelta, datetime, time
from typing import List, Optional, Dict
from zoneinfo import ZoneInfo
from uuid import UUID, uuid4
import json
import calendar

from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role, check_manager_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Attendance, User, Shift, WorkLog
from app.schemas.attendance import AttendanceCreate, AttendanceResponse, AttendanceUpdate, CalendarDailyResponse
from app.schemas.work_log import WorkLogWithDetails

router = APIRouter(redirect_slashes=False)


def dict_to_attendance_model(item: dict) -> Attendance:
    """
    DynamoDBの辞書データからSQLAlchemyのAttendanceモデルを生成します。
    """
    clock_in = None
    if item.get("clock_in"):
        clock_in = datetime.fromisoformat(item["clock_in"])
    clock_out = None
    if item.get("clock_out"):
        clock_out = datetime.fromisoformat(item["clock_out"])
        
    return Attendance(
        id=UUID(item["id"]) if "id" in item else None,
        user_id=UUID(item["user_id"]) if "user_id" in item else None,
        work_date=date.fromisoformat(item["work_date"]) if "work_date" in item else None,
        clock_in=clock_in,
        clock_out=clock_out,
        breaks=item.get("breaks", []),
        meta_data=item.get("meta_data", {}),
        status=item.get("status", "Present"),
        total_work_minutes=float(item.get("total_work_minutes", 0)) if item.get("total_work_minutes") is not None else 0.0
    )


@router.post(
    "/clock-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED
)
async def clock_in(
    attendance_in: AttendanceCreate,
    current_user: User = Depends(get_current_user),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    ユーザーの出勤時刻を記録します。
    """
    current_time = datetime.now(ZoneInfo("Asia/Tokyo"))
    today = current_time.date()
    
    # 既に今日の打刻があるか確認
    pk = f"USER#{current_user.cognito_sub}"
    sk = f"ATTENDANCE#{today.isoformat()}"
    existing = await repo.get_item(pk, sk)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Already clocked in today"
        )

    attendance_id = str(uuid4())
    new_item = {
        "PK": pk,
        "SK": sk,
        "id": attendance_id,
        "user_id": str(current_user.id),
        "work_date": today.isoformat(),
        "clock_in": current_time.isoformat(),
        "clock_out": None,
        "breaks": [],
        "meta_data": attendance_in.meta_data.model_dump() if attendance_in.meta_data else {},
        "status": "Present",
        "total_work_minutes": 0.0
    }
    
    await repo.put_item(new_item)
    return dict_to_attendance_model(new_item)


@router.post("/clock-out", response_model=AttendanceResponse)
async def clock_out(
    current_user: User = Depends(get_current_user),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    ユーザーの退勤時刻を記録します。
    """
    # 今日の打刻データを取得
    today = datetime.now(ZoneInfo("Asia/Tokyo")).date()
    pk = f"USER#{current_user.cognito_sub}"
    sk = f"ATTENDANCE#{today.isoformat()}"
    
    item = await repo.get_item(pk, sk)
    if not item:
        # 見つからない場合は最新の打刻をScan
        items = await repo.query_items_by_pk_and_sk_prefix(pk, "ATTENDANCE#")
        active_items = [i for i in items if i.get("clock_out") is None]
        if not active_items:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active clock-in found for today")
        item = active_items[-1]

    current_time = datetime.now(ZoneInfo("Asia/Tokyo"))
    item["clock_out"] = current_time.isoformat()
    
    # 簡易稼働時間計算（出勤時刻との単純差分）
    clock_in_time = datetime.fromisoformat(item["clock_in"])
    diff = current_time - clock_in_time
    total_minutes = diff.total_seconds() / 60.0
    item["total_work_minutes"] = total_minutes

    await repo.put_item(item)
    return dict_to_attendance_model(item)


@router.get("/today", response_model=AttendanceResponse | None)
async def get_today_attendance(
    current_user: User = Depends(get_current_user),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    ユーザーの今日の打刻状況を取得します。
    """
    today = datetime.now(ZoneInfo("Asia/Tokyo")).date()
    pk = f"USER#{current_user.cognito_sub}"
    sk = f"ATTENDANCE#{today.isoformat()}"
    item = await repo.get_item(pk, sk)
    if not item:
        return None
    return dict_to_attendance_model(item)


@router.get("/", response_model=list[AttendanceResponse])
async def read_attendances(
    user_id: UUID | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    current_user: User = Depends(check_manager_role),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    [管理者用] 勤怠記録一覧を取得します。
    """
    # 簡易的に全打刻データをScan
    all_items = []
    # すべてのUSER#のATTENDANCE#から取得するためにテーブル全体のScanを行う
    # テストおよびデモ用にフォールバックScan
    table = await repo.get_table()
    response = await table.scan()
    items = response.get("Items", [])
    
    for item in items:
        if item.get("SK", "").startswith("ATTENDANCE#"):
            # フィルター適用
            if user_id and item.get("user_id") != str(user_id):
                continue
            if start_date or end_date:
                work_date_str = item.get("work_date")
                if not work_date_str:
                    continue
                work_date_obj = date.fromisoformat(work_date_str)
                if start_date and work_date_obj < start_date:
                    continue
                if end_date and work_date_obj > end_date:
                    continue
            all_items.append(dict_to_attendance_model(item))
            
    # ソート
    all_items.sort(key=lambda x: x.work_date, reverse=True)
    return all_items


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attendance(
    attendance_id: UUID,
    current_user: User = Depends(check_admin_role),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    [管理者用] 指定された勤怠記録を削除（取り消し）します。
    """
    # Scanで該当IDのシフトを探す
    table = await repo.get_table()
    response = await table.scan()
    items = response.get("Items", [])
    target = None
    for item in items:
        if item.get("id") == str(attendance_id) and item.get("SK", "").startswith("ATTENDANCE#"):
            target = item
            break
            
    if not target:
        raise HTTPException(status_code=404, detail="Attendance not found")
        
    await repo.delete_item(target["PK"], target["SK"])
    return None


@router.get("/my-monthly-records", response_model=List[CalendarDailyResponse])
async def get_my_monthly_records(
    year: int = Query(...),
    month: int = Query(...),
    current_user: User = Depends(get_current_user),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    ログインユーザーの指定月の月報・カレンダーデータを取得します。
    """
    pk = f"USER#{current_user.cognito_sub}"
    print(f"[Backend DEBUG] get_my_monthly_records called for user PK: {pk}, year: {year}, month: {month}")
    user_items = await repo.query_items_by_pk(pk)
    print(f"[Backend DEBUG] Found {len(user_items)} items for PK: {pk}")
    
    project_items = await repo.scan_items_by_type("PROJECT#", "METADATA")
    task_cat_items = await repo.scan_items_by_type("TASK_CATEGORY#", "METADATA")
    
    project_map = {item["id"]: item for item in project_items if "id" in item}
    task_cat_map = {item["id"]: item for item in task_cat_items if "id" in item}
    
    shifts_by_date = {}
    attendances_by_date = {}
    work_logs_by_date = {}
    
    for item in user_items:
        sk = item.get("SK", "")
        if sk.startswith("SHIFT#"):
            date_str = sk.split("#")[1]
            shifts_by_date[date_str] = item
        elif sk.startswith("ATTENDANCE#"):
            date_str = sk.split("#")[1]
            attendances_by_date[date_str] = item
        elif sk.startswith("WORKLOG#"):
            parts = sk.split("#")
            date_str = parts[1]
            if date_str not in work_logs_by_date:
                work_logs_by_date[date_str] = []
            work_logs_by_date[date_str].append(item)
            
    print(f"[Backend DEBUG] Mapped: {len(shifts_by_date)} shifts, {len(attendances_by_date)} attendances, {len(work_logs_by_date)} work_logs dates")
    _, num_days = calendar.monthrange(year, month)
    daily_records = []
    
    for day in range(1, num_days + 1):
        target_date = date(year, month, day)
        date_str = target_date.isoformat()
        
        shift_item = shifts_by_date.get(date_str)
        scheduled_start_time = None
        scheduled_end_time = None
        shift_type = None
        shift_status = None
        shift_id = None
        
        if shift_item:
            shift_id = UUID(shift_item["id"]) if "id" in shift_item else None
            shift_type = shift_item.get("shift_type")
            shift_status = shift_item.get("status", "Approved")
            
            if shift_item.get("start_time"):
                st = time.fromisoformat(shift_item["start_time"])
                scheduled_start_time = datetime.combine(target_date, st)
            if shift_item.get("end_time"):
                et = time.fromisoformat(shift_item["end_time"])
                scheduled_end_time = datetime.combine(target_date, et)
                
        attendance_res = None
        attendance_item = attendances_by_date.get(date_str)
        if attendance_item:
            attendance_model = dict_to_attendance_model(attendance_item)
            attendance_res = AttendanceResponse(
                id=attendance_model.id,
                user_id=attendance_model.user_id,
                work_date=attendance_model.work_date,
                clock_in=attendance_model.clock_in,
                clock_out=attendance_model.clock_out,
                breaks=attendance_model.breaks,
                meta_data=attendance_model.meta_data,
                status=attendance_model.status,
                total_work_minutes=attendance_model.total_work_minutes,
                scheduled_start_time=scheduled_start_time,
                scheduled_end_time=scheduled_end_time
            )
        log_items = work_logs_by_date.get(date_str, [])
        work_logs_list = []
        total_log_minutes = 0
        
        for log in log_items:
            proj_id = log.get("project_id")
            cat_id = log.get("task_category_id")
            
            proj_item = project_map.get(proj_id, {})
            proj_data = {
                "id": UUID(proj_item["id"]) if "id" in proj_item else (UUID(proj_id) if proj_id else None),
                "code": proj_item.get("code", "UNKNOWN"),
                "name": proj_item.get("name", "Unknown"),
                "start_date": proj_item.get("start_date", "2026-01-01"),
                "end_date": proj_item.get("end_date"),
                "is_active": proj_item.get("is_active", True),
                "budget_minutes": proj_item.get("budget_minutes", 0),
                "leader_id": UUID(proj_item["leader_id"]) if proj_item.get("leader_id") else None,
            }
            
            cat_item = task_cat_map.get(cat_id, {})
            cat_data = {
                "id": UUID(cat_item["id"]) if "id" in cat_item else (UUID(cat_id) if cat_id else None),
                "name": cat_item.get("name", "Unknown"),
            }
            
            total_log_minutes += int(log.get("minutes", 0))
            
            work_logs_list.append(
                WorkLogWithDetails(
                    id=UUID(log["id"]) if "id" in log else None,
                    user_id=UUID(log["user_id"]) if "user_id" in log else None,
                    log_date=log.get("log_date"),
                    project_id=UUID(proj_id) if proj_id else None,
                    task_category_id=UUID(cat_id) if cat_id else None,
                    minutes=int(log.get("minutes", 0)),
                    comment=log.get("comment"),
                    project=proj_data,
                    task_category=cat_data
                )
            )
            
        daily_records.append(
            CalendarDailyResponse(
                date=target_date,
                scheduled_start_time=scheduled_start_time,
                scheduled_end_time=scheduled_end_time,
                shift_type=shift_type,
                shift_status=shift_status,
                shift_id=shift_id,
                attendance=attendance_res,
                work_logs=work_logs_list,
                total_log_minutes=total_log_minutes
            )
        )
        
    return daily_records
