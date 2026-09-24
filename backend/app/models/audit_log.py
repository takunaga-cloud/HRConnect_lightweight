from datetime import datetime
from typing import Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import DateTime, String, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class AuditLog(Base):
    """
    監査ログモデル。
    重要な操作（データ変更など）の履歴を記録します。
    """
    __tablename__ = "audit_logs"

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    user_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_ip_address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    target_resource_type: Mapped[str] = mapped_column(String, nullable=False)
    target_resource_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    result: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    user: Mapped[Optional["User"]] = relationship()
