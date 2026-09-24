import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.system_definition import SystemDefinition

async def seed_data():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(SystemDefinition).limit(1))
        if result.scalars().first():
            print("Already seeded.")
            return

        definitions = [
            {"category_code": "PAID_LEAVE_TYPE", "code": "FullDay", "name": "全日", "order": 1},
            {"category_code": "PAID_LEAVE_TYPE", "code": "HalfDayMorning", "name": "午前半休", "order": 2},
            {"category_code": "PAID_LEAVE_TYPE", "code": "HalfDayAfternoon", "name": "午後半休", "order": 3},
            {"category_code": "PAID_LEAVE_TYPE", "code": "全日休暇", "name": "全日休暇", "order": 4},
        ]
        
        for d in definitions:
            db.add(SystemDefinition(**d))
        
        await db.commit()
        print("Seeded system definitions.")

if __name__ == "__main__":
    asyncio.run(seed_data())
