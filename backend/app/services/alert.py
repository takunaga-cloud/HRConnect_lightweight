from datetime import date, datetime, timedelta
from typing import List
from uuid import UUID

from app.db.dynamodb_repo import DynamoDBRepository
from app.schemas.alert import Alert, AlertLevel, AlertType
from app.services.calculator import calculate_overtime

async def check_overtime_alerts(
    repo: DynamoDBRepository, user_id: UUID, year_month: str
) -> List[Alert]:
    """
    指定された月の残業時間をチェックし、36協定に基づくアラートを返します。
    """
    alerts = []

    # 1. 対象月の日付範囲を決定
    try:
        ym = datetime.strptime(year_month, "%Y-%m")
        start_date = ym.date()
        if ym.month == 12:
            next_month = ym.replace(year=ym.year + 1, month=1)
        else:
            next_month = ym.replace(month=ym.month + 1)
        end_date = (next_month - timedelta(days=1)).date()
    except ValueError:
        return []

    # ユーザーの取得
    user_uuid_str = str(user_id)
    user_items = await repo.scan_items_by_type("USER#", "METADATA")
    
    cognito_sub = None
    user_item = None
    for item in user_items:
        if item.get("id") == user_uuid_str or item.get("cognito_sub") == user_uuid_str:
            cognito_sub = item.get("cognito_sub")
            user_item = item
            break
            
    if not cognito_sub or not user_item:
        return []

    pk = f"USER#{cognito_sub}"

    # 勤怠データの取得
    attendance_items = await repo.query_items_by_pk_and_sk_prefix(pk, "ATTENDANCE#")
    attendances = []
    for item in attendance_items:
        w_date = date.fromisoformat(item["work_date"])
        if start_date <= w_date <= end_date:
            attendances.append(item)

    # シフトデータの取得
    shift_items = await repo.query_items_by_pk_and_sk_prefix(pk, "SHIFT#")
    shifts_map = {}
    for item in shift_items:
        if item.get("status") == "Approved":
            t_date = date.fromisoformat(item["target_date"])
            if start_date <= t_date <= end_date:
                # 簡易的な Shift オブジェクト化 (start_time/end_time のパース)
                from datetime import time
                s_time = time(9, 0)
                if item.get("start_time"):
                    s_time = time.fromisoformat(item["start_time"])
                e_time = time(18, 0)
                if item.get("end_time"):
                    e_time = time.fromisoformat(item["end_time"])
                
                class MockShift:
                    def __init__(self, start, end):
                        self.start_time = start
                        self.end_time = end
                        
                shifts_map[t_date] = MockShift(s_time, e_time)

    # 就業規則設定の取得
    work_rule_id = user_item.get("work_rule_id")
    config = {
        "rounding_rule_minutes": 15,
        "auto_break_deduction_minutes": 60,
        "late_grace_period_minutes": 0,
        "overtime_thresholds": []
    }
    if work_rule_id:
        rule_item = await repo.get_item(f"WORK_RULE#{work_rule_id}", "METADATA")
        if rule_item and rule_item.get("config"):
            config = rule_item["config"]

    limit_warning = 30.0
    limit_critical = 45.0
    
    thresholds = config.get("overtime_thresholds", [])
    if thresholds:
        limit_critical = float(thresholds[0].get("month_hours", 45.0))
        limit_warning = limit_critical * 0.8

    total_overtime_minutes = 0.0

    for att in attendances:
        w_date = date.fromisoformat(att["work_date"])
        shift = shifts_map.get(w_date)
        
        clock_in_str = att.get("clock_in")
        clock_out_str = att.get("clock_out")
        if not clock_in_str or not clock_out_str:
            continue
            
        clock_in = datetime.fromisoformat(clock_in_str)
        clock_out = datetime.fromisoformat(clock_out_str)
        total_work_minutes = float(att.get("total_work_minutes", 0.0))
            
        s_start = shift.start_time if shift else None
        s_end = shift.end_time if shift else None
        
        ovt = calculate_overtime(
            start_time=clock_in,
            end_time=clock_out,
            work_rule_config=config,
            shift_start_time=s_start,
            shift_end_time=s_end,
            actual_work_minutes=total_work_minutes
        )
        total_overtime_minutes += ovt["overtime_minutes"]

    total_overtime_hours = total_overtime_minutes / 60

    if total_overtime_hours >= limit_critical:
        alerts.append(Alert(
            level=AlertLevel.CRITICAL,
            type=AlertType.OVERTIME_36,
            message=f"今月の残業時間が{limit_critical}時間を超過しています（現在: {total_overtime_hours:.1f}時間）",
            details={"current": total_overtime_hours, "limit": limit_critical}
        ))
    elif total_overtime_hours >= limit_warning:
        alerts.append(Alert(
            level=AlertLevel.WARNING,
            type=AlertType.OVERTIME_36,
            message=f"今月の残業時間が{limit_warning}時間を超えました。上限（{limit_critical}時間）に注意してください（現在: {total_overtime_hours:.1f}時間）",
            details={"current": total_overtime_hours, "limit": limit_critical}
        ))

    return alerts
