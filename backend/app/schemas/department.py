from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from app.schemas.affiliation_group import AffiliationGroupResponse

class DepartmentBase(BaseModel):
    name: str


class DepartmentCreate(DepartmentBase):
    affiliation_group_id: Optional[UUID] = None


class DepartmentUpdate(DepartmentBase):
    affiliation_group_id: Optional[UUID] = None


class DepartmentResponse(DepartmentBase):
    id: UUID
    affiliation_group_id: Optional[UUID] = None
    affiliation_group: Optional[AffiliationGroupResponse] = None

    class Config:
        from_attributes = True
