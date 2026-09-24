from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import check_admin_role, get_dynamodb_repo, check_leader_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import ProjectRole, User
from app.schemas.project_role import ProjectRoleCreate, ProjectRoleResponse, ProjectRoleUpdate

router = APIRouter()


def dict_to_project_role_model(item: dict) -> ProjectRole:
    """
    DynamoDBのアイテム辞書からSQLAlchemyのProjectRoleモデルを生成します。
    """
    return ProjectRole(
        id=UUID(item["id"]) if "id" in item else None,
        name=item.get("name", ""),
        description=item.get("description", "")
    )


@router.get("/", response_model=List[ProjectRoleResponse])
async def get_project_roles(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_leader_role),  # リーダー以上が取得可能
):
    """
    プロジェクト役割一覧を取得します。
    """
    items = await repo.scan_items_by_type("PROJECT_ROLE#", "METADATA")
    roles = [dict_to_project_role_model(item) for item in items]
    roles.sort(key=lambda x: x.name)
    return roles


@router.post("/", response_model=ProjectRoleResponse, status_code=status.HTTP_201_CREATED)
async def create_project_role(
    role_in: ProjectRoleCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),  # 管理者のみ作成可能
):
    """
    新規にプロジェクト役割を作成します。
    """
    # 同名チェック
    items = await repo.scan_items_by_type("PROJECT_ROLE#", "METADATA")
    if any(item.get("name") == role_in.name for item in items):
        raise HTTPException(
            status_code=400,
            detail="同名のプロジェクト役割が既に存在します。"
        )

    role_id = str(uuid4())
    pk = f"PROJECT_ROLE#{role_id}"
    
    new_item = {
        "PK": pk,
        "SK": "METADATA",
        "id": role_id,
        "name": role_in.name,
        "description": role_in.description
    }
    
    await repo.put_item(new_item)
    return dict_to_project_role_model(new_item)


@router.put("/{role_id}", response_model=ProjectRoleResponse)
async def update_project_role(
    role_id: UUID,
    role_in: ProjectRoleUpdate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),  # 管理者のみ更新可能
):
    """
    プロジェクト役割を更新します。
    """
    pk = f"PROJECT_ROLE#{str(role_id)}"
    item = await repo.get_item(pk, "METADATA")
    
    if not item:
        raise HTTPException(status_code=404, detail="プロジェクト役割が見つかりません。")

    # 同名チェック
    if role_in.name and role_in.name != item.get("name"):
        items = await repo.scan_items_by_type("PROJECT_ROLE#", "METADATA")
        if any(i.get("name") == role_in.name for i in items):
            raise HTTPException(
                status_code=400,
                detail="同名のプロジェクト役割が既に存在します。"
            )
        
    update_data = role_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        item[field] = value
            
    await repo.put_item(item)
    return dict_to_project_role_model(item)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_role(
    role_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),  # 管理者のみ削除可能
):
    """
    プロジェクト役割を削除します。
    """
    pk = f"PROJECT_ROLE#{str(role_id)}"
    item = await repo.get_item(pk, "METADATA")
    
    if not item:
        raise HTTPException(status_code=404, detail="プロジェクト役割が見つかりません。")

    await repo.delete_item(pk, "METADATA")
