import csv
import io
from datetime import datetime, date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User, Attendance, WorkLog, Project, TaskCategory, Application
from app.schemas.closing import MonthlyClosingBase
from app.services.auditor import auditor

router = APIRouter()

@router.post("/payroll")
async def export_payroll(
    export_in: MonthlyClosingBase,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    給与計算用CSVを出力します（勤怠集計）。
    """
    start_date = date(export_in.year, export_in.month, 1)
    if export_in.month == 12:
        end_date = date(export_in.year + 1, 1, 1)
    else:
        end_date = date(export_in.year, export_in.month + 1, 1)
    
    # ユーザー全件取得
    user_items = await repo.scan_items_by_type("USER#", "METADATA")
    user_map = {item.get("id"): item for item in user_items if item.get("id")}

    # 勤怠データをスキャン
    table = await repo.get_table()
    scan_res = await table.scan()
    all_items = scan_res.get("Items", [])
    
    attendance_records = []
    for item in all_items:
        if item.get("SK", "").startswith("ATTENDANCE#"):
            w_date = date.fromisoformat(item["work_date"])
            if start_date <= w_date < end_date:
                # ユーザー特定
                uid = item.get("user_id")
                user = user_map.get(uid)
                if user:
                    attendance_records.append((item, user))

    # ソート (User ID, work_date)
    attendance_records.sort(key=lambda x: (x[1].get("id", ""), x[0].get("work_date", "")))

    # CSV生成
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["User ID", "Name", "Date", "Status", "Clock In", "Clock Out", "Total Minutes", "Overtime"])

    for att, user in attendance_records:
         writer.writerow([
             user.get("id"),
             user.get("name"),
             att.get("work_date"),
             att.get("status"),
             att.get("clock_in", ""),
             att.get("clock_out", ""),
             att.get("total_work_minutes", 0),
             0 # Overtime placeholder
         ])

    output.seek(0)
    
    await auditor.record_audit_log(
        db=repo,
        event_type="DATA_EXPORT_PAYROLL",
        user_id=current_user.id,
        target_resource_type="Export",
        target_resource_id=f"{export_in.year}-{export_in.month}",
        result="Success"
    )

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=payroll_{export_in.year}_{export_in.month}.csv"}
    )

@router.post("/work-logs")
async def export_work_logs(
    export_in: MonthlyClosingBase,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    工数管理用CSVを出力します。
    """
    start_date = date(export_in.year, export_in.month, 1)
    if export_in.month == 12:
        end_date = date(export_in.year + 1, 1, 1)
    else:
        end_date = date(export_in.year, export_in.month + 1, 1)

    # 各種マスタデータのスキャン
    user_items = await repo.scan_items_by_type("USER#", "METADATA")
    user_map = {item.get("id"): item for item in user_items if item.get("id")}
    
    project_items = await repo.scan_items_by_type("PROJECT#", "METADATA")
    project_map = {item.get("id"): item for item in project_items if item.get("id")}
    
    cat_items = await repo.scan_items_by_type("TASK_CATEGORY#", "METADATA")
    cat_map = {item.get("id"): item for item in cat_items if item.get("id")}

    # 工数データをスキャン
    table = await repo.get_table()
    scan_res = await table.scan()
    all_items = scan_res.get("Items", [])
    
    work_records = []
    for item in all_items:
        if item.get("SK", "").startswith("WORKLOG#"):
            l_date = date.fromisoformat(item["log_date"])
            if start_date <= l_date < end_date:
                uid = item.get("user_id")
                pid = item.get("project_id")
                cid = item.get("task_category_id")
                
                user = user_map.get(uid)
                proj = project_map.get(pid)
                cat = cat_map.get(cid)
                
                if user and proj and cat:
                    work_records.append((item, user, proj, cat))

    # ソート
    work_records.sort(key=lambda x: (x[1].get("id", ""), x[0].get("log_date", "")))

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["User", "Date", "Project Code", "Project Name", "Task Category", "Minutes", "Comment"])

    for log, user, proj, cat in work_records:
        writer.writerow([
            user.get("name"),
            log.get("log_date"),
            proj.get("code"),
            proj.get("name"),
            cat.get("name"),
            log.get("minutes"),
            log.get("comment", "")
        ])

    output.seek(0)

    await auditor.record_audit_log(
        db=repo,
        event_type="DATA_EXPORT_WORKLOG",
        user_id=current_user.id,
        target_resource_type="Export",
        target_resource_id=f"{export_in.year}-{export_in.month}",
        result="Success"
    )

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=worklogs_{export_in.year}_{export_in.month}.csv"}
    )


@router.post("/applications")
async def export_applications(
    export_in: MonthlyClosingBase,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    申請データを指定された共通レイアウトでCSV出力します。
    """
    start_date = date(export_in.year, export_in.month, 1)
    if export_in.month == 12:
        end_date = date(export_in.year + 1, 1, 1)
    else:
        end_date = date(export_in.year, export_in.month + 1, 1)

    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.min.time())

    # ユーザー全件取得
    user_items = await repo.scan_items_by_type("USER#", "METADATA")
    user_map = {item.get("id"): item for item in user_items if item.get("id")}

    # 申請データをスキャン
    table = await repo.get_table()
    scan_res = await table.scan()
    all_items = scan_res.get("Items", [])
    
    applications = []
    for item in all_items:
        if item.get("SK", "").startswith("APP#"):
            created_at_str = item.get("created_at")
            if created_at_str:
                created_at = datetime.fromisoformat(created_at_str)
                if start_dt <= created_at < end_dt:
                    applications.append(item)

    # ソート
    applications.sort(key=lambda x: x.get("created_at", ""))

    exclusive_keys = set()
    for app in applications:
        input_data = app.get("input_data")
        if input_data:
            for k in input_data.keys():
                if k != "reason":
                    exclusive_keys.add(k)
    
    sorted_exclusive_keys = sorted(list(exclusive_keys))

    output = io.StringIO()
    writer = csv.writer(output)

    common_headers = [
        "seqno",
        "従業員番号",
        "従業員名",
        "申請日",
        "申請番号",
        "申請内容",
        "申請理由",
        "承認フラグ",
        "承認者番号",
        "承認者名",
        "承認日"
    ]
    writer.writerow(common_headers + sorted_exclusive_keys)

    for i, app in enumerate(applications, start=1):
        uid = app.get("user_id")
        user = user_map.get(uid)
        
        emp_no = user.get("id", "") if user else ""
        emp_name = user.get("name", "") if user else ""
        
        created_at_str = app.get("created_at", "")
        app_date = datetime.fromisoformat(created_at_str).date() if created_at_str else ""
        
        app_no = app.get("id", "")
        
        type_map = {
            "PaidLeave": "有給休暇申請",
            "Overtime": "残業申請",
            "StampCorrection": "打刻修正申請",
            "Other": "交通費申請" 
        }
        app_content = type_map.get(app.get("type"), app.get("type", ""))
        
        input_data = app.get("input_data", {})
        app_reason = input_data.get("reason", "") if input_data else ""
        
        status_map = {
            "Pending": "承認待ち",
            "Approved": "承認済み",
            "Rejected": "却下"
        }
        approval_flag = status_map.get(app.get("status"), app.get("status", ""))
        
        approver_id = app.get("approver_id")
        approver = user_map.get(approver_id)
        
        approver_no = approver.get("id", "") if approver else ""
        approver_name = approver.get("name", "") if approver else ""
        
        approval_date = "" # DynamoDBではカラムがないため空欄

        common_values = [
            i,
            emp_no,
            emp_name,
            app_date,
            app_no,
            app_content,
            app_reason,
            approval_flag,
            approver_no,
            approver_name,
            approval_date
        ]

        exclusive_values = []
        for key in sorted_exclusive_keys:
            val = input_data.get(key, "") if input_data else ""
            exclusive_values.append(val)

        writer.writerow(common_values + exclusive_values)

    output.seek(0)

    await auditor.record_audit_log(
        db=repo,
        event_type="DATA_EXPORT_APPLICATION",
        user_id=current_user.id,
        target_resource_type="Export",
        target_resource_id=f"{export_in.year}-{export_in.month}",
        result="Success"
    )

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=applications_{export_in.year}_{export_in.month}.csv"}
    )
