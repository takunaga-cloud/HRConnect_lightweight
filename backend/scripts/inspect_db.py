import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models import LeaveType
from app.core.config import settings
from app.db.dynamodb import session as ddb_session

async def inspect():
    print("--- SQLite LeaveTypes ---")
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(LeaveType))
        for i in res.scalars().all():
            print(f"SQLITE: id={i.id}, name={i.name}, is_paid={i.is_paid}, is_system={i.is_system}")
            
    print("--- DynamoDB LeaveTypes ---")
    async with ddb_session.resource(
        "dynamodb", 
        endpoint_url=settings.DYNAMODB_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    ) as resource:
        table = await resource.Table(settings.DYNAMODB_TABLE_NAME)
        response = await table.scan()
        for item in response.get("Items", []):
            if item.get("SK") == "METADATA" and item.get("PK", "").startswith("LEAVE_TYPE#"):
                print(f"DYNAMODB: PK={item['PK']}, name={item.get('name')}, is_paid={item.get('is_paid')}, is_system={item.get('is_system')}")

if __name__ == "__main__":
    asyncio.run(inspect())
