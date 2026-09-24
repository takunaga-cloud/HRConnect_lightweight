from typing import List, Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, ForeignKey, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .shift import Shift
    from .attendance import Attendance
    from .project import Project, WorkLog
    from .application import Application
    from .paid_leave import PaidLeaveLedger
    from .leave import LeaveLedger

class AffiliationGroup(Base):
    """
    所属グループ（例：カンパニー、支社など）を表すモデル。
    """
    __tablename__ = "affiliation_groups"

    name: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    departments: Mapped[List["Department"]] = relationship(back_populates="affiliation_group")


class Department(Base):
    """
    部署を表すモデル。
    所属グループに紐づきます。
    """
    __tablename__ = "departments"

    name: Mapped[str] = mapped_column(String, nullable=False)
    affiliation_group_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("affiliation_groups.id"), nullable=True)

    # Relationships
    users: Mapped[List["User"]] = relationship(back_populates="department")
    affiliation_group: Mapped[Optional["AffiliationGroup"]] = relationship(back_populates="departments")


class WorkRule(Base):
    """
    就業規則設定を表すモデル。
    始業・終業時刻、休憩時間などの勤務ルールを定義します。
    """
    __tablename__ = "work_rules"

    name: Mapped[str] = mapped_column(String, nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Relationships
    users: Mapped[List["User"]] = relationship(back_populates="work_rule")


class User(Base):
    """
    ユーザー情報を表すモデル。
    社員、管理者などの役割や認証情報（Cognito連携）を保持します。
    """
    __tablename__ = "users"

    cognito_sub: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    department_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("departments.id"), nullable=True
    )
    work_rule_id: Mapped[UUID] = mapped_column(ForeignKey("work_rules.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="Active")
    role: Mapped[str] = mapped_column(String, nullable=False, default="Employee")  # Admin, Manager, Leader, Employee
    hourly_rate: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # 時間単価（円/時間）

    # Relationships
    work_rule: Mapped["WorkRule"] = relationship(back_populates="users")
    shifts: Mapped[List["Shift"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    attendances: Mapped[List["Attendance"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    work_logs: Mapped[List["WorkLog"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    applications: Mapped[List["Application"]] = relationship(back_populates="user", foreign_keys="[Application.user_id]", cascade="all, delete-orphan")
    paid_leave_ledgers: Mapped[List["PaidLeaveLedger"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    leave_ledgers: Mapped[List["LeaveLedger"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    department: Mapped[Optional["Department"]] = relationship(back_populates="users")
    assigned_projects: Mapped[List["Project"]] = relationship(secondary="project_members", back_populates="members")
