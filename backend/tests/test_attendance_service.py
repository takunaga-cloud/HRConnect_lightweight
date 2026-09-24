from datetime import date, time, datetime
import pytest
from app.services.attendance_service import AttendanceService
# We use simple Mock objects to avoid DB dependency for logic tests
from unittest.mock import MagicMock

class MockTemplate:
    def __init__(self, settings=None, schema_definition=None):
        self.settings = settings or {}
        self.schema_definition = schema_definition or []

class MockApplication:
    def __init__(self, type, input_data, template=None):
        self.type = type
        self.input_data = input_data
        self.template = template

# Mock Shift object
class MockShift:
    def __init__(self, start_time, end_time, shift_type):
        self.start_time = start_time
        self.end_time = end_time
        self.shift_type = shift_type

class TestAttendanceService:
    def test_get_paid_leave_map_basic(self):
        # 2024-01-01 Paid Leave
        input_data = {
            "leave_type": "FullDay",
            "leave_start_date": "2024-01-01",
            "leave_end_date": "2024-01-01",
            "reason": "Rest"
        }
        app = MockApplication(
            type="PaidLeave",
            input_data=input_data
        )
        
        result = AttendanceService.get_paid_leave_map([app], date(2024, 1, 1), date(2024, 1, 31))
        
        assert date(2024, 1, 1) in result
        pl_data = result[date(2024, 1, 1)]
        assert pl_data.leave_type == "FullDay"

    def test_determine_shift_for_date_paid_leave(self):
        # Case: Full Day Paid Leave
        from app.schemas.application import PaidLeaveInputData
        pl_data = PaidLeaveInputData(
            leave_type="FullDay", 
            leave_start_date=date(2024, 1, 1), 
            leave_end_date=date(2024, 1, 1), 
            reason="Rest"
        )
        
        start, end, s_type = AttendanceService.determine_shift_for_date(
            date(2024, 1, 1),
            pl_data,
            None, # No shift
            time(9, 0), time(18, 0)
        )
        # Should be normal time but type is PaidLeave (logic in service: 9-18 for full day)
        assert start == time(9, 0)
        assert end == time(18, 0)
        assert s_type == "PaidLeave"

    def test_determine_shift_half_day_morning(self):
        # Case: Morning Leave (HalfDayMorning) -> Work Afternoon (13:00-18:00)
        from app.schemas.application import PaidLeaveInputData
        pl_data = PaidLeaveInputData(
            leave_type="HalfDayMorning", 
            leave_start_date=date(2024, 1, 1), 
            leave_end_date=date(2024, 1, 1), 
            reason="Rest"
        )
        
        start, end, s_type = AttendanceService.determine_shift_for_date(
            date(2024, 1, 1),
            pl_data,
            None,
            time(9, 0), time(18, 0)
        )
        assert start == time(13, 0)
        assert end == time(18, 0)
        assert s_type == "HalfDayMorning"

    def test_determine_shift_normal(self):
        # Case: Normal Shift
        shift = MockShift(time(10, 0), time(19, 0), "Late")
        
        start, end, s_type = AttendanceService.determine_shift_for_date(
            date(2024, 1, 1),
            None, # No paid leave
            shift,
            time(9, 0), time(18, 0)
        )
        assert start == time(10, 0)
        assert end == time(19, 0)
        assert s_type == "Late"
