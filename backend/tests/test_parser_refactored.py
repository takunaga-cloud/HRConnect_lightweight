import pytest
from datetime import date, time
from uuid import uuid4
from fastapi import HTTPException
from app.services.parser import parse_shift_csv, _parse_single_row
from app.core.messages import ERROR_USER_ID_NOT_FOUND_IN_CSV, ERROR_CSV_PARSE_FAILED

def test_parse_single_row_valid():
    user_id = uuid4()
    user_map = {"EMP001": user_id}
    row = ["2024-01-01", "EMP001", "09:00", "18:00", "Day", "False"]
    
    shift = _parse_single_row(row, user_map)
    
    assert shift.target_date == date(2024, 1, 1)
    assert shift.user_id == user_id
    assert shift.start_time == time(9, 0)
    assert shift.end_time == time(18, 0)
    assert shift.shift_type == "Day"
    assert shift.is_holiday is False

def test_parse_single_row_user_not_found():
    user_map = {}
    row = ["2024-01-01", "EMP001", "09:00", "18:00", "Day", "False"]
    
    with pytest.raises(ValueError) as excinfo:
        _parse_single_row(row, user_map)
    
    assert ERROR_USER_ID_NOT_FOUND_IN_CSV.format("EMP001") in str(excinfo.value)

def test_parse_shift_csv_valid():
    user_id = uuid4()
    user_map = {"EMP001": user_id}
    csv_content = b"TargetDate,UserID,StartTime,EndTime,ShiftType,IsHoliday\n2024-01-01,EMP001,09:00,18:00,Day,False"
    
    result = parse_shift_csv(csv_content, user_map)
    
    assert len(result.shifts) == 1
    assert result.shifts[0].user_id == user_id

from app.core.exceptions import BusinessRuleError

def test_parse_shift_csv_error():
    user_map = {}
    csv_content = b"2024-01-01,UNKNOWN_USER,09:00,18:00,Day,False"
    
    with pytest.raises(BusinessRuleError) as excinfo:
        parse_shift_csv(csv_content, user_map)
    
    assert excinfo.value.status_code == 400
    assert ERROR_CSV_PARSE_FAILED in excinfo.value.message
