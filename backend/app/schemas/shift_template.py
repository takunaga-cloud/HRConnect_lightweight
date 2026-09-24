
from datetime import time
from uuid import UUID

from pydantic import BaseModel

class ShiftTemplateBase(BaseModel):
    name: str
    start_time: time
    end_time: time
    break_minutes: int = 60

class ShiftTemplateCreate(ShiftTemplateBase):
    pass

class ShiftTemplateUpdate(BaseModel):
    name: str | None = None
    start_time: time | None = None
    end_time: time | None = None
    break_minutes: int | None = None

class ShiftTemplateResponse(ShiftTemplateBase):
    id: UUID

    class Config:
        from_attributes = True
