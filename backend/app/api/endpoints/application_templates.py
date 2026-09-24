from typing import List, Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import ApplicationTemplate, User
from app.schemas.application import (
    ApplicationTemplateResponse,
    ApplicationTemplateCreate,
    ApplicationTemplateUpdate,
    ApplicationTemplateItemConfig
)

router = APIRouter()


def dict_to_application_template_model(item: dict) -> ApplicationTemplate:
    """
    DynamoDBのアイテム辞書からSQLAlchemyのApplicationTemplateモデルを生成します。
    """
    return ApplicationTemplate(
        id=UUID(item["id"]) if "id" in item else None,
        name=item.get("name", ""),
        schema_definition=item.get("schema_definition", []),
        settings=item.get("settings")
    )


@router.get("/", response_model=List[ApplicationTemplateResponse])
async def get_all_application_templates(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    全ての申請テンプレートを取得します。
    """
    items = await repo.scan_items_by_type("APP_TEMP#", "METADATA")
    templates = [dict_to_application_template_model(item) for item in items]
    return templates


@router.post("/", response_model=ApplicationTemplateResponse)
async def create_application_template(
    template_in: ApplicationTemplateCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    新しい申請テンプレートを作成します。
    """
    schema_dump = [item.model_dump() for item in template_in.schema_definition]
    template_id = str(uuid4())
    pk = f"APP_TEMP#{template_id}"
    
    new_item = {
        "PK": pk,
        "SK": "METADATA",
        "id": template_id,
        "name": template_in.name,
        "schema_definition": schema_dump,
        "settings": template_in.settings.model_dump() if template_in.settings else None
    }
    
    await repo.put_item(new_item)
    return dict_to_application_template_model(new_item)


@router.get("/{template_id}", response_model=ApplicationTemplateResponse)
async def get_application_template(
    template_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    指定されたIDの申請テンプレートを取得します。
    """
    pk = f"APP_TEMP#{str(template_id)}"
    item = await repo.get_item(pk, "METADATA")
    if not item:
        raise HTTPException(status_code=404, detail="Template not found")
    return dict_to_application_template_model(item)


@router.put("/{template_id}", response_model=ApplicationTemplateResponse)
async def update_application_template(
    template_id: UUID,
    template_in: ApplicationTemplateUpdate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    申請テンプレートを更新します。
    """
    pk = f"APP_TEMP#{str(template_id)}"
    item = await repo.get_item(pk, "METADATA")
    if not item:
        raise HTTPException(status_code=404, detail="Template not found")

    if template_in.name is not None:
        item["name"] = template_in.name
    if template_in.schema_definition is not None:
        item["schema_definition"] = [item.model_dump() for item in template_in.schema_definition]
    if template_in.settings is not None:
        item["settings"] = template_in.settings.model_dump()

    await repo.put_item(item)
    return dict_to_application_template_model(item)


@router.delete("/{template_id}")
async def delete_application_template(
    template_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    申請テンプレートを削除します。
    """
    pk = f"APP_TEMP#{str(template_id)}"
    item = await repo.get_item(pk, "METADATA")
    if not item:
        raise HTTPException(status_code=404, detail="Template not found")

    await repo.delete_item(pk, "METADATA")
    return {"ok": True}
