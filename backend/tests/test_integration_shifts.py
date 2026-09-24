import pytest
import os
from datetime import date
from sqlalchemy import select
from app.models import WorkRule, User

os.environ["ALLOW_MOCK_AUTH"] = "true"

@pytest.fixture
async def setup_users_shifts(db_session):
    # Ensure WorkRule
    result = await db_session.execute(select(WorkRule).limit(1))
    work_rule = result.scalars().first()
    if not work_rule:
        work_rule = WorkRule(name="Default Rule", config={"daily_hours": 8})
        db_session.add(work_rule)
        await db_session.flush()

    # Create Admin
    admin = User(
        cognito_sub="mock-admin-shifts",
        email="admin_s@test.com",
        name="Admin Shift",
        role="Admin",
        work_rule_id=work_rule.id,
        status="Active"
    )
    db_session.add(admin)

    # Create User
    user = User(
        cognito_sub="mock-user-shifts",
        email="user_s@test.com",
        name="User Shift",
        role="User",
        work_rule_id=work_rule.id,
        status="Active"
    )
    db_session.add(user)
    
    await db_session.commit()
    return {"admin": admin, "user": user}

@pytest.mark.asyncio
async def test_shift_lifecycle(client, setup_users_shifts):
    admin = setup_users_shifts["admin"]
    user = setup_users_shifts["user"]
    
    # 1. Create Shift (Bulk API is commonly used, check implementation)
    # The payload for Bulk expects { shifts: [ShiftCreate] }
    # ShiftCreate: user_id, target_date, start_time, end_time, etc.
    
    shift_data = {
        "user_id": str(user.id),
        "target_date": "2024-02-01",
        "start_time": "09:00:00",
        "end_time": "18:00:00",
        "shift_type": "Day",
        "is_holiday": False
    }
    
    headers = {"Authorization": "Bearer mock-token-admin_s@test.com"}
    
    # Using Bulk Create
    response = await client.post("/api/v1/shifts/bulk", json={"shifts": [shift_data]}, headers=headers)
    assert response.status_code == 201
    created_shifts = response.json()
    assert len(created_shifts) == 1
    shift_id = created_shifts[0]["id"]
    
    # 2. Get Shifts (List)
    response_list = await client.get(f"/api/v1/shifts/?start_date=2024-02-01&end_date=2024-02-01", headers=headers)
    assert response_list.status_code == 200
    shifts = response_list.json()
    assert len(shifts) >= 1
    assert any(s["id"] == shift_id for s in shifts)
    
    # 3. Delete Shift
    response_del = await client.delete(f"/api/v1/shifts/{shift_id}", headers=headers)
    assert response_del.status_code == 204
    
    # 4. Verify Deletion
    response_list_after = await client.get(f"/api/v1/shifts/?start_date=2024-02-01&end_date=2024-02-01", headers=headers)
    assert response_list_after.status_code == 200
    shifts_after = response_list_after.json()
    assert not any(s["id"] == shift_id for s in shifts_after)
