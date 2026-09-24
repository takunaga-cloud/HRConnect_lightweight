from enum import Enum
from typing import Optional

from pydantic import BaseModel


class AlertLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertType(str, Enum):
    OVERTIME_36 = "overtime_36"
    OVERTIME_SPECIAL = "overtime_special"
    HEAD_COUNTS = "head_counts"  # 将来用


class Alert(BaseModel):
    level: AlertLevel
    type: AlertType
    message: str
    details: Optional[dict] = None
