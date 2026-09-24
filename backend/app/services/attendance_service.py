from datetime import date, datetime, time, timedelta
from typing import List, Dict, Optional, Any
from zoneinfo import ZoneInfo
from uuid import UUID

from app.models import Attendance, Shift, Application
from app.schemas.application import PaidLeaveInputData
from app.schemas.attendance import AttendanceResponse, CalendarDailyResponse
from app.schemas.work_log import WorkLogWithDetails

class AttendanceService:
    """
    勤怠・シフト関連のドメインロジックを提供するサービス。
    """
    
    @staticmethod
    def _should_reflect_attendance(app: Application) -> bool:
        """勤怠への反映対象かを判定します"""
        if app.type == "PaidLeave" or app.type == "有給休暇申請":
            return True
        if app.template and app.template.settings and app.template.settings.get("reflect_attendance"):
            return True
        return False

    @staticmethod
    def _extract_dates_from_application(app: Application) -> Optional[PaidLeaveInputData]:
        """申請データから有給データを抽出します（カスタムテンプレートのマッピング対応）"""
        try:
            mapped_data = app.input_data.copy()
            if app.template and app.template.schema_definition:
                for item in app.template.schema_definition:
                    target_field = None
                    name = None
                    
                    if isinstance(item, dict):
                        target_field = item.get("target_field")
                        name = item.get("name")
                    else:
                        target_field = getattr(item, "target_field", None)
                        name = getattr(item, "name", None)

                    if target_field and name in mapped_data:
                        mapped_data[target_field] = mapped_data[name]

            return PaidLeaveInputData(**mapped_data)
        except Exception:
            return None

    @classmethod
    def get_paid_leave_map(cls, approved_apps: List[Application], start_date: date, end_date: date) -> Dict[date, PaidLeaveInputData]:
        """
        承認済みの有給申請から、日付ごとの有給データをマッピングして返します。
        """
        paid_leave_map = {}
        
        target_apps = [app for app in approved_apps if cls._should_reflect_attendance(app)]

        for app in target_apps:
            pl_data = cls._extract_dates_from_application(app)
            if not pl_data:
                continue

            # 期間の重複チェック
            if pl_data.leave_end_date < start_date or pl_data.leave_start_date > end_date:
                continue
            
            curr = pl_data.leave_start_date
            while curr <= pl_data.leave_end_date:
                if start_date <= curr <= end_date:
                    paid_leave_map[curr] = pl_data
                curr += timedelta(days=1)
                
        return paid_leave_map

    @staticmethod
    def determine_shift_for_date(
        current_date: date, 
        paid_leave_data: Optional[PaidLeaveInputData], 
        shift: Optional[Shift], 
        default_start: time, 
        default_end: time
    ) -> tuple[time, time, Optional[str]]:
        """
        有給申請とシフト情報から、その日の勤務予定時刻とシフトタイプを決定します。
        """
        shift_type = None
        s_start = default_start
        s_end = default_end
        
        if paid_leave_data:
            # 有給申請がある場合、シフト情報をオーバーライド
            if paid_leave_data.leave_type in ["HalfDayMorning", "午前半休"]:
                 # 午前休 -> 午後勤務 (13:00-18:00)
                 s_start = time(13, 0)
                 s_end = time(18, 0)
                 shift_type = "HalfDayMorning"
            elif paid_leave_data.leave_type in ["HalfDayAfternoon", "午後半休"]:
                 # 午後休 -> 午前勤務 (09:00-12:00)
                 s_start = time(9, 0)
                 s_end = time(12, 0)
                 shift_type = "HalfDayAfternoon"
            else:
                 # 全日休
                 s_start = time(9, 0)
                 s_end = time(18, 0)
                 shift_type = "PaidLeave"
        elif shift:
            # 通常シフト
            s_start = shift.start_time
            s_end = shift.end_time
            shift_type = shift.shift_type
            
        return s_start, s_end, shift_type
