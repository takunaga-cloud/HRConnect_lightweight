from datetime import date, time
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class ShiftBase(BaseModel):
    user_id: UUID
    target_date: date
    start_time: time
    end_time: time
    is_holiday: bool = False
    shift_type: Optional[str] = None
    remarks: Optional[str] = None
    status: str = "Approved"


class ShiftCreate(ShiftBase):
    pass


class ShiftUpdate(ShiftBase):
    pass


class ShiftTypeUpdate(BaseModel):
    shift_type: str


class ShiftResponse(ShiftBase):
    id: UUID

    class Config:
        from_attributes = True


class ShiftBulkCreate(BaseModel):
    shifts: List[ShiftCreate]


class ShiftBulkUpdate(BaseModel):
    shifts: List[ShiftUpdate]

class HolidayGenerationRequest(BaseModel):
    user_ids: List[UUID]
    start_date: date
    end_date: date
    include_saturdays: bool = True
    include_sundays: bool = True
    include_public_holidays: bool = True
    remarks: Optional[str] = None

class ShiftGenerationRequest(BaseModel):
    user_ids: List[UUID]
    start_date: date
    end_date: date
    start_time: time
    end_time: time
    shift_type: str
    weekdays: List[int] # 0=Monday, 6=Sunday
    exclude_public_holidays: bool = True
    remarks: Optional[str] = None

class ShiftBatchDeleteRequest(BaseModel):
    user_ids: List[UUID]
    start_date: date
    end_date: date


class ShiftRequestCreate(BaseModel):
    target_date: date
    start_time: time
    end_time: time
    is_holiday: bool = False
    shift_type: Optional[str] = None
    remarks: Optional[str] = None


class ShiftRequestBulkCreate(BaseModel):
    requests: List[ShiftRequestCreate]


class ShiftBulkApproveRequest(BaseModel):
    shift_ids: List[UUID]
