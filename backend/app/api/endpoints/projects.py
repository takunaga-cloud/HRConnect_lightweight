from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role, check_leader_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Project, User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.project_service import ProjectService
from app.core.messages import ERROR_PROJECT_NOT_FOUND

router = APIRouter()


@router.get("/", response_model=List[ProjectResponse])
async def get_all_projects(
    assigned_only: bool = False,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(get_current_user),
):
    """
    全てのアクティブなプロジェクトを取得します。
    assigned_only=True の場合、現在のユーザーがメンバーまたはリーダーであるプロジェクトのみを返します。
    """
    service = ProjectService(repo)
    return await service.get_all_projects(current_user, assigned_only)


@router.get("/admin", response_model=List[ProjectResponse])
async def get_all_projects_admin(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_leader_role),  # Allowed for Admin, Manager, Leader
):
    """
    管理者用：全てのプロジェクトを取得します（非アクティブも含む）。
    """
    service = ProjectService(repo)
    return await service.get_all_projects_admin()


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),  # Check Admin Role
):
    """
    新規プロジェクトを作成します。
    """
    service = ProjectService(repo)
    return await service.create_project(project_in)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_in: ProjectUpdate,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_leader_role),  # Allowed for Admin, Manager, Leader
):
    """
    プロジェクト情報を更新します。
    """
    service = ProjectService(repo)
    project = await service.update_project(project_id, project_in)
    
    if not project:
        raise HTTPException(status_code=404, detail=ERROR_PROJECT_NOT_FOUND)
        
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
    current_user: User = Depends(check_admin_role),  # Check Admin Role
):
    """
    プロジェクトを削除します。
    """
    service = ProjectService(repo)
    success = await service.delete_project(project_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=ERROR_PROJECT_NOT_FOUND)
