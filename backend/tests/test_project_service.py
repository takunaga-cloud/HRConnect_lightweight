import pytest
import pytest_asyncio
from uuid import uuid4
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.project_service import ProjectService
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.models import User, Department, WorkRule

@pytest.mark.asyncio
async def test_create_and_get_project(db_session: AsyncSession):
    service = ProjectService(db_session)
    
    # Create
    project_in = ProjectCreate(
        code="TEST-001",
        name="Test Project",
        description="Description",
        is_active=True,
        start_date=date(2024, 1, 1),
        end_date=date(2024, 12, 31)
    )
    project = await service.create_project(project_in)
    assert project.id is not None
    assert project.code == "TEST-001"
    assert project.name == "Test Project"

    # Get Admin (All)
    all_projects = await service.get_all_projects_admin()
    assert len(all_projects) >= 1
    found = next((p for p in all_projects if p.id == project.id), None)
    assert found is not None

@pytest.mark.asyncio
async def test_update_project(db_session: AsyncSession):
    service = ProjectService(db_session)
    
    # Create dummy project
    project_in = ProjectCreate(
        code="TEST-UPD", 
        name="Update Me", 
        is_active=True,
        start_date=date(2024, 1, 1)
    )
    project = await service.create_project(project_in)
    
    # Update
    update_in = ProjectUpdate(name="Updated Name")
    updated = await service.update_project(project.id, update_in)
    
    assert updated.name == "Updated Name"
    assert updated.code == "TEST-UPD"

@pytest.mark.asyncio
async def test_delete_project(db_session: AsyncSession):
    service = ProjectService(db_session)
    
    # Create dummy project
    project_in = ProjectCreate(
        code="TEST-DEL", 
        name="Delete Me", 
        is_active=True,
        start_date=date(2024, 1, 1)
    )
    project = await service.create_project(project_in)
    
    # Delete
    success = await service.delete_project(project.id)
    assert success is True
    
    # Verify gone
    all_projects = await service.get_all_projects_admin()
    found = next((p for p in all_projects if p.id == project.id), None)
    assert found is None
