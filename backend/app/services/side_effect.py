from datetime import date, timedelta, time, datetime
from typing import Dict, List, Optional
from uuid import UUID, uuid4
import calendar

from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Application, PaidLeaveLedger, Shift, Attendance, User, WorkRule
from app.schemas.application import PaidLeaveInputData, StampCorrectionInputData
from app.services.calculator import calculate_working_hours
from app.core.constants import (
    DEFAULT_ROUNDING_RULE_MINUTES,
    DEFAULT_AUTO_BREAK_DEDUCTION_MINUTES,
    DEFAULT_LATE_GRACE_PERIOD_MINUTES,
    DEFAULT_HALF_DAY_MORNING_START,
    DEFAULT_HALF_DAY_MORNING_END,
    DEFAULT_HALF_DAY_AFTERNOON_START,
    DEFAULT_HALF_DAY_AFTERNOON_END,
)

class SideEffectService:
    @staticmethod
    async def _get_cognito_sub(repo: DynamoDBRepository, user_id: str) -> Optional[str]:
        """
        user_id (UUID文字形式) から cognito_sub を逆引きします。
        """
        user_items = await repo.scan_items_by_type("USER#", "METADATA")
        for item in user_items:
            if item.get("id") == user_id or item.get("cognito_sub") == user_id:
                return item.get("cognito_sub")
        return None

    @classmethod
    async def get_user_work_rule_config(cls, repo: DynamoDBRepository, user_id: str) -> Dict:
        """
        ユーザーの就業規則設定を取得します。
        """
        sub = await cls._get_cognito_sub(repo, str(user_id))
        if not sub:
            return {
                "rounding_rule_minutes": DEFAULT_ROUNDING_RULE_MINUTES,
                "auto_break_deduction_minutes": DEFAULT_AUTO_BREAK_DEDUCTION_MINUTES,
                "late_grace_period_minutes": DEFAULT_LATE_GRACE_PERIOD_MINUTES
            }
            
        user = await repo.get_item(f"USER#{sub}", "METADATA")
        if not user or not user.get("work_rule_id"):
            return {
                "rounding_rule_minutes": DEFAULT_ROUNDING_RULE_MINUTES,
                "auto_break_deduction_minutes": DEFAULT_AUTO_BREAK_DEDUCTION_MINUTES,
                "late_grace_period_minutes": DEFAULT_LATE_GRACE_PERIOD_MINUTES
            }
            
        rule = await repo.get_item(f"WORK_RULE#{user['work_rule_id']}", "METADATA")
        if rule and rule.get("config"):
            return rule["config"]
        
        return {
            "rounding_rule_minutes": 1,
            "auto_break_deduction_minutes": DEFAULT_AUTO_BREAK_DEDUCTION_MINUTES
        }

    @classmethod
    async def apply_paid_leave_side_effects(
        cls,
        repo: DynamoDBRepository,
        application: Application,
        user_id: UUID,
        input_data: PaidLeaveInputData,
    ):
        """
        休暇申請が承認された際の副作用を適用します（有給休暇・代休・特別休暇などの汎用対応）。
        """
        user_uuid_str = str(user_id)
        sub = await cls._get_cognito_sub(repo, user_uuid_str)
        if not sub:
            raise Exception(f"User not found for ID: {user_id}")
            
        pk = f"USER#{sub}"
        
        raw_input = application.input_data if application.input_data else {}
        leave_name = raw_input.get("休暇区分") or raw_input.get("leave_type_name") or raw_input.get("leave_name") or "有給休暇"

        # 休暇区分の検索 (LEAVE_TYPE#マスタ)
        type_items = await repo.scan_items_by_type("LEAVE_TYPE#", "METADATA")
        leave_type = None
        for item in type_items:
            if item.get("name") == leave_name:
                leave_type = item
                break
                
        if not leave_type:
            # なければ新規作成
            is_paid_val = True
            if "無給" in leave_name or "欠勤" in leave_name:
                is_paid_val = False
            lt_id = str(uuid4())
            leave_type = {
                "PK": f"LEAVE_TYPE#{lt_id}",
                "SK": "METADATA",
                "id": lt_id,
                "name": leave_name,
                "is_paid": is_paid_val,
                "is_system": False
            }
            await repo.put_item(leave_type)

        leave_type_id = leave_type["id"]

        is_half = input_data.leave_type in ["HalfDayMorning", "HalfDayAfternoon", "午前半休", "午後半休"]
        delta = input_data.leave_end_date - input_data.leave_start_date
        days_to_deduct = 0.5 * float(delta.days + 1) if is_half else float(delta.days + 1)

        # 付与台帳 (LEAVE_LEDGER#) の更新
        ledger_items = await repo.query_items_by_pk_and_sk_prefix(pk, "LEAVE_LEDGER#")
        
        # フィルター & ソート (grant_date の古い順)
        valid_ledgers = []
        for item in ledger_items:
            if item.get("leave_type_id") == leave_type_id:
                expire_d = date.fromisoformat(item["expire_date"])
                if expire_d >= input_data.leave_start_date:
                    valid_ledgers.append(item)
                    
        valid_ledgers.sort(key=lambda x: x.get("grant_date", ""))

        remaining_deduction = days_to_deduct
        for l in valid_ledgers:
            if remaining_deduction <= 0:
                break
            available = float(l.get("days_granted", 0.0)) - float(l.get("days_used", 0.0))
            if available <= 0:
                continue
            
            if available >= remaining_deduction:
                l["days_used"] = float(l.get("days_used", 0.0)) + remaining_deduction
                remaining_deduction = 0
            else:
                l["days_used"] = float(l.get("days_used", 0.0)) + available
                remaining_deduction -= available
            await repo.put_item(l)

        # 不足分のプレースホルダー台帳作成
        if remaining_deduction > 0:
            pledger_id = str(uuid4())
            expire_date = input_data.leave_start_date + timedelta(days=365*2)
            placeholder = {
                "PK": pk,
                "SK": f"LEAVE_LEDGER#{input_data.leave_start_date.isoformat()}#{leave_type_id}",
                "id": pledger_id,
                "user_id": user_uuid_str,
                "leave_type_id": leave_type_id,
                "grant_date": input_data.leave_start_date.isoformat(),
                "expire_date": expire_date.isoformat(),
                "days_granted": 0.0,
                "days_used": remaining_deduction
            }
            await repo.put_item(placeholder)

        # 有給休暇の場合は旧有給テーブル (PaidLeaveLedger) も更新
        if leave_name == "有給休暇":
            old_items = await repo.query_items_by_pk_and_sk_prefix(pk, "PAID_LEAVE_LEDGER#")
            
            valid_old_ledgers = []
            for item in old_items:
                expire_d = date.fromisoformat(item["expire_date"])
                if expire_d >= input_data.leave_start_date:
                    valid_old_ledgers.append(item)
            
            valid_old_ledgers.sort(key=lambda x: x.get("grant_date", ""))
            
            if valid_old_ledgers:
                old_ledger = valid_old_ledgers[0]
                old_ledger["days_used"] = float(old_ledger.get("days_used", 0.0)) + days_to_deduct
                await repo.put_item(old_ledger)
            else:
                old_id = str(uuid4())
                expire_date = input_data.leave_start_date + timedelta(days=365*2)
                new_old_ledger = {
                    "PK": pk,
                    "SK": f"PAID_LEAVE_LEDGER#{input_data.leave_start_date.isoformat()}",
                    "id": old_id,
                    "user_id": user_uuid_str,
                    "grant_date": input_data.leave_start_date.isoformat(),
                    "expire_date": expire_date.isoformat(),
                    "days_granted": 0.0,
                    "days_used": days_to_deduct
                }
                await repo.put_item(new_old_ledger)

        # 就業規則設定から半休時間を動的に取得してシフトへ反映
        rule_config = await cls.get_user_work_rule_config(repo, user_uuid_str)
        morning_start_str = rule_config.get("half_day_morning_start", DEFAULT_HALF_DAY_MORNING_START)
        morning_end_str = rule_config.get("half_day_morning_end", DEFAULT_HALF_DAY_MORNING_END)
        morning_start = datetime.strptime(morning_start_str, "%H:%M").time()
        morning_end = datetime.strptime(morning_end_str, "%H:%M").time()

        afternoon_start_str = rule_config.get("half_day_afternoon_start", DEFAULT_HALF_DAY_AFTERNOON_START)
        afternoon_end_str = rule_config.get("half_day_afternoon_end", DEFAULT_HALF_DAY_AFTERNOON_END)
        afternoon_start = datetime.strptime(afternoon_start_str, "%H:%M").time()
        afternoon_end = datetime.strptime(afternoon_end_str, "%H:%M").time()

        current_date = input_data.leave_start_date
        while current_date <= input_data.leave_end_date:
            sk_shift = f"SHIFT#{current_date.isoformat()}"
            shift = await repo.get_item(pk, sk_shift)
            
            if not shift:
                shift_id = str(uuid4())
                shift = {
                    "PK": pk,
                    "SK": sk_shift,
                    "id": shift_id,
                    "user_id": user_uuid_str,
                    "target_date": current_date.isoformat(),
                    "start_time": "00:00:00",
                    "end_time": "00:00:00",
                    "is_holiday": False,
                    "status": "Approved"
                }
            else:
                shift["status"] = "Approved"

            if input_data.leave_type in ["FullDay", "全日"]:
                shift["shift_type"] = leave_name
                shift["start_time"] = "00:00:00"
                shift["end_time"] = "00:00:00"
                shift["remarks"] = ""
                
            elif input_data.leave_type in ["HalfDayMorning", "午前半休"]:
                shift["shift_type"] = f"{leave_name}(午前)"
                shift["remarks"] = ""
                shift["start_time"] = morning_start.isoformat()
                shift["end_time"] = morning_end.isoformat()
                 
            elif input_data.leave_type in ["HalfDayAfternoon", "午後半休"]:
                shift["shift_type"] = f"{leave_name}(午後)"
                shift["remarks"] = ""
                shift["start_time"] = afternoon_start.isoformat()
                shift["end_time"] = afternoon_end.isoformat()

            await repo.put_item(shift)
            current_date += timedelta(days=1)

    @classmethod
    async def apply_stamp_correction_side_effects(
        cls,
        repo: DynamoDBRepository,
        application: Application,
        user_id: UUID,
        input_data: StampCorrectionInputData,
    ):
        """
        打刻修正申請が承認された際の副作用を適用します。
        """
        user_uuid_str = str(user_id)
        sub = await cls._get_cognito_sub(repo, user_uuid_str)
        if not sub:
            raise Exception(f"User not found for ID: {user_id}")
            
        pk = f"USER#{sub}"
        sk_attendance = f"ATTENDANCE#{input_data.correction_date.isoformat()}"
        
        attendance = await repo.get_item(pk, sk_attendance)

        if not attendance:
            att_id = str(uuid4())
            attendance = {
                "PK": pk,
                "SK": sk_attendance,
                "id": att_id,
                "user_id": user_uuid_str,
                "work_date": input_data.correction_date.isoformat(),
                "status": "Present",
                "meta_data": {}
            }

        meta = attendance.get("meta_data")
        if meta is None or not isinstance(meta, dict):
            meta = {}
        meta["stamp_type"] = "correction"
        attendance["meta_data"] = meta

        # 安全なパース用関数
        def safe_parse_dt(val):
            if not val:
                return None
            if isinstance(val, datetime):
                return val
            if isinstance(val, str) and val.strip():
                try:
                    return datetime.fromisoformat(val.replace("Z", "+00:00").replace(" ", "T"))
                except ValueError:
                    return None
            return None

        current_clock_in = input_data.new_clock_in if input_data.new_clock_in else safe_parse_dt(attendance.get("clock_in"))
        current_clock_out = input_data.new_clock_out if input_data.new_clock_out else safe_parse_dt(attendance.get("clock_out"))

        attendance["clock_in"] = current_clock_in.isoformat() if current_clock_in else None
        attendance["clock_out"] = current_clock_out.isoformat() if current_clock_out else None

        if current_clock_in and current_clock_out:
            rule_config = await cls.get_user_work_rule_config(repo, user_uuid_str)
            breaks = attendance.get("breaks", [])
            if not breaks or not isinstance(breaks, list):
                breaks = []
            
            calc_res = calculate_working_hours(
                current_clock_in,
                current_clock_out,
                rule_config,
                breaks=breaks
            )
            
            attendance["total_work_minutes"] = float(calc_res["total_work_minutes"])
        else:
            # 時刻が両方揃っていない場合は労働時間を0にする
            attendance["total_work_minutes"] = 0.0
            
        await repo.put_item(attendance)

        if attendance.get("total_work_minutes"):
            await cls.check_and_grant_compensatory_leave(
                repo=repo,
                user_id=user_id,
                work_date=input_data.correction_date,
                total_work_minutes=float(attendance["total_work_minutes"])
            )

    @classmethod
    async def check_and_grant_compensatory_leave(
        cls,
        repo: DynamoDBRepository,
        user_id: UUID,
        work_date: date,
        total_work_minutes: float
    ):
        """
        休日出勤を検知し、条件を満たした場合は代休を自動付与します。
        """
        user_uuid_str = str(user_id)
        sub = await cls._get_cognito_sub(repo, user_uuid_str)
        if not sub:
            return
            
        pk = f"USER#{sub}"
        sk_shift = f"SHIFT#{work_date.isoformat()}"
        
        # シフトの確認
        shift = await repo.get_item(pk, sk_shift)
        if not shift or not shift.get("is_holiday") or shift.get("status") != "Approved":
            return

        if total_work_minutes >= 480:  # 8時間
            days_granted = 1.0
        elif total_work_minutes >= 240:  # 4時間
            days_granted = 0.5
        else:
            return

        # '代休' の LeaveType を取得
        type_items = await repo.scan_items_by_type("LEAVE_TYPE#", "METADATA")
        leave_type = None
        for item in type_items:
            if item.get("name") == "代休":
                leave_type = item
                break
        if not leave_type:
            return

        leave_type_id = leave_type["id"]

        # 重複防止チェック
        sk_ledger = f"LEAVE_LEDGER#{work_date.isoformat()}#{leave_type_id}"
        existing_ledger = await repo.get_item(pk, sk_ledger)
        if existing_ledger:
            return

        # 翌月末の有効期限を計算
        if work_date.month == 12:
            next_year = work_date.year + 1
            next_month = 1
        else:
            next_year = work_date.year
            next_month = work_date.month + 1
        _, last_day = calendar.monthrange(next_year, next_month)
        expire_date = date(next_year, next_month, last_day)

        ledger_id = str(uuid4())
        new_ledger = {
            "PK": pk,
            "SK": sk_ledger,
            "id": ledger_id,
            "user_id": user_uuid_str,
            "leave_type_id": leave_type_id,
            "grant_date": work_date.isoformat(),
            "expire_date": expire_date.isoformat(),
            "days_granted": days_granted,
            "days_used": 0.0
        }
        await repo.put_item(new_ledger)
