from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import check_admin_role, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Department, User
from app.schemas.department import DepartmentCreate, DepartmentResponse, DepartmentUpdate

router = APIRouter()


def dict_to_department_model(item: dict) -> Department:
    """
    DynamoDBのアイテム辞書からSQLAlchemyのDepartmentモデルを生成します。
    """
    return Department(
        id=UUID(item["id"]) if "id" in item else None,
        name=item.get("name", ""),
        affiliation_group_id=UUID(item["affiliation_group_id"]) if item.get("affiliation_group_id") else None
    )


@router.get("/", response_model=List[DepartmentResponse])
async def get_departments(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    全データ取得
    """
    items = await repo.scan_items_by_type("DEPT#", "METADATA")
    departments = [dict_to_department_model(item) for item in items]
    # ソート
    departments.sort(key=lambda x: x.name)
    return departments


@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    department_in: DepartmentCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    作成
    """
    dept_id = str(uuid4())
    pk = f"DEPT#{dept_id}"
    
    new_item = {
        "PK": pk,
        "SK": "METADATA",
        "id": dept_id,
        "name": department_in.name,
        "affiliation_group_id": str(department_in.affiliation_group_id) if department_in.affiliation_group_id else None
    }
    
    await repo.put_item(new_item)
    return dict_to_department_model(new_item)


@router.put("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: UUID,
    department_in: DepartmentUpdate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    更新
    """
    pk = f"DEPT#{str(department_id)}"
    item = await repo.get_item(pk, "METADATA")
    
    if not item:
        raise HTTPException(status_code=404, detail="Department not found")
        
    update_data = department_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "affiliation_group_id" and value:
            item[field] = str(value)
        else:
            item[field] = value
            
    await repo.put_item(item)
    return dict_to_department_model(item)


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    削除
    """
    pk = f"DEPT#{str(department_id)}"
    item = await repo.get_item(pk, "METADATA")
    
    if not item:
        raise HTTPException(status_code=404, detail="Department not found")

    await repo.delete_item(pk, "METADATA")
