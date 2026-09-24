from datetime import datetime, time, timedelta, date
import math
from typing import Dict, Any, List, Optional

def round_time(dt: datetime, rounding_minutes: int = 1, method: str = "floor") -> datetime:
    """
    指定された分単位で時刻を丸めます。
    method: "floor" (切り捨て), "ceil" (切り上げ), "round" (四捨五入)
    デフォルトは1分単位（丸めなし）。
    """
    if rounding_minutes <= 1:
        return dt.replace(second=0, microsecond=0)

    delta = timedelta(minutes=rounding_minutes)

    # 分のみ抽出
    minutes_from_start = (dt - dt.replace(hour=0, minute=0, second=0, microsecond=0)).total_seconds() / 60
    
    if method == "floor":
        rounded_minutes = math.floor(minutes_from_start / rounding_minutes) * rounding_minutes
    elif method == "ceil":
        rounded_minutes = math.ceil(minutes_from_start / rounding_minutes) * rounding_minutes
    else:
        rounded_minutes = round(minutes_from_start / rounding_minutes) * rounding_minutes

    new_time = dt.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(minutes=rounded_minutes)
    return new_time

def calculate_working_hours(
    clock_in: datetime,
    clock_out: datetime,
    work_rule_config: Dict[str, Any],
    breaks: List[Dict[str, datetime]] = [],
) -> Dict[str, Any]:
    """
    打刻時刻から実労働時間、休憩時間などを計算します。
    """
    # 1. 丸め処理
    rounding_unit = work_rule_config.get("rounding_rule_minutes", 1)
    
    # Timezone normalization (Assume JST for naive datetimes)
    from zoneinfo import ZoneInfo
    jst = ZoneInfo("Asia/Tokyo")
    
    if clock_in.tzinfo is None:
        clock_in = clock_in.replace(tzinfo=jst)
    
    if clock_out.tzinfo is None:
        clock_out = clock_out.replace(tzinfo=jst)

    # 出勤は切り上げ、退勤は切り捨てが一般的だが、ここでは設定次第とする
    # 簡易的に出勤切り上げ、退勤切り捨てとする
    rounded_clock_in = round_time(clock_in, rounding_unit, "ceil")
    rounded_clock_out = round_time(clock_out, rounding_unit, "floor")
    
    if rounded_clock_out < rounded_clock_in:
        return {
            "total_work_minutes": 0.0,
            "break_minutes": 0.0,
            "actual_work_minutes": 0.0
        }

    # 2. 拘束時間（滞在時間）
    stay_minutes = (rounded_clock_out - rounded_clock_in).total_seconds() / 60

    # 3. 休憩時間の計算
    break_minutes = 0.0
    # 実績休憩（打刻された休憩）の合計
    for brk in breaks:
        # 休憩も丸める場合があるが、ここでは生データを使用
        b_start = brk.get("start")
        b_end = brk.get("end")
        if b_start and b_end:
            if isinstance(b_start, str):
                b_start = datetime.fromisoformat(b_start)
            if isinstance(b_end, str):
                b_end = datetime.fromisoformat(b_end)
            break_minutes += (b_end - b_start).total_seconds() / 60

    # 自動休憩控除
    auto_deduction = work_rule_config.get("auto_break_deduction_minutes", 0)
    # 拘束時間が一定以上（例えば6時間）の場合のみ引くルールだが、
    # ここではシンプルに stay_minutes > (6*60) の場合に適用するなどのロジックを入れるか、
    # design.mdの仕様通り単純に設定があれば適用するか。
    # ここでは「休憩打刻がなく、かつ自動控除設定がある場合」または「休憩打刻があっても最低休憩時間を確保する場合」など複雑。
    # 簡易実装として、実績休憩 < 自動控除 なら 自動控除値を優先する (最低休憩時間保証)
    if auto_deduction > 0 and stay_minutes > 360: # 6時間超で適用と仮定
        break_minutes = max(break_minutes, float(auto_deduction))

    # 4. 実労働時間
    actual_work_minutes = max(0.0, stay_minutes - break_minutes)

    return {
        "clock_in": rounded_clock_in, # 計算に使用した丸め後時刻も返す
        "clock_out": rounded_clock_out,
        "stay_minutes": stay_minutes,
        "break_minutes": break_minutes,
        "total_work_minutes": actual_work_minutes
    }

def calculate_overtime(
    start_time: datetime,
    end_time: datetime,
    work_rule_config: Dict[str, Any],
    shift_start_time: Optional[time] = time(9, 0),
    shift_end_time: Optional[time] = time(18, 0),
    actual_work_minutes: Optional[float] = None
) -> Dict[str, float]:
    """
    残業時間を計算します。
    """
    if actual_work_minutes is None:
        # 実労働時間が渡されていない場合は計算する
        calc_result = calculate_working_hours(start_time, end_time, work_rule_config)
        actual_work_minutes = calc_result["total_work_minutes"]

    overtime_minutes = 0.0
    midnight_overtime_minutes = 0.0
    
    # 所定労働時間 (デフォルト8時間 = 480分)
    # シフトがない場合は8時間とみなす
    scheduled_minutes = 480.0
    if shift_start_time and shift_end_time:
        # シフト上の拘束時間 - 自動休憩(60分と仮定)
        shift_duration = (
            datetime.combine(date.min, shift_end_time) - datetime.combine(date.min, shift_start_time)
        ).total_seconds() / 60
        scheduled_minutes = max(0, shift_duration - 60) # 休憩1時間引く

    # 法定内/外残業の区別はなく、単純に所定を超えた分を残業とする
    if actual_work_minutes > scheduled_minutes:
        overtime_minutes = actual_work_minutes - scheduled_minutes

    # 深夜残業 (22:00 - 05:00)
    # 注: 日をまたぐ場合の考慮が必要だが、ここでは簡易的に当日夜〜翌朝のみ対応
    # start_timeの日付を基準にする
    midnight_start = datetime.combine(start_time.date(), time(22, 0))
    midnight_end = datetime.combine(start_time.date() + timedelta(days=1), time(5, 0))

    if start_time.tzinfo is not None:
        midnight_start = midnight_start.replace(tzinfo=start_time.tzinfo)
        midnight_end = midnight_end.replace(tzinfo=start_time.tzinfo)

    # 勤務時間が深夜帯に重なるかチェック
    # 丸め後の時間を使うべきだが、引数簡略化のため生データまたは呼び出し元で丸めた値を入れる想定
    # ここでは計算ロジック内で丸めを行っていない警告
    
    if end_time > midnight_start:
         # 重なり区間計算
         overlap_start = max(start_time, midnight_start)
         overlap_end = min(end_time, midnight_end)
         if overlap_end > overlap_start:
             midnight_overtime_minutes = (overlap_end - overlap_start).total_seconds() / 60

    return {
        "overtime_minutes": overtime_minutes,
        "midnight_overtime_minutes": midnight_overtime_minutes
    }

def calculate_holiday_work_days(
    attendances: List[Dict[str, Any]], holidays: List[date]
) -> int:
    """
    勤怠データと休日リストに基づき、休日出勤日数を計算します。
    """
    holiday_work_days = 0
    for attendance in attendances:
        work_date = attendance["work_date"]
        # work_dateがdatetimeオブジェクトかdateオブジェクトか判定して統一
        if isinstance(work_date, datetime):
            work_date = work_date.date()
            
        if work_date in holidays:
            # 実労働時間が0より大きい場合のみカウント
            if attendance.get("total_work_minutes", 0) > 0:
                holiday_work_days += 1
    return holiday_work_days
