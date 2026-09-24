from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import ShiftTemplate, User
from app.schemas.shift_template import ShiftTemplateCreate, ShiftTemplateResponse, ShiftTemplateUpdate

router = APIRouter()


def dict_to_shift_template_model(item: dict) -> ShiftTemplate:
    """
    DynamoDBのアイテム辞書からSQLAlchemyのShiftTemplateモデルを生成します。
    """
    # DynamoDBから取得した時刻文字列をdatetime.timeオブジェクトへ変換（必要な場合）
    from datetime import time
    def to_time(t_val):
        if isinstance(t_val, time):
            return t_val
        if isinstance(t_val, str) and ":" in t_val:
            parts = t_val.split(":")
            return time(int(parts[0]), int(parts[1]))
        return time(9, 0) # デフォルト値

    return ShiftTemplate(
        id=UUID(item["id"]) if "id" in item else None,
        name=item.get("name", ""),
        start_time=to_time(item.get("start_time")),
        end_time=to_time(item.get("end_time")),
        break_minutes=int(item.get("break_minutes", 60))
    )


@router.get("/", response_model=List[ShiftTemplateResponse])
async def read_shift_templates(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    シフトテンプレート一覧を取得します。
    """
    items = await repo.scan_items_by_type("SHIFT_TEMP#", "METADATA")
    templates = [dict_to_shift_template_model(item) for item in items]
    return templates


@router.post("/", response_model=ShiftTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_shift_template(
    template_in: ShiftTemplateCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    新しいシフトテンプレートを作成します。
    """
    template_id = str(uuid4())
    pk = f"SHIFT_TEMP#{template_id}"
    
    new_item = {
        "PK": pk,
        "SK": "METADATA",
        "id": template_id,
        "name": template_in.name,
        "start_time": template_in.start_time,
        "end_time": template_in.end_time,
        "break_minutes": template_in.break_minutes
    }
    
    await repo.put_item(new_item)
    return dict_to_shift_template_model(new_item)


@router.put("/{template_id}", response_model=ShiftTemplateResponse)
async def update_shift_template(
    template_id: UUID,
    template_in: ShiftTemplateUpdate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    シフトテンプレートを更新します。
    """
    pk = f"SHIFT_TEMP#{str(template_id)}"
    item = await repo.get_item(pk, "METADATA")
    if not item:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        item[field] = value
        
    await repo.put_item(item)
    return dict_to_shift_template_model(item)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shift_template(
    template_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    シフトテンプレートを削除します。
    """
    pk = f"SHIFT_TEMP#{str(template_id)}"
    item = await repo.get_item(pk, "METADATA")
    if not item:
        raise HTTPException(status_code=404, detail="Template not found")
    
    await repo.delete_item(pk, "METADATA")
