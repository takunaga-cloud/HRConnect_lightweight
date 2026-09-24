from datetime import date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel

class LeaveTypeResponse(BaseModel):
    id: UUID
    name: str
    is_paid: bool
    is_system: bool

    class Config:
        from_attributes = True

class LeaveLedgerGrant(BaseModel):
    user_id: UUID
    leave_type_id: UUID
    grant_date: date
    expire_date: Optional[date] = None # 未指定なら翌月末（代休）または2年後（その他）
    days_granted: float

class LeaveLedgerResponse(BaseModel):
    id: UUID
    user_id: UUID
    leave_type_id: UUID
    grant_date: date
    expire_date: date
    days_granted: float
    days_used: float

    class Config:
        from_attributes = True

class LeaveHistoryItem(BaseModel):
    date: date
    type: str # "付与" or "消化"
    amount: float
    description: str

class LeaveLedgerSummary(BaseModel):
    leave_type: LeaveTypeResponse
    total_granted: float
    total_used: float
    current_balance: float
    ledgers: List[LeaveLedgerResponse]
    history: List[LeaveHistoryItem]

class UserLeaveSummary(BaseModel):
    user_id: UUID
    summaries: List[LeaveLedgerSummary]
