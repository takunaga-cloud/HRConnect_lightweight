from uuid import UUID
from pydantic import BaseModel


class AffiliationGroupBase(BaseModel):
    name: str


class AffiliationGroupCreate(AffiliationGroupBase):
    pass


class AffiliationGroupUpdate(AffiliationGroupBase):
    pass


class AffiliationGroupResponse(AffiliationGroupBase):
    id: UUID

    class Config:
        from_attributes = True
