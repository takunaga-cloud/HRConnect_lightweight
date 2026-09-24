from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class GPSData(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None

from app.schemas.work_log import WorkLogWithDetails


class AttendanceMetaData(BaseModel):
    gps: Optional[GPSData] = None
    ip_address: Optional[str] = None
    device_info: Optional[str] = None
    stamp_type: Optional[str] = None


class AttendanceCreate(BaseModel):
    work_date: date
    clock_in: datetime
    meta_data: Optional[AttendanceMetaData] = None


class AttendanceUpdate(BaseModel):
    clock_out: Optional[datetime] = None
    breaks: Optional[list[dict]] = None
    status: Optional[str] = None
    total_work_minutes: Optional[float] = None


class AttendanceResponse(AttendanceCreate):
    id: UUID
    user_id: UUID
    clock_out: Optional[datetime] = None
    breaks: Optional[list[dict]] = None
    status: str
    total_work_minutes: Optional[float] = None
    scheduled_start_time: Optional[datetime] = None
    scheduled_end_time: Optional[datetime] = None

    class Config:
        from_attributes = True


class CalendarDailyResponse(BaseModel):
    date: date
    scheduled_start_time: Optional[datetime] = None
    scheduled_end_time: Optional[datetime] = None
    shift_type: Optional[str] = None
    shift_status: Optional[str] = None
    shift_id: Optional[UUID] = None
    attendance: Optional[AttendanceResponse] = None
    work_logs: list[WorkLogWithDetails] = []
    total_log_minutes: int = 0
