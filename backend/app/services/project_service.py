from typing import List, Optional
from uuid import UUID, uuid4

from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Project, User
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.api.deps import dict_to_user_model

class ProjectService:
    def __init__(self, repo: DynamoDBRepository):
        self.repo = repo

    async def _get_users_by_ids(self, user_ids: List[str]) -> List[User]:
        if not user_ids:
            return []
        all_user_items = await self.repo.scan_items_by_type("USER#", "METADATA")
        matched_users = []
        for item in all_user_items:
            if item.get("id") in user_ids:
                matched_users.append(dict_to_user_model(item))
        return matched_users

    async def _get_user_by_id(self, user_id: str) -> Optional[User]:
        if not user_id:
            return None
        users = await self._get_users_by_ids([user_id])
        return users[0] if users else None

    async def _dict_to_project_model(self, item: dict) -> Project:
        from datetime import date
        start_date_val = item.get("start_date")
        if isinstance(start_date_val, str):
            start_date_obj = date.fromisoformat(start_date_val)
        else:
            start_date_obj = start_date_val or date.today()

        end_date_val = item.get("end_date")
        if isinstance(end_date_val, str):
            end_date_obj = date.fromisoformat(end_date_val)
        else:
            end_date_obj = end_date_val

        project = Project(
            id=UUID(item["id"]) if "id" in item else None,
            code=item.get("code", ""),
            name=item.get("name", ""),
            start_date=start_date_obj,
            end_date=end_date_obj,
            budget_minutes=int(item.get("budget_minutes") or 0),
            leader_id=UUID(item["leader_id"]) if item.get("leader_id") else None,
            is_active=item.get("is_active", True),
            main_languages=item.get("main_languages"),
            skills=item.get("skills"),
            environments=item.get("environments"),
            difficulty=item.get("difficulty"),
            category=item.get("category")
        )
        if item.get("leader_id"):
            project.leader = await self._get_user_by_id(item["leader_id"])
        
        member_ids = item.get("member_ids", [])
        member_roles = item.get("member_roles", {}) or {}
        
        # プロジェクト役割マスタを取得してマッピング
        roles_items = await self.repo.scan_items_by_type("PROJECT_ROLE#", "METADATA")
        roles_map = {r["id"]: r.get("name", "") for r in roles_items}

        if member_ids:
            users = await self._get_users_by_ids(member_ids)
            project.members = []
            for u in users:
                uid_str = str(u.id)
                role_id = member_roles.get(uid_str)
                if role_id:
                    u.project_role_id = UUID(role_id)
                    u.project_role_name = roles_map.get(role_id, "")
                else:
                    u.project_role_id = None
                    u.project_role_name = None
                project.members.append(u)
        else:
            project.members = []
            
        return project

    async def get_all_projects(self, current_user: User, assigned_only: bool = False) -> List[Project]:
        """
        プロジェクト一覧を取得します。
        assigned_only=Trueの場合、ユーザーがリーダーまたはメンバーのプロジェクトのみを返します。
        """
        items = await self.repo.scan_items_by_type("PROJECT#", "METADATA")
        projects = []
        for item in items:
            if not item.get("is_active", True):
                continue
                
            project_obj = await self._dict_to_project_model(item)
            
            if assigned_only:
                # 管理者(Admin/Manager)の場合はアサイン制限をスキップする
                is_admin_or_manager = current_user.role.lower() in ["admin", "manager"]
                if not is_admin_or_manager:
                    is_leader = str(project_obj.leader_id) == str(current_user.id)
                    is_member = any(str(m.id) == str(current_user.id) for m in project_obj.members)
                    if not (is_leader or is_member):
                        continue
                    
            projects.append(project_obj)
        
        # 一般ユーザーでassigned_only=Trueかつ結果が0件の場合、フォールバックとして全アクティブプロジェクトを返す
        if assigned_only and not projects and current_user.role.lower() not in ["admin", "manager"]:
            for item in items:
                if item.get("is_active", True):
                    project_obj = await self._dict_to_project_model(item)
                    projects.append(project_obj)
        return projects

    async def get_all_projects_admin(self) -> List[Project]:
        """
        管理者用：全てのプロジェクトを取得します（非アクティブも含む）。
        コード順にソートして返します。
        """
        items = await self.repo.scan_items_by_type("PROJECT#", "METADATA")
        projects = []
        for item in items:
            projects.append(await self._dict_to_project_model(item))
        projects.sort(key=lambda x: x.code)
        return projects

    async def create_project(self, project_in: ProjectCreate) -> Project:
        """
        新規プロジェクトを作成します。
        """
        project_id = str(uuid4())
        pk = f"PROJECT#{project_id}"
        
        dump_data = project_in.model_dump()
        member_assignments = dump_data.pop("member_assignments", []) or []
        
        member_ids = []
        member_roles = {}
        for assign in member_assignments:
            if assign.get("user_id"):
                uid_str = str(assign["user_id"])
                member_ids.append(uid_str)
                if assign.get("role_id"):
                    member_roles[uid_str] = str(assign["role_id"])

        # フォールバックとして従来のmember_idsも考慮
        if not member_ids and "member_ids" in dump_data:
            member_ids = [str(mid) for mid in dump_data.pop("member_ids", []) if mid]

        main_languages_str = ",".join(project_in.main_languages) if project_in.main_languages else None
        skills_str = ",".join(project_in.skills) if project_in.skills else None
        environments_str = ",".join(project_in.environments) if project_in.environments else None

        new_item = {
            "PK": pk,
            "SK": "METADATA",
            "id": project_id,
            "code": project_in.code,
            "name": project_in.name,
            "description": project_in.description if hasattr(project_in, "description") else "",
            "leader_id": str(project_in.leader_id) if project_in.leader_id else None,
            "is_active": project_in.is_active,
            "member_ids": member_ids,
            "member_roles": member_roles,
            "main_languages": main_languages_str,
            "skills": skills_str,
            "environments": environments_str,
            "difficulty": project_in.difficulty,
            "category": project_in.category
        }
        
        await self.repo.put_item(new_item)
        return await self._dict_to_project_model(new_item)

    async def update_project(self, project_id: UUID, project_in: ProjectUpdate) -> Optional[Project]:
        """
        プロジェクト情報を更新します。
        member_assignments または member_ids が指定された場合、メンバーの入れ替えおよび役割の割り当てを行います。
        """
        pk = f"PROJECT#{str(project_id)}"
        item = await self.repo.get_item(pk, "METADATA")
        
        if not item:
            return None
            
        update_data = project_in.model_dump(exclude_unset=True)
        
        if "member_assignments" in update_data:
            member_assignments = update_data.pop("member_assignments")
            if member_assignments is not None:
                member_ids = []
                member_roles = {}
                for assign in member_assignments:
                    if assign.get("user_id"):
                        uid_str = str(assign["user_id"])
                        member_ids.append(uid_str)
                        if assign.get("role_id"):
                            member_roles[uid_str] = str(assign["role_id"])
                item["member_ids"] = member_ids
                item["member_roles"] = member_roles
        elif "member_ids" in update_data:
            member_ids = update_data.pop("member_ids")
            if member_ids is not None:
                item["member_ids"] = [str(mid) for mid in member_ids]
                # 従来のmember_idsでの更新の場合は、役割のクリアや既存のものの維持を考慮するが、基本的には空にするか維持する
                # ここでは新規にアサインされた人の役割を空にし、既存で残った人の役割は維持する
                old_roles = item.get("member_roles", {}) or {}
                item["member_roles"] = {mid: old_roles.get(mid) for mid in item["member_ids"] if old_roles.get(mid)}
                
        for list_field in ["main_languages", "skills", "environments"]:
            if list_field in update_data:
                list_val = update_data.pop(list_field)
                item[list_field] = ",".join(list_val) if list_val else None

        for field, value in update_data.items():
            if field == "leader_id" and value:
                item[field] = str(value)
            else:
                item[field] = value
                
        await self.repo.put_item(item)
        return await self._dict_to_project_model(item)

    async def delete_project(self, project_id: UUID) -> bool:
        """
        プロジェクトを削除します。
        """
        pk = f"PROJECT#{str(project_id)}"
        item = await self.repo.get_item(pk, "METADATA")
        
        if not item:
            return False
            
        await self.repo.delete_item(pk, "METADATA")
        return True
