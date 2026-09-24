from datetime import date
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Attendance, WorkLog, User
from app.schemas.work_log import WorkLogBulkCreate, WorkLogResponse

router = APIRouter()


def dict_to_work_log_model(item: dict) -> WorkLog:
    """
    DynamoDBのアイテム辞書からSQLAlchemyのWorkLogモデルを生成します。
    """
    return WorkLog(
        id=UUID(item["id"]) if "id" in item else None,
        user_id=UUID(item["user_id"]) if "user_id" in item else None,
        log_date=date.fromisoformat(item["log_date"]) if "log_date" in item else None,
        project_id=UUID(item["project_id"]) if "project_id" in item else None,
        task_category_id=UUID(item["task_category_id"]) if "task_category_id" in item else None,
        minutes=int(item.get("minutes", 0)),
        comment=item.get("comment", "")
    )


@router.post(
    "/bulk", response_model=List[WorkLogResponse], status_code=status.HTTP_201_CREATED
)
async def bulk_create_work_logs(
    work_log_data: WorkLogBulkCreate,
    current_user: User = Depends(get_current_user),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    指定された日付の工数データを一括で保存（更新）します。
    既存のデータは削除され、新しいデータが挿入されます。
    """
    if not work_log_data.work_logs:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Work logs cannot be empty")

    target_date = work_log_data.work_logs[0].log_date
    pk = f"USER#{current_user.cognito_sub}"

    # 1. 勤怠実績との合計工数バリデーション
    # 今日の打刻データをDynamoDBから引く
    attendance_item = await repo.get_item(pk, f"ATTENDANCE#{target_date.isoformat()}")
    actual_work_minutes = None
    if attendance_item:
        actual_work_minutes = float(attendance_item.get("total_work_minutes", 0))

    total_input_minutes = sum(log.minutes for log in work_log_data.work_logs)

    # 合計時間のズレが許容範囲を超える場合の警告/エラーロジック
    if actual_work_minutes is not None and actual_work_minutes > 0:
        allowed_deviation = 15
        if abs(total_input_minutes - actual_work_minutes) > allowed_deviation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"合計工数({total_input_minutes}分)が勤怠実績({actual_work_minutes:.1f}分)と大きく異なります。許容誤差は±{allowed_deviation}分です。",
            )

    # 2. 既存の指定日のwork_logsを削除するためにQueryで取得
    existing_items = await repo.query_items_by_pk_and_sk_prefix(pk, f"WORKLOG#{target_date.isoformat()}#")
    for item in existing_items:
        await repo.delete_item(item["PK"], item["SK"])

    # 3. 新しいwork_logsを挿入
    response_work_logs = []
    for log_in in work_log_data.work_logs:
        project_uuid = str(log_in.project_id)
        sk = f"WORKLOG#{target_date.isoformat()}#{project_uuid}"
        
        new_item = {
            "PK": pk,
            "SK": sk,
            "id": str(uuid4()),
            "user_id": str(current_user.id),
            "log_date": target_date.isoformat(),
            "project_id": project_uuid,
            "task_category_id": str(log_in.task_category_id) if log_in.task_category_id else None,
            "minutes": log_in.minutes,
            "comment": log_in.comment if log_in.comment else ""
        }
        await repo.put_item(new_item)
        response_work_logs.append(dict_to_work_log_model(new_item))

    return [WorkLogResponse.model_validate(wl) for wl in response_work_logs]


@router.get("/daily-info/{selected_date}", response_model=dict)
async def get_daily_info(
    selected_date: date,
    current_user: User = Depends(get_current_user),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
):
    """
    指定された日付の勤怠実績と工数データを取得します。
    """
    pk = f"USER#{current_user.cognito_sub}"
    
    # 勤怠実績を取得
    attendance_item = await repo.get_item(pk, f"ATTENDANCE#{selected_date.isoformat()}")
    
    # 工数データを取得
    work_log_items = await repo.query_items_by_pk_and_sk_prefix(pk, f"WORKLOG#{selected_date.isoformat()}#")
    work_logs = [dict_to_work_log_model(item) for item in work_log_items]

    return {
        "attendance": int(attendance_item.get("total_work_minutes", 0)) if attendance_item else None,
        "work_logs": [WorkLogResponse.model_validate(log) for log in work_logs],
    }
