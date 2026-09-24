from typing import Optional
from app.core import security
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User
from app.api.deps import dict_to_user_model

async def authenticate_user(
    repo: DynamoDBRepository, identifier: str, password: str
) -> Optional[User]:
    """
    DynamoDBからユーザーをメールアドレスまたは社員番号(user_id)で取得し、認証します。
    """
    # 簡易的にScanを使用して検索（開発・小規模環境のため）
    items = await repo.scan_items_by_type("USER#", "METADATA")
    
    user_item = None
    for item in items:
        if item.get("email") == identifier or item.get("user_id") == identifier:
            # mock-sub-を含まない本物のユーザーを優先的に選択する
            if user_item and "mock-sub-" not in user_item.get("cognito_sub", ""):
                if "mock-sub-" in item.get("cognito_sub", ""):
                    continue
            user_item = item
            
    if not user_item:
        return None
        
    hashed_password = user_item.get("hashed_password")
    if not hashed_password:
        return None
        
    if not security.verify_password(password, hashed_password):
        return None
        
    return dict_to_user_model(user_item)
