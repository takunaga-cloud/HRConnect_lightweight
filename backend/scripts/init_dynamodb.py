import asyncio
import os
import sys

# 親ディレクトリを sys.path に追加して app をインポート可能にする
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.dynamodb import create_dynamodb_table_if_not_exists
from app.core.config import settings

async def main():
    print("=========================================")
    print("HRConnect DynamoDB Initialization Script")
    print(f"Target Table: {settings.DYNAMODB_TABLE_NAME}")
    print(f"AWS Region:   {settings.AWS_REGION}")
    if settings.DYNAMODB_ENDPOINT_URL:
        print(f"Endpoint URL: {settings.DYNAMODB_ENDPOINT_URL} (Local Mode)")
    else:
        print("Endpoint URL: AWS Cloud Default")
    print("=========================================")

    try:
        await create_dynamodb_table_if_not_exists()
        print("Successfully initialized DynamoDB table and seed data!")
    except Exception as e:
        print(f"Error during DynamoDB initialization: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

