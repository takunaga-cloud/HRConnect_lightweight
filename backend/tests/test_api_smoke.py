import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_openapi_endpoint():
    """
    アプリケーションが正常に起動し、OpenAPI定義を返却できるか確認するスモークテスト。
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/openapi.json")
    
    # DB接続エラーなどで起動しない場合はここで落ちるか500になる
    assert response.status_code == 200
    assert "openapi" in response.json()
    assert "info" in response.json()
