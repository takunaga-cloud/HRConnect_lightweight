import asyncio
import sys
import os
from datetime import time

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.future import select

from app.db.session import AsyncSessionLocal
from app.models import ShiftTemplate

async def seed_shift_templates():
    async with AsyncSessionLocal() as session:
        # Check existing
        result = await session.execute(select(ShiftTemplate))
        existing = result.scalars().all()
        existing_names = [t.name for t in existing]

        templates_to_create = [
            {"name": "A直", "start_time": time(9, 0), "end_time": time(18, 0), "break_minutes": 60},
            {"name": "2直", "start_time": time(13, 0), "end_time": time(22, 0), "break_minutes": 60},
            {"name": "時差", "start_time": time(10, 0), "end_time": time(19, 0), "break_minutes": 60},
            {"name": "午前出張", "start_time": time(9, 0), "end_time": time(18, 0), "break_minutes": 60},
            {"name": "午後出張", "start_time": time(9, 0), "end_time": time(18, 0), "break_minutes": 60},
            {"name": "終日出張", "start_time": time(9, 0), "end_time": time(18, 0), "break_minutes": 60},
            {"name": "社内関連", "start_time": time(9, 0), "end_time": time(18, 0), "break_minutes": 60},
            {"name": "明休", "start_time": time(0, 0), "end_time": time(0, 0), "break_minutes": 0},
        ]

        for data in templates_to_create:
            if data["name"] not in existing_names:
                print(f"Creating {data['name']}...")
                template = ShiftTemplate(**data)
                session.add(template)
            else:
                print(f"Skipping {data['name']} (already exists)")

        await session.commit()
        print("Seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed_shift_templates())
