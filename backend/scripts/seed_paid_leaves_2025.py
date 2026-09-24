import asyncio
import sys
import os
from datetime import date
from uuid import uuid4
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# PYTHONPATHの調整
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models import User, LeaveType, PaidLeaveLedger

# 直接 SQLite の非同期エンジンとセッションを作成する
engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def seed_paid_leaves():
    async with AsyncSessionLocal() as db:
        print("Starting seeding paid leaves for 2025/04/01...")
        
        # '有給休暇' の LeaveType を取得
        res = await db.execute(select(LeaveType).filter(LeaveType.name == "有給休暇"))
        leave_type = res.scalars().first()
        if not leave_type:
            print("Error: '有給休暇' leave type not found in database.")
            return

        # 全ユーザーを取得
        res_users = await db.execute(select(User))
        users = res_users.scalars().all()
        print(f"Found {len(users)} users.")

        grant_d = date(2025, 4, 1)
        expire_d = date(2027, 4, 1)
        days = 20.0

        for user in users:
            # 既存の同一付与日のデータがあるかチェック
            res_existing = await db.execute(
                select(PaidLeaveLedger).filter(
                    PaidLeaveLedger.user_id == user.id,
                    PaidLeaveLedger.grant_date == grant_d
                )
            )
            existing = res_existing.scalars().first()
            if not existing:
                ledger = PaidLeaveLedger(
                    id=uuid4(),
                    user_id=user.id,
                    grant_date=grant_d,
                    expire_date=expire_d,
                    days_granted=days,
                    days_used=0.0
                )
                db.add(ledger)
                print(f"Granted 20 days to {user.name} ({user.email})")
            else:
                print(f"User {user.name} ({user.email}) already has ledger for {grant_d}")

        await db.commit()
        print("Paid leaves seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_paid_leaves())
