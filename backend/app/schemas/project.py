from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class ProjectBase(BaseModel):
    code: str
    name: str
    start_date: date
    end_date: Optional[date] = None
    is_active: bool = True
    budget_minutes: int = 0
    leader_id: Optional[UUID] = None
    main_languages: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    environments: Optional[List[str]] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None


class ProjectMemberAssignment(BaseModel):
    """
    プロジェクトメンバーのアサイン情報（ユーザーIDと役割IDのペア）。
    """
    user_id: UUID
    role_id: Optional[UUID] = None


class ProjectCreate(ProjectBase):
    member_assignments: Optional[List[ProjectMemberAssignment]] = None


class ProjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    budget_minutes: Optional[int] = None
    leader_id: Optional[UUID] = None
    member_ids: Optional[List[UUID]] = None
    member_assignments: Optional[List[ProjectMemberAssignment]] = None
    main_languages: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    environments: Optional[List[str]] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None


class ProjectLeaderResponse(BaseModel):
    id: UUID
    name: str
    role: str

    class Config:
        from_attributes = True


class ProjectMemberUserResponse(BaseModel):
    """
    役割情報を含んだプロジェクトメンバーのレスポンススキーマ。
    """
    id: UUID
    name: str
    role: str
    project_role_id: Optional[UUID] = None
    project_role_name: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectSimpleResponse(ProjectBase):
    id: UUID

    class Config:
        from_attributes = True


class ProjectResponse(ProjectBase):
    id: UUID
    leader: Optional[ProjectLeaderResponse] = None
    members: Optional[List[ProjectMemberUserResponse]] = None

    class Config:
        from_attributes = True

    @field_validator("main_languages", "skills", "environments", mode="before")
    @classmethod
    def convert_comma_string_to_list(cls, v):
        if isinstance(v, str):
            return [x.strip() for x in v.split(",") if x.strip()]
        return v
