from typing import List, Optional
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User

router = APIRouter()

class AuditLogResponse(BaseModel):
    timestamp: datetime
    user_name: str
    user_ip_address: Optional[str]
    event_type: str
    target_resource_type: str
    target_resource_id: Optional[str]
    details: Optional[dict]
    result: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[AuditLogResponse])
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    event_type: Optional[str] = Query(None),
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),
):
    """
    監査ログを取得します。
    """
    items = await repo.scan_items_by_type("AUDITLOG#", "METADATA")
    
    # タイムスタンプ降順でソート
    items.sort(key=lambda x: x.get("PK", ""), reverse=True)
    
    user_items = await repo.scan_items_by_type("USER#", "METADATA")
    user_map = {item.get("id"): item.get("name") for item in user_items if item.get("id")}
    
    response_list = []
    
    filtered_items = []
    for item in items:
        if event_type and item.get("event_type") != event_type:
            continue
        filtered_items.append(item)
        
    sliced_items = filtered_items[offset : offset + limit]
    
    for item in sliced_items:
        uid = item.get("user_id")
        user_name = "System" if not uid else user_map.get(uid, "Unknown")
        
        pk_val = item.get("PK", "")
        ts_str = pk_val.replace("AUDITLOG#", "")
        try:
            timestamp = datetime.fromisoformat(ts_str)
        except Exception:
            timestamp = datetime.utcnow()
            
        resp = AuditLogResponse(
            timestamp=timestamp,
            user_name=user_name,
            user_ip_address=item.get("user_ip_address"),
            event_type=item.get("event_type"),
            target_resource_type=item.get("target_resource_type"),
            target_resource_id=item.get("target_resource_id"),
            details=item.get("details"),
            result=item.get("result", "Success")
        )
        response_list.append(resp)
        
    return response_list
