from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import check_admin_role, get_current_user, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import TaskCategory, User
from app.schemas.task_category import TaskCategoryCreate, TaskCategoryResponse, TaskCategoryUpdate

router = APIRouter()


def dict_to_task_category_model(item: dict) -> TaskCategory:
    """
    DynamoDBのアイテム辞書からSQLAlchemyのTaskCategoryモデルを生成します。
    """
    return TaskCategory(
        id=UUID(item["id"]) if "id" in item else None,
        name=item.get("name", "")
    )


@router.get("/", response_model=List[TaskCategoryResponse])
async def get_all_task_categories(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    全てのタスクカテゴリを取得します。
    """
    items = await repo.scan_items_by_type("TASK_CATEGORY#", "METADATA")
    task_categories = [dict_to_task_category_model(item) for item in items]
    task_categories.sort(key=lambda x: x.name)
    return task_categories


@router.post("/", response_model=TaskCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_task_category(
    category_in: TaskCategoryCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role), # Check Admin
):
    category_id = str(uuid4())
    pk = f"TASK_CATEGORY#{category_id}"
    
    new_item = {
        "PK": pk,
        "SK": "METADATA",
        "id": category_id,
        "name": category_in.name
    }
    
    await repo.put_item(new_item)
    return dict_to_task_category_model(new_item)


@router.put("/{category_id}", response_model=TaskCategoryResponse)
async def update_task_category(
    category_id: UUID,
    category_in: TaskCategoryUpdate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role), # Check Admin
):
    pk = f"TASK_CATEGORY#{str(category_id)}"
    item = await repo.get_item(pk, "METADATA")
    
    if not item:
        raise HTTPException(status_code=404, detail="Category not found")
        
    update_data = category_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        item[field] = value
        
    await repo.put_item(item)
    return dict_to_task_category_model(item)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_category(
    category_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role), # Check Admin
):
    pk = f"TASK_CATEGORY#{str(category_id)}"
    item = await repo.get_item(pk, "METADATA")
    
    if not item:
        raise HTTPException(status_code=404, detail="Category not found")
        
    await repo.delete_item(pk, "METADATA")
