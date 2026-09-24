from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import WorkRule, User
from app.schemas.work_rule import WorkRuleCreate, WorkRuleResponse, WorkRuleUpdate

router = APIRouter()


def dict_to_work_rule_model(item: dict) -> WorkRule:
    """
    DynamoDBのアイテム辞書からSQLAlchemyのWorkRuleモデルを生成します。
    """
    return WorkRule(
        id=UUID(item["id"]) if "id" in item else None,
        name=item.get("name", ""),
        config=item.get("config", {})
    )


@router.get("/", response_model=List[WorkRuleResponse])
async def read_work_rules(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    就業規則の一覧を取得します。
    """
    items = await repo.scan_items_by_type("WORK_RULE#", "METADATA")
    work_rules = [dict_to_work_rule_model(item) for item in items]
    return work_rules


@router.post("/", response_model=WorkRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_work_rule(
    work_rule_in: WorkRuleCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    新しい就業規則を作成します（管理者のみ想定）。
    """
    rule_id = str(uuid4())
    pk = f"WORK_RULE#{rule_id}"
    
    new_item = {
        "PK": pk,
        "SK": "METADATA",
        "id": rule_id,
        "name": work_rule_in.name,
        "config": work_rule_in.config.model_dump()
    }
    
    await repo.put_item(new_item)
    return dict_to_work_rule_model(new_item)


@router.get("/{work_rule_id}", response_model=WorkRuleResponse)
async def read_work_rule(
    work_rule_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    指定IDの就業規則を取得します。
    """
    pk = f"WORK_RULE#{str(work_rule_id)}"
    item = await repo.get_item(pk, "METADATA")
    if not item:
        if str(work_rule_id) == "00000000-0000-0000-0000-000000000000":
            default_item = {
                "id": "00000000-0000-0000-0000-000000000000",
                "name": "デフォルト就業規則",
                "config": {
                    "standard_working_hours": 8.0,
                    "break_time_rules": []
                }
            }
            return dict_to_work_rule_model(default_item)
        raise HTTPException(status_code=404, detail="Work rule not found")
    return dict_to_work_rule_model(item)


@router.put("/{work_rule_id}", response_model=WorkRuleResponse)
async def update_work_rule(
    work_rule_id: UUID,
    work_rule_in: WorkRuleUpdate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    就業規則を更新します（管理者のみ想定）。
    """
    pk = f"WORK_RULE#{str(work_rule_id)}"
    item = await repo.get_item(pk, "METADATA")
    if not item:
        raise HTTPException(status_code=404, detail="Work rule not found")

    if work_rule_in.name is not None:
        item["name"] = work_rule_in.name
    if work_rule_in.config is not None:
        item["config"] = work_rule_in.config.model_dump()

    await repo.put_item(item)
    return dict_to_work_rule_model(item)
