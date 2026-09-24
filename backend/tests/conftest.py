import os
import pytest
import asyncio

# Pydantic設定エラー回避のためのダミー環境変数
os.environ["COGNITO_USER_POOL_ID"] = "mock_pool_id"
os.environ["COGNITO_CLIENT_ID"] = "mock_client_id"
# テスト用DB URL (Configのデフォルトを上書き)
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base

# テスト用のインメモリSQLiteデータベース
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """
    テスト関数ごとに新しいセッションを作成し、終了後にロールバックするフィクスチャ。
    """
    connection = await test_engine.connect()
    transaction = await connection.begin()
    
    session_factory = sessionmaker(
        bind=connection,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    session = session_factory()

    yield session

    await session.close()
    await transaction.rollback()
    await connection.close()

from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    
    # Cleanup
    app.dependency_overrides.clear()
