from typing import List
from uuid import UUID, uuid4
from datetime import date, timedelta
import calendar

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import PaidLeaveLedger, User
from app.models.leave import LeaveType, LeaveLedger
from app.schemas.paid_leave import PaidLeaveGrant, PaidLeaveResponse, UserPaidLeaveSummary
from app.schemas.leave import LeaveTypeResponse, LeaveLedgerGrant, LeaveLedgerResponse, UserLeaveSummary

router = APIRouter()


def dict_to_paid_leave_model(item: dict) -> PaidLeaveLedger:
    return PaidLeaveLedger(
        id=UUID(item["id"]) if "id" in item else None,
        user_id=UUID(item["user_id"]) if "user_id" in item else None,
        grant_date=date.fromisoformat(item["grant_date"]) if "grant_date" in item else None,
        expire_date=date.fromisoformat(item["expire_date"]) if "expire_date" in item else None,
        days_granted=float(item.get("days_granted", 0.0)),
        days_used=float(item.get("days_used", 0.0))
    )


def dict_to_leave_ledger_model(item: dict) -> LeaveLedger:
    return LeaveLedger(
        id=UUID(item["id"]) if "id" in item else None,
        user_id=UUID(item["user_id"]) if "user_id" in item else None,
        leave_type_id=UUID(item["leave_type_id"]) if "leave_type_id" in item else None,
        grant_date=date.fromisoformat(item["grant_date"]) if "grant_date" in item else None,
        expire_date=date.fromisoformat(item["expire_date"]) if "expire_date" in item else None,
        days_granted=float(item.get("days_granted", 0.0)),
        days_used=float(item.get("days_used", 0.0))
    )


def dict_to_leave_type_model(item: dict) -> LeaveType:
    return LeaveType(
        id=UUID(item["id"]) if "id" in item else None,
        name=item.get("name", ""),
        is_paid=bool(item.get("is_paid", True)),
        is_system=bool(item.get("is_system", False))
    )


@router.post("/grant", response_model=PaidLeaveResponse, status_code=status.HTTP_201_CREATED)
async def grant_paid_leave(
    grant_in: PaidLeaveGrant,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    ユーザーに有給休暇を付与します。
    """
    # 付与対象ユーザーのid(UUID)からcognito_subを取得してPKにする
    users_items = await repo.scan_items_by_type("USER#", "METADATA")
    target_user = None
    for item in users_items:
        if item.get("id") == str(grant_in.user_id):
            target_user = item
            break
            
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_sub = target_user.get("cognito_sub")
    expire_date = grant_in.grant_date.replace(year=grant_in.grant_date.year + 2)
    ledger_id = str(uuid4())
    
    pk = f"USER#{user_sub}"
    sk = f"PAID_LEAVE_LEDGER#{grant_in.grant_date.isoformat()}"
    
    new_item = {
        "PK": pk,
        "SK": sk,
        "id": ledger_id,
        "user_id": str(grant_in.user_id),
        "grant_date": grant_in.grant_date.isoformat(),
        "expire_date": expire_date.isoformat(),
        "days_granted": float(grant_in.days_granted),
        "days_used": 0.0
    }
    
    await repo.put_item(new_item)
    return dict_to_paid_leave_model(new_item)


@router.get("/user/{user_id}", response_model=UserPaidLeaveSummary)
async def get_user_paid_leaves(
    user_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    指定ユーザーの有給休暇情報を取得します。
    """
    # 取得対象のユーザーのIDからcognito_subを特定する
    users_items = await repo.scan_items_by_type("USER#", "METADATA")
    target_user = None
    for item in users_items:
        if item.get("id") == str(user_id):
            target_user = item
            break
            
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    pk = f"USER#{target_user.get('cognito_sub')}"
    
    ledgers_items = await repo.query_items_by_pk_and_sk_prefix(pk, "PAID_LEAVE_LEDGER#")
    ledgers = [dict_to_paid_leave_model(l) for l in ledgers_items]
    
    total_granted = sum(l.days_granted for l in ledgers)
    
    # 承認済みの有給申請を取得
    app_items = await repo.query_items_by_pk_and_sk_prefix(pk, "APP#")
    approved_apps = [a for a in app_items if a.get("status") == "Approved" and a.get("type") in ["PaidLeave", "有給休暇申請"]]
    
    from app.schemas.paid_leave import PaidLeaveHistoryItem
    history: List[PaidLeaveHistoryItem] = []
    
    # 付与履歴
    for l in ledgers:
        history.append(
            PaidLeaveHistoryItem(
                date=l.grant_date,
                type="付与",
                amount=l.days_granted,
                description=f"有効期限: {l.expire_date}"
            )
        )
        
    total_used = 0.0
    for app in approved_apps:
        input_data = app.get("input_data", {})
        leave_start = date.fromisoformat(input_data["leave_start_date"])
        leave_end = date.fromisoformat(input_data["leave_end_date"])
        leave_type = input_data.get("leave_type")
        
        is_half = leave_type in ["HalfDayMorning", "HalfDayAfternoon", "午前半休", "午後半休"]
        delta = leave_end - leave_start
        amount = 0.5 * float(delta.days + 1) if is_half else float(delta.days + 1)
        
        total_used += amount
        history.append(
            PaidLeaveHistoryItem(
                date=leave_start,
                type="消化",
                amount=amount,
                description=input_data.get("reason") or "事由なし"
            )
        )
        
    history.sort(key=lambda x: x.date, reverse=True)
    current_balance = total_granted - total_used
    
    return UserPaidLeaveSummary(
        user_id=user_id,
        total_granted=total_granted,
        total_used=total_used,
        current_balance=current_balance,
        ledgers=[PaidLeaveResponse.model_validate(l) for l in ledgers],
        history=history
    )


@router.get("/types", response_model=List[LeaveTypeResponse])
async def get_leave_types(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    すべての休暇区分マスタを取得します。
    """
    items = await repo.scan_items_by_type("LEAVE_TYPE#", "METADATA")
    types = [dict_to_leave_type_model(item) for item in items]
    
    # 有給休暇・特別休暇・代休の順にソートする
    order_map = {"有給休暇": 0, "特別休暇": 1, "代休": 2}
    types.sort(key=lambda x: order_map.get(x.name, 99))
    
    return types


@router.post("/ledgers/grant", response_model=LeaveLedgerResponse, status_code=status.HTTP_201_CREATED)
async def grant_leave_ledger(
    grant_in: LeaveLedgerGrant,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    ユーザーに特定の休暇（有給、代休、特別休暇など）を付与します。
    """
    # 休暇マスタの取得
    type_pk = f"LEAVE_TYPE#{grant_in.leave_type_id}"
    type_item = await repo.get_item(type_pk, "METADATA")
    if not type_item:
        raise HTTPException(status_code=404, detail="Leave type not found")
        
    leave_name = type_item.get("name", "")

    if grant_in.expire_date:
        expire_date = grant_in.expire_date
    else:
        if leave_name == "代休":
            g_date = grant_in.grant_date
            if g_date.month == 12:
                next_year = g_date.year + 1
                next_month = 1
            else:
                next_year = g_date.year
                next_month = g_date.month + 1
            _, last_day = calendar.monthrange(next_year, next_month)
            expire_date = date(next_year, next_month, last_day)
        else:
            expire_date = grant_in.grant_date.replace(year=grant_in.grant_date.year + 2)

    # 付与対象ユーザーのid(UUID)からcognito_subを取得してPKにする
    users_items = await repo.scan_items_by_type("USER#", "METADATA")
    target_user = None
    for item in users_items:
        if item.get("id") == str(grant_in.user_id):
            target_user = item
            break
            
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_sub = target_user.get("cognito_sub")
    ledger_id = str(uuid4())
    pk = f"USER#{user_sub}"
    sk = f"LEAVE_LEDGER#{grant_in.grant_date.isoformat()}#{grant_in.leave_type_id}"
    
    new_item = {
        "PK": pk,
        "SK": sk,
        "id": ledger_id,
        "user_id": str(grant_in.user_id),
        "leave_type_id": str(grant_in.leave_type_id),
        "grant_date": grant_in.grant_date.isoformat(),
        "expire_date": expire_date.isoformat(),
        "days_granted": float(grant_in.days_granted),
        "days_used": 0.0
    }
    await repo.put_item(new_item)

    if leave_name == "有給休暇":
        # 古い有給管理台帳(PaidLeaveLedger)にもインサートしておく
        old_pk = f"USER#{user_sub}"
        old_sk = f"PAID_LEAVE_LEDGER#{grant_in.grant_date.isoformat()}"
        old_item = {
            "PK": old_pk,
            "SK": old_sk,
            "id": str(uuid4()),
            "user_id": str(grant_in.user_id),
            "grant_date": grant_in.grant_date.isoformat(),
            "expire_date": expire_date.isoformat(),
            "days_granted": float(grant_in.days_granted),
            "days_used": 0.0
        }
        await repo.put_item(old_item)

    return dict_to_leave_ledger_model(new_item)


@router.get("/ledgers/user/{user_id}", response_model=UserLeaveSummary)
async def get_user_leave_ledgers_summary(
    user_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    指定ユーザーのすべての休暇区分のサマリー（残高・履歴等）を取得します。
    """
    from app.schemas.leave import LeaveHistoryItem, LeaveLedgerSummary
    # 現在ログイン中のユーザーでなく、取得対象のユーザーのIDからcognito_subを特定する
    users_items = await repo.scan_items_by_type("USER#", "METADATA")
    target_user = None
    for item in users_items:
        if item.get("id") == str(user_id):
            target_user = item
            break
            
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    pk = f"USER#{target_user.get('cognito_sub')}"
    
    # 休暇タイプ全件
    types_items = await repo.scan_items_by_type("LEAVE_TYPE#", "METADATA")
    leave_types = [dict_to_leave_type_model(t) for t in types_items]

    # このユーザーの付与履歴
    ledgers_items = await repo.query_items_by_pk_and_sk_prefix(pk, "LEAVE_LEDGER#")
    all_ledgers = [dict_to_leave_ledger_model(l) for l in ledgers_items]

    # このユーザーの承認済み申請
    app_items = await repo.query_items_by_pk_and_sk_prefix(pk, "APP#")
    all_apps = [a for a in app_items if a.get("status") == "Approved"]

    summaries = []

    for lt in leave_types:
        type_ledgers = [l for l in all_ledgers if str(l.leave_type_id) == str(lt.id)]
        total_granted = sum(l.days_granted for l in type_ledgers)

        type_apps = []
        for app in all_apps:
            raw_input = app.get("input_data", {})
            app_leave_name = raw_input.get("休暇区分") or raw_input.get("leave_type_name") or raw_input.get("leave_name")
            if not app_leave_name and lt.name == "有給休暇" and app.get("type") in ["PaidLeave", "有給休暇申請"]:
                app_leave_name = "有給休暇"
            
            if app_leave_name == lt.name:
                type_apps.append(app)

        history = []
        total_used = 0.0

        for l in type_ledgers:
            history.append(
                LeaveHistoryItem(
                    date=l.grant_date,
                    type="付与",
                    amount=l.days_granted,
                    description=f"有効期限: {l.expire_date}"
                )
            )

        for app in type_apps:
            try:
                input_data = app.get("input_data", {})
                leave_start = date.fromisoformat(input_data["leave_start_date"])
                leave_end = date.fromisoformat(input_data["leave_end_date"])
                unit_type = input_data.get("leave_type")

                is_half = unit_type in ["HalfDayMorning", "HalfDayAfternoon", "午前半休", "午後半休"]
                delta = leave_end - leave_start
                amount = 0.5 * float(delta.days + 1) if is_half else float(delta.days + 1)

                total_used += amount

                history.append(
                    LeaveHistoryItem(
                        date=leave_start,
                        type="消化",
                        amount=amount,
                        description=input_data.get("reason") or "事由なし"
                    )
                )
            except Exception:
                continue

        history.sort(key=lambda x: x.date, reverse=True)
        current_balance = total_granted - total_used

        summaries.append(
            LeaveLedgerSummary(
                leave_type=LeaveTypeResponse.model_validate(lt),
                total_granted=total_granted,
                total_used=total_used,
                current_balance=current_balance,
                ledgers=[LeaveLedgerResponse.model_validate(l) for l in type_ledgers],
                history=history
            )
        )

    return UserLeaveSummary(user_id=user_id, summaries=summaries)
