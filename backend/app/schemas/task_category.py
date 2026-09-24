from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class TaskCategoryBase(BaseModel):
    name: str


class TaskCategoryCreate(TaskCategoryBase):
    pass


class TaskCategoryUpdate(TaskCategoryBase):
    pass


class TaskCategoryResponse(TaskCategoryBase):
    id: UUID

    class Config:
        from_attributes = True
