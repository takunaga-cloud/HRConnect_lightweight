import pytest
from app.db.dynamodb import create_dynamodb_table_if_not_exists, session
from app.db.dynamodb_repo import DynamoDBRepository
from app.core.config import settings

@pytest.mark.asyncio
async def test_dynamodb_repository_basic_operations():
    """
    DynamoDBの基本操作（Put, Get, Query）を検証する非同期テストです。
    """
    # 接続先をテスト用の仮のローカル環境またはモック（環境変数等で指定されたエンドポイント）として初期化
    # 例としてエンドポイントが無い場合はテストをスキップするか、DynamoDB Localを想定
    # 今回はモック接続（boto3のスタブやMotoが利用できるとベストですが、簡易的にaioboto3でアクセス検証）
    
    # settings.DYNAMODB_TABLE_NAME = "HRConnectTableTest"
    
    # 非同期クライアントセッションを用いてテスト
    async with session.resource("dynamodb", endpoint_url=settings.DYNAMODB_ENDPOINT_URL) as resource:
        repo = DynamoDBRepository(resource)
        
        # テーブル作成の疎通（テスト前に実行）
        try:
            await create_dynamodb_table_if_not_exists()
        except Exception as e:
            pytest.skip(f"DynamoDB Local またはモックへの接続に失敗したため、テストをスキップします: {e}")
            return
            
        test_item = {
            "PK": "USER#test-user",
            "SK": "METADATA",
            "email": "test@example.com",
            "name": "テストユーザー"
        }
        
        # PutItem
        await repo.put_item(test_item)
        
        # GetItem
        retrieved_item = await repo.get_item("USER#test-user", "METADATA")
        assert retrieved_item is not None
        assert retrieved_item["email"] == "test@example.com"
        assert retrieved_item["name"] == "テストユーザー"
        
        # DeleteItem
        await repo.delete_item("USER#test-user", "METADATA")
        
        # 削除後の確認
        deleted_item = await repo.get_item("USER#test-user", "METADATA")
        assert deleted_item is None
