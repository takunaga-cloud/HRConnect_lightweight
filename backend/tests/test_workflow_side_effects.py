
import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from datetime import date, timedelta

from app.models import Application, PaidLeaveLedger, Shift
from app.schemas.application import PaidLeaveInputData
from app.services.side_effect import SideEffectService

@pytest.mark.asyncio
async def test_apply_paid_leave_side_effects_creates_shift():
    # Arrange
    db = AsyncMock()
    user_id = uuid4()
    application = MagicMock(spec=Application)
    application.user_id = user_id
    application.input_data = {"休暇区分": "有給休暇"}
    
    start_date = date(2023, 10, 1)
    end_date = date(2023, 10, 1)
    
    input_data = PaidLeaveInputData(
        leave_type="FullDay",
        leave_start_date=start_date,
        leave_end_date=end_date,
        reason="Test"
    )
    
    # Mock get_user_work_rule_config to avoid extra DB execution
    SideEffectService.get_user_work_rule_config = AsyncMock(return_value={})

    # Mock Ledger query result
    mock_ledger = MagicMock(spec=PaidLeaveLedger)
    mock_ledger.days_used = 0.0
    
    # Mock DB execute results
    # First execute is for getting ledger
    # Second execute is for getting shift (return None to simulate not found)
    
    # We need to setup db.execute to return iterables properly
    # This is tricky with AsyncMock and SQLAlchemy style execution
    # Simplified approach: We check if db.add is called with expected Shift object
    
    mock_result_type = MagicMock()
    mock_result_type.scalars.return_value.first.return_value = None # LeaveType not found

    mock_result_ledger = MagicMock()
    mock_result_ledger.scalars.return_value.all.return_value = [] # no ledgers
    
    mock_result_old_ledger = MagicMock()
    mock_result_old_ledger.scalars.return_value.first.return_value = mock_ledger
    
    mock_result_shift = MagicMock()
    mock_result_shift.scalars.return_value.first.return_value = None # Shift not found
    
    db.execute.side_effect = [
        mock_result_type,
        mock_result_ledger,
        mock_result_old_ledger,
        mock_result_shift
    ]

    # Act
    await SideEffectService.apply_paid_leave_side_effects(db, application, user_id, input_data)

    # Assert
    # 1. Check Ledger updated
    assert mock_ledger.days_used == 1.0
    
    # 2. Check Shift created
    # Verify db.add was called for Shift
    # The last call to db.add should be the shift (if created) or we iterate args
    
    shift_created = False
    for call in db.add.call_args_list:
        arg = call.args[0]
        if isinstance(arg, Shift):
            assert arg.user_id == user_id
            assert arg.target_date == start_date
            assert arg.shift_type == "有給休暇"
            shift_created = True
            
    assert shift_created, "Shift should have been created"

