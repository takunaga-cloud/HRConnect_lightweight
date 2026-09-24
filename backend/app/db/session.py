import os
from fastapi import Depends
from app.db.dynamodb import get_dynamodb_resource
from app.db.dynamodb_repo import DynamoDBRepository, MockDynamoDBRepository

# モック用リポジトリのシングルトンインスタンス
_mock_repo = None

async def get_dynamodb_repo(resource = Depends(get_dynamodb_resource)) -> DynamoDBRepository:
    """
    FastAPIのDependency Injection用。
    ALLOW_MOCK_AUTH=Trueの場合は実際のDynamoDBに接続せず、MockDynamoDBRepositoryのインスタンスを返します。
    """
    if os.getenv("ALLOW_MOCK_AUTH", "False").lower() == "true":
        global _mock_repo
        if _mock_repo is None:
            _mock_repo = MockDynamoDBRepository()
        return _mock_repo
        
    return DynamoDBRepository(resource)


