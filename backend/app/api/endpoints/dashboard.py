from datetime import date, datetime, timedelta, time
from typing import List
from uuid import UUID
import pytz

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.deps import get_current_user, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Shift, Attendance, User, WorkRule, Application, WorkLog, PaidLeaveLedger
from app.schemas.dashboard import DailyAttendanceSummary, UserBasicInfo
from app.services.alert import check_overtime_alerts

router = APIRouter()


async def _get_cognito_sub(repo: DynamoDBRepository, user_id: str) -> str | None:
    user_items = await repo.scan_items_by_type("USER#", "METADATA")
    for item in user_items:
        if item.get("id") == user_id or item.get("cognito_sub") == user_id:
            return item.get("cognito_sub")
    return None


@router.get("/summary", response_model=DailyAttendanceSummary)
async def get_daily_attendance_summary(
    target_date: date = Query(date.today()),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    指定された日付の出勤状況サマリー（出勤済み、遅刻者、未出勤）を取得します。
    """
    if current_user.role.lower() not in ["admin", "manager"]:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    try:
        # 全従業員の基本情報を取得 (Activeのみ)
        user_items = await repo.scan_items_by_type("USER#", "METADATA")
        active_users = [u for u in user_items if u.get("status") == "Active"]
        
        total_user_list = [
            UserBasicInfo(id=UUID(u["id"]), name=u["name"], email=u["email"]) 
            for u in active_users if u.get("id")
        ]
        total_users = len(total_user_list)

        # その日のシフトをスキャン
        table = await repo.get_table()
        scan_res = await table.scan()
        all_items = scan_res.get("Items", [])
        
        # 就業規則マッピング
        rule_items = await repo.scan_items_by_type("WORK_RULE#", "METADATA")
        rule_map = {r["id"]: r.get("config", {}) for r in rule_items if r.get("id")}

        # その日のシフトがあるユーザー
        shift_users_map = {}
        for item in all_items:
            if item.get("SK", "").startswith("SHIFT#"):
                if item.get("target_date") == target_date.isoformat() and not item.get("is_holiday") and item.get("status") == "Approved":
                    uid = item.get("user_id")
                    
                    # ユーザー情報の特定
                    user_data = None
                    for u in active_users:
                        if u.get("id") == uid:
                            user_data = u
                            break
                            
                    if user_data:
                        w_rule_id = user_data.get("work_rule_id")
                        config = rule_map.get(w_rule_id, {})
                        
                        s_time = time(9, 0)
                        if item.get("start_time"):
                            s_time = time.fromisoformat(item["start_time"])
                            
                        shift_users_map[uid] = {
                            "name": user_data["name"],
                            "email": user_data["email"],
                            "start_time": s_time,
                            "config": config
                        }

        # その日の勤怠実績を取得
        attendances_today = []
        for item in all_items:
            if item.get("SK", "").startswith("ATTENDANCE#") and item.get("work_date") == target_date.isoformat():
                uid = item.get("user_id")
                user_data = None
                for u in active_users:
                    if u.get("id") == uid:
                        user_data = u
                        break
                if user_data:
                    attendances_today.append((item, user_data))

        present_user_list: List[UserBasicInfo] = []
        late_user_list: List[UserBasicInfo] = []
        present_user_ids = set()

        for att, user in attendances_today:
            clock_in_str = att.get("clock_in")
            uid = user.get("id")
            
            if clock_in_str:
                user_info = UserBasicInfo(id=UUID(uid), name=user["name"], email=user["email"])
                present_user_list.append(user_info)
                present_user_ids.add(uid)

                # 遅刻判定 (シフトがある場合のみ)
                if uid in shift_users_map:
                    shift_info = shift_users_map[uid]
                    grace_minutes = shift_info["config"].get("late_grace_period_minutes", 0)
                    
                    shift_start_dt = datetime.combine(target_date, shift_info["start_time"])
                    clock_in_dt = datetime.fromisoformat(clock_in_str)
                    
                    if clock_in_dt.tzinfo:
                        jst = pytz.timezone("Asia/Tokyo")
                        shift_start_dt = jst.localize(shift_start_dt)
                        
                    late_threshold_dt = shift_start_dt + timedelta(minutes=int(grace_minutes))

                    if clock_in_dt > late_threshold_dt:
                        late_user_list.append(user_info)

        # 未出勤者 (シフトがあるのに打刻していない)
        absent_user_list: List[UserBasicInfo] = []
        for uid, info in shift_users_map.items():
            if uid not in present_user_ids:
                absent_user_list.append(UserBasicInfo(
                    id=UUID(uid),
                    name=info["name"],
                    email=info["email"]
                ))

        # アラート対象者 (月間160h + 45h超過)
        start_of_month = target_date.replace(day=1)
        alert_user_list: List[UserBasicInfo] = []
        
        # 月間累計労働時間を集計
        user_monthly_minutes = {}
        for item in all_items:
            if item.get("SK", "").startswith("ATTENDANCE#"):
                w_date = date.fromisoformat(item["work_date"])
                if w_date >= start_of_month:
                    uid = item.get("user_id")
                    user_monthly_minutes[uid] = user_monthly_minutes.get(uid, 0.0) + float(item.get("total_work_minutes", 0.0))

        limit_threshold = (160 + 45) * 60
        for uid, minutes in user_monthly_minutes.items():
            if minutes > limit_threshold:
                for u in active_users:
                    if u.get("id") == uid:
                        alert_user_list.append(UserBasicInfo(id=UUID(uid), name=u["name"], email=u["email"]))
                        break

        # Monthly Overtime Chart
        weekly_overtime = {"1週目": 0, "2週目": 0, "3週目": 0, "4週目": 0, "5週目": 0}
        for item in all_items:
            if item.get("SK", "").startswith("ATTENDANCE#"):
                w_date = date.fromisoformat(item["work_date"])
                if w_date >= start_of_month:
                    minutes = float(item.get("total_work_minutes", 0.0))
                    day = w_date.day
                    ovt = max(0.0, minutes - 480.0)
                    week_key = f"{min(5, (day-1)//7 + 1)}週目"
                    weekly_overtime[week_key] += ovt
                    
        monthly_overtime_chart = [
            {"name": k, "overtime_hours": round(v / 60.0, 1)} 
            for k, v in weekly_overtime.items() if v > 0 or k != "5週目"
        ]

        # Daily Attendance Chart (過去7日間)
        daily_attendance_chart = []
        for i in range(6, -1, -1):
            d = target_date - timedelta(days=i)
            
            d_count = 0
            for item in all_items:
                if item.get("SK", "").startswith("ATTENDANCE#") and item.get("work_date") == d.isoformat() and item.get("clock_in"):
                    d_count += 1
                    
            daily_attendance_chart.append({
                "date": d.strftime("%m/%d"),
                "present_users": d_count
            })

        return DailyAttendanceSummary(
            total_users=total_users,
            present_users=len(present_user_list),
            late_users=len(late_user_list),
            absent_users=len(absent_user_list),
            alert_count=len(alert_user_list),
            total_user_list=total_user_list,
            present_user_list=present_user_list,
            late_user_list=late_user_list,
            absent_user_list=absent_user_list,
            alert_user_list=alert_user_list,
            monthly_overtime_chart=monthly_overtime_chart,
            daily_attendance_chart=daily_attendance_chart
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-summary", response_model=dict)
async def get_my_dashboard_summary(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    一般ユーザー向けのダッシュボード用サマリー情報を取得します。
    """
    try:
        today = date.today()
        pk = f"USER#{current_user.cognito_sub}"
        
        # 1. 今日の打刻データ取得
        today_attendance = await repo.get_item(pk, f"ATTENDANCE#{today.isoformat()}")
        
        clock_in_time = today_attendance.get("clock_in") if today_attendance else None
        clock_out_time = today_attendance.get("clock_out") if today_attendance else None
        
        status_val = "NotClockedIn"
        if clock_in_time and not clock_out_time:
            status_val = "ClockedIn"
        elif clock_in_time and clock_out_time:
            status_val = "ClockedOut" 

        # 2. 今月の総稼働時間の取得
        start_of_month = today.replace(day=1)
        
        # ユーザーに紐付く勤怠データをクエリ
        att_items = await repo.query_items_by_pk_and_sk_prefix(pk, "ATTENDANCE#")
        
        total_minutes = 0.0
        worked_days = 0
        for item in att_items:
            w_date = date.fromisoformat(item["work_date"])
            if w_date >= start_of_month:
                total_minutes += float(item.get("total_work_minutes", 0.0))
                worked_days += 1

        total_hours = round(total_minutes / 60.0, 1)

        # 残業時間の計算 (簡略化: 総労働時間 - (出勤日数 * 8h))
        scheduled_minutes = worked_days * 480
        overtime_minutes = max(0.0, total_minutes - scheduled_minutes)
        overtime_hours = round(overtime_minutes / 60.0, 1)

        # 3. 有給休暇残高の計算
        ledger_items = await repo.query_items_by_pk_and_sk_prefix(pk, "LEAVE_LEDGER#")
        
        # 有給休暇マスタを特定
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
                if expire_d >= today:
                    total_granted += float(item.get("days_granted", 0.0))
                    total_used += float(item.get("days_used", 0.0))
                    
        remaining_days = max(0.0, total_granted - total_used)
        next_holiday_str = f"{remaining_days:.1f} Days"

        # 4. 申請件数 (承認待ち)
        app_items = await repo.query_items_by_pk_and_sk_prefix(pk, "APP#")
        pending_count = sum(1 for a in app_items if a.get("status") == "Pending")

        # 5. 直近の工数入力履歴 (最新2件)
        wl_items = await repo.query_items_by_pk_and_sk_prefix(pk, "WORKLOG#")
        wl_items.sort(key=lambda x: x.get("log_date", ""), reverse=True)
        
        # プロジェクト名をマッピングするためにプロジェクト一覧を取得
        proj_items = await repo.scan_items_by_type("PROJECT#", "METADATA")
        proj_map = {p["id"]: p.get("name", "") for p in proj_items if p.get("id")}
        
        recent_logs = []
        for log in wl_items[:2]:
            pid = log.get("project_id")
            pname = proj_map.get(pid, f"Project {pid}")
            recent_logs.append({
                "project_name": pname,
                "task_name": "Task",
                "minutes": int(log.get("minutes", 0)),
                "status": "Completed"
            })

        # 6. アラートの取得
        current_month_str = today.strftime("%Y-%m")
        alerts_list = await check_overtime_alerts(repo, current_user.id, current_month_str)
        alerts = [alert.model_dump() for alert in alerts_list]

        return {
            "status": status_val,
            "clock_in_time": clock_in_time,
            "clock_out_time": clock_out_time,
            "total_hours_month": total_hours,
            "overtime_hours_month": overtime_hours,
            "next_holiday": next_holiday_str,
            "pending_apps_count": pending_count,
            "recent_logs": recent_logs,
            "alerts": alerts
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
