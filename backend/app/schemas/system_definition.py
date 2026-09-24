from typing import Optional
from uuid import UUID
from pydantic import BaseModel

class SystemDefinitionBase(BaseModel):
    category_code: str
    code: str
    name: str
    order: int = 0
    description: Optional[str] = None

class SystemDefinitionCreate(SystemDefinitionBase):
    pass

class SystemDefinitionUpdate(BaseModel):
    category_code: Optional[str] = None
    code: Optional[str] = None
    name: Optional[str] = None
    order: Optional[int] = None
    description: Optional[str] = None

class SystemDefinitionResponse(SystemDefinitionBase):
    id: UUID

    class Config:
        from_attributes = True
