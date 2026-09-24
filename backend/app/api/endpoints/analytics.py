from typing import List, Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_dynamodb_repo, check_admin_role, get_current_user
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User
from typing import Optional

router = APIRouter()

@router.get("/projects", response_model=List[Dict[str, Any]])
async def get_project_analytics(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    プロジェクトごとの予算と実績工数を集計して返します。
    """
    project_items = await repo.scan_items_by_type("PROJECT#", "METADATA")
    
    table = await repo.get_table()
    scan_res = await table.scan()
    all_items = scan_res.get("Items", [])
    work_log_items = [item for item in all_items if item.get("SK", "").startswith("WORKLOG#")]
    
    work_log_stats = {}
    for wl in work_log_items:
        pid = wl.get("project_id")
        if pid:
            work_log_stats[pid] = work_log_stats.get(pid, 0) + int(wl.get("minutes", 0))

    response_data = []
    for proj in project_items:
        proj_id = proj.get("id")
        budget_min = int(proj.get("budget_minutes", 0))
        
        actual_minutes = work_log_stats.get(proj_id, 0)
        actual_hours = round(actual_minutes / 60, 1)
        budget_hours = round(budget_min / 60, 1)
        
        usage_rate = 0.0
        if budget_min > 0:
            usage_rate = round((actual_minutes / budget_min) * 100, 1)
            
        remaining_hours = max(0, budget_hours - actual_hours)

        response_data.append({
            "id": proj_id,
            "code": proj.get("code", ""),
            "name": proj.get("name", ""),
            "start_date": proj.get("start_date"),
            "end_date": proj.get("end_date"),
            "budget_hours": budget_hours,
            "actual_hours": actual_hours,
            "remaining_hours": remaining_hours,
            "usage_rate": usage_rate,
            "is_active": proj.get("is_active", True)
        })

    response_data.sort(key=lambda x: x["code"])
    return response_data


@router.get("/project-costs", response_model=List[Dict[str, Any]])
async def get_project_costs_analytics(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    プロジェクトごとの人件費コストを集計して返します（管理者のみ）。
    """
    project_items = await repo.scan_items_by_type("PROJECT#", "METADATA")

    user_items = await repo.scan_items_by_type("USER#", "METADATA")
    user_rate_map = {item.get("id"): int(item.get("hourly_rate", 0)) for item in user_items if item.get("id")}

    table = await repo.get_table()
    scan_res = await table.scan()
    all_items = scan_res.get("Items", [])
    work_log_items = [item for item in all_items if item.get("SK", "").startswith("WORKLOG#")]

    costs_map = {}
    hours_map = {}
    for wl in work_log_items:
        pid = wl.get("project_id")
        uid = wl.get("user_id")
        minutes = int(wl.get("minutes", 0))
        
        if pid:
            rate = user_rate_map.get(uid, 0)
            cost = (minutes / 60.0) * rate
            
            costs_map[pid] = costs_map.get(pid, 0.0) + cost
            hours_map[pid] = hours_map.get(pid, 0.0) + minutes

    response_data = []
    for proj in project_items:
        proj_id = proj.get("id")
        actual_cost = round(costs_map.get(proj_id, 0.0))
        actual_hours = round(hours_map.get(proj_id, 0.0) / 60.0, 1)
        budget_hours = round(int(proj.get("budget_minutes", 0)) / 60.0, 1)

        response_data.append({
            "id": proj_id,
            "code": proj.get("code", ""),
            "name": proj.get("name", ""),
            "budget_hours": budget_hours,
            "actual_hours": actual_hours,
            "actual_cost": actual_cost,
            "is_active": proj.get("is_active", True)
        })

    response_data.sort(key=lambda x: x["code"])
    return response_data


@router.get("/skills", response_model=Dict[str, Any])
async def get_user_skills_analytics(
    user_id: Optional[UUID] = None,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    ユーザーの工数実績とプロジェクトの技術要素を掛け合わせ、
    言語・スキル・環境別の「総経験時間」「経験件数」「経験年数（重複考慮）」を集計して返します。
    """
    from datetime import date, timedelta
    target_user_id = user_id if user_id else current_user.id
    
    # 権限チェック: 自分以外を照会する場合は Admin または Manager ロールが必要
    if str(target_user_id) != str(current_user.id):
        if current_user.role.lower() not in ["admin", "manager"]:
            raise HTTPException(status_code=403, detail="他ユーザーのスキル情報を閲覧する権限がありません")
            
    # 全プロジェクトのメタデータを取得
    project_items = await repo.scan_items_by_type("PROJECT#", "METADATA")
    project_map = {p.get("id"): p for p in project_items if p.get("id")}
    
    # 対象ユーザーの工数ログを取得
    table = await repo.get_table()
    scan_res = await table.scan()
    all_items = scan_res.get("Items", [])
    
    target_work_logs = []
    for item in all_items:
        if item.get("SK", "").startswith("WORKLOG#") and str(item.get("user_id")) == str(target_user_id):
            target_work_logs.append(item)
            
    # 集計用のデータ構造
    lang_stats = {}
    skill_stats = {}
    env_stats = {}
    
    def add_stat(stats_dict, key, minutes, proj_id, start_date_str, end_date_str):
        if not key:
            return
        if key not in stats_dict:
            stats_dict[key] = {"minutes": 0, "projects": set(), "dates": set()}
            
        stats_dict[key]["minutes"] += minutes
        stats_dict[key]["projects"].add(proj_id)
        
        # 期間（年数用）の日付セット追加
        start_d = date.fromisoformat(start_date_str) if start_date_str else date.today()
        end_d = date.fromisoformat(end_date_str) if end_date_str else date.today()
        
        # 安全のために極端に長い期間を制限 (例: 10年)
        if (end_d - start_d).days > 3650:
            end_d = start_d + timedelta(days=3650)
            
        curr_d = start_d
        while curr_d <= end_d:
            stats_dict[key]["dates"].add(curr_d)
            curr_d += timedelta(days=1)

    for wl in target_work_logs:
        proj_id = wl.get("project_id")
        minutes = int(wl.get("minutes", 0))
        
        proj = project_map.get(proj_id)
        if not proj:
            continue
            
        start_date = proj.get("start_date")
        end_date = proj.get("end_date")
        
        # カンマ区切りの文字列をパース
        main_languages = [x.strip() for x in proj.get("main_languages", "").split(",") if x.strip()] if proj.get("main_languages") else []
        skills = [x.strip() for x in proj.get("skills", "").split(",") if x.strip()] if proj.get("skills") else []
        environments = [x.strip() for x in proj.get("environments", "").split(",") if x.strip()] if proj.get("environments") else []
        
        for lang in main_languages:
            add_stat(lang_stats, lang, minutes, proj_id, start_date, end_date)
        for skill in skills:
            add_stat(skill_stats, skill, minutes, proj_id, start_date, end_date)
        for env in environments:
            add_stat(env_stats, env, minutes, proj_id, start_date, end_date)

    # レスポンス形式に整形
    def format_stats(stats_dict):
        result = []
        for name, data in stats_dict.items():
            hours = round(data["minutes"] / 60.0, 1)
            project_count = len(data["projects"])
            years = round(len(data["dates"]) / 365.25, 1)
            result.append({
                "name": name,
                "hours": hours,
                "project_count": project_count,
                "years": max(0.1, years)  # 最低でも 0.1 年とする
            })
        # 経験時間の降順でソート
        result.sort(key=lambda x: x["hours"], reverse=True)
        return result

    return {
        "languages": format_stats(lang_stats),
        "skills": format_stats(skill_stats),
        "environments": format_stats(env_stats)
    }
