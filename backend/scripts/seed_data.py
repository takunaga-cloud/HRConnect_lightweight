
import asyncio
import random
from uuid import uuid4
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.db.session import AsyncSessionLocal
from app.models import User, Department, WorkRule, TaskCategory, Project, Attendance, WorkLog, Application, ApplicationTemplate
from app.core.security import get_password_hash

async def seed_data():
    async with AsyncSessionLocal() as db:
        print("Starting seed data...")

        # 1. Departments
        depts = [
            {"name": "開発部", "code": "DEV"},
            {"name": "営業部", "code": "SALES"},
            {"name": "人事部", "code": "HR"},
            {"name": "総務部", "code": "GA"},
        ]
        dept_objs = {}
        for d in depts:
            res = await db.execute(select(Department).filter(Department.name == d["name"]))
            existing = res.scalars().first()
            if not existing:
                new_dept = Department(name=d["name"])
                db.add(new_dept)
                await db.flush()
                dept_objs[d["code"]] = new_dept
            else:
                dept_objs[d["code"]] = existing
        print("Departments seeded.")

        # 2. Work Rules
        res = await db.execute(select(WorkRule).filter(WorkRule.name == "標準就業規則"))
        wr = res.scalars().first()
        if not wr:
            wr = WorkRule(
                name="標準就業規則",
                config={
                    "start_time": "09:00",
                    "end_time": "18:00",
                    "break_time": "01:00",
                    "basic_work_hours": 8.0,
                    "rounding_rule_minutes": 15,
                    "auto_break_deduction_minutes": 60,
                    "late_grace_period_minutes": 5
                }
            )
            db.add(wr)
            await db.flush()
        print("WorkRule seeded.")

        # 3. Users (10 users)
        users_data = [
            {"email": "admin@hr-connect.com", "name": "管理 太郎", "role": "Admin", "dept": "HR"},
            {"email": "manager@hr-connect.com", "name": "部長 次郎", "role": "Manager", "dept": "DEV"},
            {"email": "user1@hr-connect.com", "name": "開発 一郎", "role": "User", "dept": "DEV"},
            {"email": "user2@hr-connect.com", "name": "開発 二郎", "role": "User", "dept": "DEV"},
            {"email": "user3@hr-connect.com", "name": "開発 三郎", "role": "User", "dept": "DEV"},
            {"email": "user4@hr-connect.com", "name": "営業 四郎", "role": "User", "dept": "SALES"},
            {"email": "user5@hr-connect.com", "name": "営業 五郎", "role": "User", "dept": "SALES"},
            {"email": "user6@hr-connect.com", "name": "人事 六郎", "role": "User", "dept": "HR"},
            {"email": "user7@hr-connect.com", "name": "総務 七郎", "role": "User", "dept": "GA"},
            {"email": "user8@hr-connect.com", "name": "開発 八郎", "role": "User", "dept": "DEV"},
        ]

        user_objs = []
        password_map = {
            "admin@hr-connect.com": "Admin#K9x$2P!w9a",
            "manager@hr-connect.com": "Manager!4p*sZ9#wK2",
        }
        for u in users_data:
            user_password = password_map.get(u["email"], "User@7m*qR8#tN4")
            res = await db.execute(select(User).filter(User.email == u["email"]))
            existing = res.scalars().first()
            if not existing:
                new_user = User(
                    email=u["email"],
                    name=u["name"],
                    role=u["role"],
                    user_id=f"EMP{len(user_objs) + 1:03d}",
                    hashed_password=get_password_hash(user_password),
                    cognito_sub=f"mock-sub-{u['email']}",
                    status="Active",
                    department_id=dept_objs[u["dept"]].id if u["dept"] in dept_objs else None,
                    work_rule_id=wr.id
                )
                db.add(new_user)
                await db.flush()
                user_objs.append(new_user)
            else:
                existing.hashed_password = get_password_hash(user_password)
                db.add(existing)
                user_objs.append(existing)
        print("Users seeded.")

        # 4. Task Categories
        cats = ["設計", "開発", "テスト", "ミーティング", "その他"]
        cat_objs = []
        for c_name in cats:
            res = await db.execute(select(TaskCategory).filter(TaskCategory.name == c_name))
            existing = res.scalars().first()
            if not existing:
                new_c = TaskCategory(name=c_name)
                db.add(new_c)
                await db.flush()
                cat_objs.append(new_c)
            else:
                cat_objs.append(existing)
        print("TaskCategories seeded.")

        # 5. Projects (100 projects)
        # Create a mix of active/inactive, different budgets
        
        # Check current count first to avoid duplicates if re-run
        res = await db.execute(select(Project))
        existing_projects = res.scalars().all()
        current_count = len(existing_projects)
        
        target_count = 100
        needed = target_count - current_count
        
        if needed > 0:
            print(f"Creating {needed} projects...")
            for i in range(current_count + 1, target_count + 1):
                is_active = random.choice([True, True, True, False]) # 75% active
                budget = random.choice([100, 200, 500, 1000, 50]) * 60 # minutes
                
                # Mock dates
                start_month = random.randint(1, 12)
                start_date = datetime.strptime(f"2025-{start_month:02d}-01", "%Y-%m-%d").date()
                end_date = None
                if not is_active:
                     end_date = datetime.strptime(f"2025-{start_month:02d}-28", "%Y-%m-%d").date()

                new_proj = Project(
                    code=f"PROJ-{i:03d}",
                    name=f"プロジェクト {chr(65 + (i % 26))}{i}", # Project A1, B2...
                    start_date=start_date,
                    end_date=end_date,
                    is_active=is_active,
                    budget_minutes=budget
                )
                db.add(new_proj)
            await db.flush()
        print("Projects seeded.")

        # Re-fetch projects for seeding work logs
        res = await db.execute(select(Project).filter(Project.is_active == True))
        active_projects = res.scalars().all()
        if not active_projects:
            # Fallback if no active projects (unlikely)
            res = await db.execute(select(Project))
            active_projects = res.scalars().all()

        # 6. Application Templates
        templates_data = [
            {"name": "有給休暇申請", "schema": {"type": "object", "properties": {"reason": {"type": "string"}, "date": {"type": "string"}}}},
            {"name": "残業申請", "schema": {"type": "object", "properties": {"reason": {"type": "string"}, "hours": {"type": "number"}}}},
            {"name": "交通費申請", "schema": {"type": "object", "properties": {"destination": {"type": "string"}, "cost": {"type": "number"}}}},
            {"name": "StampCorrection", "schema": {"type": "object", "properties": {"correction_date": {"type": "string"}, "new_clock_in": {"type": "string"}, "new_clock_out": {"type": "string"}, "reason": {"type": "string"}}}},
        ]
        template_objs = []
        for t in templates_data:
            res = await db.execute(select(ApplicationTemplate).filter(ApplicationTemplate.name == t["name"]))
            existing = res.scalars().first()
            if not existing:
                new_tpl = ApplicationTemplate(name=t["name"], schema_definition=t["schema"])
                db.add(new_tpl)
                await db.flush()
                template_objs.append(new_tpl)
            else:
                template_objs.append(existing)
        print("ApplicationTemplates seeded.")

        # 7. Attendance & WorkLogs (Last 30 days)
        # 8. Applications
        
        from datetime import timedelta, time
        
        today = datetime.now().date()
        start_seed_date = today - timedelta(days=30)
        
        print("Seeding Attendance and WorkLogs...")
        for user in user_objs:
            # Create a few applications
            for _ in range(random.randint(2, 5)):
                tpl = random.choice(template_objs)
                app = Application(
                    user_id=user.id,
                    template_id=tpl.id,
                    type=tpl.name,
                    status=random.choice(["Pending", "Approved", "Rejected"]),
                    input_data={"reason": "Test application", "note": "Generated by seed"},
                    created_at=datetime.now() - timedelta(days=random.randint(1, 10))
                )
                db.add(app)

            # Generate daily attendance and logs
            curr = start_seed_date
            while curr <= today:
                # Skip weekends with 80% probability
                if curr.weekday() >= 5 and random.random() < 0.8:
                    curr += timedelta(days=1)
                    continue
                
                # Random absence
                if random.random() < 0.1:
                     curr += timedelta(days=1)
                     continue

                # Create Attendance
                # 9:00 +- 30 mins
                clock_in_min = random.randint(-30, 30)
                clock_in = datetime.combine(curr, time(9, 0)) + timedelta(minutes=clock_in_min)
                
                # 18:00 +- 60 mins
                clock_out_min = random.randint(-30, 120) 
                clock_out = datetime.combine(curr, time(18, 0)) + timedelta(minutes=clock_out_min)
                
                work_minutes = (clock_out - clock_in).total_seconds() / 60 - 60 # minus 1h break
                if work_minutes < 0: work_minutes = 0

                attendance = Attendance(
                    user_id=user.id,
                    work_date=curr,
                    clock_in=clock_in,
                    clock_out=clock_out,
                    status="Present",
                    total_work_minutes=work_minutes
                )
                db.add(attendance)
                await db.flush() # Need ID? No, but good for safety

                # Create WorkLogs
                # Split work_minutes into 1-3 logs
                remaining_mins = int(work_minutes)
                num_logs = random.randint(1, 3)
                
                for i in range(num_logs):
                    proj = random.choice(active_projects)
                    cat = random.choice(cat_objs)
                    
                    if i == num_logs - 1:
                        mins = remaining_mins
                    else:
                        mins = random.randint(30, remaining_mins - 30) if remaining_mins > 60 else remaining_mins
                    
                    if mins <= 0: continue
                    
                    log = WorkLog(
                        user_id=user.id,
                        log_date=curr,
                        project_id=proj.id,
                        task_category_id=cat.id,
                        minutes=mins,
                        comment=f"Worked on {proj.name}"
                    )
                    db.add(log)
                    remaining_mins -= mins
                
                curr += timedelta(days=1)
                
        print("Attendance, WorkLogs, Applications seeded.")
        
        await db.commit()
        print("Data seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
