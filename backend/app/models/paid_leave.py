from datetime import date
from typing import TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Date, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class PaidLeaveLedger(Base):
    """
    有給休暇管理台帳モデル。
    ユーザーごとの付与日、期限、付与日数、消化日数を管理します。
    """
    __tablename__ = "paid_leave_ledgers"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    grant_date: Mapped[date] = mapped_column(Date, nullable=False)
    expire_date: Mapped[date] = mapped_column(Date, nullable=False)
    days_granted: Mapped[float] = mapped_column(Float, nullable=False)
    days_used: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="paid_leave_ledgers")
