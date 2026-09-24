from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, JSON, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class Application(Base):
    """
    各種申請（有給、残業など）を表すモデル。
    申請内容(input_data)や承認状態を管理します。
    """
    __tablename__ = "applications"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    template_id: Mapped[UUID] = mapped_column(
        ForeignKey("application_templates.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="Pending")
    input_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    approver_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(foreign_keys=[user_id], back_populates="applications")
    approver: Mapped[Optional["User"]] = relationship(
        foreign_keys=[approver_id]
    )
    template: Mapped["ApplicationTemplate"] = relationship(back_populates="applications")


class ApplicationTemplate(Base):
    """
    申請書のテンプレート定義を表すモデル。
    フォームの入力項目定義(schema_definition)などを保持します。
    """
    __tablename__ = "application_templates"

    name: Mapped[str] = mapped_column(String, nullable=False)
    schema_definition: Mapped[dict] = mapped_column(JSON, nullable=False)
    settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    applications: Mapped[List["Application"]] = relationship(back_populates="template")
