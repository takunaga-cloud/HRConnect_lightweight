from fastapi import APIRouter

from app.api.endpoints import (
    analytics,
    application_templates,
    applications,
    attendances,
    audit_logs,
    auth,
    closings,
    dashboard,
    departments,
    exports,
    paid_leaves,
    projects,
    project_roles,
    shift_templates,
    shifts,
    task_categories,
    users,
    work_logs,
    work_rules,
    affiliation_groups,
    system_definitions,
)

api_router = APIRouter()
api_router.include_router(attendances.router, prefix="/attendances", tags=["attendances"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(task_categories.router, prefix="/task-categories", tags=["task-categories"])
api_router.include_router(work_logs.router, prefix="/work-logs", tags=["work-logs"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(
    application_templates.router,
    prefix="/application-templates",
    tags=["application-templates"],
)
api_router.include_router(shifts.router, prefix="/shifts", tags=["shifts"])
api_router.include_router(shift_templates.router, prefix="/shift-templates", tags=["shift-templates"])
api_router.include_router(exports.router, prefix="/exports", tags=["exports"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(work_rules.router, prefix="/work-rules", tags=["work-rules"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(closings.router, prefix="/closings", tags=["closings"])
api_router.include_router(paid_leaves.router, prefix="/paid-leaves", tags=["paid-leaves"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(
    affiliation_groups.router, prefix="/affiliation-groups", tags=["affiliation-groups"]
)
api_router.include_router(project_roles.router, prefix="/project-roles", tags=["project-roles"])
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(
    system_definitions.router, prefix="/system-definitions", tags=["system-definitions"]
)
