from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo, dict_to_user_model
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter()


def mask_hourly_rate(user_obj: User, current_user: User) -> UserResponse:
    """
    ログインユーザーがAdminまたはManager以外である場合、時間単価(hourly_rate)を隠蔽します。
    """
    res = UserResponse.model_validate(user_obj)
    if current_user.role.lower() not in ["admin", "manager"]:
        res.hourly_rate = None
    return res


@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user: User = Depends(get_current_user),
):
    """
    ログイン中のユーザー情報を取得します。
    """
    return mask_hourly_rate(current_user, current_user)


@router.get("/", response_model=List[UserResponse])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    全ユーザーの一覧を取得します。
    """
    # 簡易的にScanを用いて全ユーザーを取得
    items = await repo.scan_items_by_type("USER#", "METADATA")
    # skip/limitの適用
    items_sliced = items[skip : skip + limit]
    users = [dict_to_user_model(item) for item in items_sliced]
    return [mask_hourly_rate(u, current_user) for u in users]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),  # ロールチェックを簡易的に適用
):
    """
    新しいユーザーを作成します（管理者のみ）。
    """
    # 権限チェック
    if current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges"
        )

    # メールアドレスおよびUserIDの重複チェック（Scanで検索）
    items = await repo.scan_items_by_type("USER#", "METADATA")
    for item in items:
        if item.get("email") == user_in.email:
            raise HTTPException(
                status_code=400,
                detail="The user with this email already exists in the system.",
            )
        if item.get("user_id") == user_in.user_id:
            raise HTTPException(
                status_code=400,
                detail="The user with this UserID already exists in the system.",
            )

    cognito_sub = str(uuid4())
    user_uuid = str(uuid4())
    
    new_item = {
        "PK": f"USER#{cognito_sub}",
        "SK": "METADATA",
        "id": user_uuid,
        "cognito_sub": cognito_sub,
        "email": user_in.email,
        "user_id": user_in.user_id,
        "name": user_in.name,
        "role": user_in.role,
        "status": user_in.status,
        "department_id": str(user_in.department_id) if user_in.department_id else None,
        "work_rule_id": str(user_in.work_rule_id) if user_in.work_rule_id else "00000000-0000-0000-0000-000000000000",
        "hourly_rate": user_in.hourly_rate if user_in.hourly_rate is not None else 0,
    }
    
    await repo.put_item(new_item)
    created_user = dict_to_user_model(new_item)
    return mask_hourly_rate(created_user, current_user)


@router.put("/{cognito_sub}", response_model=UserResponse)
async def update_user(
    cognito_sub: str,
    user_in: UserUpdate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    ユーザー情報を更新します（管理者用）。
    """
    if current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges"
        )

    # ユーザーの取得
    item = await repo.get_item(f"USER#{cognito_sub}", "METADATA")
    if not item:
        raise HTTPException(status_code=404, detail="User not found")

    # 重複チェック用全取得
    items = await repo.scan_items_by_type("USER#", "METADATA")

    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "email" and value != item.get("email"):
            if any(i.get("email") == value for i in items):
                raise HTTPException(status_code=400, detail="The user with this email already exists.")
            item["email"] = value
        elif field == "user_id" and value != item.get("user_id"):
            if any(i.get("user_id") == value for i in items):
                raise HTTPException(status_code=400, detail="The user with this UserID already exists.")
            item["user_id"] = value
        elif field in ["name", "role", "status", "department_id", "work_rule_id", "hourly_rate"]:
            if field in ["department_id", "work_rule_id"] and value:
                item[field] = str(value)
            else:
                item[field] = value

    await repo.put_item(item)
    updated_user = dict_to_user_model(item)
    return mask_hourly_rate(updated_user, current_user)


@router.delete("/{cognito_sub}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    cognito_sub: str,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    指定されたユーザーを削除します（管理者のみ）。
    """
    if cognito_sub == current_user.cognito_sub:
        raise HTTPException(
            status_code=400,
            detail="自分自身を削除することはできません。"
        )

    item = await repo.get_item(f"USER#{cognito_sub}", "METADATA")
    if not item:
        raise HTTPException(status_code=404, detail="User not found")

    await repo.delete_item(f"USER#{cognito_sub}", "METADATA")
