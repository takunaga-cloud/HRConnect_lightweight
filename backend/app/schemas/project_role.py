from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class ProjectRoleBase(BaseModel):
    """
    プロジェクト役割の基本スキーマ。
    """
    name: str
    description: Optional[str] = None


class ProjectRoleCreate(ProjectRoleBase):
    """
    プロジェクト役割作成時のスキーマ。
    """
    pass


class ProjectRoleUpdate(BaseModel):
    """
    プロジェクト役割更新時のスキーマ。
    """
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectRoleResponse(ProjectRoleBase):
    """
    プロジェクト役割レスポンス時のスキーマ。
    """
    id: UUID

    class Config:
        from_attributes = True
