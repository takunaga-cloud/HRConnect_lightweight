# バックエンド業務ロジック (Models / Schemas / Services) 仕様詳細書

本ドキュメントは、HRConnectにおける「バックエンド業務ロジック (Models / Schemas / Services)」カテゴリに属する全ファイルの仕様・構成・詳細を網羅した資料です。

**対象ファイル数:** 40 ファイル

---

## 掲載ファイル一覧

- [`backend/app/models/__init__.py`](#backend-app-models-__init__-py) : __init__.py モジュール / 設定ファイル
- [`backend/app/models/application.py`](#backend-app-models-application-py) : application.py モジュール / 設定ファイル
- [`backend/app/models/attendance.py`](#backend-app-models-attendance-py) : attendance.py モジュール / 設定ファイル
- [`backend/app/models/audit_log.py`](#backend-app-models-audit_log-py) : audit_log.py モジュール / 設定ファイル
- [`backend/app/models/base.py`](#backend-app-models-base-py) : base.py モジュール / 設定ファイル
- [`backend/app/models/closing.py`](#backend-app-models-closing-py) : closing.py モジュール / 設定ファイル
- [`backend/app/models/leave.py`](#backend-app-models-leave-py) : leave.py モジュール / 設定ファイル
- [`backend/app/models/paid_leave.py`](#backend-app-models-paid_leave-py) : paid_leave.py モジュール / 設定ファイル
- [`backend/app/models/project.py`](#backend-app-models-project-py) : project.py モジュール / 設定ファイル
- [`backend/app/models/shift.py`](#backend-app-models-shift-py) : shift.py モジュール / 設定ファイル
- [`backend/app/models/system_definition.py`](#backend-app-models-system_definition-py) : system_definition.py モジュール / 設定ファイル
- [`backend/app/models/user.py`](#backend-app-models-user-py) : user.py モジュール / 設定ファイル
- [`backend/app/schemas/affiliation_group.py`](#backend-app-schemas-affiliation_group-py) : affiliation_group.py モジュール / 設定ファイル
- [`backend/app/schemas/alert.py`](#backend-app-schemas-alert-py) : alert.py モジュール / 設定ファイル
- [`backend/app/schemas/application.py`](#backend-app-schemas-application-py) : application.py モジュール / 設定ファイル
- [`backend/app/schemas/attendance.py`](#backend-app-schemas-attendance-py) : attendance.py モジュール / 設定ファイル
- [`backend/app/schemas/closing.py`](#backend-app-schemas-closing-py) : closing.py モジュール / 設定ファイル
- [`backend/app/schemas/dashboard.py`](#backend-app-schemas-dashboard-py) : dashboard.py モジュール / 設定ファイル
- [`backend/app/schemas/department.py`](#backend-app-schemas-department-py) : department.py モジュール / 設定ファイル
- [`backend/app/schemas/leave.py`](#backend-app-schemas-leave-py) : leave.py モジュール / 設定ファイル
- [`backend/app/schemas/paid_leave.py`](#backend-app-schemas-paid_leave-py) : paid_leave.py モジュール / 設定ファイル
- [`backend/app/schemas/project.py`](#backend-app-schemas-project-py) : project.py モジュール / 設定ファイル
- [`backend/app/schemas/project_role.py`](#backend-app-schemas-project_role-py) : project_role.py モジュール / 設定ファイル
- [`backend/app/schemas/shift.py`](#backend-app-schemas-shift-py) : shift.py モジュール / 設定ファイル
- [`backend/app/schemas/shift_template.py`](#backend-app-schemas-shift_template-py) : shift_template.py モジュール / 設定ファイル
- [`backend/app/schemas/system_definition.py`](#backend-app-schemas-system_definition-py) : system_definition.py モジュール / 設定ファイル
- [`backend/app/schemas/task_category.py`](#backend-app-schemas-task_category-py) : task_category.py モジュール / 設定ファイル
- [`backend/app/schemas/token.py`](#backend-app-schemas-token-py) : token.py モジュール / 設定ファイル
- [`backend/app/schemas/user.py`](#backend-app-schemas-user-py) : user.py モジュール / 設定ファイル
- [`backend/app/schemas/work_log.py`](#backend-app-schemas-work_log-py) : work_log.py モジュール / 設定ファイル
- [`backend/app/schemas/work_rule.py`](#backend-app-schemas-work_rule-py) : work_rule.py モジュール / 設定ファイル
- [`backend/app/services/alert.py`](#backend-app-services-alert-py) : alert.py モジュール / 設定ファイル
- [`backend/app/services/attendance_service.py`](#backend-app-services-attendance_service-py) : attendance_service.py モジュール / 設定ファイル
- [`backend/app/services/auditor.py`](#backend-app-services-auditor-py) : auditor.py モジュール / 設定ファイル
- [`backend/app/services/auth.py`](#backend-app-services-auth-py) : auth.py モジュール / 設定ファイル
- [`backend/app/services/calculator.py`](#backend-app-services-calculator-py) : calculator.py モジュール / 設定ファイル
- [`backend/app/services/parser.py`](#backend-app-services-parser-py) : parser.py モジュール / 設定ファイル
- [`backend/app/services/project_service.py`](#backend-app-services-project_service-py) : project_service.py モジュール / 設定ファイル
- [`backend/app/services/side_effect.py`](#backend-app-services-side_effect-py) : side_effect.py モジュール / 設定ファイル
- [`backend/app/services/workflow.py`](#backend-app-services-workflow-py) : workflow.py モジュール / 設定ファイル

---

## <a id="backend-app-models-__init__-py"></a> backend/app/models/__init__.py

- **ファイル概要:** __init__.py モジュール / 設定ファイル
- **行数:** 39 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 主な依存モジュール (Imports)
`application`, `attendance`, `audit_log`, `base`, `closing`, `leave`, `paid_leave`, `project`, `shift`, `system_definition`, `user`

### コード先頭プレビュー
```text
from .base import Base
from .user import User, Department, AffiliationGroup, WorkRule
from .attendance import Attendance
from .shift import Shift, ShiftTemplate
from .project import Project, ProjectMember, ProjectRole, WorkLog, TaskCategory
from .application import Application, ApplicationTemplate
from .paid_leave import PaidLeaveLedger
from .leave import LeaveType, LeaveLedger
from .audit_log import AuditLog
from .closing import MonthlyClosing
from .system_definition import SystemDefinition

# Re-export all for convenience
__all__ = [
    "Base",
```

---

## <a id="backend-app-models-application-py"></a> backend/app/models/application.py

- **ファイル概要:** application.py モジュール / 設定ファイル
- **行数:** 52 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class Application`**: 各種申請（有給、残業など）を表すモデル。
申請内容(input_data)や承認状態を管理します。
  - メソッド: なし
- **`class ApplicationTemplate`**: 申請書のテンプレート定義を表すモデル。
フォームの入力項目定義(schema_definition)などを保持します。
  - メソッド: なし

### 主な依存モジュール (Imports)
`base`, `datetime`, `sqlalchemy`, `sqlalchemy.orm`, `typing`, `user`, `uuid`

### コード先頭プレビュー
```text
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, JSON, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class Application(Base):
    """
    各種申請（有給、残業など）を表すモデル。
    申請内容(input_data)や承認状態を管理します。
    """
```

---

## <a id="backend-app-models-attendance-py"></a> backend/app/models/attendance.py

- **ファイル概要:** attendance.py モジュール / 設定ファイル
- **行数:** 30 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class Attendance`**: 日次の勤怠実績（打刻情報）を表すモデル。
出退勤時刻、休憩、勤務ステータスなどを管理します。
  - メソッド: なし

### 主な依存モジュール (Imports)
`base`, `datetime`, `sqlalchemy`, `sqlalchemy.orm`, `typing`, `user`, `uuid`

### コード先頭プレビュー
```text
from datetime import date, datetime
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Date, DateTime, Float, ForeignKey, String, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class Attendance(Base):
    """
    日次の勤怠実績（打刻情報）を表すモデル。
    出退勤時刻、休憩、勤務ステータスなどを管理します。
    """
```

---

## <a id="backend-app-models-audit_log-py"></a> backend/app/models/audit_log.py

- **ファイル概要:** audit_log.py モジュール / 設定ファイル
- **行数:** 28 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class AuditLog`**: 監査ログモデル。
重要な操作（データ変更など）の履歴を記録します。
  - メソッド: なし

### 主な依存モジュール (Imports)
`base`, `datetime`, `sqlalchemy`, `sqlalchemy.orm`, `typing`, `user`, `uuid`

### コード先頭プレビュー
```text
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import DateTime, String, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class AuditLog(Base):
    """
    監査ログモデル。
    重要な操作（データ変更など）の履歴を記録します。
    """
```

---

## <a id="backend-app-models-base-py"></a> backend/app/models/base.py

- **ファイル概要:** base.py モジュール / 設定ファイル
- **行数:** 18 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class Base`**: 全てのデータベースモデルの基底クラス。

共通のUUID主キー定義と、テーブル名の自動生成機能（DeclarativeBaseの機能）を提供します。
すべてのモデルはこのクラスを継承する必要があります。
  - メソッド: なし

### 主な依存モジュール (Imports)
`sqlalchemy`, `sqlalchemy.orm`, `uuid`

### コード先頭プレビュー
```text
from uuid import UUID, uuid4
from sqlalchemy import func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    """
    全てのデータベースモデルの基底クラス。
    
    共通のUUID主キー定義と、テーブル名の自動生成機能（DeclarativeBaseの機能）を提供します。
    すべてのモデルはこのクラスを継承する必要があります。
    """

    # to generate tablename from class name
    __abstract__ = True

```

---

## <a id="backend-app-models-closing-py"></a> backend/app/models/closing.py

- **ファイル概要:** closing.py モジュール / 設定ファイル
- **行数:** 35 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class MonthlyClosing`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`app.models`, `app.models.user`, `datetime`, `sqlalchemy`, `sqlalchemy.orm`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Boolean,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base
```

---

## <a id="backend-app-models-leave-py"></a> backend/app/models/leave.py

- **ファイル概要:** leave.py モジュール / 設定ファイル
- **行数:** 44 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class LeaveType`**: 休暇区分マスタ。
管理者が任意の休暇区分（有休、代休、慶弔、夏季など）を設定できます。
  - メソッド: なし
- **`class LeaveLedger`**: 休暇管理台帳。
ユーザーごとの各種休暇の付与、消化、有効期限を管理します。
  - メソッド: なし

### 主な依存モジュール (Imports)
`base`, `datetime`, `sqlalchemy`, `sqlalchemy.orm`, `typing`, `user`, `uuid`

### コード先頭プレビュー
```text
from datetime import date
from typing import TYPE_CHECKING, List
from uuid import UUID
from sqlalchemy import String, Boolean, Float, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class LeaveType(Base):
    """
    休暇区分マスタ。
    管理者が任意の休暇区分（有休、代休、慶弔、夏季など）を設定できます。
    """
```

---

## <a id="backend-app-models-paid_leave-py"></a> backend/app/models/paid_leave.py

- **ファイル概要:** paid_leave.py モジュール / 設定ファイル
- **行数:** 25 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class PaidLeaveLedger`**: 有給休暇管理台帳モデル。
ユーザーごとの付与日、期限、付与日数、消化日数を管理します。
  - メソッド: なし

### 主な依存モジュール (Imports)
`base`, `datetime`, `sqlalchemy`, `sqlalchemy.orm`, `typing`, `user`, `uuid`

### コード先頭プレビュー
```text
from datetime import date
from typing import TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Date, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class PaidLeaveLedger(Base):
    """
    有給休暇管理台帳モデル。
    ユーザーごとの付与日、期限、付与日数、消化日数を管理します。
    """
```

---

## <a id="backend-app-models-project-py"></a> backend/app/models/project.py

- **ファイル概要:** project.py モジュール / 設定ファイル
- **行数:** 94 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class WorkLog`**: 工数（作業実績）ログを表すモデル。
どのプロジェクト・タスクカテゴリに何分時間を使ったかを記録します。
  - メソッド: なし
- **`class Project`**: プロジェクト情報を表すモデル。
  - メソッド: なし
- **`class ProjectRole`**: プロジェクト内での役割（PM、リーダー、開発者、テスターなど）を表すモデル。
  - メソッド: なし
- **`class ProjectMember`**: プロジェクトとユーザーの多対多の関連を表す中間テーブルモデル。
  - メソッド: なし
- **`class TaskCategory`**: 作業タスクのカテゴリ（例：設計、開発、会議など）を表すモデル。
  - メソッド: なし

### 主な依存モジュール (Imports)
`base`, `datetime`, `sqlalchemy`, `sqlalchemy.orm`, `typing`, `user`, `uuid`

### コード先頭プレビュー
```text
from datetime import date
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, Date, Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class WorkLog(Base):
    """
    工数（作業実績）ログを表すモデル。
    どのプロジェクト・タスクカテゴリに何分時間を使ったかを記録します。
    """
```

---

## <a id="backend-app-models-shift-py"></a> backend/app/models/shift.py

- **ファイル概要:** shift.py モジュール / 設定ファイル
- **行数:** 41 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class Shift`**: 日次のシフト予定を表すモデル。
予定勤務時間やシフトタイプなどを管理します。
  - メソッド: なし
- **`class ShiftTemplate`**: シフトパターンのテンプレート定義を表すモデル。
よく使うシフトパターン（早番、遅番など）を登録します。
  - メソッド: なし

### 主な依存モジュール (Imports)
`base`, `datetime`, `sqlalchemy`, `sqlalchemy.orm`, `typing`, `user`, `uuid`

### コード先頭プレビュー
```text
from datetime import date, time
from typing import Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Date, Time, Boolean, String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .user import User

class Shift(Base):
    """
    日次のシフト予定を表すモデル。
    予定勤務時間やシフトタイプなどを管理します。
    """
```

---

## <a id="backend-app-models-system_definition-py"></a> backend/app/models/system_definition.py

- **ファイル概要:** system_definition.py モジュール / 設定ファイル
- **行数:** 12 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class SystemDefinition`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`app.models`, `sqlalchemy`, `sqlalchemy.orm`

### コード先頭プレビュー
```text
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.models import Base

class SystemDefinition(Base):
    __tablename__ = "system_definitions"

    category_code: Mapped[str] = mapped_column(String, nullable=False, index=True)
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
```

---

## <a id="backend-app-models-user-py"></a> backend/app/models/user.py

- **ファイル概要:** user.py モジュール / 設定ファイル
- **行数:** 89 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class AffiliationGroup`**: 所属グループ（例：カンパニー、支社など）を表すモデル。
  - メソッド: なし
- **`class Department`**: 部署を表すモデル。
所属グループに紐づきます。
  - メソッド: なし
- **`class WorkRule`**: 就業規則設定を表すモデル。
始業・終業時刻、休憩時間などの勤務ルールを定義します。
  - メソッド: なし
- **`class User`**: ユーザー情報を表すモデル。
社員、管理者などの役割や認証情報（Cognito連携）を保持します。
  - メソッド: なし

### 主な依存モジュール (Imports)
`application`, `attendance`, `base`, `leave`, `paid_leave`, `project`, `shift`, `sqlalchemy`, `sqlalchemy.orm`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List, Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import String, ForeignKey, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .shift import Shift
    from .attendance import Attendance
    from .project import Project, WorkLog
    from .application import Application
    from .paid_leave import PaidLeaveLedger
    from .leave import LeaveLedger

class AffiliationGroup(Base):
```

---

## <a id="backend-app-schemas-affiliation_group-py"></a> backend/app/schemas/affiliation_group.py

- **ファイル概要:** affiliation_group.py モジュール / 設定ファイル
- **行数:** 21 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class AffiliationGroupBase`**: 詳細なし
  - メソッド: なし
- **`class AffiliationGroupCreate`**: 詳細なし
  - メソッド: なし
- **`class AffiliationGroupUpdate`**: 詳細なし
  - メソッド: なし
- **`class AffiliationGroupResponse`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`pydantic`, `uuid`

### コード先頭プレビュー
```text
from uuid import UUID
from pydantic import BaseModel


class AffiliationGroupBase(BaseModel):
    name: str


class AffiliationGroupCreate(AffiliationGroupBase):
    pass


class AffiliationGroupUpdate(AffiliationGroupBase):
    pass

```

---

## <a id="backend-app-schemas-alert-py"></a> backend/app/schemas/alert.py

- **ファイル概要:** alert.py モジュール / 設定ファイル
- **行数:** 23 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class AlertLevel`**: 詳細なし
  - メソッド: なし
- **`class AlertType`**: 詳細なし
  - メソッド: なし
- **`class Alert`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`enum`, `pydantic`, `typing`

### コード先頭プレビュー
```text
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class AlertLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertType(str, Enum):
    OVERTIME_36 = "overtime_36"
    OVERTIME_SPECIAL = "overtime_special"
```

---

## <a id="backend-app-schemas-application-py"></a> backend/app/schemas/application.py

- **ファイル概要:** application.py モジュール / 設定ファイル
- **行数:** 143 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class ApplicationBase`**: 詳細なし
  - メソッド: なし
- **`class ApplicationCreate`**: 詳細なし
  - メソッド: なし
- **`class ApplicationUpdate`**: 詳細なし
  - メソッド: なし
- **`class ApplicationResponse`**: 詳細なし
  - メソッド: なし
- **`class PaidLeaveInputData`**: 詳細なし
  - メソッド: なし
- **`class StampCorrectionInputData`**: 詳細なし
  - メソッド: `parse_datetime_flexible()`, `parse_date_flexible()`
- **`class ApplicationTemplateItemConfig`**: 詳細なし
  - メソッド: なし
- **`class ApplicationTemplateSettings`**: 詳細なし
  - メソッド: なし
- **`class ApplicationTemplateBase`**: 詳細なし
  - メソッド: `parse_schema_definition()`
- **`class ApplicationTemplateCreate`**: 詳細なし
  - メソッド: なし
- **`class ApplicationTemplateUpdate`**: 詳細なし
  - メソッド: なし
- **`class ApplicationTemplateResponse`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`app.schemas.user`, `datetime`, `dateutil.parser`, `pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date, datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ApplicationBase(BaseModel):
    template_id: UUID
    type: str
    input_data: dict # JSONBフィールドのPydantic表現


class ApplicationCreate(ApplicationBase):
    pass
```

---

## <a id="backend-app-schemas-attendance-py"></a> backend/app/schemas/attendance.py

- **ファイル概要:** attendance.py モジュール / 設定ファイル
- **行数:** 59 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class GPSData`**: 詳細なし
  - メソッド: なし
- **`class AttendanceMetaData`**: 詳細なし
  - メソッド: なし
- **`class AttendanceCreate`**: 詳細なし
  - メソッド: なし
- **`class AttendanceUpdate`**: 詳細なし
  - メソッド: なし
- **`class AttendanceResponse`**: 詳細なし
  - メソッド: なし
- **`class CalendarDailyResponse`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`app.schemas.work_log`, `datetime`, `pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class GPSData(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None

from app.schemas.work_log import WorkLogWithDetails


```

---

## <a id="backend-app-schemas-closing-py"></a> backend/app/schemas/closing.py

- **ファイル概要:** closing.py モジュール / 設定ファイル
- **行数:** 24 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class MonthlyClosingBase`**: 詳細なし
  - メソッド: なし
- **`class MonthlyClosingCreate`**: 詳細なし
  - メソッド: なし
- **`class MonthlyClosingUpdate`**: 詳細なし
  - メソッド: なし
- **`class MonthlyClosingResponse`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`datetime`, `pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel

class MonthlyClosingBase(BaseModel):
    year: int
    month: int

class MonthlyClosingCreate(MonthlyClosingBase):
    pass

class MonthlyClosingUpdate(BaseModel):
    status: str
```

---

## <a id="backend-app-schemas-dashboard-py"></a> backend/app/schemas/dashboard.py

- **ファイル概要:** dashboard.py モジュール / 設定ファイル
- **行数:** 23 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class UserBasicInfo`**: 詳細なし
  - メソッド: なし
- **`class DailyAttendanceSummary`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel


class UserBasicInfo(BaseModel):
    id: UUID
    name: str
    email: Optional[str] = None

class DailyAttendanceSummary(BaseModel):
    total_users: int
    present_users: int
    late_users: int
    absent_users: int
```

---

## <a id="backend-app-schemas-department-py"></a> backend/app/schemas/department.py

- **ファイル概要:** department.py モジュール / 設定ファイル
- **行数:** 25 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class DepartmentBase`**: 詳細なし
  - メソッド: なし
- **`class DepartmentCreate`**: 詳細なし
  - メソッド: なし
- **`class DepartmentUpdate`**: 詳細なし
  - メソッド: なし
- **`class DepartmentResponse`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`app.schemas.affiliation_group`, `pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from app.schemas.affiliation_group import AffiliationGroupResponse

class DepartmentBase(BaseModel):
    name: str


class DepartmentCreate(DepartmentBase):
    affiliation_group_id: Optional[UUID] = None


class DepartmentUpdate(DepartmentBase):
```

---

## <a id="backend-app-schemas-leave-py"></a> backend/app/schemas/leave.py

- **ファイル概要:** leave.py モジュール / 設定ファイル
- **行数:** 50 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class LeaveTypeResponse`**: 詳細なし
  - メソッド: なし
- **`class LeaveLedgerGrant`**: 詳細なし
  - メソッド: なし
- **`class LeaveLedgerResponse`**: 詳細なし
  - メソッド: なし
- **`class LeaveHistoryItem`**: 詳細なし
  - メソッド: なし
- **`class LeaveLedgerSummary`**: 詳細なし
  - メソッド: なし
- **`class UserLeaveSummary`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`datetime`, `pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel

class LeaveTypeResponse(BaseModel):
    id: UUID
    name: str
    is_paid: bool
    is_system: bool

    class Config:
        from_attributes = True

class LeaveLedgerGrant(BaseModel):
```

---

## <a id="backend-app-schemas-paid_leave-py"></a> backend/app/schemas/paid_leave.py

- **ファイル概要:** paid_leave.py モジュール / 設定ファイル
- **行数:** 40 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class PaidLeaveGrant`**: 詳細なし
  - メソッド: なし
- **`class PaidLeaveResponse`**: 詳細なし
  - メソッド: なし
- **`class PaidLeaveHistoryItem`**: 詳細なし
  - メソッド: なし
- **`class UserPaidLeaveSummary`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`datetime`, `pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PaidLeaveGrant(BaseModel):
    user_id: UUID
    grant_date: date
    days_granted: float
    # expire_date: Optional[date] = None # Optional, if logic handles default (2 years usually)


class PaidLeaveResponse(BaseModel):
```

---

## <a id="backend-app-schemas-project-py"></a> backend/app/schemas/project.py

- **ファイル概要:** project.py モジュール / 設定ファイル
- **行数:** 95 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class ProjectBase`**: 詳細なし
  - メソッド: なし
- **`class ProjectMemberAssignment`**: プロジェクトメンバーのアサイン情報（ユーザーIDと役割IDのペア）。
  - メソッド: なし
- **`class ProjectCreate`**: 詳細なし
  - メソッド: なし
- **`class ProjectUpdate`**: 詳細なし
  - メソッド: なし
- **`class ProjectLeaderResponse`**: 詳細なし
  - メソッド: なし
- **`class ProjectMemberUserResponse`**: 役割情報を含んだプロジェクトメンバーのレスポンススキーマ。
  - メソッド: なし
- **`class ProjectSimpleResponse`**: 詳細なし
  - メソッド: なし
- **`class ProjectResponse`**: 詳細なし
  - メソッド: `convert_comma_string_to_list()`
- **`class Config`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`datetime`, `pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class ProjectBase(BaseModel):
    code: str
    name: str
    start_date: date
    end_date: Optional[date] = None
    is_active: bool = True
    budget_minutes: int = 0
    leader_id: Optional[UUID] = None
```

---

## <a id="backend-app-schemas-project_role-py"></a> backend/app/schemas/project_role.py

- **ファイル概要:** project_role.py モジュール / 設定ファイル
- **行数:** 36 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class ProjectRoleBase`**: プロジェクト役割の基本スキーマ。
  - メソッド: なし
- **`class ProjectRoleCreate`**: プロジェクト役割作成時のスキーマ。
  - メソッド: なし
- **`class ProjectRoleUpdate`**: プロジェクト役割更新時のスキーマ。
  - メソッド: なし
- **`class ProjectRoleResponse`**: プロジェクト役割レスポンス時のスキーマ。
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class ProjectRoleBase(BaseModel):
    """
    プロジェクト役割の基本スキーマ。
    """
    name: str
    description: Optional[str] = None


class ProjectRoleCreate(ProjectRoleBase):
    """
```

---

## <a id="backend-app-schemas-shift-py"></a> backend/app/schemas/shift.py

- **ファイル概要:** shift.py モジュール / 設定ファイル
- **行数:** 85 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class ShiftBase`**: 詳細なし
  - メソッド: なし
- **`class ShiftCreate`**: 詳細なし
  - メソッド: なし
- **`class ShiftUpdate`**: 詳細なし
  - メソッド: なし
- **`class ShiftTypeUpdate`**: 詳細なし
  - メソッド: なし
- **`class ShiftResponse`**: 詳細なし
  - メソッド: なし
- **`class ShiftBulkCreate`**: 詳細なし
  - メソッド: なし
- **`class ShiftBulkUpdate`**: 詳細なし
  - メソッド: なし
- **`class HolidayGenerationRequest`**: 詳細なし
  - メソッド: なし
- **`class ShiftGenerationRequest`**: 詳細なし
  - メソッド: なし
- **`class ShiftBatchDeleteRequest`**: 詳細なし
  - メソッド: なし
- **`class ShiftRequestCreate`**: 詳細なし
  - メソッド: なし
- **`class ShiftRequestBulkCreate`**: 詳細なし
  - メソッド: なし
- **`class ShiftBulkApproveRequest`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`datetime`, `pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date, time
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class ShiftBase(BaseModel):
    user_id: UUID
    target_date: date
    start_time: time
    end_time: time
    is_holiday: bool = False
    shift_type: Optional[str] = None
    remarks: Optional[str] = None
```

---

## <a id="backend-app-schemas-shift_template-py"></a> backend/app/schemas/shift_template.py

- **ファイル概要:** shift_template.py モジュール / 設定ファイル
- **行数:** 26 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class ShiftTemplateBase`**: 詳細なし
  - メソッド: なし
- **`class ShiftTemplateCreate`**: 詳細なし
  - メソッド: なし
- **`class ShiftTemplateUpdate`**: 詳細なし
  - メソッド: なし
- **`class ShiftTemplateResponse`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`datetime`, `pydantic`, `uuid`

### コード先頭プレビュー
```text

from datetime import time
from uuid import UUID

from pydantic import BaseModel

class ShiftTemplateBase(BaseModel):
    name: str
    start_time: time
    end_time: time
    break_minutes: int = 60

class ShiftTemplateCreate(ShiftTemplateBase):
    pass

```

---

## <a id="backend-app-schemas-system_definition-py"></a> backend/app/schemas/system_definition.py

- **ファイル概要:** system_definition.py モジュール / 設定ファイル
- **行数:** 26 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class SystemDefinitionBase`**: 詳細なし
  - メソッド: なし
- **`class SystemDefinitionCreate`**: 詳細なし
  - メソッド: なし
- **`class SystemDefinitionUpdate`**: 詳細なし
  - メソッド: なし
- **`class SystemDefinitionResponse`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

class SystemDefinitionBase(BaseModel):
    category_code: str
    code: str
    name: str
    order: int = 0
    description: Optional[str] = None

class SystemDefinitionCreate(SystemDefinitionBase):
    pass

class SystemDefinitionUpdate(BaseModel):
```

---

## <a id="backend-app-schemas-task_category-py"></a> backend/app/schemas/task_category.py

- **ファイル概要:** task_category.py モジュール / 設定ファイル
- **行数:** 23 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class TaskCategoryBase`**: 詳細なし
  - メソッド: なし
- **`class TaskCategoryCreate`**: 詳細なし
  - メソッド: なし
- **`class TaskCategoryUpdate`**: 詳細なし
  - メソッド: なし
- **`class TaskCategoryResponse`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class TaskCategoryBase(BaseModel):
    name: str


class TaskCategoryCreate(TaskCategoryBase):
    pass


class TaskCategoryUpdate(TaskCategoryBase):
```

---

## <a id="backend-app-schemas-token-py"></a> backend/app/schemas/token.py

- **ファイル概要:** token.py モジュール / 設定ファイル
- **行数:** 12 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class Token`**: 詳細なし
  - メソッド: なし
- **`class TokenPayload`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`pydantic`, `typing`

### コード先頭プレビュー
```text
from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
```

---

## <a id="backend-app-schemas-user-py"></a> backend/app/schemas/user.py

- **ファイル概要:** user.py モジュール / 設定ファイル
- **行数:** 43 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class UserBase`**: 詳細なし
  - メソッド: なし
- **`class UserCreate`**: 詳細なし
  - メソッド: なし
- **`class UserUpdate`**: 詳細なし
  - メソッド: なし
- **`class UserResponse`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`app.schemas.department`, `pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


from app.schemas.department import DepartmentResponse

class UserBase(BaseModel):
    name: str
    email: str
    status: str
    role: str

class UserCreate(UserBase):
```

---

## <a id="backend-app-schemas-work_log-py"></a> backend/app/schemas/work_log.py

- **ファイル概要:** work_log.py モジュール / 設定ファイル
- **行数:** 40 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class WorkLogBase`**: 詳細なし
  - メソッド: なし
- **`class WorkLogCreate`**: 詳細なし
  - メソッド: なし
- **`class WorkLogResponse`**: 詳細なし
  - メソッド: なし
- **`class WorkLogWithDetails`**: 詳細なし
  - メソッド: なし
- **`class WorkLogBulkCreate`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`datetime`, `project`, `pydantic`, `task_category`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

from .project import ProjectBase, ProjectSimpleResponse
from .task_category import TaskCategoryBase, TaskCategoryResponse


class WorkLogBase(BaseModel):
    log_date: date
    project_id: UUID
    task_category_id: UUID
    minutes: int
```

---

## <a id="backend-app-schemas-work_rule-py"></a> backend/app/schemas/work_rule.py

- **ファイル概要:** work_rule.py モジュール / 設定ファイル
- **行数:** 32 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class WorkRuleConfig`**: 詳細なし
  - メソッド: なし
- **`class WorkRuleBase`**: 詳細なし
  - メソッド: なし
- **`class WorkRuleCreate`**: 詳細なし
  - メソッド: なし
- **`class WorkRuleUpdate`**: 詳細なし
  - メソッド: なし
- **`class WorkRuleResponse`**: 詳細なし
  - メソッド: なし
- **`class Config`**: 詳細なし
  - メソッド: なし

### 主な依存モジュール (Imports)
`pydantic`, `typing`, `uuid`

### コード先頭プレビュー
```text
from typing import List, Optional, Any, Dict
from uuid import UUID

from pydantic import BaseModel, Field


class WorkRuleConfig(BaseModel):
    rounding_rule_minutes: int = Field(1, description="打刻の丸め単位（分）")
    auto_break_deduction_minutes: int = Field(0, description="自動休憩控除時間（分）")
    late_grace_period_minutes: int = Field(0, description="遅刻許容時間（分）")
    overtime_thresholds: List[Dict[str, Any]] = Field(default_factory=list, description="36協定の残業閾値リスト")


class WorkRuleBase(BaseModel):
    name: str
```

---

## <a id="backend-app-services-alert-py"></a> backend/app/services/alert.py

- **ファイル概要:** alert.py モジュール / 設定ファイル
- **行数:** 143 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class MockShift`**: 詳細なし
  - メソッド: `__init__()`

### 定義関数・エンドポイント
- **`def check_overtime_alerts(repo, user_id, year_month)`**: 指定された月の残業時間をチェックし、36協定に基づくアラートを返します。

### 主な依存モジュール (Imports)
`app.db.dynamodb_repo`, `app.schemas.alert`, `app.services.calculator`, `datetime`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date, datetime, timedelta
from typing import List
from uuid import UUID

from app.db.dynamodb_repo import DynamoDBRepository
from app.schemas.alert import Alert, AlertLevel, AlertType
from app.services.calculator import calculate_overtime

async def check_overtime_alerts(
    repo: DynamoDBRepository, user_id: UUID, year_month: str
) -> List[Alert]:
    """
    指定された月の残業時間をチェックし、36協定に基づくアラートを返します。
    """
    alerts = []
```

---

## <a id="backend-app-services-attendance_service-py"></a> backend/app/services/attendance_service.py

- **ファイル概要:** attendance_service.py モジュール / 設定ファイル
- **行数:** 113 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class AttendanceService`**: 勤怠・シフト関連のドメインロジックを提供するサービス。
  - メソッド: `_should_reflect_attendance()`, `_extract_dates_from_application()`, `get_paid_leave_map()`, `determine_shift_for_date()`

### 主な依存モジュール (Imports)
`app.models`, `app.schemas.application`, `app.schemas.attendance`, `app.schemas.work_log`, `datetime`, `typing`, `uuid`, `zoneinfo`

### コード先頭プレビュー
```text
from datetime import date, datetime, time, timedelta
from typing import List, Dict, Optional, Any
from zoneinfo import ZoneInfo
from uuid import UUID

from app.models import Attendance, Shift, Application
from app.schemas.application import PaidLeaveInputData
from app.schemas.attendance import AttendanceResponse, CalendarDailyResponse
from app.schemas.work_log import WorkLogWithDetails

class AttendanceService:
    """
    勤怠・シフト関連のドメインロジックを提供するサービス。
    """
    
```

---

## <a id="backend-app-services-auditor-py"></a> backend/app/services/auditor.py

- **ファイル概要:** auditor.py モジュール / 設定ファイル
- **行数:** 96 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class Auditor`**: 監査ログを記録するクラス。
DBへの保存とログ出力を両方行います。
  - メソッド: `record_audit_log()`

### 主な依存モジュール (Imports)
`app.db.dynamodb_repo`, `app.models`, `datetime`, `json`, `logging`, `sqlalchemy.ext.asyncio`, `typing`, `uuid`

### コード先頭プレビュー
```text
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional, Union
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import AuditLog

# ロガーの設定 (CloudWatch Logs等に出力するため標準出力へ)
logger = logging.getLogger("auditor")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(message)s'))
```

---

## <a id="backend-app-services-auth-py"></a> backend/app/services/auth.py

- **ファイル概要:** auth.py モジュール / 設定ファイル
- **行数:** 35 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義関数・エンドポイント
- **`def authenticate_user(repo, identifier, password)`**: DynamoDBからユーザーをメールアドレスまたは社員番号(user_id)で取得し、認証します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.core`, `app.db.dynamodb_repo`, `app.models`, `typing`

### コード先頭プレビュー
```text
from typing import Optional
from app.core import security
from app.db.dynamodb_repo import DynamoDBRepository
from app.models import User
from app.api.deps import dict_to_user_model

async def authenticate_user(
    repo: DynamoDBRepository, identifier: str, password: str
) -> Optional[User]:
    """
    DynamoDBからユーザーをメールアドレスまたは社員番号(user_id)で取得し、認証します。
    """
    # 簡易的にScanを使用して検索（開発・小規模環境のため）
    items = await repo.scan_items_by_type("USER#", "METADATA")
    
```

---

## <a id="backend-app-services-calculator-py"></a> backend/app/services/calculator.py

- **ファイル概要:** calculator.py モジュール / 設定ファイル
- **行数:** 177 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義関数・エンドポイント
- **`def round_time(dt, rounding_minutes, method)`**: 指定された分単位で時刻を丸めます。
method: "floor" (切り捨て), "ceil" (切り上げ), "round" (四捨五入)
デフォルトは1分単位（丸めなし）。
- **`def calculate_working_hours(clock_in, clock_out, work_rule_config, breaks)`**: 打刻時刻から実労働時間、休憩時間などを計算します。
- **`def calculate_overtime(start_time, end_time, work_rule_config, shift_start_time, shift_end_time, actual_work_minutes)`**: 残業時間を計算します。
- **`def calculate_holiday_work_days(attendances, holidays)`**: 勤怠データと休日リストに基づき、休日出勤日数を計算します。

### 主な依存モジュール (Imports)
`datetime`, `math`, `typing`, `zoneinfo`

### コード先頭プレビュー
```text
from datetime import datetime, time, timedelta, date
import math
from typing import Dict, Any, List, Optional

def round_time(dt: datetime, rounding_minutes: int = 1, method: str = "floor") -> datetime:
    """
    指定された分単位で時刻を丸めます。
    method: "floor" (切り捨て), "ceil" (切り上げ), "round" (四捨五入)
    デフォルトは1分単位（丸めなし）。
    """
    if rounding_minutes <= 1:
        return dt.replace(second=0, microsecond=0)

    delta = timedelta(minutes=rounding_minutes)

```

---

## <a id="backend-app-services-parser-py"></a> backend/app/services/parser.py

- **ファイル概要:** parser.py モジュール / 設定ファイル
- **行数:** 77 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義関数・エンドポイント
- **`def _parse_single_row(row, user_map)`**: 1行分のCSVデータを解析し、ShiftCreateオブジェクトを返します。
- **`def parse_shift_csv(file_content, user_map)`**: CSVファイルの内容を解析し、ShiftBulkCreateオブジェクトを返します。
CSVフォーマット: TargetDate,UserID(EmployeeID),StartTime,EndTime,ShiftType,IsHoliday
例: 2023-10-01,EMP001,09:00,18:00,Day,False

### 主な依存モジュール (Imports)
`app.core.exceptions`, `app.core.messages`, `app.schemas.shift`, `csv`, `datetime`, `io`, `typing`, `uuid`

### コード先頭プレビュー
```text
import csv
import io
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from app.schemas.shift import ShiftCreate, ShiftBulkCreate
from app.core.messages import ERROR_USER_ID_NOT_FOUND_IN_CSV, ERROR_CSV_PARSE_FAILED
from app.core.exceptions import BusinessRuleError

def _parse_single_row(row: List[str], user_map: dict[str, UUID]) -> ShiftCreate:
    """
    1行分のCSVデータを解析し、ShiftCreateオブジェクトを返します。
    """
    if len(row) < 5:
```

---

## <a id="backend-app-services-project_service-py"></a> backend/app/services/project_service.py

- **ファイル概要:** project_service.py モジュール / 設定ファイル
- **行数:** 238 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class ProjectService`**: 詳細なし
  - メソッド: `__init__()`, `_get_users_by_ids()`, `_get_user_by_id()`, `_dict_to_project_model()`, `get_all_projects()`, `get_all_projects_admin()`, `create_project()`, `update_project()`

### 主な依存モジュール (Imports)
`app.api.deps`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.project`, `datetime`, `typing`, `uuid`

### コード先頭プレビュー
```text
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
```

---

## <a id="backend-app-services-side_effect-py"></a> backend/app/services/side_effect.py

- **ファイル概要:** side_effect.py モジュール / 設定ファイル
- **行数:** 401 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義クラス
- **`class SideEffectService`**: 詳細なし
  - メソッド: `_get_cognito_sub()`, `get_user_work_rule_config()`, `apply_paid_leave_side_effects()`, `apply_stamp_correction_side_effects()`, `check_and_grant_compensatory_leave()`

### 主な依存モジュール (Imports)
`app.core.constants`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.application`, `app.services.calculator`, `calendar`, `datetime`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date, timedelta, time, datetime
from typing import Dict, List, Optional
from uuid import UUID, uuid4
import calendar

from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Application, PaidLeaveLedger, Shift, Attendance, User, WorkRule
from app.schemas.application import PaidLeaveInputData, StampCorrectionInputData
from app.services.calculator import calculate_working_hours
from app.core.constants import (
    DEFAULT_ROUNDING_RULE_MINUTES,
    DEFAULT_AUTO_BREAK_DEDUCTION_MINUTES,
    DEFAULT_LATE_GRACE_PERIOD_MINUTES,
    DEFAULT_HALF_DAY_MORNING_START,
    DEFAULT_HALF_DAY_MORNING_END,
```

---

## <a id="backend-app-services-workflow-py"></a> backend/app/services/workflow.py

- **ファイル概要:** workflow.py モジュール / 設定ファイル
- **行数:** 155 行
- **カテゴリ:** バックエンド業務ロジック (Models / Schemas / Services)

### 定義関数・エンドポイント
- **`def dict_to_application_model(item)`**: DynamoDBのアイテム辞書からSQLAlchemyのApplicationモデルを生成します。
- **`def _find_application_item(repo, application_id)`**: 
- **`def _load_relations(repo, app_obj)`**: Applicationモデルの関連（user, approver, template）をDynamoDBからロードします。
- **`def approve_application(repo, application_id, approver_id)`**: 申請を承認し、申請種別に応じた副作用を適用します。
- **`def _apply_application_side_effects(repo, application)`**: 申請タイプごとの副作用適用ロジック。
- **`def reject_application(repo, application_id, approver_id)`**: 申請を却下します。

### 主な依存モジュール (Imports)
`app.api.deps`, `app.core.exceptions`, `app.db.dynamodb_repo`, `app.models`, `app.schemas.application`, `app.services.side_effect`, `datetime`, `fastapi`, `typing`, `uuid`

### コード先頭プレビュー
```text
from datetime import date, datetime, time
from typing import Dict
from uuid import UUID

from fastapi import HTTPException, status

from app.db.dynamodb_repo import DynamoDBRepository
from app.models import Application, User, ApplicationTemplate
from app.schemas.application import PaidLeaveInputData, StampCorrectionInputData
from app.services.side_effect import SideEffectService
from app.core.exceptions import ResourceNotFoundError, BusinessRuleError
from app.api.deps import dict_to_user_model

def dict_to_application_model(item: dict) -> Application:
    """
```

---

