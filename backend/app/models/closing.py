from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Boolean,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User

class MonthlyClosing(Base):
    __tablename__ = "monthly_closings"

    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="Open") # Open, Closed
    closed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_by_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=True)

    # Relationships
    closed_by: Mapped["User"] = relationship()

    __table_args__ = (
        UniqueConstraint("year", "month", name="uq_monthly_closing_year_month"),
    )
