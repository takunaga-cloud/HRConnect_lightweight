from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User
from app.models.system_definition import SystemDefinition
from app.schemas.system_definition import (
    SystemDefinitionCreate,
    SystemDefinitionResponse,
    SystemDefinitionUpdate,
)

router = APIRouter()


def dict_to_system_definition_model(item: dict) -> SystemDefinition:
    """
    DynamoDBのアイテム辞書からSQLAlchemyのSystemDefinitionモデルを生成します。
    """
    return SystemDefinition(
        id=UUID(item["id"]) if "id" in item else None,
        category_code=item.get("category_code", ""),
        code=item.get("code", ""),
        name=item.get("name", ""),
        order=int(item.get("order", 0)),
        description=item.get("description", "")
    )


@router.get("/", response_model=List[SystemDefinitionResponse])
async def get_system_definitions(
    category_code: str | None = None,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    Get all system definitions, optionally filtered by category.
    """
    items = await repo.scan_items_by_type("SYS_DEF#", "METADATA")
    
    definitions = []
    for item in items:
        if category_code and item.get("category_code") != category_code:
            continue
        definitions.append(dict_to_system_definition_model(item))
        
    definitions.sort(key=lambda x: (x.category_code, x.order))
    return definitions


@router.post("/", response_model=SystemDefinitionResponse, status_code=status.HTTP_201_CREATED)
async def create_system_definition(
    definition_in: SystemDefinitionCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    Create a new system definition.
    """
    def_id = str(uuid4())
    pk = f"SYS_DEF#{def_id}"
    
    new_item = {
        "PK": pk,
        "SK": "METADATA",
        "id": def_id,
        "category_code": definition_in.category_code,
        "code": definition_in.code,
        "name": definition_in.name,
        "order": definition_in.order,
        "description": definition_in.description
    }
    
    await repo.put_item(new_item)
    return dict_to_system_definition_model(new_item)


@router.put("/{definition_id}", response_model=SystemDefinitionResponse)
async def update_system_definition(
    definition_id: UUID,
    definition_in: SystemDefinitionUpdate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    Update a system definition.
    """
    pk = f"SYS_DEF#{str(definition_id)}"
    item = await repo.get_item(pk, "METADATA")
    
    if not item:
        raise HTTPException(status_code=404, detail="System definition not found")
        
    update_data = definition_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        item[field] = value
        
    await repo.put_item(item)
    return dict_to_system_definition_model(item)


@router.delete("/{definition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_system_definition(
    definition_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    Delete a system definition.
    """
    pk = f"SYS_DEF#{str(definition_id)}"
    item = await repo.get_item(pk, "METADATA")
    
    if not item:
        raise HTTPException(status_code=404, detail="System definition not found")
        
    await repo.delete_item(pk, "METADATA")
