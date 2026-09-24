from typing import List, Optional, Any, Dict
from uuid import UUID

from pydantic import BaseModel, Field


class WorkRuleConfig(BaseModel):
    rounding_rule_minutes: int = Field(1, description="打刻の丸め単位（分）")
    auto_break_deduction_minutes: int = Field(0, description="自動休憩控除時間（分）")
    late_grace_period_minutes: int = Field(0, description="遅刻許容時間（分）")
    overtime_thresholds: List[Dict[str, Any]] = Field(default_factory=list, description="36協定の残業閾値リスト")


class WorkRuleBase(BaseModel):
    name: str
    config: WorkRuleConfig


class WorkRuleCreate(WorkRuleBase):
    pass


class WorkRuleUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[WorkRuleConfig] = None


class WorkRuleResponse(WorkRuleBase):
    id: UUID

    class Config:
        from_attributes = True
