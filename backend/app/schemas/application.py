from datetime import date, datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ApplicationBase(BaseModel):
    template_id: UUID
    type: str
    input_data: dict # JSONBフィールドのPydantic表現


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    status: Optional[Literal["Pending", "Approved", "Rejected"]] = None
    input_data: Optional[dict] = None
    approver_id: Optional[UUID] = None


from app.schemas.user import UserResponse

class ApplicationResponse(ApplicationBase):
    id: UUID
    user_id: UUID
    status: Literal["Pending", "Approved", "Rejected"]
    approver_id: Optional[UUID] = None
    created_at: datetime
    user: Optional[UserResponse] = None
    approver: Optional[UserResponse] = None

    class Config:
        from_attributes = True


from pydantic import BaseModel, Field, field_validator
import dateutil.parser

# 有給休暇申請の input_data スキーマ
class PaidLeaveInputData(BaseModel):
    leave_start_date: date
    leave_end_date: date
    leave_type: str
    reason: Optional[str] = None

# 打刻修正申請の input_data スキーマ
class StampCorrectionInputData(BaseModel):
    correction_date: date
    original_clock_in: Optional[datetime] = None
    original_clock_out: Optional[datetime] = None
    new_clock_in: Optional[datetime] = None
    new_clock_out: Optional[datetime] = None
    reason: str

    @field_validator("original_clock_in", "original_clock_out", "new_clock_in", "new_clock_out", mode="before")
    @classmethod
    def parse_datetime_flexible(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped or v_stripped.lower() in ("none", "null", "undefined", ""):
                return None
            try:
                return dateutil.parser.parse(v_stripped)
            except Exception:
                try:
                    return datetime.fromisoformat(v_stripped.replace("Z", "+00:00").replace(" ", "T"))
                except Exception:
                    return None
        return None

    @field_validator("correction_date", mode="before")
    @classmethod
    def parse_date_flexible(cls, v):
        if v is None:
            return None
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped or v_stripped.lower() in ("none", "null", "undefined", ""):
                return None
            try:
                return dateutil.parser.parse(v_stripped).date()
            except Exception:
                try:
                    return date.fromisoformat(v_stripped)
                except Exception:
                    return None
        return None


# 例: ApplicationTemplate のスキーマ
class ApplicationTemplateItemConfig(BaseModel):
    name: str # 項目名
    type: Literal["text", "date", "time", "select", "money"] # 入力形式
    options: Optional[List[str]] = None # type=selectの場合の選択肢
    datasource_type: Literal["manual", "master"] = "manual" # 追加: データソースタイプ
    datasource_key: Optional[str] = None # 追加: type=masterの場合のマスタキー (projects, departments, users)
    target_field: Optional[str] = None # 追加: マッピング先フィールド (leave_start_date, leave_type, etc.)
    required: bool = True # 必須かどうか

class ApplicationTemplateSettings(BaseModel):
    reflect_attendance: bool = False # 勤怠(打刻)への反映
    reflect_schedule: bool = False   # シフトへの反映
    reflect_dashboard: bool = False  # ダッシュボードへの反映

from pydantic import BaseModel, Field, field_validator

class ApplicationTemplateBase(BaseModel):
    name: str
    schema_definition: List[ApplicationTemplateItemConfig]
    settings: Optional[ApplicationTemplateSettings] = None

    @field_validator("schema_definition", mode="before")
    @classmethod
    def parse_schema_definition(cls, v):
        if isinstance(v, dict):
            return []
        if v is None:
            return []
        return v

class ApplicationTemplateCreate(ApplicationTemplateBase):
    pass

class ApplicationTemplateUpdate(BaseModel):
    name: Optional[str] = None
    schema_definition: Optional[List[ApplicationTemplateItemConfig]] = None
    settings: Optional[ApplicationTemplateSettings] = None


class ApplicationTemplateResponse(ApplicationTemplateBase):
    id: UUID

    class Config:
        from_attributes = True
