import sys
import os
import asyncio

# アプリケーションのパスを通す
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models import Project

engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def seed_skills():
    print("既存プロジェクトへの技術要素（スキル・言語・環境）シードデータを投入中...")
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Project))
        projects = res.scalars().all()
        
        if not projects:
            print("プロジェクトが見つかりません。")
            return
            
        # テストデータのバリエーション
        skill_templates = [
            {
                "main_languages": "Python,TypeScript",
                "skills": "FastAPI,Next.js,Docker,Pydantic",
                "environments": "AWS,Vercel"
            },
            {
                "main_languages": "Java,Go",
                "skills": "Spring Boot,Gin,gRPC,PostgreSQL",
                "environments": "GCP,Kubernetes"
            },
            {
                "main_languages": "TypeScript,HTML/CSS",
                "skills": "React,TailwindCSS,Redux Toolkit",
                "environments": "Cloudflare,Vercel"
            }
        ]
        
        for idx, project in enumerate(projects):
            template = skill_templates[idx % len(skill_templates)]
            project.main_languages = template["main_languages"]
            project.skills = template["skills"]
            project.environments = template["environments"]
            print(f"プロジェクト {project.code} ({project.name}) に登録: 言語={project.main_languages}, スキル={project.skills}, 環境={project.environments}")
            
        await db.commit()
        print("SQLiteへのシードデータ書き込みが完了しました。")

        # 同期スクリプトの処理を呼び出してDynamoDB側にも反映する
        from sync_sqlite_to_dynamodb import sync
        await sync()

if __name__ == "__main__":
    asyncio.run(seed_skills())
