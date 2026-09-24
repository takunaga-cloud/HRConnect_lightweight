import asyncio
import sys
import os

# PYTHONPATHの調整
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models import ApplicationTemplate

async def add_template():
    async with AsyncSessionLocal() as db:
        print("Checking for StampCorrection template...")
        # Check both name variations
        res = await db.execute(select(ApplicationTemplate).filter(ApplicationTemplate.name == "StampCorrection"))
        existing = res.scalars().first()
        
        if not existing:
            # We also check the Japanese name
            res_ja = await db.execute(select(ApplicationTemplate).filter(ApplicationTemplate.name == "打刻修正申請"))
            existing_ja = res_ja.scalars().first()
            
            if existing_ja:
                print("Template '打刻修正申請' already exists. We will reuse it.")
                return

            template = ApplicationTemplate(
                name="StampCorrection",
                schema_definition=[
                    {"name": "correction_date", "type": "date", "required": True, "target_field": "correction_date"},
                    {"name": "new_clock_in", "type": "text", "required": False, "target_field": "new_clock_in"},
                    {"name": "new_clock_out", "type": "text", "required": False, "target_field": "new_clock_out"},
                    {"name": "reason", "type": "text", "required": True, "target_field": "reason"},
                ],
                settings={"reflect_attendance": True}
            )
            db.add(template)
            await db.commit()
            print("StampCorrection template added successfully!")
        else:
            print("StampCorrection template already exists.")

if __name__ == "__main__":
    asyncio.run(add_template())
