from datetime import date
from typing import TYPE_CHECKING, List
from uuid import UUID
from sqlalchemy import String, Boolean, Float, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class LeaveType(Base):
    """
    休暇区分マスタ。
    管理者が任意の休暇区分（有休、代休、慶弔、夏季など）を設定できます。
    """
    __tablename__ = "leave_types"

    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    is_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)  # 有給か無給か
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)  # システム標準（有休・代休など）

    # Relationships
    ledgers: Mapped[List["LeaveLedger"]] = relationship(
        back_populates="leave_type", cascade="all, delete-orphan"
    )


class LeaveLedger(Base):
    """
    休暇管理台帳。
    ユーザーごとの各種休暇の付与、消化、有効期限を管理します。
    """
    __tablename__ = "leave_ledgers"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    leave_type_id: Mapped[UUID] = mapped_column(ForeignKey("leave_types.id"), nullable=False)
    grant_date: Mapped[date] = mapped_column(Date, nullable=False)
    expire_date: Mapped[date] = mapped_column(Date, nullable=False)
    days_granted: Mapped[float] = mapped_column(Float, nullable=False)
    days_used: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="leave_ledgers")
    leave_type: Mapped["LeaveType"] = relationship(back_populates="ledgers")
