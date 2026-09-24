from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel

class MonthlyClosingBase(BaseModel):
    year: int
    month: int

class MonthlyClosingCreate(MonthlyClosingBase):
    pass

class MonthlyClosingUpdate(BaseModel):
    status: str

class MonthlyClosingResponse(MonthlyClosingBase):
    id: UUID
    status: str
    closed_at: Optional[datetime] = None
    closed_by_id: Optional[UUID] = None

    class Config:
        from_attributes = True
