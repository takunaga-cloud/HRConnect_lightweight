import aioboto3
from typing import AsyncGenerator
from app.core.config import settings

# aioboto3セッションの初期化
session = aioboto3.Session(
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

import os

async def get_dynamodb_resource() -> AsyncGenerator[any, None]:
    """
    FastAPIのDependency Injection用。非同期DynamoDBリソースを取得します。
    """
    if os.getenv("ALLOW_MOCK_AUTH", "False").lower() == "true":
        yield None
        return

    async with session.resource(
        "dynamodb", 
        endpoint_url=settings.DYNAMODB_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    ) as resource:
        yield resource

async def create_dynamodb_table_if_not_exists():
    """
    ローカル開発環境やテスト環境で、テーブルが存在しない場合に自動生成します。
    """
    async with session.client(
        "dynamodb", 
        endpoint_url=settings.DYNAMODB_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    ) as client:
        try:
            # テーブルが存在するかチェック
            await client.describe_table(TableName=settings.DYNAMODB_TABLE_NAME)
        except client.exceptions.ResourceNotFoundException:
            # テーブルを作成
            await client.create_table(
                TableName=settings.DYNAMODB_TABLE_NAME,
                KeySchema=[
                    {"AttributeName": "PK", "KeyType": "HASH"},  # パーティションキー
                    {"AttributeName": "SK", "KeyType": "RANGE"}  # ソートキー
                ],
                AttributeDefinitions=[
                    {"AttributeName": "PK", "AttributeType": "S"},
                    {"AttributeName": "SK", "AttributeType": "S"}
                ],
                GlobalSecondaryIndexes=[
                    {
                        "IndexName": "GSI1",
                        "KeySchema": [
                            {"AttributeName": "SK", "KeyType": "HASH"},
                            {"AttributeName": "PK", "KeyType": "RANGE"}
                        ],
                        "Projection": {
                            "ProjectionType": "ALL"
                        }
                    }
                ],
                BillingMode="PAY_PER_REQUEST"  # オンデマンド課金
            )
            # テーブル作成が反映されるまで数秒待機
            import asyncio
            await asyncio.sleep(3)

            # テーブル新規作成時のみ、テストユーザーのシードデータ作成
            from app.core.security import get_password_hash
            async with session.resource(
                "dynamodb", 
                endpoint_url=settings.DYNAMODB_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            ) as resource:
                table = await resource.Table(settings.DYNAMODB_TABLE_NAME)
                
                # 管理者アカウントの作成
                admin_pk = "USER#admin-sub"
                await table.put_item(
                    Item={
                        "PK": admin_pk,
                        "SK": "METADATA",
                        "id": "11111111-1111-1111-1111-111111111111",
                        "cognito_sub": "admin-sub",
                        "email": "admin@hr-connect.com",
                        "user_id": "admin",
                        "name": "Admin User",
                        "role": "Admin",
                        "status": "Active",
                        "hashed_password": get_password_hash("Admin#K9x$2P!w9a"),
                        "hourly_rate": 0,
                        "work_rule_id": "00000000-0000-0000-0000-000000000000"
                    }
                )

                # 一般ユーザーアカウントの作成
                user1_pk = "USER#user1-sub"
                await table.put_item(
                    Item={
                        "PK": user1_pk,
                        "SK": "METADATA",
                        "id": "22222222-2222-2222-2222-222222222222",
                        "cognito_sub": "user1-sub",
                        "email": "user1@hr-connect.com",
                        "user_id": "user1",
                        "name": "Employee User",
                        "role": "Employee",
                        "status": "Active",
                        "hashed_password": get_password_hash("User@7m*qR8#tN4"),
                        "hourly_rate": 0,
                        "work_rule_id": "00000000-0000-0000-0000-000000000000"
                    }
                )

                # 休暇区分マスタ(LeaveType)のシード作成
                leave_types = [
                    {"id": "8e49b8fa-2123-44ce-be36-8b9c59130b23", "name": "有給休暇", "is_paid": True, "is_system": True},
                    {"id": "17b9e284-12af-40fb-9e4c-8fbaf53ce5c0", "name": "代休", "is_paid": False, "is_system": True},
                    {"id": "10000000-0000-0000-0000-000000000003", "name": "特別休暇", "is_paid": True, "is_system": True},
                ]
                for lt in leave_types:
                    lt_pk = f"LEAVE_TYPE#{lt['id']}"
                    await table.put_item(
                        Item={
                            "PK": lt_pk,
                            "SK": "METADATA",
                            "id": lt["id"],
                            "name": lt["name"],
                            "is_paid": lt["is_paid"],
                            "is_system": lt["is_system"]
                        }
                    )

                # 一般ユーザー(user1)への有給休暇付与データのシード作成
                from decimal import Decimal
                await table.put_item(
                    Item={
                        "PK": "USER#user1-sub",
                        "SK": "LEAVE_LEDGER#99999999-9999-9999-9999-999999999999",
                        "id": "99999999-9999-9999-9999-999999999999",
                        "user_id": "22222222-2222-2222-2222-222222222222",
                        "leave_type_id": "8e49b8fa-2123-44ce-be36-8b9c59130b23",
                        "grant_date": "2026-04-01",
                        "expire_date": "2028-03-31",
                        "days_granted": Decimal("20.0"),
                        "days_used": Decimal("0.0")
                    }
                )


