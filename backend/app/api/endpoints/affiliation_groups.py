from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_dynamodb_repo, check_admin_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import AffiliationGroup, User
from app.schemas.affiliation_group import (
    AffiliationGroupCreate,
    AffiliationGroupResponse,
    AffiliationGroupUpdate,
)

router = APIRouter()


def dict_to_affiliation_group_model(item: dict) -> AffiliationGroup:
    """
    DynamoDBのアイテム辞書からSQLAlchemyのAffiliationGroupモデルを生成します。
    """
    return AffiliationGroup(
        id=UUID(item["id"]) if "id" in item else None,
        name=item.get("name", "")
    )


@router.get("/", response_model=List[AffiliationGroupResponse])
async def get_affiliation_groups(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    所属グループ一覧を取得
    """
    items = await repo.scan_items_by_type("AFF_GROUP#", "METADATA")
    groups = [dict_to_affiliation_group_model(item) for item in items]
    groups.sort(key=lambda x: x.name)
    return groups


@router.post(
    "/", response_model=AffiliationGroupResponse, status_code=status.HTTP_201_CREATED
)
async def create_affiliation_group(
    group_in: AffiliationGroupCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    所属グループ作成
    """
    group_id = str(uuid4())
    pk = f"AFF_GROUP#{group_id}"
    
    new_item = {
        "PK": pk,
        "SK": "METADATA",
        "id": group_id,
        "name": group_in.name
    }
    
    await repo.put_item(new_item)
    return dict_to_affiliation_group_model(new_item)


@router.put("/{group_id}", response_model=AffiliationGroupResponse)
async def update_affiliation_group(
    group_id: UUID,
    group_in: AffiliationGroupUpdate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    所属グループ更新
    """
    pk = f"AFF_GROUP#{str(group_id)}"
    item = await repo.get_item(pk, "METADATA")
    
    if not item:
        raise HTTPException(status_code=404, detail="Affiliation group not found")
        
    update_data = group_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        item[field] = value
        
    await repo.put_item(item)
    return dict_to_affiliation_group_model(item)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_affiliation_group(
    group_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    所属グループ削除
    """
    pk = f"AFF_GROUP#{str(group_id)}"
    item = await repo.get_item(pk, "METADATA")
    
    if not item:
        raise HTTPException(status_code=404, detail="Affiliation group not found")
        
    await repo.delete_item(pk, "METADATA")
