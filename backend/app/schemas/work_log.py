from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

from .project import ProjectBase, ProjectSimpleResponse
from .task_category import TaskCategoryBase, TaskCategoryResponse


class WorkLogBase(BaseModel):
    log_date: date
    project_id: UUID
    task_category_id: UUID
    minutes: int
    comment: Optional[str] = None


class WorkLogCreate(WorkLogBase):
    pass


class WorkLogResponse(WorkLogBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True


class WorkLogWithDetails(WorkLogResponse):
    project: ProjectSimpleResponse
    task_category: TaskCategoryResponse

    class Config:
        from_attributes = True


class WorkLogBulkCreate(BaseModel):
    work_logs: List[WorkLogCreate]
