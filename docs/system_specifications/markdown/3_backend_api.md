# バックエンドAPIルーティング & 依存性注入 仕様詳細書

本ドキュメントは、HRConnectにおける「バックエンドAPIルーティング & 依存性注入」カテゴリに属する全ファイルの仕様・構成・詳細を網羅した資料です。

**対象ファイル数:** 23 ファイル

---

## 掲載ファイル一覧

- [`backend/app/api/api.py`](#backend-app-api-api-py) : api.py モジュール / 設定ファイル
- [`backend/app/api/deps.py`](#backend-app-api-deps-py) : deps.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/affiliation_groups.py`](#backend-app-api-endpoints-affiliation_groups-py) : affiliation_groups.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/analytics.py`](#backend-app-api-endpoints-analytics-py) : analytics.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/application_templates.py`](#backend-app-api-endpoints-application_templates-py) : application_templates.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/applications.py`](#backend-app-api-endpoints-applications-py) : applications.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/attendances.py`](#backend-app-api-endpoints-attendances-py) : attendances.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/audit_logs.py`](#backend-app-api-endpoints-audit_logs-py) : audit_logs.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/auth.py`](#backend-app-api-endpoints-auth-py) : auth.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/closings.py`](#backend-app-api-endpoints-closings-py) : closings.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/dashboard.py`](#backend-app-api-endpoints-dashboard-py) : dashboard.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/departments.py`](#backend-app-api-endpoints-departments-py) : departments.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/exports.py`](#backend-app-api-endpoints-exports-py) : exports.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/paid_leaves.py`](#backend-app-api-endpoints-paid_leaves-py) : paid_leaves.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/project_roles.py`](#backend-app-api-endpoints-project_roles-py) : project_roles.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/projects.py`](#backend-app-api-endpoints-projects-py) : projects.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/shift_templates.py`](#backend-app-api-endpoints-shift_templates-py) : shift_templates.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/shifts.py`](#backend-app-api-endpoints-shifts-py) : shifts.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/system_definitions.py`](#backend-app-api-endpoints-system_definitions-py) : system_definitions.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/task_categories.py`](#backend-app-api-endpoints-task_categories-py) : task_categories.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/users.py`](#backend-app-api-endpoints-users-py) : users.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/work_logs.py`](#backend-app-api-endpoints-work_logs-py) : work_logs.py モジュール / 設定ファイル
- [`backend/app/api/endpoints/work_rules.py`](#backend-app-api-endpoints-work_rules-py) : work_rules.py モジュール / 設定ファイル

---

## <a id="backend-app-api-api-py"></a> backend/app/api/api.py

- **ファイル概要:** api.py モジュール / 設定ファイル
- **行数:** 56 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 主な依存モジュール (Imports)
`app.api.endpoints`, `fastapi`

### コード先頭プレビュー
```text
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
```

---

## <a id="backend-app-api-deps-py"></a> backend/app/api/deps.py

- **ファイル概要:** deps.py モジュール / 設定ファイル
- **行数:** 137 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_user_model(item)`**: DynamoDBのアイテム辞書から、互換性のためにSQLAlchemyのUserモデル（非永続）を生成します。
- **`def get_current_user(token, repo)`**: 現在の認証済みユーザーを取得します。
JWTトークンを検証し、Cognitoのsub(ID)に基づいてDynamoDBからユーザーをロードします。
- **`def check_admin_role(current_user)`**: 管理者権限（role="Admin" または "admin"）を持つユーザーのみ許可します。
- **`def check_manager_role(current_user)`**: 管理者またはマネージャー権限を持つユーザーを許可します。
- **`def check_leader_role(current_user)`**: 管理者、マネージャー、またはリーダー権限を持つユーザーを許可します。

### 主な依存モジュール (Imports)
`app.core.security`, `app.db.dynamodb_repo`, `app.db.session`, `app.models`, `fastapi`, `fastapi.security`, `os`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import verify_token
from app.db.session import get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User, Department

# OAuth2PasswordBearerをインスタンス化
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def dict_to_user_model(item: dict) -> User:
```

---

## <a id="backend-app-api-endpoints-affiliation_groups-py"></a> backend/app/api/endpoints/affiliation_groups.py

- **ファイル概要:** affiliation_groups.py モジュール / 設定ファイル
- **行数:** 106 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_affiliation_group_model(item)`**: DynamoDBのアイテム辞書からSQLAlchemyのAffiliationGroupモデルを生成します。
- **`def get_affiliation_groups(repo, current_user)`**: 所属グループ一覧を取得
- **`def create_affiliation_group(group_in, repo, current_user)`**: 所属グループ作成
- **`def update_affiliation_group(group_id, group_in, repo, current_user)`**: 所属グループ更新
- **`def delete_affiliation_group(group_id, repo, current_user)`**: 所属グループ削除

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.affiliation_group`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_dynamodb_repo, check_admin_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import AffiliationGroup, User
from app.schemas.affiliation_group import (
    AffiliationGroupCreate,
    AffiliationGroupResponse,
    AffiliationGroupUpdate,
)

router = APIRouter()
```

---

## <a id="backend-app-api-endpoints-analytics-py"></a> backend/app/api/endpoints/analytics.py

- **ファイル概要:** analytics.py モジュール / 設定ファイル
- **行数:** 222 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def get_project_analytics(repo, current_user)`**: プロジェクトごとの予算と実績工数を集計して返します。
- **`def get_project_costs_analytics(repo, current_user)`**: プロジェクトごとの人件費コストを集計して返します（管理者のみ）。
- **`def get_user_skills_analytics(user_id, repo, current_user)`**: ユーザーの工数実績とプロジェクトの技術要素を掛け合わせ、
言語・スキル・環境別の「総経験時間」「経験件数」「経験年数（重複考慮）」を集計して返します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `datetime`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List, Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_dynamodb_repo, check_admin_role, get_current_user
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User
from typing import Optional

router = APIRouter()

@router.get("/projects", response_model=List[Dict[str, Any]])
async def get_project_analytics(
    repo: DynamoDBRepository = Depends(get_dynamodb_repo),
```

---

## <a id="backend-app-api-endpoints-application_templates-py"></a> backend/app/api/endpoints/application_templates.py

- **ファイル概要:** application_templates.py モジュール / 設定ファイル
- **行数:** 127 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_application_template_model(item)`**: DynamoDBのアイテム辞書からSQLAlchemyのApplicationTemplateモデルを生成します。
- **`def get_all_application_templates(repo, current_user)`**: 全ての申請テンプレートを取得します。
- **`def create_application_template(template_in, repo, current_user)`**: 新しい申請テンプレートを作成します。
- **`def get_application_template(template_id, repo, current_user)`**: 指定されたIDの申請テンプレートを取得します。
- **`def update_application_template(template_id, template_in, repo, current_user)`**: 申請テンプレートを更新します。
- **`def delete_application_template(template_id, repo, current_user)`**: 申請テンプレートを削除します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.application`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List, Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import ApplicationTemplate, User
from app.schemas.application import (
    ApplicationTemplateResponse,
    ApplicationTemplateCreate,
    ApplicationTemplateUpdate,
    ApplicationTemplateItemConfig
)

```

---

## <a id="backend-app-api-endpoints-applications-py"></a> backend/app/api/endpoints/applications.py

- **ファイル概要:** applications.py モジュール / 設定ファイル
- **行数:** 454 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def _find_application_item_full(repo, application_id)`**: 
- **`def get_all_applications(status, repo, current_user)`**: 全ての申請を取得します。（管理者・マネージャー用）
- **`def get_my_applications(repo, current_user)`**: ログインユーザー自身の申請履歴を取得します。
- **`def get_application_by_id(application_id, repo, current_user)`**: 特定の申請を取得します。
- **`def create_application(application_in, repo, current_user)`**: 新しい申請を作成します。
- **`def approve_single_application(application_id, repo, current_user)`**: 申請を承認します。承認処理には副作用が含まれます。
- **`def reject_single_application(application_id, repo, current_user)`**: 申請を却下します。
- **`def delete_application(application_id, repo, current_user)`**: 指定された申請を削除します。（管理者のみ）
- **`def update_application(application_id, application_in, repo, current_user)`**: 申請内容を更新します。（管理者のみ）

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.models.leave`, `app.schemas.application`, `app.services.auditor`, `app.services.workflow`, `datetime`, `fastapi`, `jsonschema`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List
from uuid import UUID, uuid4
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo, dict_to_user_model
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Application, User, ApplicationTemplate, PaidLeaveLedger
from app.models.leave import LeaveLedger
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationUpdate
from app.services.workflow import approve_application, reject_application, dict_to_application_model, _load_relations
from app.services.auditor import auditor

router = APIRouter(redirect_slashes=False)
```

---

## <a id="backend-app-api-endpoints-attendances-py"></a> backend/app/api/endpoints/attendances.py

- **ファイル概要:** attendances.py モジュール / 設定ファイル
- **行数:** 342 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_attendance_model(item)`**: DynamoDBの辞書データからSQLAlchemyのAttendanceモデルを生成します。
- **`def clock_in(attendance_in, current_user, repo)`**: ユーザーの出勤時刻を記録します。
- **`def clock_out(current_user, repo)`**: ユーザーの退勤時刻を記録します。
- **`def get_today_attendance(current_user, repo)`**: ユーザーの今日の打刻状況を取得します。
- **`def read_attendances(user_id, start_date, end_date, current_user, repo)`**: [管理者用] 勤怠記録一覧を取得します。
- **`def delete_attendance(attendance_id, current_user, repo)`**: [管理者用] 指定された勤怠記録を削除（取り消し）します。
- **`def get_my_monthly_records(year, month, current_user, repo)`**: ログインユーザーの指定月の月報・カレンダーデータを取得します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.attendance`, `app.schemas.work_log`, `calendar`, `datetime`, `fastapi`, `json`, `typing`, `uuid`, `zoneinfo`

### コード先頭プレビュー
```text
from datetime import date, timedelta, datetime, time
from typing import List, Optional, Dict
from zoneinfo import ZoneInfo
from uuid import UUID, uuid4
import json
import calendar

from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role, check_manager_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Attendance, User, Shift, WorkLog
from app.schemas.attendance import AttendanceCreate, AttendanceResponse, AttendanceUpdate, CalendarDailyResponse
from app.schemas.work_log import WorkLogWithDetails

router = APIRouter(redirect_slashes=False)
```

---

## <a id="backend-app-api-endpoints-audit_logs-py"></a> backend/app/api/endpoints/audit_logs.py

- **ファイル概要:** audit_logs.py モジュール / 設定ファイル
- **行数:** 79 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義クラス
- **`class AuditLogResponse`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 定義関数・エンドポイント
- **`def get_audit_logs(limit, offset, event_type, repo, current_user)`**: 監査ログを取得します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `datetime`, `fastapi`, `pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User

router = APIRouter()

class AuditLogResponse(BaseModel):
    timestamp: datetime
```

---

## <a id="backend-app-api-endpoints-auth-py"></a> backend/app/api/endpoints/auth.py

- **ファイル概要:** auth.py モジュール / 設定ファイル
- **行数:** 40 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def login_access_token(repo, form_data)`**: OAuth2 compatible token login, get an access token for future requests

### 主な依存モジュール (Imports)
`app.api.deps`, `app.core`, `app.core.config`, `app.db.dynamodb_repo`, `app.schemas.token`, `app.services.auth`, `datetime`, `fastapi`, `fastapi.security`, `typing`

### コード先頭プレビュー
```text
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.core import security
from app.core.config import settings
from app.schemas.token import Token
from app.services.auth import authenticate_user

router = APIRouter()

```

---

## <a id="backend-app-api-endpoints-closings-py"></a> backend/app/api/endpoints/closings.py

- **ファイル概要:** closings.py モジュール / 設定ファイル
- **行数:** 132 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_closing_model(item)`**: DynamoDBのアイテム辞書からSQLAlchemyのMonthlyClosingモデルを生成します。
- **`def get_closings(skip, limit, repo, current_user)`**: 月次締めの履歴を取得します。
- **`def execute_closing(closing_in, repo, current_user)`**: 指定月の締め処理を実行します。
- **`def reopen_closing(closing_in, repo, current_user)`**: 締め処理を解除します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.models.closing`, `app.schemas.closing`, `app.services.auditor`, `datetime`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models.closing import MonthlyClosing
from app.models import User
from app.schemas.closing import MonthlyClosingCreate, MonthlyClosingResponse, MonthlyClosingUpdate
from app.services.auditor import auditor

router = APIRouter()

```

---

## <a id="backend-app-api-endpoints-dashboard-py"></a> backend/app/api/endpoints/dashboard.py

- **ファイル概要:** dashboard.py モジュール / 設定ファイル
- **行数:** 325 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def _get_cognito_sub(repo, user_id)`**: 
- **`def get_daily_attendance_summary(target_date, repo, current_user)`**: 指定された日付の出勤状況サマリー（出勤済み、遅刻者、未出勤）を取得します。
- **`def get_my_dashboard_summary(repo, current_user)`**: 一般ユーザー向けのダッシュボード用サマリー情報を取得します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.dashboard`, `app.services.alert`, `datetime`, `fastapi`, `pytz`, `traceback`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date, datetime, timedelta, time
from typing import List
from uuid import UUID
import pytz

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.deps import get_current_user, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Shift, Attendance, User, WorkRule, Application, WorkLog, PaidLeaveLedger
from app.schemas.dashboard import DailyAttendanceSummary, UserBasicInfo
from app.services.alert import check_overtime_alerts

router = APIRouter()

```

---

## <a id="backend-app-api-endpoints-departments-py"></a> backend/app/api/endpoints/departments.py

- **ファイル概要:** departments.py モジュール / 設定ファイル
- **行数:** 106 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_department_model(item)`**: DynamoDBのアイテム辞書からSQLAlchemyのDepartmentモデルを生成します。
- **`def get_departments(repo, current_user)`**: 全データ取得
- **`def create_department(department_in, repo, current_user)`**: 作成
- **`def update_department(department_id, department_in, repo, current_user)`**: 更新
- **`def delete_department(department_id, repo, current_user)`**: 削除

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.department`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import check_admin_role, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Department, User
from app.schemas.department import DepartmentCreate, DepartmentResponse, DepartmentUpdate

router = APIRouter()


def dict_to_department_model(item: dict) -> Department:
    """
```

---

## <a id="backend-app-api-endpoints-exports-py"></a> backend/app/api/endpoints/exports.py

- **ファイル概要:** exports.py モジュール / 設定ファイル
- **行数:** 312 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def export_payroll(export_in, repo, current_user)`**: 給与計算用CSVを出力します（勤怠集計）。
- **`def export_work_logs(export_in, repo, current_user)`**: 工数管理用CSVを出力します。
- **`def export_applications(export_in, repo, current_user)`**: 申請データを指定された共通レイアウトでCSV出力します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.closing`, `app.services.auditor`, `csv`, `datetime`, `fastapi`, `fastapi.responses`, `io`, `uuid`

### コード先頭プレビュー
```text
import csv
import io
from datetime import datetime, date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User, Attendance, WorkLog, Project, TaskCategory, Application
from app.schemas.closing import MonthlyClosingBase
from app.services.auditor import auditor

router = APIRouter()
```

---

## <a id="backend-app-api-endpoints-paid_leaves-py"></a> backend/app/api/endpoints/paid_leaves.py

- **ファイル概要:** paid_leaves.py モジュール / 設定ファイル
- **行数:** 372 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_paid_leave_model(item)`**: 
- **`def dict_to_leave_ledger_model(item)`**: 
- **`def dict_to_leave_type_model(item)`**: 
- **`def grant_paid_leave(grant_in, repo, current_user)`**: ユーザーに有給休暇を付与します。
- **`def get_user_paid_leaves(user_id, repo, current_user)`**: 指定ユーザーの有給休暇情報を取得します。
- **`def get_leave_types(repo, current_user)`**: すべての休暇区分マスタを取得します。
- **`def grant_leave_ledger(grant_in, repo, current_user)`**: ユーザーに特定の休暇（有給、代休、特別休暇など）を付与します。
- **`def get_user_leave_ledgers_summary(user_id, repo, current_user)`**: 指定ユーザーのすべての休暇区分のサマリー（残高・履歴等）を取得します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.models.leave`, `app.schemas.leave`, `app.schemas.paid_leave`, `calendar`, `datetime`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List
from uuid import UUID, uuid4
from datetime import date, timedelta
import calendar

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import PaidLeaveLedger, User
from app.models.leave import LeaveType, LeaveLedger
from app.schemas.paid_leave import PaidLeaveGrant, PaidLeaveResponse, UserPaidLeaveSummary
from app.schemas.leave import LeaveTypeResponse, LeaveLedgerGrant, LeaveLedgerResponse, UserLeaveSummary

router = APIRouter()
```

---

## <a id="backend-app-api-endpoints-project_roles-py"></a> backend/app/api/endpoints/project_roles.py

- **ファイル概要:** project_roles.py モジュール / 設定ファイル
- **行数:** 119 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_project_role_model(item)`**: DynamoDBのアイテム辞書からSQLAlchemyのProjectRoleモデルを生成します。
- **`def get_project_roles(repo, current_user)`**: プロジェクト役割一覧を取得します。
- **`def create_project_role(role_in, repo, current_user)`**: 新規にプロジェクト役割を作成します。
- **`def update_project_role(role_id, role_in, repo, current_user)`**: プロジェクト役割を更新します。
- **`def delete_project_role(role_id, repo, current_user)`**: プロジェクト役割を削除します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.project_role`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import check_admin_role, get_dynamodb_repo, check_leader_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import ProjectRole, User
from app.schemas.project_role import ProjectRoleCreate, ProjectRoleResponse, ProjectRoleUpdate

router = APIRouter()


def dict_to_project_role_model(item: dict) -> ProjectRole:
    """
```

---

## <a id="backend-app-api-endpoints-projects-py"></a> backend/app/api/endpoints/projects.py

- **ファイル概要:** projects.py モジュール / 設定ファイル
- **行数:** 87 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def get_all_projects(assigned_only, repo, current_user)`**: 全てのアクティブなプロジェクトを取得します。
assigned_only=True の場合、現在のユーザーがメンバーまたはリーダーであるプロジェクトのみを返します。
- **`def get_all_projects_admin(repo, current_user)`**: 管理者用：全てのプロジェクトを取得します（非アクティブも含む）。
- **`def create_project(project_in, repo, current_user)`**: 新規プロジェクトを作成します。
- **`def update_project(project_id, project_in, repo, current_user)`**: プロジェクト情報を更新します。
- **`def delete_project(project_id, repo, current_user)`**: プロジェクトを削除します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.core.messages`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.project`, `app.services.project_service`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
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


```

---

## <a id="backend-app-api-endpoints-shift_templates-py"></a> backend/app/api/endpoints/shift_templates.py

- **ファイル概要:** shift_templates.py モジュール / 設定ファイル
- **行数:** 113 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_shift_template_model(item)`**: DynamoDBのアイテム辞書からSQLAlchemyのShiftTemplateモデルを生成します。
- **`def read_shift_templates(repo, current_user)`**: シフトテンプレート一覧を取得します。
- **`def create_shift_template(template_in, repo, current_user)`**: 新しいシフトテンプレートを作成します。
- **`def update_shift_template(template_id, template_in, repo, current_user)`**: シフトテンプレートを更新します。
- **`def delete_shift_template(template_id, repo, current_user)`**: シフトテンプレートを削除します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.shift_template`, `datetime`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import ShiftTemplate, User
from app.schemas.shift_template import ShiftTemplateCreate, ShiftTemplateResponse, ShiftTemplateUpdate

router = APIRouter()


def dict_to_shift_template_model(item: dict) -> ShiftTemplate:
    """
```

---

## <a id="backend-app-api-endpoints-shifts-py"></a> backend/app/api/endpoints/shifts.py

- **ファイル概要:** shifts.py モジュール / 設定ファイル
- **行数:** 562 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_shift_model(item)`**: DynamoDBのアイテム辞書からSQLAlchemyのShiftモデルを生成します。
- **`def bulk_upsert_shifts(shifts_in, current_user, repo)`**: シフトデータを一括で登録または更新します。
- **`def get_shifts(start_date, end_date, user_id, status, repo, current_user)`**: 指定された期間とユーザーのシフトデータを取得します。
- **`def update_shift(shift_id, shift_in, current_user, repo)`**: 指定されたシフトを更新します。
- **`def delete_shift(shift_id, current_user, repo)`**: 指定されたシフトを削除します。
- **`def generate_holidays(request, current_user, repo)`**: 指定された期間と条件に基づいて休日シフトを一括生成・更新します。
- **`def generate_work_shifts(request, current_user, repo)`**: 指定された期間・曜日・条件に基づいて通常シフトを一括生成・更新します。
- **`def get_my_daily_shift(target_date, current_user, repo)`**: 自身の指定日のシフトを取得します。
- **`def get_my_shifts(start_date, end_date, status, current_user, repo)`**: 自身の指定期間のシフトを取得します。
- **`def update_my_daily_shift(target_date, shift_update, current_user, repo)`**: 自身の指定日のシフトタイプを更新します。
- **`def batch_delete_shifts(request, current_user, repo)`**: 指定された期間とユーザーのシフトを一括削除します。
- **`def create_my_shift_requests(requests_in, current_user, repo)`**: 従業員が自身の希望シフトを登録・申請します（複数日一括）。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.shift`, `app.services.auditor`, `datetime`, `fastapi`, `jpholiday`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date, timedelta, time
from typing import List, Optional
from uuid import UUID, uuid4
import jpholiday

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role, check_manager_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Shift, User
from app.schemas.shift import ShiftBulkCreate, ShiftResponse, ShiftCreate, ShiftTypeUpdate
from app.schemas.shift import HolidayGenerationRequest, ShiftGenerationRequest, ShiftBatchDeleteRequest, ShiftRequestBulkCreate
from app.services.auditor import auditor

router = APIRouter()
```

---

## <a id="backend-app-api-endpoints-system_definitions-py"></a> backend/app/api/endpoints/system_definitions.py

- **ファイル概要:** system_definitions.py モジュール / 設定ファイル
- **行数:** 120 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_system_definition_model(item)`**: DynamoDBのアイテム辞書からSQLAlchemyのSystemDefinitionモデルを生成します。
- **`def get_system_definitions(category_code, repo, current_user)`**: Get all system definitions, optionally filtered by category.
- **`def create_system_definition(definition_in, repo, current_user)`**: Create a new system definition.
- **`def update_system_definition(definition_id, definition_in, repo, current_user)`**: Update a system definition.
- **`def delete_system_definition(definition_id, repo, current_user)`**: Delete a system definition.

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.models.system_definition`, `app.schemas.system_definition`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo, check_admin_role
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User
from app.models.system_definition import SystemDefinition
from app.schemas.system_definition import (
    SystemDefinitionCreate,
    SystemDefinitionResponse,
    SystemDefinitionUpdate,
)

```

---

## <a id="backend-app-api-endpoints-task_categories-py"></a> backend/app/api/endpoints/task_categories.py

- **ファイル概要:** task_categories.py モジュール / 設定ファイル
- **行数:** 91 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_task_category_model(item)`**: DynamoDBのアイテム辞書からSQLAlchemyのTaskCategoryモデルを生成します。
- **`def get_all_task_categories(repo, current_user)`**: 全てのタスクカテゴリを取得します。
- **`def create_task_category(category_in, repo, current_user)`**: 
- **`def update_task_category(category_id, category_in, repo, current_user)`**: 
- **`def delete_task_category(category_id, repo, current_user)`**: 

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.task_category`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import check_admin_role, get_current_user, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import TaskCategory, User
from app.schemas.task_category import TaskCategoryCreate, TaskCategoryResponse, TaskCategoryUpdate

router = APIRouter()


def dict_to_task_category_model(item: dict) -> TaskCategory:
    """
```

---

## <a id="backend-app-api-endpoints-users-py"></a> backend/app/api/endpoints/users.py

- **ファイル概要:** users.py モジュール / 設定ファイル
- **行数:** 169 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def mask_hourly_rate(user_obj, current_user)`**: ログインユーザーがAdminまたはManager以外である場合、時間単価(hourly_rate)を隠蔽します。
- **`def read_user_me(current_user)`**: ログイン中のユーザー情報を取得します。
- **`def read_users(skip, limit, repo, current_user)`**: 全ユーザーの一覧を取得します。
- **`def create_user(user_in, repo, current_user)`**: 新しいユーザーを作成します（管理者のみ）。
- **`def update_user(cognito_sub, user_in, repo, current_user)`**: ユーザー情報を更新します（管理者用）。
- **`def delete_user(cognito_sub, repo, current_user)`**: 指定されたユーザーを削除します（管理者のみ）。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.user`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo, dict_to_user_model
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter()


def mask_hourly_rate(user_obj: User, current_user: User) -> UserResponse:
    """
```

---

## <a id="backend-app-api-endpoints-work_logs-py"></a> backend/app/api/endpoints/work_logs.py

- **ファイル概要:** work_logs.py モジュール / 設定ファイル
- **行数:** 115 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_work_log_model(item)`**: DynamoDBのアイテム辞書からSQLAlchemyのWorkLogモデルを生成します。
- **`def bulk_create_work_logs(work_log_data, current_user, repo)`**: 指定された日付の工数データを一括で保存（更新）します。
既存のデータは削除され、新しいデータが挿入されます。
- **`def get_daily_info(selected_date, current_user, repo)`**: 指定された日付の勤怠実績と工数データを取得します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.work_log`, `datetime`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Attendance, WorkLog, User
from app.schemas.work_log import WorkLogBulkCreate, WorkLogResponse

router = APIRouter()


def dict_to_work_log_model(item: dict) -> WorkLog:
```

---

## <a id="backend-app-api-endpoints-work_rules-py"></a> backend/app/api/endpoints/work_rules.py

- **ファイル概要:** work_rules.py モジュール / 設定ファイル
- **行数:** 109 行
- **カテゴリ:** バックエンドAPIルーティング & 依存性注入

### 定義関数・エンドポイント
- **`def dict_to_work_rule_model(item)`**: DynamoDBのアイテム辞書からSQLAlchemyのWorkRuleモデルを生成します。
- **`def read_work_rules(repo, current_user)`**: 就業規則の一覧を取得します。
- **`def create_work_rule(work_rule_in, repo, current_user)`**: 新しい就業規則を作成します（管理者のみ想定）。
- **`def read_work_rule(work_rule_id, repo, current_user)`**: 指定IDの就業規則を取得します。
- **`def update_work_rule(work_rule_id, work_rule_in, repo, current_user)`**: 就業規則を更新します（管理者のみ想定）。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.work_rule`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_dynamodb_repo
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import WorkRule, User
from app.schemas.work_rule import WorkRuleCreate, WorkRuleResponse, WorkRuleUpdate

router = APIRouter()


def dict_to_work_rule_model(item: dict) -> WorkRule:
    """
```

---

