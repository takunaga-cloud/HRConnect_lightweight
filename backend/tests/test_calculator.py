from datetime import datetime, time, date, timedelta
import pytest
from app.services.calculator import round_time, calculate_working_hours, calculate_overtime, calculate_holiday_work_days

class TestCalculator:
    def test_round_time(self):
        # 09:01 -> 09:00 (Floor, 15min unit)
        dt = datetime(2024, 1, 1, 9, 1)
        assert round_time(dt, 15, "floor") == datetime(2024, 1, 1, 9, 0)
        
        # 09:01 -> 09:15 (Ceil, 15min unit)
        assert round_time(dt, 15, "ceil") == datetime(2024, 1, 1, 9, 15)
        
        # 09:14 -> 09:15 (Round, 15min unit)
        dt2 = datetime(2024, 1, 1, 9, 14)
        assert round_time(dt2, 15, "round") == datetime(2024, 1, 1, 9, 15)

    def test_calculate_working_hours_basic(self):
        work_rule = {"rounding_rule_minutes": 1, "auto_break_deduction_minutes": 60}
        
        # 09:00 - 18:00 (9h stay, 1h break = 8h work)
        clock_in = datetime(2024, 1, 1, 9, 0)
        clock_out = datetime(2024, 1, 1, 18, 0)
        
        result = calculate_working_hours(clock_in, clock_out, work_rule)
        assert result["stay_minutes"] == 540 # 9h * 60
        assert result["break_minutes"] == 60
        assert result["total_work_minutes"] == 480 # 8h

    def test_calculate_working_hours_with_breaks(self):
        work_rule = {"rounding_rule_minutes": 1, "auto_break_deduction_minutes": 0}
        
        clock_in = datetime(2024, 1, 1, 9, 0)
        clock_out = datetime(2024, 1, 1, 18, 0)
        breaks = [{"start": "2024-01-01T12:00:00", "end": "2024-01-01T13:00:00"}]
        
        result = calculate_working_hours(clock_in, clock_out, work_rule, breaks)
        assert result["break_minutes"] == 60
        assert result["total_work_minutes"] == 480

    def test_calculate_overtime(self):
        work_rule = {}
        # 09:00 - 19:00 (10h stay -> 9h work -> 1h overtime)
        # Assuming manual calculation or passed actual_work_minutes
        
        # Case 1: Pass actual_work_minutes directly (9h = 540min)
        # Scheduled: 09:00-18:00 (9h - 1h break = 8h = 480min)
        result = calculate_overtime(
            datetime(2024, 1, 1, 9, 0),
            datetime(2024, 1, 1, 19, 0),
            work_rule,
            actual_work_minutes=540
        )
        assert result["overtime_minutes"] == 60 # 540 - 480
        assert result["midnight_overtime_minutes"] == 0

    def test_midnight_overtime(self):
        work_rule = {}
        # 18:00 - 24:00 (6h work)
        # 22:00 - 24:00 is midnight
        start = datetime(2024, 1, 1, 18, 0)
        end = datetime(2024, 1, 2, 0, 0)
        
        result = calculate_overtime(
            start, end, work_rule,
            actual_work_minutes=360 # 6h
        )
        # Scheduled default is 8h (480min). 360 < 480, so 0 overtime.
        assert result["overtime_minutes"] == 0
        # But midnight work exists (2h = 120min)
        assert result["midnight_overtime_minutes"] == 120

    def test_calculate_holiday_work_days(self):
        holidays = [date(2024, 1, 1)]
        attendances = [
            {"work_date": date(2024, 1, 1), "total_work_minutes": 480}, # Holiday work
            {"work_date": date(2024, 1, 2), "total_work_minutes": 480}, # Normal day
        ]
        
        count = calculate_holiday_work_days(attendances, holidays)
        assert count == 1
