from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models.closing import MonthlyClosing
from app.models import User
from app.schemas.closing import MonthlyClosingCreate, MonthlyClosingResponse, MonthlyClosingUpdate
from app.services.auditor import auditor

router = APIRouter()


def dict_to_closing_model(item: dict) -> MonthlyClosing:
    """
    DynamoDBのアイテム辞書からSQLAlchemyのMonthlyClosingモデルを生成します。
    """
    return MonthlyClosing(
        id=UUID(item["id"]) if "id" in item else None,
        year=int(item.get("year", 2026)),
        month=int(item.get("month", 1)),
        status=item.get("status", "Open"),
        closed_at=datetime.fromisoformat(item["closed_at"]) if item.get("closed_at") else None,
        closed_by_id=UUID(item["closed_by_id"]) if item.get("closed_by_id") else None
    )


@router.get("/", response_model=List[MonthlyClosingResponse])
async def get_closings(
    skip: int = 0,
    limit: int = 12, # 1 yr
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    月次締めの履歴を取得します。
    """
    items = await repo.scan_items_by_type("CLOSING#", "METADATA")
    closings = [dict_to_closing_model(item) for item in items]
    
    # ソート (降順)
    closings.sort(key=lambda x: (x.year, x.month), reverse=True)
    return closings[skip : skip + limit]


@router.post("/execute", response_model=MonthlyClosingResponse)
async def execute_closing(
    closing_in: MonthlyClosingCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    指定月の締め処理を実行します。
    """
    pk = f"CLOSING#{closing_in.year}#{closing_in.month}"
    existing = await repo.get_item(pk, "METADATA")

    closed_at_str = datetime.utcnow().isoformat()
    closed_by_id_str = str(current_user.id)

    if existing:
        if existing.get("status") == "Closed":
            raise HTTPException(status_code=400, detail="This month is already closed.")
        # Re-close (update status & closed_at)
        existing["status"] = "Closed"
        existing["closed_at"] = closed_at_str
        existing["closed_by_id"] = closed_by_id_str
        await repo.put_item(existing)
        target_item = existing
    else:
        closing_id = str(uuid4())
        new_item = {
            "PK": pk,
            "SK": "METADATA",
            "id": closing_id,
            "year": closing_in.year,
            "month": closing_in.month,
            "status": "Closed",
            "closed_at": closed_at_str,
            "closed_by_id": closed_by_id_str
        }
        await repo.put_item(new_item)
        target_item = new_item

    # 監査ログ
    await auditor.record_audit_log(
        db=repo,
        event_type="MONTHLY_CLOSING_EXECUTED",
        user_id=current_user.id,
        target_resource_type="MonthlyClosing",
        target_resource_id=target_item["id"],
        details={"year": closing_in.year, "month": closing_in.month},
        result="Success"
    )

    return dict_to_closing_model(target_item)


@router.post("/reopen", response_model=MonthlyClosingResponse)
async def reopen_closing(
    closing_in: MonthlyClosingCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    締め処理を解除します。
    """
    pk = f"CLOSING#{closing_in.year}#{closing_in.month}"
    existing = await repo.get_item(pk, "METADATA")

    if not existing or existing.get("status") == "Open":
        raise HTTPException(status_code=400, detail="This month is not closed.")

    existing["status"] = "Open"
    existing["closed_at"] = None
    existing["closed_by_id"] = None
    await repo.put_item(existing)
    
    await auditor.record_audit_log(
        db=repo,
        event_type="MONTHLY_CLOSING_REOPENED",
        user_id=current_user.id,
        target_resource_type="MonthlyClosing",
        target_resource_id=existing["id"],
        details={"year": closing_in.year, "month": closing_in.month},
        result="Success"
    )

    return dict_to_closing_model(existing)
