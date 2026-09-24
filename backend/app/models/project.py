from datetime import date
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, Date, Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class WorkLog(Base):
    """
    工数（作業実績）ログを表すモデル。
    どのプロジェクト・タスクカテゴリに何分時間を使ったかを記録します。
    """
    __tablename__ = "work_logs"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    project_id: Mapped[UUID] = mapped_column(ForeignKey("projects.id"), nullable=False)
    task_category_id: Mapped[UUID] = mapped_column(
        ForeignKey("task_categories.id"), nullable=False
    )
    minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="work_logs")
    project: Mapped["Project"] = relationship(back_populates="work_logs")
    task_category: Mapped["TaskCategory"] = relationship(back_populates="work_logs")


class Project(Base):
    """
    プロジェクト情報を表すモデル。
    """
    __tablename__ = "projects"

    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    budget_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    leader_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    main_languages: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    skills: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    environments: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    difficulty: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
 
    # Relationships
    work_logs: Mapped[List["WorkLog"]] = relationship(back_populates="project")
    leader: Mapped[Optional["User"]] = relationship()
    members: Mapped[List["User"]] = relationship(secondary="project_members", back_populates="assigned_projects")
    member_associations: Mapped[List["ProjectMember"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class ProjectRole(Base):
    """
    プロジェクト内での役割（PM、リーダー、開発者、テスターなど）を表すモデル。
    """
    __tablename__ = "project_roles"

    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)


class ProjectMember(Base):
    """
    プロジェクトとユーザーの多対多の関連を表す中間テーブルモデル。
    """
    __tablename__ = "project_members"

    project_id: Mapped[UUID] = mapped_column(ForeignKey("projects.id"), nullable=False)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("project_roles.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="member_associations")
    user: Mapped["User"] = relationship()
    role: Mapped[Optional["ProjectRole"]] = relationship()


class TaskCategory(Base):
    """
    作業タスクのカテゴリ（例：設計、開発、会議など）を表すモデル。
    """
    __tablename__ = "task_categories"

    name: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    work_logs: Mapped[List["WorkLog"]] = relationship(back_populates="task_category")
