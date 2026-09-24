from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import verify_token
from app.db.session import get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User, Department

# OAuth2PasswordBearerをインスタンス化
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def dict_to_user_model(item: dict) -> User:
    """
    DynamoDBのアイテム辞書から、互換性のためにSQLAlchemyのUserモデル（非永続）を生成します。
    """
    user = User(
        cognito_sub=item.get("cognito_sub", ""),
        email=item.get("email", ""),
        user_id=item.get("user_id", ""),
        name=item.get("name", ""),
        status=item.get("status", "Active"),
        role=item.get("role", "Employee"),
        hourly_rate=int(item.get("hourly_rate", 0)),
    )
    if "id" in item:
        user.id = UUID(item["id"])
    if "department_id" in item and item["department_id"]:
        user.department_id = UUID(item["department_id"])
        # ダミーのDepartmentを紐付けておく
        user.department = Department(id=user.department_id, name=item.get("department_name", "Unknown"))
    if "work_rule_id" in item and item["work_rule_id"]:
        user.work_rule_id = UUID(item["work_rule_id"])
    return user

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    repo: Annotated[DynamoDBRepository, Depends(get_dynamodb_repo)],
) -> User:
    """
    現在の認証済みユーザーを取得します。
    JWTトークンを検証し、Cognitoのsub(ID)に基づいてDynamoDBからユーザーをロードします。
    """
    # 開発用バイパス設定（モック認証）
    import os
    if os.getenv("ALLOW_MOCK_AUTH", "False").lower() == "true":
        if token.startswith("mock-token-"):
            # モックユーザーのキーで直接引く
            token_suffix = token[len("mock-token-"):]
            new_email = token_suffix if "@" in token_suffix else "user@example.com"
            mock_sub = f"mock-sub-{new_email}"
            
            item = await repo.get_item(f"USER#{mock_sub}", "METADATA")
            if not item:
                # 存在しない場合は新規モックユーザーを書き込む
                mock_id = "00000000-0000-0000-0000-000000000000"
                item = {
                    "PK": f"USER#{mock_sub}",
                    "SK": "METADATA",
                    "id": mock_id,
                    "cognito_sub": mock_sub,
                    "email": new_email,
                    "name": "Mock User",
                    "status": "Active",
                    "role": "Admin",
                    "work_rule_id": "00000000-0000-0000-0000-000000000000",
                    "hourly_rate": 0
                }
                await repo.put_item(item)
            return dict_to_user_model(item)

    # トークン検証
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        from app.core.security import verify_local_token
        payload = verify_local_token(token)
        if not payload:
            payload = verify_token(token)
        cognito_sub: str = payload.get("sub")
        if cognito_sub is None:
            raise credentials_exception
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token processing error: {e}",
        )

    # DynamoDBからユーザー項目を取得
    item = await repo.get_item(f"USER#{cognito_sub}", "METADATA")
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return dict_to_user_model(item)


def check_admin_role(current_user: User = Depends(get_current_user)) -> User:
    """
    管理者権限（role="Admin" または "admin"）を持つユーザーのみ許可します。
    """
    if current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


def check_manager_role(current_user: User = Depends(get_current_user)) -> User:
    """
    管理者またはマネージャー権限を持つユーザーを許可します。
    """
    if current_user.role.lower() not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


def check_leader_role(current_user: User = Depends(get_current_user)) -> User:
    """
    管理者、マネージャー、またはリーダー権限を持つユーザーを許可します。
    """
    if current_user.role.lower() not in ["admin", "manager", "leader"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user
