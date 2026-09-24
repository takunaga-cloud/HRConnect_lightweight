from datetime import date, datetime
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Date, DateTime, Float, ForeignKey, String, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class Attendance(Base):
    """
    日次の勤怠実績（打刻情報）を表すモデル。
    出退勤時刻、休憩、勤務ステータスなどを管理します。
    """
    __tablename__ = "attendances"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    work_date: Mapped[date] = mapped_column(Date, nullable=False)
    clock_in: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    clock_out: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    breaks: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    meta_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="Present")
    total_work_minutes: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="attendances")
