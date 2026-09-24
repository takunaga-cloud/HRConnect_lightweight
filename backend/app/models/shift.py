from datetime import date, time
from typing import Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Date, Time, Boolean, String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class Shift(Base):
    """
    日次のシフト予定を表すモデル。
    予定勤務時間やシフトタイプなどを管理します。
    """
    __tablename__ = "shifts"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    target_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_holiday: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    shift_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    remarks: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="Approved")  # Requested (希望) / Approved (確定)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="shifts")


class ShiftTemplate(Base):
    """
    シフトパターンのテンプレート定義を表すモデル。
    よく使うシフトパターン（早番、遅番など）を登録します。
    """
    __tablename__ = "shift_templates"

    name: Mapped[str] = mapped_column(String, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    break_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
