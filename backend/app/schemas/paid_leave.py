from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PaidLeaveGrant(BaseModel):
    user_id: UUID
    grant_date: date
    days_granted: float
    # expire_date: Optional[date] = None # Optional, if logic handles default (2 years usually)


class PaidLeaveResponse(BaseModel):
    id: UUID
    user_id: UUID
    grant_date: date
    expire_date: date
    days_granted: float
    days_used: float

    class Config:
        from_attributes = True


class PaidLeaveHistoryItem(BaseModel):
    date: date
    type: str  # "Grant" or "Usage"
    amount: float # Positive for grant, negative for usage (visually handled in FE)
    description: str


class UserPaidLeaveSummary(BaseModel):
    user_id: UUID
    total_granted: float
    total_used: float
    current_balance: float
    ledgers: list[PaidLeaveResponse]
    history: list[PaidLeaveHistoryItem]
