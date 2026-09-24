from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


from app.schemas.department import DepartmentResponse

class UserBase(BaseModel):
    name: str
    email: str
    status: str
    role: str

class UserCreate(UserBase):
    user_id: str = Field(..., max_length=12, pattern="^[a-zA-Z0-9]+$")
    email: EmailStr
    password: str
    department_id: Optional[UUID] = None
    work_rule_id: UUID
    hourly_rate: Optional[int] = 0

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[UUID] = None
    work_rule_id: Optional[UUID] = None
    status: Optional[str] = None
    email: Optional[EmailStr] = None
    user_id: Optional[str] = None
    password: Optional[str] = None
    hourly_rate: Optional[int] = None

class UserResponse(UserBase):
    id: UUID
    user_id: Optional[str] = None
    department_id: Optional[UUID] = None
    work_rule_id: UUID
    department: Optional[DepartmentResponse] = None
    hourly_rate: Optional[int] = None

    class Config:
        from_attributes = True
