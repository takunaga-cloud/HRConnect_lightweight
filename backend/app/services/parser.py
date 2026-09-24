import csv
import io
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from app.schemas.shift import ShiftCreate, ShiftBulkCreate
from app.core.messages import ERROR_USER_ID_NOT_FOUND_IN_CSV, ERROR_CSV_PARSE_FAILED
from app.core.exceptions import BusinessRuleError

def _parse_single_row(row: List[str], user_map: dict[str, UUID]) -> ShiftCreate:
    """
    1行分のCSVデータを解析し、ShiftCreateオブジェクトを返します。
    """
    if len(row) < 5:
        raise ValueError(f"Insufficient columns. Expected at least 5, got {len(row)}: {row}")

    target_date_str = row[0].strip()
    user_id_str = row[1].strip()
    start_time_str = row[2].strip()
    end_time_str = row[3].strip()
    shift_type = row[4].strip()
    is_holiday_str = row[5].strip() if len(row) > 5 else "False"

    target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    
    # UserID (EmployeeID) から UUID を解決
    if user_id_str not in user_map:
        raise ValueError(ERROR_USER_ID_NOT_FOUND_IN_CSV.format(user_id_str))
    user_id = user_map[user_id_str]
    
    start_time = datetime.strptime(start_time_str, "%H:%M").time() if start_time_str else None
    end_time = datetime.strptime(end_time_str, "%H:%M").time() if end_time_str else None
    
    is_holiday = is_holiday_str.lower() == "true"

    return ShiftCreate(
        target_date=target_date,
        user_id=user_id,
        start_time=start_time, # type: ignore
        end_time=end_time, # type: ignore
        shift_type=shift_type,
        is_holiday=is_holiday
    )

def parse_shift_csv(file_content: bytes, user_map: dict[str, UUID]) -> ShiftBulkCreate:
    """
    CSVファイルの内容を解析し、ShiftBulkCreateオブジェクトを返します。
    CSVフォーマット: TargetDate,UserID(EmployeeID),StartTime,EndTime,ShiftType,IsHoliday
    例: 2023-10-01,EMP001,09:00,18:00,Day,False
    """
    decoded = file_content.decode("utf-8-sig") # BOM付きUTF-8対応
    reader = csv.reader(io.StringIO(decoded))
    
    shifts: List[ShiftCreate] = []
    
    rows = list(reader)
    if not rows:
        return ShiftBulkCreate(shifts=[])

    # ヘッダー行をスキップするかどうかの判定
    start_index = 0
    try:
        datetime.strptime(rows[0][0], "%Y-%m-%d")
    except ValueError:
        start_index = 1 

    for i, row in enumerate(rows[start_index:], start=start_index + 1):
        if not row: continue
        try:
            shift = _parse_single_row(row, user_map)
            shifts.append(shift)
        except Exception as e:
            raise BusinessRuleError(f"Line {i}: {ERROR_CSV_PARSE_FAILED} - {str(e)}")

    return ShiftBulkCreate(shifts=shifts)

