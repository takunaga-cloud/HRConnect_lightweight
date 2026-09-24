import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional, Union
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import AuditLog

# ロガーの設定 (CloudWatch Logs等に出力するため標準出力へ)
logger = logging.getLogger("auditor")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(message)s'))
logger.addHandler(handler)

class Auditor:
    """
    監査ログを記録するクラス。
    DBへの保存とログ出力を両方行います。
    """

    @staticmethod
    async def record_audit_log(
        db: Union[AsyncSession, DynamoDBRepository],
        event_type: str,
        user_id: Optional[Union[UUID, str]],
        target_resource_type: str,
        target_resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        result: str = "Success",
        user_ip_address: Optional[str] = None,
    ):
        """
        監査ログを記録します。
        
        Args:
            db (Union[AsyncSession, DynamoDBRepository]): DBセッションまたはDynamoDBリポジトリ
            event_type (str): イベントの種類
            user_id (Optional[UUID]): 操作を行ったユーザーのID
            target_resource_type (str): 操作対象のリソースタイプ
            target_resource_id (Optional[str]): 操作対象のリソースID
            details (Optional[Dict[str, Any]]): 変更内容のサマリーまたは差分
            result (str): 操作結果
            user_ip_address (Optional[str]): 操作元のIPアドレス
        """
        timestamp = datetime.utcnow()
        
        # 1. DB保存（SQLAlchemy / DynamoDB の両対応）
        if hasattr(db, "put_item"):
            # DynamoDBへの書き込み
            import uuid
            log_id = str(uuid.uuid4())
            item = {
                "PK": f"AUDITLOG#{timestamp.isoformat()}",
                "SK": "METADATA",
                "id": log_id,
                "user_id": str(user_id) if user_id else None,
                "user_ip_address": user_ip_address,
                "event_type": event_type,
                "target_resource_type": target_resource_type,
                "target_resource_id": target_resource_id,
                "details": details or {},
                "result": result
            }
            await db.put_item(item)
        else:
            # SQLAlchemyへの書き込み
            audit_log = AuditLog(
                timestamp=timestamp,
                user_id=user_id,
                user_ip_address=user_ip_address,
                event_type=event_type,
                target_resource_type=target_resource_type,
                target_resource_id=str(target_resource_id) if target_resource_id else None,
                details=details or {},
                result=result
            )
            db.add(audit_log)
        
        # 2. ログ出力 (CloudWatch Logs)
        log_entry = {
            "timestamp": timestamp.isoformat() + "Z",
            "user_id": str(user_id) if user_id else "system",
            "user_ip_address": user_ip_address or "unknown",
            "event_type": event_type,
            "target_resource_type": target_resource_type,
            "target_resource_id": str(target_resource_id) if target_resource_id else None,
            "details": details or {},
            "result": result
        }
        logger.info(json.dumps(log_entry, ensure_ascii=False))

# シングルトン的に使えるようにインスタンス化
auditor = Auditor()
