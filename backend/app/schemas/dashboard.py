from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel


class UserBasicInfo(BaseModel):
    id: UUID
    name: str
    email: Optional[str] = None

class DailyAttendanceSummary(BaseModel):
    total_users: int
    present_users: int
    late_users: int
    absent_users: int
    alert_count: int
    present_user_list: List[UserBasicInfo] = []
    late_user_list: List[UserBasicInfo] = []
    absent_user_list: List[UserBasicInfo] = []
    alert_user_list: List[UserBasicInfo] = []
    total_user_list: List[UserBasicInfo] = []
    monthly_overtime_chart: List[Dict[str, Any]]
    daily_attendance_chart: List[Dict[str, Any]]
