import asyncio
import sys
import os

# パスを追加してappモジュールをインポートできるようにする
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.session import engine, Base
from app.models import * # 全てのモデルをインポートしてmetadataに登録させる

async def init_values():
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_values())
