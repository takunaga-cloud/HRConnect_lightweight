from typing import Dict, Any, List, Optional
from boto3.dynamodb.conditions import Key
from app.core.config import settings

class DynamoDBRepository:
    """
    DynamoDBのシングルテーブル設計に基づくデータ操作を提供するリポジトリクラスです。
    """
    def __init__(self, resource):
        self.resource = resource
        self.table_name = settings.DYNAMODB_TABLE_NAME

    async def get_table(self):
        return await self.resource.Table(self.table_name)

    async def get_item(self, pk: str, sk: str) -> Optional[Dict[str, Any]]:
        """
        単一のアイテムをキーで取得します。
        """
        table = await self.get_table()
        response = await table.get_item(Key={"PK": pk, "SK": sk})
        return response.get("Item")

    async def put_item(self, item: Dict[str, Any]) -> None:
        """
        アイテムを登録または上書きします。
        """
        from decimal import Decimal
        from uuid import UUID
        from datetime import datetime, date, time
        from pydantic import BaseModel

        def serialize_val(v):
            if v is None:
                return None
            elif isinstance(v, float):
                return Decimal(str(v))
            elif isinstance(v, UUID):
                return str(v)
            elif isinstance(v, (datetime, date, time)):
                return v.isoformat()
            elif isinstance(v, BaseModel):
                return serialize_val(v.model_dump())
            elif isinstance(v, dict):
                return {k: serialize_val(val) for k, val in v.items()}
            elif isinstance(v, list):
                return [serialize_val(val) for val in v]
            return v

        serialized_item = {k: serialize_val(v) for k, v in item.items()}
        table = await self.get_table()
        await table.put_item(Item=serialized_item)

    async def delete_item(self, pk: str, sk: str) -> None:
        """
        アイテムを削除します。
        """
        table = await self.get_table()
        await table.delete_item(Key={"PK": pk, "SK": sk})

    async def query_items_by_pk(self, pk: str) -> List[Dict[str, Any]]:
        """
        PKに一致する全アイテムをクエリします。
        """
        table = await self.get_table()
        response = await table.query(
            KeyConditionExpression=Key("PK").eq(pk)
        )
        return response.get("Items", [])

    async def query_items_by_pk_and_sk_prefix(self, pk: str, sk_prefix: str) -> List[Dict[str, Any]]:
        """
        PKに一致し、かつSKが指定した接頭辞で始まるアイテムをクエリします。
        """
        table = await self.get_table()
        response = await table.query(
            KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with(sk_prefix)
        )
        return response.get("Items", [])

    async def transact_write_items(self, transact_items: List[Dict[str, Any]]) -> None:
        """
        複数のデータ更新（登録、更新、削除）をトランザクション内でアトミックに実行します。
        """
        # aioboto3 の client 経由で transact_write_items を呼び出す
        client = self.resource.meta.client
        await client.transact_write_items(TransactItems=transact_items)

    async def query_gsi1(self, gsi1_pk: str, gsi1_sk_prefix: str) -> List[Dict[str, Any]]:
        """
        GSI1インデックスを用いて、GSI1-PKが一致し、GSI1-SKが指定した接頭辞で始まるアイテムをクエリします。
        """
        table = await self.get_table()
        response = await table.query(
            IndexName="GSI1",
            KeyConditionExpression=Key("SK").eq(gsi1_pk) & Key("PK").begins_with(gsi1_sk_prefix)
        )
        return response.get("Items", [])

    async def scan_items_by_type(self, pk_prefix: str, sk: str = "METADATA") -> List[Dict[str, Any]]:
        """
        簡易的なScan操作によって、指定したPKプレフィックスおよびSKを持つアイテムを検索します（開発用フォールバック）。
        """
        table = await self.get_table()
        # scanではページネーションに対応するため、LastEvaluatedKeyを処理する
        items = []
        response = await table.scan()
        items.extend(response.get("Items", []))
        while "LastEvaluatedKey" in response:
            response = await table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))
        return [item for item in items if item.get("PK", "").startswith(pk_prefix) and item.get("SK", "") == sk]


class MockDynamoDBRepository:
    """
    メモリ内の辞書を使用してDynamoDB操作をシミュレートするモックリポジトリクラスです。
    ALLOW_MOCK_AUTH=Trueの場合に、実際のDynamoDBを使わずに動作させるために使用します。
    """
    def __init__(self):
        self.db = {}
        # boto3のclient/resourceのダックタイピング用
        self.meta = self
        self.client = self

        # 初期データの投入（モック管理者および一般ユーザー、休暇区分）
        from app.core.security import get_password_hash
        from decimal import Decimal
        import os
        import json

        # 管理者アカウントの作成
        admin_pk = "USER#admin-sub"
        self.db[(admin_pk, "METADATA")] = {
            "PK": admin_pk,
            "SK": "METADATA",
            "id": "11111111-1111-1111-1111-111111111111",
            "cognito_sub": "admin-sub",
            "email": "admin@hr-connect.com",
            "user_id": "admin",
            "name": "Admin User",
            "role": "Admin",
            "status": "Active",
            "hashed_password": get_password_hash("Admin#K9x$2P!w9a"),
            "hourly_rate": 0,
            "work_rule_id": "00000000-0000-0000-0000-000000000000"
        }

        # 一般ユーザーアカウントの作成
        user1_pk = "USER#user1-sub"
        self.db[(user1_pk, "METADATA")] = {
            "PK": user1_pk,
            "SK": "METADATA",
            "id": "22222222-2222-2222-2222-222222222222",
            "cognito_sub": "user1-sub",
            "email": "user1@hr-connect.com",
            "user_id": "user1",
            "name": "Employee User",
            "role": "Employee",
            "status": "Active",
            "hashed_password": get_password_hash("User@7m*qR8#tN4"),
            "hourly_rate": 0,
            "work_rule_id": "00000000-0000-0000-0000-000000000000"
        }

        # 休暇区分マスタの作成
        leave_types = [
            {"id": "8e49b8fa-2123-44ce-be36-8b9c59130b23", "name": "有給休暇", "is_paid": True, "is_system": True},
            {"id": "17b9e284-12af-40fb-9e4c-8fbaf53ce5c0", "name": "代休", "is_paid": False, "is_system": True},
            {"id": "10000000-0000-0000-0000-000000000003", "name": "特別休暇", "is_paid": True, "is_system": True},
        ]
        for lt in leave_types:
            lt_pk = f"LEAVE_TYPE#{lt['id']}"
            self.db[(lt_pk, "METADATA")] = {
                "PK": lt_pk,
                "SK": "METADATA",
                "id": lt["id"],
                "name": lt["name"],
                "is_paid": lt["is_paid"],
                "is_system": lt["is_system"]
            }

        # 有給休暇付与データの作成
        self.db[("USER#user1-sub", "LEAVE_LEDGER#99999999-9999-9999-9999-999999999999")] = {
            "PK": "USER#user1-sub",
            "SK": "LEAVE_LEDGER#99999999-9999-9999-9999-999999999999",
            "id": "99999999-9999-9999-9999-999999999999",
            "user_id": "22222222-2222-2222-2222-222222222222",
            "leave_type_id": "8e49b8fa-2123-44ce-be36-8b9c59130b23",
            "grant_date": "2026-04-01",
            "expire_date": "2028-03-31",
            "days_granted": Decimal("20.0"),
            "days_used": Decimal("0.0")
        }

        # SQLite（hr_connect.db）からデータをロードしてインメモリに同期する
        import sqlite3
        db_path = "./hr_connect.db"
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()

                def norm_id(val):
                    if not val:
                        return val
                    val_str = str(val).replace("-", "")
                    if len(val_str) == 32:
                        return f"{val_str[:8]}-{val_str[8:12]}-{val_str[12:16]}-{val_str[16:20]}-{val_str[20:]}"
                    return str(val)

                # Userのメールアドレスとcognito_subの対応関係を作る
                cursor.execute("SELECT id, email FROM users")
                users = cursor.fetchall()
                user_id_to_sub = {}
                
                def get_correct_sub(email: str) -> str:
                    if email == "admin@hr-connect.com":
                        return "admin-sub"
                    elif email == "manager@hr-connect.com":
                        return "manager-sub"
                    else:
                        username = email.split("@")[0]
                        return f"{username}-sub"

                for u in users:
                    correct_sub = get_correct_sub(u["email"])
                    user_id_to_sub[norm_id(u["id"])] = correct_sub

                # 1. system_definitions
                cursor.execute("SELECT * FROM system_definitions")
                for row in cursor.fetchall():
                    r_id = norm_id(row['id'])
                    pk = f"SYS_DEF#{r_id}"
                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "category_code": row["category_code"], "code": row["code"],
                        "name": row["name"], "order": row["order"], "description": row["description"]
                    }

                # 2. affiliation_groups
                cursor.execute("SELECT * FROM affiliation_groups")
                for row in cursor.fetchall():
                    r_id = norm_id(row['id'])
                    pk = f"AFFILIATION_GROUP#{r_id}"
                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "name": row["name"]
                    }

                # 3. departments
                cursor.execute("SELECT * FROM departments")
                for row in cursor.fetchall():
                    r_id = norm_id(row['id'])
                    pk = f"DEPT#{r_id}"
                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "name": row["name"], "affiliation_group_id": norm_id(row["affiliation_group_id"])
                    }

                # 4. work_rules
                cursor.execute("SELECT * FROM work_rules")
                for row in cursor.fetchall():
                    r_id = norm_id(row['id'])
                    pk = f"WORK_RULE#{r_id}"
                    try:
                        config_val = json.loads(row["config"]) if row["config"] else {}
                    except Exception:
                        config_val = {}
                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "name": row["name"], "config": config_val
                    }

                # 5. users (詳細情報をロード)
                for row in users:
                    cursor.execute("SELECT * FROM users WHERE id = ?", (row["id"],))
                    u_detail = cursor.fetchone()
                    if not u_detail:
                        continue
                    correct_sub = get_correct_sub(u_detail["email"])
                    pk = f"USER#{correct_sub}"
                    
                    if u_detail["email"] == "admin@hr-connect.com":
                        pwd = "Admin#K9x$2P!w9a"
                    elif u_detail["email"] == "manager@hr-connect.com":
                        pwd = "Manager!4p*sZ9#wK2"
                    else:
                        pwd = "User@7m*qR8#tN4"

                    r_id = norm_id(u_detail["id"])
                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "cognito_sub": correct_sub, "email": u_detail["email"],
                        "user_id": u_detail["user_id"], "name": u_detail["name"], "status": u_detail["status"],
                        "role": u_detail["role"], "hourly_rate": u_detail["hourly_rate"],
                        "department_id": norm_id(u_detail["department_id"]), "work_rule_id": norm_id(u_detail["work_rule_id"]),
                        "hashed_password": get_password_hash(pwd)
                    }

                # 6. projects
                # プロジェクト役割とアサインのマップをロード
                cursor.execute("SELECT * FROM project_roles")
                for row in cursor.fetchall():
                    r_id = norm_id(row['id'])
                    pk = f"PROJECT_ROLE#{r_id}"
                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "name": row["name"], "description": row["description"]
                    }

                cursor.execute("SELECT * FROM project_members")
                project_members_rows = cursor.fetchall()
                project_to_member_roles = {}
                for row in project_members_rows:
                    p_id = norm_id(row['project_id'])
                    u_id = norm_id(row['user_id'])
                    r_id = norm_id(dict(row).get('role_id'))
                    if p_id not in project_to_member_roles:
                        project_to_member_roles[p_id] = {}
                    if r_id:
                        project_to_member_roles[p_id][u_id] = r_id

                cursor.execute("SELECT * FROM projects")
                for row in cursor.fetchall():
                    r_id = norm_id(row['id'])
                    pk = f"PROJECT#{r_id}"
                    
                    # メンバーIDのリストを取得
                    cursor.execute(f"SELECT user_id FROM project_members WHERE project_id = '{r_id}'")
                    m_ids = [norm_id(r['user_id']) for r in cursor.fetchall()]

                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "code": row["code"], "name": row["name"],
                        "start_date": row["start_date"], "end_date": row["end_date"],
                        "is_active": bool(row["is_active"]), "budget_minutes": row["budget_minutes"],
                        "leader_id": norm_id(row["leader_id"]),
                        "member_ids": m_ids,
                        "member_roles": project_to_member_roles.get(r_id, {}),
                        "main_languages": dict(row).get("main_languages"),
                        "skills": dict(row).get("skills"),
                        "environments": dict(row).get("environments")
                    }

                # 7. project_members
                for row in project_members_rows:
                    p_id = norm_id(row['project_id'])
                    u_id = norm_id(row['user_id'])
                    pk = f"PROJECT#{p_id}"
                    sk = f"MEMBER#{u_id}"
                    self.db[(pm_pk := pk, sk)] = {
                        "PK": pm_pk, "SK": sk,
                        "id": norm_id(row["id"]), "project_id": p_id, "user_id": u_id,
                        "role_id": norm_id(dict(row).get("role_id"))
                    }

                # 8. task_categories
                cursor.execute("SELECT * FROM task_categories")
                for row in cursor.fetchall():
                    r_id = norm_id(row['id'])
                    pk = f"TASK_CATEGORY#{r_id}"
                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "name": row["name"]
                    }

                # 9. shift_templates
                cursor.execute("SELECT * FROM shift_templates")
                for row in cursor.fetchall():
                    r_id = norm_id(row['id'])
                    pk = f"SHIFT_TEMP#{r_id}"
                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "name": row["name"], "start_time": row["start_time"], "end_time": row["end_time"],
                        "break_minutes": row["break_minutes"]
                    }

                # 10. shifts
                cursor.execute("SELECT * FROM shifts")
                for row in cursor.fetchall():
                    cognito_sub = user_id_to_sub.get(norm_id(row["user_id"]))
                    if not cognito_sub:
                        continue
                    pk = f"USER#{cognito_sub}"
                    sk = f"SHIFT#{row['target_date']}"
                    self.db[(pk, sk)] = {
                        "PK": pk, "SK": sk,
                        "id": norm_id(row["id"]), "user_id": norm_id(row["user_id"]), "target_date": row["target_date"],
                        "start_time": row["start_time"], "end_time": row["end_time"],
                        "is_holiday": bool(row["is_holiday"]), "shift_type": row["shift_type"],
                        "remarks": row["remarks"], "status": row["status"]
                    }

                # 11. attendances
                cursor.execute("SELECT * FROM attendances")
                for row in cursor.fetchall():
                    cognito_sub = user_id_to_sub.get(norm_id(row["user_id"]))
                    if not cognito_sub:
                        continue
                    pk = f"USER#{cognito_sub}"
                    sk = f"ATTENDANCE#{row['work_date']}"
                    
                    try:
                        breaks_val = json.loads(row["breaks"]) if row["breaks"] else []
                    except Exception:
                        breaks_val = []
                    try:
                        meta_val = json.loads(row["meta_data"]) if row["meta_data"] else {}
                    except Exception:
                        meta_val = {}

                    self.db[(pk, sk)] = {
                        "PK": pk, "SK": sk,
                        "id": norm_id(row["id"]), "user_id": norm_id(row["user_id"]), "work_date": row["work_date"],
                        "clock_in": row["clock_in"], "clock_out": row["clock_out"],
                        "breaks": breaks_val, "meta_data": meta_val,
                        "status": row["status"], "total_work_minutes": row["total_work_minutes"]
                    }

                # 12. application_templates
                cursor.execute("SELECT * FROM application_templates")
                for row in cursor.fetchall():
                    r_id = norm_id(row['id'])
                    pk = f"APP_TEMP#{r_id}"
                    try:
                        schema_val = json.loads(row["schema_definition"]) if row["schema_definition"] else {}
                    except Exception:
                        schema_val = {}
                    try:
                        settings_val = json.loads(row["settings"]) if row["settings"] else {}
                    except Exception:
                        settings_val = {}
                    
                    # テンプレート名の正規化（StampCorrection -> 打刻修正申請）
                    name_val = row["name"]
                    if name_val == "StampCorrection":
                        name_val = "打刻修正申請"

                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "name": name_val,
                        "schema_definition": schema_val, "settings": settings_val
                    }

                # 13. applications
                cursor.execute("SELECT * FROM applications")
                for row in cursor.fetchall():
                    cognito_sub = user_id_to_sub.get(norm_id(row["user_id"]))
                    if not cognito_sub:
                        continue
                    pk = f"USER#{cognito_sub}"
                    sk = f"APP#{norm_id(row['id'])}"
                    try:
                        input_val = json.loads(row["input_data"]) if row["input_data"] else {}
                    except Exception:
                        input_val = {}
                    self.db[(pk, sk)] = {
                        "PK": pk, "SK": sk,
                        "id": norm_id(row["id"]), "user_id": norm_id(row["user_id"]), "template_id": norm_id(row["template_id"]),
                        "type": row["type"], "status": row["status"], "input_data": input_val,
                        "approver_id": norm_id(row["approver_id"]), "created_at": row["created_at"]
                    }

                # 14. work_logs
                cursor.execute("SELECT * FROM work_logs")
                for row in cursor.fetchall():
                    cognito_sub = user_id_to_sub.get(norm_id(row["user_id"]))
                    if not cognito_sub:
                        continue
                    p_id = norm_id(row['project_id'])
                    pk = f"USER#{cognito_sub}"
                    sk = f"WORKLOG#{row['log_date']}#{p_id}"
                    self.db[(pk, sk)] = {
                        "PK": pk, "SK": sk,
                        "id": norm_id(row["id"]), "user_id": norm_id(row["user_id"]), "log_date": row["log_date"],
                        "project_id": p_id, "task_category_id": norm_id(row["task_category_id"]),
                        "minutes": row["minutes"], "comment": row["comment"]
                    }

                # 15. leave_types
                cursor.execute("SELECT * FROM leave_types")
                for row in cursor.fetchall():
                    r_id = norm_id(row['id'])
                    pk = f"LEAVE_TYPE#{r_id}"
                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "name": row["name"],
                        "is_paid": bool(row["is_paid"]) if row["is_paid"] is not None else True,
                        "is_system": bool(row["is_system"]) if row["is_system"] is not None else False
                    }

                # 16. leave_ledgers
                cursor.execute("SELECT * FROM leave_ledgers")
                for row in cursor.fetchall():
                    cognito_sub = user_id_to_sub.get(norm_id(row["user_id"]))
                    if not cognito_sub:
                        continue
                    pk = f"USER#{cognito_sub}"
                    sk = f"LEAVE_LEDGER#{norm_id(row['id'])}"
                    self.db[(pk, sk)] = {
                        "PK": pk, "SK": sk,
                        "id": norm_id(row["id"]), "user_id": norm_id(row["user_id"]), "leave_type_id": norm_id(row["leave_type_id"]),
                        "grant_date": row["grant_date"], "expire_date": row["expire_date"],
                        "days_granted": Decimal(str(row["days_granted"])), "days_used": Decimal(str(row["days_used"]))
                    }

                # 17. paid_leave_ledgers
                cursor.execute("SELECT * FROM paid_leave_ledgers")
                for row in cursor.fetchall():
                    cognito_sub = user_id_to_sub.get(norm_id(row["user_id"]))
                    if not cognito_sub:
                        continue
                    pk = f"USER#{cognito_sub}"
                    sk = f"PAID_LEAVE_LEDGER#{norm_id(row['id'])}"
                    self.db[(pk, sk)] = {
                        "PK": pk, "SK": sk,
                        "id": norm_id(row["id"]), "user_id": norm_id(row["user_id"]),
                        "grant_date": row["grant_date"], "expire_date": row["expire_date"],
                        "days_granted": Decimal(str(row["days_granted"])), "days_used": Decimal(str(row["days_used"]))
                    }

                # 18. monthly_closings
                cursor.execute("SELECT * FROM monthly_closings")
                for row in cursor.fetchall():
                    r_id = norm_id(row['id'])
                    pk = f"MONTHLY_CLOSING#{row['year']}#{row['month']}"
                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "year": row["year"], "month": row["month"],
                        "status": row["status"], "closed_at": row["closed_at"], "closed_by_id": norm_id(row["closed_by_id"])
                    }

                # 19. audit_logs
                cursor.execute("SELECT * FROM audit_logs")
                for row in cursor.fetchall():
                    r_id = norm_id(row['id'])
                    pk = f"AUDIT_LOG#{r_id}"
                    self.db[(pk, "METADATA")] = {
                        "PK": pk, "SK": "METADATA",
                        "id": r_id, "timestamp": row["timestamp"], "user_id": norm_id(row["user_id"]),
                        "user_ip_address": row["user_ip_address"], "event_type": row["event_type"],
                        "target_resource_type": row["target_resource_type"],
                        "target_resource_id": row["target_resource_id"], "details": row["details"], "result": row["result"]
                    }

                conn.close()
                print("Successfully loaded seed data from SQLite to Mock DynamoDB!")
            except Exception as e:
                print(f"Error seeding data from SQLite: {e}")

    async def get_table(self):
        return self

    async def scan(self, **kwargs):
        # メモリ内の全データを辞書のリストにして返す
        return {"Items": list(self.db.values())}

    async def get_item(self, pk: str, sk: str):
        return self.db.get((pk, sk))

    async def put_item(self, item: dict) -> None:
        pk = item.get("PK")
        sk = item.get("SK")
        if pk and sk:
            self.db[(pk, sk)] = item

    async def delete_item(self, pk: str, sk: str) -> None:
        self.db.pop((pk, sk), None)

    async def query_items_by_pk(self, pk: str):
        return [v for (p, s), v in self.db.items() if p == pk]

    async def query_items_by_pk_and_sk_prefix(self, pk: str, sk_prefix: str):
        return [v for (p, s), v in self.db.items() if p == pk and s.startswith(sk_prefix)]

    async def scan_items_by_type(self, pk_prefix: str, sk: str = "METADATA"):
        return [v for (p, s), v in self.db.items() if p.startswith(pk_prefix) and s == sk]

    async def query_gsi1(self, gsi1_pk: str, gsi1_sk_prefix: str):
        return [v for (p, s), v in self.db.items() if s == gsi1_pk and p.startswith(gsi1_sk_prefix)]

    async def transact_write_items(self, transact_items: list) -> None:
        for ti in transact_items:
            if "Put" in ti:
                put_data = ti["Put"]
                await self.put_item(put_data["Item"])
            elif "Delete" in ti:
                del_data = ti["Delete"]
                await self.delete_item(del_data["Key"]["PK"], del_data["Key"]["SK"])


