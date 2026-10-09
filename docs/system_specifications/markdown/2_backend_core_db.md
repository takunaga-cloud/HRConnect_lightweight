# バックエンド基盤 & DBリポジトリ 仕様詳細書

本ドキュメントは、HRConnectにおける「バックエンド基盤 & DBリポジトリ」カテゴリに属する全ファイルの仕様・構成・詳細を網羅した資料です。

**対象ファイル数:** 9 ファイル

---

## 掲載ファイル一覧

- [`backend/app/core/config.py`](#backend-app-core-config-py) : 環境変数設定 (Pydantic Settings)
- [`backend/app/core/constants.py`](#backend-app-core-constants-py) : constants.py モジュール / 設定ファイル
- [`backend/app/core/exceptions.py`](#backend-app-core-exceptions-py) : exceptions.py モジュール / 設定ファイル
- [`backend/app/core/messages.py`](#backend-app-core-messages-py) : messages.py モジュール / 設定ファイル
- [`backend/app/core/security.py`](#backend-app-core-security-py) : security.py モジュール / 設定ファイル
- [`backend/app/db/dynamodb.py`](#backend-app-db-dynamodb-py) : DynamoDB非同期セッション・リソース管理 & テーブル初期化
- [`backend/app/db/dynamodb_repo.py`](#backend-app-db-dynamodb_repo-py) : DynamoDBシングルテーブル設計用リポジトリ (CRUD・Query・Scan)
- [`backend/app/db/session.py`](#backend-app-db-session-py) : session.py モジュール / 設定ファイル
- [`backend/app/main.py`](#backend-app-main-py) : FastAPIエントリーポイント & AWS Lambda (Mangum) ハンドラー

---

## <a id="backend-app-core-config-py"></a> backend/app/core/config.py

- **ファイル概要:** 環境変数設定 (Pydantic Settings)
- **行数:** 43 行
- **カテゴリ:** バックエンド基盤 & DBリポジトリ

### 定義クラス
- **`class Settings`**: 詳細なし
  - メソッド: `__init__()`

### 主な依存モジュール (Imports)
`pydantic_settings`, `warnings`

### コード先頭プレビュー
```text
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "HR-Connect API"
    API_V1_STR: str = "/api/v1"

    COGNITO_USER_POOL_ID: str = ""
    COGNITO_CLIENT_ID: str = ""
    COGNITO_REGION: str = "ap-northeast-1"

    SUPABASE_JWT_SECRET: str = ""

    DATABASE_URL: str = "sqlite+aiosqlite:///./hr_connect.db"
    
```

---

## <a id="backend-app-core-constants-py"></a> backend/app/core/constants.py

- **ファイル概要:** constants.py モジュール / 設定ファイル
- **行数:** 16 行
- **カテゴリ:** バックエンド基盤 & DBリポジトリ

### コード先頭プレビュー
```text
# HRConnect Backend Constants

# Work Rule Defaults
DEFAULT_ROUNDING_RULE_MINUTES = 15
DEFAULT_AUTO_BREAK_DEDUCTION_MINUTES = 60
DEFAULT_LATE_GRACE_PERIOD_MINUTES = 5

# System Defaults
DEFAULT_WORK_START_TIME = "09:00"
DEFAULT_WORK_END_TIME = "18:00"

# Half-day Leave Defaults
DEFAULT_HALF_DAY_MORNING_START = "09:00"
DEFAULT_HALF_DAY_MORNING_END = "12:00"
DEFAULT_HALF_DAY_AFTERNOON_START = "13:00"
```

---

## <a id="backend-app-core-exceptions-py"></a> backend/app/core/exceptions.py

- **ファイル概要:** exceptions.py モジュール / 設定ファイル
- **行数:** 34 行
- **カテゴリ:** バックエンド基盤 & DBリポジトリ

### 定義クラス
- **`class HRConnectError`**: Base exception for HRConnect
  - メソッド: `__init__()`
- **`class ResourceNotFoundError`**: Raised when a requested resource is not found
  - メソッド: `__init__()`
- **`class BusinessRuleError`**: Raised when a business rule is violated
  - メソッド: `__init__()`
- **`class UnauthorizedError`**: Raised when authentication or authorization fails
  - メソッド: `__init__()`
- **`class ForbiddenError`**: Raised when access is forbidden
  - メソッド: `__init__()`

### 主な依存モジュール (Imports)
`typing`

### コード先頭プレビュー
```text
from typing import Any, Dict, Optional

class HRConnectError(Exception):
    """Base exception for HRConnect"""
    def __init__(
        self, 
        message: str, 
        status_code: int = 400, 
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details

```

---

## <a id="backend-app-core-messages-py"></a> backend/app/core/messages.py

- **ファイル概要:** messages.py モジュール / 設定ファイル
- **行数:** 24 行
- **カテゴリ:** バックエンド基盤 & DBリポジトリ

### コード先頭プレビュー
```text
# Error Messages

# Common
ERROR_NOT_FOUND = "Resource not found"
ERROR_PERMISSION_DENIED = "Permission denied"
ERROR_INTERNAL_SERVER = "Internal server error"

# Auth
ERROR_USER_NOT_FOUND = "User not found"
ERROR_INVALID_CREDENTIALS = "Invalid credentials"
ERROR_INACTIVE_USER = "Inser is inactive"

# Projects
ERROR_PROJECT_NOT_FOUND = "Project not found"
ERROR_PROJECT_CODE_EXISTS = "Project code already exists"
```

---

## <a id="backend-app-core-security-py"></a> backend/app/core/security.py

- **ファイル概要:** security.py モジュール / 設定ファイル
- **行数:** 123 行
- **カテゴリ:** バックエンド基盤 & DBリポジトリ

### 定義関数・エンドポイント
- **`def verify_token(token)`**: CognitoのJWTトークンを検証し、ペイロードを返します。
- **`def _log_debug(msg)`**: 
- **`def verify_local_token(token)`**: ローカルのSECRET_KEYで署名されたトークンを検証します。
- **`def create_access_token(subject, expires_delta)`**: 
- **`def verify_password(plain_password, hashed_password)`**: 
- **`def get_password_hash(password)`**: 

### 主な依存モジュール (Imports)
`app.core.config`, `bcrypt`, `datetime`, `fastapi`, `jwt`, `jwt.exceptions`, `os`, `requests`, `typing`

### コード先頭プレビュー
```text
import os
from datetime import datetime, timedelta
from typing import Any, Optional, Union

import bcrypt

import jwt
import requests
from fastapi import Depends, HTTPException, status
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError

from app.core.config import settings

# 環境変数からCognitoの設定を取得
```

---

## <a id="backend-app-db-dynamodb-py"></a> backend/app/db/dynamodb.py

- **ファイル概要:** DynamoDB非同期セッション・リソース管理 & テーブル初期化
- **行数:** 152 行
- **カテゴリ:** バックエンド基盤 & DBリポジトリ

### 定義関数・エンドポイント
- **`def _get_boto3_session_kwargs()`**: 
- **`def _get_dynamodb_client_kwargs()`**: 
- **`def get_dynamodb_resource()`**: FastAPIのDependency Injection用。非同期DynamoDBリソースを取得します。
- **`def create_dynamodb_table_if_not_exists()`**: ローカル開発環境やテスト環境で、テーブルが存在しない場合に自動生成します。

### 主な依存モジュール (Imports)
`aioboto3`, `app.core.config`, `app.core.security`, `asyncio`, `decimal`, `os`, `typing`

### コード先頭プレビュー
```text
import os
import aioboto3
from typing import AsyncGenerator
from app.core.config import settings

def _get_boto3_session_kwargs():
    kwargs = {"region_name": settings.AWS_REGION}
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
    return kwargs

session = aioboto3.Session(**_get_boto3_session_kwargs())

def _get_dynamodb_client_kwargs():
```

---

## <a id="backend-app-db-dynamodb_repo-py"></a> backend/app/db/dynamodb_repo.py

- **ファイル概要:** DynamoDBシングルテーブル設計用リポジトリ (CRUD・Query・Scan)
- **行数:** 593 行
- **カテゴリ:** バックエンド基盤 & DBリポジトリ

### 定義クラス
- **`class DynamoDBRepository`**: DynamoDBのシングルテーブル設計に基づくデータ操作を提供するリポジトリクラスです。
  - メソッド: `__init__()`, `get_table()`, `get_item()`, `put_item()`, `delete_item()`, `query_items_by_pk()`, `query_items_by_pk_and_sk_prefix()`, `transact_write_items()`
- **`class MockDynamoDBRepository`**: メモリ内の辞書を使用してDynamoDB操作をシミュレートするモックリポジトリクラスです。
ALLOW_MOCK_AUTH=Trueの場合に、実際のDynamoDBを使わずに動作させるために使用します。
  - メソッド: `__init__()`, `get_table()`, `scan()`, `get_item()`, `put_item()`, `delete_item()`, `query_items_by_pk()`, `query_items_by_pk_and_sk_prefix()`

### 主な依存モジュール (Imports)
`app.core.config`, `app.core.security`, `boto3.dynamodb.conditions`, `datetime`, `decimal`, `json`, `os`, `pydantic`, `sqlite3`, `typing`, `uuid`

### コード先頭プレビュー
```text
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

```

---

## <a id="backend-app-db-session-py"></a> backend/app/db/session.py

- **ファイル概要:** session.py モジュール / 設定ファイル
- **行数:** 22 行
- **カテゴリ:** バックエンド基盤 & DBリポジトリ

### 定義関数・エンドポイント
- **`def get_dynamodb_repo(resource)`**: FastAPIのDependency Injection用。
ALLOW_MOCK_AUTH=Trueの場合は実際のDynamoDBに接続せず、MockDynamoDBRepositoryのインスタンスを返します。

### 主な依存モジュール (Imports)
`app.db.dynamodb`, `app.db.dynamodb_repo`, `fastapi`, `os`

### コード先頭プレビュー
```text
import os
from fastapi import Depends
from app.db.dynamodb import get_dynamodb_resource
from app.db.dynamodb_repo import DynamoDBRepository, MockDynamoDBRepository

# モック用リポジトリのシングルトンインスタンス
_mock_repo = None

async def get_dynamodb_repo(resource = Depends(get_dynamodb_resource)) -> DynamoDBRepository:
    """
    FastAPIのDependency Injection用。
    ALLOW_MOCK_AUTH=Trueの場合は実際のDynamoDBに接続せず、MockDynamoDBRepositoryのインスタンスを返します。
    """
    if os.getenv("ALLOW_MOCK_AUTH", "False").lower() == "true":
        global _mock_repo
```

---

## <a id="backend-app-main-py"></a> backend/app/main.py

- **ファイル概要:** FastAPIエントリーポイント & AWS Lambda (Mangum) ハンドラー
- **行数:** 91 行
- **カテゴリ:** バックエンド基盤 & DBリポジトリ

### 定義クラス
- **`class SlashingMiddleware`**: 詳細なし
  - メソッド: `dispatch()`
- **`class HTTPSSchemeMiddleware`**: 詳細なし
  - メソッド: `dispatch()`

### 定義関数・エンドポイント
- **`def hr_connect_exception_handler(request, exc)`**: 
- **`def startup_event()`**: 

### 主な依存モジュール (Imports)
`app.api.api`, `app.core.config`, `app.core.exceptions`, `app.db.dynamodb`, `fastapi`, `fastapi.middleware.cors`, `fastapi.responses`, `mangum`, `starlette.middleware.base`, `starlette.routing`

### コード先頭プレビュー
```text
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import HRConnectError

from app.api.api import api_router
from app.core.config import settings

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from starlette.routing import Match

app = FastAPI(
    title="HR-Connect API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
```

---

