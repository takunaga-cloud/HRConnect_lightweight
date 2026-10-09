# 運用スクリプト & 結合・単体テスト 仕様詳細書

本ドキュメントは、HRConnectにおける「運用スクリプト & 結合・単体テスト」カテゴリに属する全ファイルの仕様・構成・詳細を網羅した資料です。

**対象ファイル数:** 33 ファイル

---

## 掲載ファイル一覧

- [`backend/scripts/README.md`](#backend-scripts-README-md) : Backend Scripts
- [`backend/scripts/add_stamp_correction_template.py`](#backend-scripts-add_stamp_correction_template-py) : add_stamp_correction_template.py モジュール / 設定ファイル
- [`backend/scripts/create_tables.py`](#backend-scripts-create_tables-py) : create_tables.py モジュール / 設定ファイル
- [`backend/scripts/init_db.py`](#backend-scripts-init_db-py) : init_db.py モジュール / 設定ファイル
- [`backend/scripts/init_dynamodb.py`](#backend-scripts-init_dynamodb-py) : DynamoDB非同期セッション・リソース管理 & テーブル初期化
- [`backend/scripts/inspect_db.py`](#backend-scripts-inspect_db-py) : inspect_db.py モジュール / 設定ファイル
- [`backend/scripts/seed_data.py`](#backend-scripts-seed_data-py) : seed_data.py モジュール / 設定ファイル
- [`backend/scripts/seed_paid_leaves_2025.py`](#backend-scripts-seed_paid_leaves_2025-py) : seed_paid_leaves_2025.py モジュール / 設定ファイル
- [`backend/scripts/seed_project_skills.py`](#backend-scripts-seed_project_skills-py) : seed_project_skills.py モジュール / 設定ファイル
- [`backend/scripts/seed_shift_templates.py`](#backend-scripts-seed_shift_templates-py) : seed_shift_templates.py モジュール / 設定ファイル
- [`backend/scripts/seed_shift_templates_sync.py`](#backend-scripts-seed_shift_templates_sync-py) : seed_shift_templates_sync.py モジュール / 設定ファイル
- [`backend/scripts/seed_system_definitions.py`](#backend-scripts-seed_system_definitions-py) : seed_system_definitions.py モジュール / 設定ファイル
- [`backend/scripts/verify_database_match.py`](#backend-scripts-verify_database_match-py) : verify_database_match.py モジュール / 設定ファイル
- [`backend/scripts/verify_master_ref.py`](#backend-scripts-verify_master_ref-py) : verify_master_ref.py モジュール / 設定ファイル
- [`backend/tests/conftest.py`](#backend-tests-conftest-py) : conftest.py モジュール / 設定ファイル
- [`backend/tests/test_api_integration.py`](#backend-tests-test_api_integration-py) : test_api_integration.py モジュール / 設定ファイル
- [`backend/tests/test_api_smoke.py`](#backend-tests-test_api_smoke-py) : test_api_smoke.py モジュール / 設定ファイル
- [`backend/tests/test_attendance_service.py`](#backend-tests-test_attendance_service-py) : test_attendance_service.py モジュール / 設定ファイル
- [`backend/tests/test_calculator.py`](#backend-tests-test_calculator-py) : test_calculator.py モジュール / 設定ファイル
- [`backend/tests/test_integration_shifts.py`](#backend-tests-test_integration_shifts-py) : test_integration_shifts.py モジュール / 設定ファイル
- [`backend/tests/test_parser_refactored.py`](#backend-tests-test_parser_refactored-py) : test_parser_refactored.py モジュール / 設定ファイル
- [`backend/tests/test_project_service.py`](#backend-tests-test_project_service-py) : test_project_service.py モジュール / 設定ファイル
- [`backend/tests/test_workflow_side_effects.py`](#backend-tests-test_workflow_side_effects-py) : test_workflow_side_effects.py モジュール / 設定ファイル
- [`frontend/e2e/applications.spec.ts`](#frontend-e2e-applications-spec-ts) : applications.spec.ts モジュール / 設定ファイル
- [`frontend/e2e/attendance.spec.ts`](#frontend-e2e-attendance-spec-ts) : attendance.spec.ts モジュール / 設定ファイル
- [`frontend/e2e/auth.spec.ts`](#frontend-e2e-auth-spec-ts) : auth.spec.ts モジュール / 設定ファイル
- [`frontend/e2e/db_connection.spec.ts`](#frontend-e2e-db_connection-spec-ts) : db_connection.spec.ts モジュール / 設定ファイル
- [`frontend/e2e/shifts.spec.ts`](#frontend-e2e-shifts-spec-ts) : shifts.spec.ts モジュール / 設定ファイル
- [`scripts/create_lightweight_zip.sh`](#scripts-create_lightweight_zip-sh) : !/bin/bash
- [`scripts/find_unused_files.py`](#scripts-find_unused_files-py) : find_unused_files.py モジュール / 設定ファイル
- [`scripts/generate_complete_system_specs.py`](#scripts-generate_complete_system_specs-py) : generate_complete_system_specs.py モジュール / 設定ファイル
- [`scripts/generate_docs.py`](#scripts-generate_docs-py) : generate_docs.py モジュール / 設定ファイル
- [`scripts/restart_backend.sh`](#scripts-restart_backend-sh) : !/bin/bash

---

## <a id="backend-scripts-README-md"></a> backend/scripts/README.md

- **ファイル概要:** Backend Scripts
- **行数:** 29 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### コード先頭プレビュー
```text
# Backend Scripts

このディレクトリには、開発・運用・デバッグ用のスクリプトが含まれています。

## 実行方法

これらのスクリプトは `app` モジュール（バックエンドアプリケーション）に依存しているため、実行時には `backend` ディレクトリを `PYTHONPATH` に含める必要があります。

### プロジェクトルート (`HRConnect/`) から実行する場合

```bash
# 例: seed_data.py を実行
export PYTHONPATH=$PYTHONPATH:$(pwd)/backend
python backend/scripts/seed_data.py
```
```

---

## <a id="backend-scripts-add_stamp_correction_template-py"></a> backend/scripts/add_stamp_correction_template.py

- **ファイル概要:** add_stamp_correction_template.py モジュール / 設定ファイル
- **行数:** 45 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def add_template()`**: 

### 主な依存モジュール (Imports)
`app.db.session`, `app.models`, `asyncio`, `os`, `sqlalchemy`, `sys`

### コード先頭プレビュー
```text
import asyncio
import sys
import os

# PYTHONPATHの調整
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models import ApplicationTemplate

async def add_template():
    async with AsyncSessionLocal() as db:
        print("Checking for StampCorrection template...")
        # Check both name variations
```

---

## <a id="backend-scripts-create_tables-py"></a> backend/scripts/create_tables.py

- **ファイル概要:** create_tables.py モジュール / 設定ファイル
- **行数:** 6 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 主な依存モジュール (Imports)
`app.db.session`, `asyncio`

### コード先頭プレビュー
```text
import asyncio
from app.db.session import init_db

if __name__ == "__main__":
    asyncio.run(init_db())
    print("Tables created successfully.")
```

---

## <a id="backend-scripts-init_db-py"></a> backend/scripts/init_db.py

- **ファイル概要:** init_db.py モジュール / 設定ファイル
- **行数:** 19 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def init_values()`**: 

### 主な依存モジュール (Imports)
`app.db.session`, `app.models`, `asyncio`, `os`, `sys`

### コード先頭プレビュー
```text
import asyncio
import sys
import os

# パスを追加してappモジュールをインポートできるようにする
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.session import engine, Base
from app.models import * # 全てのモデルをインポートしてmetadataに登録させる

async def init_values():
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
```

---

## <a id="backend-scripts-init_dynamodb-py"></a> backend/scripts/init_dynamodb.py

- **ファイル概要:** DynamoDB非同期セッション・リソース管理 & テーブル初期化
- **行数:** 31 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def main()`**: 

### 主な依存モジュール (Imports)
`app.core.config`, `app.db.dynamodb`, `asyncio`, `os`, `sys`

### コード先頭プレビュー
```text
import asyncio
import os
import sys

# 親ディレクトリを sys.path に追加して app をインポート可能にする
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.dynamodb import create_dynamodb_table_if_not_exists
from app.core.config import settings

async def main():
    print("=========================================")
    print("HRConnect DynamoDB Initialization Script")
    print(f"Target Table: {settings.DYNAMODB_TABLE_NAME}")
    print(f"AWS Region:   {settings.AWS_REGION}")
```

---

## <a id="backend-scripts-inspect_db-py"></a> backend/scripts/inspect_db.py

- **ファイル概要:** inspect_db.py モジュール / 設定ファイル
- **行数:** 35 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def inspect()`**: 

### 主な依存モジュール (Imports)
`app.core.config`, `app.db.dynamodb`, `app.db.session`, `app.models`, `asyncio`, `os`, `sqlalchemy`, `sys`

### コード先頭プレビュー
```text
import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models import LeaveType
from app.core.config import settings
from app.db.dynamodb import session as ddb_session

async def inspect():
    print("--- SQLite LeaveTypes ---")
    async with AsyncSessionLocal() as db:
```

---

## <a id="backend-scripts-seed_data-py"></a> backend/scripts/seed_data.py

- **ファイル概要:** seed_data.py モジュール / 設定ファイル
- **行数:** 275 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def seed_data()`**: 

### 主な依存モジュール (Imports)
`app.core.security`, `app.db.session`, `app.models`, `asyncio`, `datetime`, `random`, `sqlalchemy`, `sqlalchemy.ext.asyncio`, `sqlalchemy.orm`, `uuid`

### コード先頭プレビュー
```text

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
```

---

## <a id="backend-scripts-seed_paid_leaves_2025-py"></a> backend/scripts/seed_paid_leaves_2025.py

- **ファイル概要:** seed_paid_leaves_2025.py モジュール / 設定ファイル
- **行数:** 69 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def seed_paid_leaves()`**: 

### 主な依存モジュール (Imports)
`app.core.config`, `app.models`, `asyncio`, `datetime`, `os`, `sqlalchemy`, `sqlalchemy.ext.asyncio`, `sqlalchemy.orm`, `sys`, `uuid`

### コード先頭プレビュー
```text
import asyncio
import sys
import os
from datetime import date
from uuid import uuid4
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# PYTHONPATHの調整
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models import User, LeaveType, PaidLeaveLedger

```

---

## <a id="backend-scripts-seed_project_skills-py"></a> backend/scripts/seed_project_skills.py

- **ファイル概要:** seed_project_skills.py モジュール / 設定ファイル
- **行数:** 63 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def seed_skills()`**: 

### 主な依存モジュール (Imports)
`app.core.config`, `app.models`, `asyncio`, `os`, `sqlalchemy`, `sqlalchemy.ext.asyncio`, `sqlalchemy.orm`, `sync_sqlite_to_dynamodb`, `sys`

### コード先頭プレビュー
```text
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
```

---

## <a id="backend-scripts-seed_shift_templates-py"></a> backend/scripts/seed_shift_templates.py

- **ファイル概要:** seed_shift_templates.py モジュール / 設定ファイル
- **行数:** 44 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def seed_shift_templates()`**: 

### 主な依存モジュール (Imports)
`app.db.session`, `app.models`, `asyncio`, `datetime`, `os`, `sqlalchemy.future`, `sys`

### コード先頭プレビュー
```text
import asyncio
import sys
import os
from datetime import time

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.future import select

from app.db.session import AsyncSessionLocal
from app.models import ShiftTemplate

async def seed_shift_templates():
    async with AsyncSessionLocal() as session:
```

---

## <a id="backend-scripts-seed_shift_templates_sync-py"></a> backend/scripts/seed_shift_templates_sync.py

- **ファイル概要:** seed_shift_templates_sync.py モジュール / 設定ファイル
- **行数:** 41 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def seed()`**: 

### 主な依存モジュール (Imports)
`psycopg2`, `uuid`

### コード先頭プレビュー
```text
import psycopg2
import uuid

def seed():
    conn_str = "postgresql://postgres.shonqzbsrzoivbscaghl:koorinosyo19910328Nt-@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
    print("Connecting to Supabase using sync psycopg2...")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # テンプレートデータ
    templates_to_create = [
        {"name": "A直", "start_time": "09:00:00", "end_time": "18:00:00", "break_minutes": 60},
        {"name": "2直", "start_time": "13:00:00", "end_time": "22:00:00", "break_minutes": 60},
        {"name": "時差", "start_time": "10:00:00", "end_time": "19:00:00", "break_minutes": 60},
        {"name": "午前出張", "start_time": "09:00:00", "end_time": "18:00:00", "break_minutes": 60},
```

---

## <a id="backend-scripts-seed_system_definitions-py"></a> backend/scripts/seed_system_definitions.py

- **ファイル概要:** seed_system_definitions.py モジュール / 設定ファイル
- **行数:** 28 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def seed_data()`**: 

### 主な依存モジュール (Imports)
`app.db.session`, `app.models.system_definition`, `asyncio`, `sqlalchemy`

### コード先頭プレビュー
```text
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.system_definition import SystemDefinition

async def seed_data():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(SystemDefinition).limit(1))
        if result.scalars().first():
            print("Already seeded.")
            return

        definitions = [
            {"category_code": "PAID_LEAVE_TYPE", "code": "FullDay", "name": "全日", "order": 1},
```

---

## <a id="backend-scripts-verify_database_match-py"></a> backend/scripts/verify_database_match.py

- **ファイル概要:** verify_database_match.py モジュール / 設定ファイル
- **行数:** 218 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def normalize_value(val)`**: 比較のために値を文字列などの共通の比較可能フォーマットに正規化します。
- **`def verify_databases()`**: ローカルと本番のデータベースの全レコードを完全に突き合わせ検証します。

### 主な依存モジュール (Imports)
`app.models`, `datetime`, `os`, `sqlalchemy`, `sqlalchemy.orm`, `sys`, `uuid`

### コード先頭プレビュー
```text
import sys
from datetime import date, datetime
from uuid import UUID
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

# アプリケーションのパスを通す
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import (
    Base,
    User,
    Department,
    AffiliationGroup,
```

---

## <a id="backend-scripts-verify_master_ref-py"></a> backend/scripts/verify_master_ref.py

- **ファイル概要:** verify_master_ref.py モジュール / 設定ファイル
- **行数:** 16 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def test_system_definitions_access()`**: 

### 主な依存モジュール (Imports)
`requests`

### コード先頭プレビュー
```text

import requests

def test_system_definitions_access():
    # Use the admin email we know exists
    login_url = "http://localhost:3000/api/auth/login" # This goes through our route handler
    # Since we can't easily handle cookies and redirect in a simple script for Next.js route handlers,
    # let's try to hit the backend directly if we had a token, 
    # but the backend requires a token from Cognito or our mock.
    
    # Actually, a better way is to check the backend code logic which I already did.
    # To be really sure, I'll just check if the backend starts without errors.
    pass

if __name__ == "__main__":
```

---

## <a id="backend-tests-conftest-py"></a> backend/tests/conftest.py

- **ファイル概要:** conftest.py モジュール / 設定ファイル
- **行数:** 74 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def event_loop()`**: Create an instance of the default event loop for each test case.
- **`def test_engine()`**: 
- **`def db_session(test_engine)`**: テスト関数ごとに新しいセッションを作成し、終了後にロールバックするフィクスチャ。
- **`def client(db_session)`**: 

### 主な依存モジュール (Imports)
`app.main`, `app.models.base`, `asyncio`, `httpx`, `os`, `pytest`, `sqlalchemy.ext.asyncio`, `sqlalchemy.orm`, `sqlalchemy.pool`, `typing`

### コード先頭プレビュー
```text
import os
import pytest
import asyncio

# Pydantic設定エラー回避のためのダミー環境変数
os.environ["COGNITO_USER_POOL_ID"] = "mock_pool_id"
os.environ["COGNITO_CLIENT_ID"] = "mock_client_id"
# テスト用DB URL (Configのデフォルトを上書き)
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

```

---

## <a id="backend-tests-test_api_integration-py"></a> backend/tests/test_api_integration.py

- **ファイル概要:** test_api_integration.py モジュール / 設定ファイル
- **行数:** 156 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def setup_users(db_session)`**: 
- **`def test_admin_only_endpoint(client, db_session, setup_users)`**: 
- **`def test_invalid_token(client)`**: 
- **`def test_paid_leave_balance_validation(client, db_session, setup_users)`**: 

### 主な依存モジュール (Imports)
`app.models`, `datetime`, `os`, `pytest`, `sqlalchemy`

### コード先頭プレビュー
```text
import pytest
import os
from app.models import User, WorkRule
from sqlalchemy import select

# Mock Auth enable
os.environ["ALLOW_MOCK_AUTH"] = "true"

@pytest.fixture
async def setup_users(db_session):
    # Ensure WorkRule exists
    result = await db_session.execute(select(WorkRule).limit(1))
    work_rule = result.scalars().first()
    if not work_rule:
        work_rule = WorkRule(name="Default Rule", config={"daily_hours": 8})
```

---

## <a id="backend-tests-test_api_smoke-py"></a> backend/tests/test_api_smoke.py

- **ファイル概要:** test_api_smoke.py モジュール / 設定ファイル
- **行数:** 16 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def test_openapi_endpoint()`**: アプリケーションが正常に起動し、OpenAPI定義を返却できるか確認するスモークテスト。

### 主な依存モジュール (Imports)
`app.main`, `httpx`, `pytest`

### コード先頭プレビュー
```text
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_openapi_endpoint():
    """
    アプリケーションが正常に起動し、OpenAPI定義を返却できるか確認するスモークテスト。
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/openapi.json")
    
    # DB接続エラーなどで起動しない場合はここで落ちるか500になる
    assert response.status_code == 200
    assert "openapi" in response.json()
```

---

## <a id="backend-tests-test_attendance_service-py"></a> backend/tests/test_attendance_service.py

- **ファイル概要:** test_attendance_service.py モジュール / 設定ファイル
- **行数:** 98 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義クラス
- **`class MockTemplate`**: 詳細なし
  - メソッド: `__init__()`
- **`class MockApplication`**: 詳細なし
  - メソッド: `__init__()`
- **`class MockShift`**: 詳細なし
  - メソッド: `__init__()`
- **`class TestAttendanceService`**: 詳細なし
  - メソッド: `test_get_paid_leave_map_basic()`, `test_determine_shift_for_date_paid_leave()`, `test_determine_shift_half_day_morning()`, `test_determine_shift_normal()`

### 主な依存モジュール (Imports)
`app.schemas.application`, `app.services.attendance_service`, `datetime`, `pytest`, `unittest.mock`

### コード先頭プレビュー
```text
from datetime import date, time, datetime
import pytest
from app.services.attendance_service import AttendanceService
# We use simple Mock objects to avoid DB dependency for logic tests
from unittest.mock import MagicMock

class MockTemplate:
    def __init__(self, settings=None, schema_definition=None):
        self.settings = settings or {}
        self.schema_definition = schema_definition or []

class MockApplication:
    def __init__(self, type, input_data, template=None):
        self.type = type
        self.input_data = input_data
```

---

## <a id="backend-tests-test_calculator-py"></a> backend/tests/test_calculator.py

- **ファイル概要:** test_calculator.py モジュール / 設定ファイル
- **行数:** 81 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義クラス
- **`class TestCalculator`**: 詳細なし
  - メソッド: `test_round_time()`, `test_calculate_working_hours_basic()`, `test_calculate_working_hours_with_breaks()`, `test_calculate_overtime()`, `test_midnight_overtime()`, `test_calculate_holiday_work_days()`

### 主な依存モジュール (Imports)
`app.services.calculator`, `datetime`, `pytest`

### コード先頭プレビュー
```text
from datetime import datetime, time, date, timedelta
import pytest
from app.services.calculator import round_time, calculate_working_hours, calculate_overtime, calculate_holiday_work_days

class TestCalculator:
    def test_round_time(self):
        # 09:01 -> 09:00 (Floor, 15min unit)
        dt = datetime(2024, 1, 1, 9, 1)
        assert round_time(dt, 15, "floor") == datetime(2024, 1, 1, 9, 0)
        
        # 09:01 -> 09:15 (Ceil, 15min unit)
        assert round_time(dt, 15, "ceil") == datetime(2024, 1, 1, 9, 15)
        
        # 09:14 -> 09:15 (Round, 15min unit)
        dt2 = datetime(2024, 1, 1, 9, 14)
```

---

## <a id="backend-tests-test_integration_shifts-py"></a> backend/tests/test_integration_shifts.py

- **ファイル概要:** test_integration_shifts.py モジュール / 設定ファイル
- **行数:** 86 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def setup_users_shifts(db_session)`**: 
- **`def test_shift_lifecycle(client, setup_users_shifts)`**: 

### 主な依存モジュール (Imports)
`app.models`, `datetime`, `os`, `pytest`, `sqlalchemy`

### コード先頭プレビュー
```text
import pytest
import os
from datetime import date
from sqlalchemy import select
from app.models import WorkRule, User

os.environ["ALLOW_MOCK_AUTH"] = "true"

@pytest.fixture
async def setup_users_shifts(db_session):
    # Ensure WorkRule
    result = await db_session.execute(select(WorkRule).limit(1))
    work_rule = result.scalars().first()
    if not work_rule:
        work_rule = WorkRule(name="Default Rule", config={"daily_hours": 8})
```

---

## <a id="backend-tests-test_parser_refactored-py"></a> backend/tests/test_parser_refactored.py

- **ファイル概要:** test_parser_refactored.py モジュール / 設定ファイル
- **行数:** 51 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def test_parse_single_row_valid()`**: 
- **`def test_parse_single_row_user_not_found()`**: 
- **`def test_parse_shift_csv_valid()`**: 
- **`def test_parse_shift_csv_error()`**: 

### 主な依存モジュール (Imports)
`app.core.exceptions`, `app.core.messages`, `app.services.parser`, `datetime`, `fastapi`, `pytest`, `uuid`

### コード先頭プレビュー
```text
import pytest
from datetime import date, time
from uuid import uuid4
from fastapi import HTTPException
from app.services.parser import parse_shift_csv, _parse_single_row
from app.core.messages import ERROR_USER_ID_NOT_FOUND_IN_CSV, ERROR_CSV_PARSE_FAILED

def test_parse_single_row_valid():
    user_id = uuid4()
    user_map = {"EMP001": user_id}
    row = ["2024-01-01", "EMP001", "09:00", "18:00", "Day", "False"]
    
    shift = _parse_single_row(row, user_map)
    
    assert shift.target_date == date(2024, 1, 1)
```

---

## <a id="backend-tests-test_project_service-py"></a> backend/tests/test_project_service.py

- **ファイル概要:** test_project_service.py モジュール / 設定ファイル
- **行数:** 75 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def test_create_and_get_project(db_session)`**: 
- **`def test_update_project(db_session)`**: 
- **`def test_delete_project(db_session)`**: 

### 主な依存モジュール (Imports)
`app.models`, `app.schemas.project`, `app.services.project_service`, `datetime`, `pytest`, `pytest_asyncio`, `sqlalchemy.ext.asyncio`, `uuid`

### コード先頭プレビュー
```text
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
```

---

## <a id="backend-tests-test_workflow_side_effects-py"></a> backend/tests/test_workflow_side_effects.py

- **ファイル概要:** test_workflow_side_effects.py モジュール / 設定ファイル
- **行数:** 85 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def test_apply_paid_leave_side_effects_creates_shift()`**: 

### 主な依存モジュール (Imports)
`app.models`, `app.schemas.application`, `app.services.side_effect`, `datetime`, `pytest`, `unittest.mock`, `uuid`

### コード先頭プレビュー
```text

import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from datetime import date, timedelta

from app.models import Application, PaidLeaveLedger, Shift
from app.schemas.application import PaidLeaveInputData
from app.services.side_effect import SideEffectService

@pytest.mark.asyncio
async def test_apply_paid_leave_side_effects_creates_shift():
    # Arrange
    db = AsyncMock()
    user_id = uuid4()
```

---

## <a id="frontend-e2e-applications-spec-ts"></a> frontend/e2e/applications.spec.ts

- **ファイル概要:** applications.spec.ts モジュール / 設定ファイル
- **行数:** 67 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 主な依存モジュール (Imports)
`@playwright/test`

### コード先頭プレビュー
```text
import { test, expect } from '@playwright/test';

test.describe('Employee Leave Application Flow', () => {
    test.beforeEach(async ({ page }) => {
        // ログイン処理
        await page.goto('/login');
        await page.fill('input[id="email"]', 'user1@hr-connect.com');
        await page.fill('input[type="password"]', 'User@7m*qR8#tN4');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('Submit a paid leave application', async ({ page }) => {
        // 1. 申請ページに遷移
        await page.goto('/applications');
```

---

## <a id="frontend-e2e-attendance-spec-ts"></a> frontend/e2e/attendance.spec.ts

- **ファイル概要:** attendance.spec.ts モジュール / 設定ファイル
- **行数:** 51 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 主な依存モジュール (Imports)
`@playwright/test`

### コード先頭プレビュー
```text
import { test, expect } from '@playwright/test';

test.describe('Employee Attendance Stamping', () => {
    test.beforeEach(async ({ page, context }) => {
        // Nominatimの逆ジオコーディングAPIのモック
        await page.route('https://nominatim.openstreetmap.org/reverse*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ display_name: '東京都千代田区丸の内１丁目' })
            });
        });

        // 位置情報権限のモック付与と位置設定 (東京駅付近)
        await context.grantPermissions(['geolocation']);
```

---

## <a id="frontend-e2e-auth-spec-ts"></a> frontend/e2e/auth.spec.ts

- **ファイル概要:** auth.spec.ts モジュール / 設定ファイル
- **行数:** 21 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 主な依存モジュール (Imports)
`@playwright/test`

### コード先頭プレビュー
```text
import { test, expect } from '@playwright/test';

test('Login flow and redirect to dashboard', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/login');

    // 2. Fill login form
    // Using Mock Auth triggers (admin@example.com)
    await page.fill('input[id="email"]', 'admin@hr-connect.com');
    await page.fill('input[type="password"]', 'Admin#K9x$2P!w9a');

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Verify redirect to dashboard
```

---

## <a id="frontend-e2e-db_connection-spec-ts"></a> frontend/e2e/db_connection.spec.ts

- **ファイル概要:** db_connection.spec.ts モジュール / 設定ファイル
- **行数:** 41 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 主な依存モジュール (Imports)
`@playwright/test`

### コード先頭プレビュー
```text
import { test, expect } from '@playwright/test';

test.describe('Database Connection and Display Verification', () => {
    test.beforeEach(async ({ page }) => {
        // 1. 管理者としてログイン
        await page.goto('/login');
        await page.fill('input[id="email"]', 'admin@hr-connect.com');
        await page.fill('input[type="password"]', 'Admin#K9x$2P!w9a');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('Verify departments are correctly loaded from DB', async ({ page }) => {
        // 2. 部門（部署）管理画面へ遷移
        await page.goto('/departments');
```

---

## <a id="frontend-e2e-shifts-spec-ts"></a> frontend/e2e/shifts.spec.ts

- **ファイル概要:** shifts.spec.ts モジュール / 設定ファイル
- **行数:** 25 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 主な依存モジュール (Imports)
`@playwright/test`

### コード先頭プレビュー
```text

import { test, expect } from '@playwright/test';

test.describe('Admin Shift Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input[id="email"]', 'admin@hr-connect.com');
        await page.fill('input[type="password"]', 'Admin#K9x$2P!w9a');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('Navigate to Shift Management and verify elements', async ({ page }) => {
        // 1. Navigate to Shifts page
```

---

## <a id="scripts-create_lightweight_zip-sh"></a> scripts/create_lightweight_zip.sh

- **ファイル概要:** !/bin/bash
- **行数:** 50 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### コード先頭プレビュー
```text
#!/bin/bash
# HRConnect 純粋ローカル(SQLite)構成用 ZIP作成スクリプト

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_ZIP="$PROJECT_ROOT/HRConnect_lightweight.zip"

echo "=== 純粋ローカル構成（AWS非依存）軽量ZIPの作成を開始します ==="

# 不要な生成テキスト・不要ZIPファイルを事前に削除
rm -f "$PROJECT_ROOT"/HRConnect_*.txt "$PROJECT_ROOT"/HRConnect_*.zip

cd "$PROJECT_ROOT" || exit 1

# Python zipfile で不要パッケージ・キャッシュ・生成物を確実除外
```

---

## <a id="scripts-find_unused_files-py"></a> scripts/find_unused_files.py

- **ファイル概要:** find_unused_files.py モジュール / 設定ファイル
- **行数:** 214 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def find_ts_unused_files()`**: 
- **`def find_py_unused_files()`**: 
- **`def resolve_py_mod(current_file, mod_path, all_files)`**: 

### 主な依存モジュール (Imports)
`os`, `re`, `sys`

### コード先頭プレビュー
```text
# -*- coding: utf-8 -*-
import os
import re
import sys

def find_ts_unused_files():
    frontend_dir = "/home/takunaga/HRConnect_Next/HRConnect/frontend"
    src_dir = os.path.join(frontend_dir, "src")
    
    # 1. すべてのTS/TSXファイルを取得
    all_files = []
    for root, dirs, files in os.walk(src_dir):
        # node_modules や .next などの除外は os.walk の時点で src に絞っているので不要
        for file in files:
            if file.endswith(('.ts', '.tsx')):
```

---

## <a id="scripts-generate_complete_system_specs-py"></a> scripts/generate_complete_system_specs.py

- **ファイル概要:** generate_complete_system_specs.py モジュール / 設定ファイル
- **行数:** 655 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def scan_files()`**: 
- **`def categorize_file(rel_path)`**: 
- **`def analyze_file_content(path)`**: 
- **`def generate_docs()`**: 

### 主な依存モジュール (Imports)
`ast`, `html`, `json`, `os`, `pathlib`, `re`

### コード先頭プレビュー
```text
import os
import re
import ast
import json
import html
from pathlib import Path

BASE_DIR = Path("/home/takunaga/HRConnect_lightweight")
DOCS_DIR = BASE_DIR / "docs" / "system_specifications"
MD_DIR = DOCS_DIR / "markdown"
DOCS_DIR.mkdir(parents=True, exist_ok=True)
MD_DIR.mkdir(parents=True, exist_ok=True)

EXCLUDE_DIRS = {
    'node_modules', '.next', '.venv', 'venv', '__pycache__',
```

---

## <a id="scripts-generate_docs-py"></a> scripts/generate_docs.py

- **ファイル概要:** generate_docs.py モジュール / 設定ファイル
- **行数:** 376 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### 定義関数・エンドポイント
- **`def extract_python_metadata(code)`**: 
- **`def extract_ts_js_metadata(code)`**: 
- **`def get_python_explanation(line, line_num, ast_map)`**: 
- **`def analyze_python_ast(code)`**: 
- **`def get_ts_js_explanation(line)`**: 
- **`def infer_file_purpose(file_path)`**: 
- **`def generate_markdown_content(file_path)`**: 
- **`def main()`**: 

### 主な依存モジュール (Imports)
`ast`, `os`, `pathlib`, `re`

### コード先頭プレビュー
```text

import os
import ast
import re
from pathlib import Path

# Config
BASE_DIR = Path("/home/takunaga/HRConnect")
OUTPUT_DIR = BASE_DIR / "md_file"
EXCLUDE_DIRS = {
    "node_modules", "venv", ".venv", "__pycache__", ".git", ".next", 
    "dist", "build", "md_file", ".idea", ".vscode", "coverage", ".pytest_cache"
}
EXCLUDE_EXTENSIONS = {
    ".pyc", ".pyo", ".pyd", ".db", ".sq3", ".sqlite", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", 
```

---

## <a id="scripts-restart_backend-sh"></a> scripts/restart_backend.sh

- **ファイル概要:** !/bin/bash
- **行数:** 9 行
- **カテゴリ:** 運用スクリプト & 結合・単体テスト

### コード先頭プレビュー
```text
#!/bin/bash
# バックエンドを全インターフェース(0.0.0.0)で待機するように再起動します。
# これにより、localhost (IPv6/IPv4 の両方) からのアクセスを確実に受け取れるようになります。

echo "Restarting backend with host 0.0.0.0..."
pkill -f "uvicorn app.main:app"
cd /home/takunaga/HRConnect/backend
nohup ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > uvicorn.log 2>&1 &
echo "Backend restarted in background. Logging to backend/uvicorn.log"
```

---

