# HRConnect 改修指南書 (開発者向けガイド)

## 1. ディレクトリ構造の解説 (Monorepo Structure)

本プロジェクトはフロントエンドとバックエンドが単一のリポジトリで管理されるモノレポ構成を採用しています。

```text
/
├── frontend/          # Next.js (TypeScript) - クライアントアプリ
│   ├── src/app/       # App Router構成
│   │   ├── (auth)/    # 認証関連（ログイン、パスワードリセット）
│   │   ├── (user)/    # 一般従業員用（打刻、工数、申請）
│   │   └── (admin)/   # 管理者・労務用（シフト、承認、アナリティクス）
│   └── src/lib/       # 共有ライブラリ（APIクライアント、Cognito連携）
│
├── backend/           # FastAPI (Python) - APIサーバー
│   ├── app/
│   │   ├── core/      # 設定情報、セキュリティ（JWT検証）、定数
│   │   ├── api/       # ルーター（Web APIのエントリーポイント）
│   │   ├── models/    # SQLAlchemy 2.0 (Async) DBモデル定義
│   │   ├── schemas/   # Pydantic スキーマ（APIの入出力バリデーション）
│   │   └── services/  # ビジネスロジック（残業計算、副作用処理、監査ログ）
│   ├── alembic/       # データベースマイグレーション
│   └── main.py        # アプリケーション起動エントリーポイント
```

---

## 2. コーディング規約と技術スタックの適用方法

### 2.1 データベースアクセス (SQLAlchemy 2.0 Async)
本システムでは、SQLAlchemy 2.0 の非同期 API を用いてデータベース操作を行います。クエリの発行時は、必ず `async` 関数内で `await db.execute(...)` を呼び出してください。

**実装原則**:
*   N+1問題を回避するため、リレーション関係にあるテーブル（例: ユーザー情報を取得する際の所属部署 `department`）をあわせて取得する場合は、`joinedload` または `selectinload` を明示的に指定してください。

### 2.2 認証と認可の適用方法 (`Depends`)
エンドポイントを保護し、アクセス権限を制御するために、FastAPI の依存関係注入（DI: Dependency Injection）機能を利用します。

```python
from fastapi import APIRouter, Depends
from app.core.security import get_current_user, check_role
from app.models.user import User

router = APIRouter()

@router.post("/approvals")
async def approve_application(
    id: str,
    # ログイン中のユーザー情報を取得し、かつManager以上のロールであることを強制
    current_user: User = Depends(check_role(["Admin", "Manager"]))
):
    # 承認処理のロジック
    return {"status": "success"}
```

---

## 3. ビジネスロジックの追加方法

### 3.1 申請副作用の追加 (Side Effects Pipeline)
申請（ワークフロー）が承認された後に自動実行される副作用（例: 有給承認時にシフトを「有給」に書き換える）を追加する場合、`backend/app/services/side_effect.py` 内にロジックを実装します。

**実装例（半休承認時のシフト枠の自動生成）**:
```python
# backend/app/services/side_effect.py より抜粋

class SideEffectService:
    @staticmethod
    async def apply_paid_leave_side_effects(db: AsyncSession, application: Application):
        """
        有給申請が承認された際、有給台帳を減算し、対象日のシフトを変更する副作用処理。
        この処理は、呼び出し元のトランザクション内で実行されます。
        """
        input_data = application.input_data
        target_date = input_data.get("leave_start_date")
        leave_type = input_data.get("leave_type") # FullDay | HalfDayMorning | HalfDayAfternoon

        # 1. 有給休暇台帳の減算
        days_to_deduct = 1.0 if leave_type == "FullDay" else 0.5
        await PaidLeaveService.deduct_leave(db, application.user_id, days_to_deduct)

        # 2. シフト予定の自動作成/更新
        shift = await db.scalar(
            select(Shift).filter(Shift.user_id == application.user_id, Shift.target_date == target_date)
        )
        
        # システム定義または WorkRule.config から時間設定を取得する（ハードコードの排除）
        # ※改善点: 09:00-12:00 等の時間は config から動的に取得すること
        start_time, end_time = get_shift_times_from_config(leave_type)

        if not shift:
            # シフトが存在しない場合は新規作成
            shift = Shift(
                user_id=application.user_id,
                target_date=target_date,
                start_time=start_time,
                end_time=end_time,
                shift_type=leave_type,
                is_holiday=False
            )
            db.add(shift)
        else:
            # 既存のシフトを書き換え
            shift.start_time = start_time
            shift.end_time = end_time
            shift.shift_type = leave_type
```

---

## 4. エラーハンドリング規約 (Error Handling)

APIは、共通のエラーレスポンススキーマ（`app/schemas/error.py`）に準拠したフォーマットでレスポンスを返します。

### 4.1 共通エラーレスポンス形式
```json
{
  "code": "BUSINESS_001",
  "message": "申請に必要な有給残日数が不足しています。",
  "details": {}
}
```

### 4.2 例外のスローとマッピング
サービス層（`services/`）では、FastAPI 特有の `HTTPException` を直接スローせず、ドメイン固有のカスタム例外（例: `BusinessRuleError`）をスローしてください。APIルーター層またはミドルウェアにて、これらを適切なHTTPステータスコードとエラーコードへ変換（マッピング）します。

```python
# サービス層でのエラー判定例
if ledger.remaining_days < days_to_deduct:
    raise BusinessRuleError(
        code="BUSINESS_001",
        message="申請に必要な有給残日数が不足しています。"
    )
```

---

## 5. テストコードの実装規約 (Testing Guide)

バグの混入を防止するため、主要な計算ロジック（`calculator.py`）および副作用処理（`side_effect.py`）にはテストケースを実装することを義務付けます。

### 5.1 テストの実行方法
バックエンドのテストは `pytest` を使用して実行します。

```bash
cd backend
poetry run pytest tests/
```

### 5.2 テストコードの記述例
```python
# backend/tests/test_calculator.py

import pytest
from app.services.calculator import calculate_work_minutes

def test_calculate_work_minutes_with_rounding():
    # 15分丸め設定（出勤切り上げ、退勤切り捨て）のテスト
    rounding_minutes = 15
    clock_in = "2026-05-31T09:03:00Z"   # -> 09:15 に丸め
    clock_out = "2026-05-31T18:12:00Z"  # -> 18:00 に丸め
    breaks = []
    
    total_minutes = calculate_work_minutes(clock_in, clock_out, breaks, rounding_minutes)
    
    # 09:15 から 18:00 までの実労働時間は 8時間45分 (525分)
    assert total_minutes == 525

---

## 6. 日付形式標準化ルール (Date Format Policy)

本システムでは、すべての画面表示および入力インターフェースにおいて **`YYYY/MM/DD`** 形式での統一を必須とします。
* **`<input type="date">` の使用禁止**: ブラウザのロケール設定により、インプット欄が自動的に `MM/DD/YYYY` などに切り替わるのを防ぐため、`<input type="date">` の直接使用は禁止します。共通の `DateInput` コンポーネントを使用してください。
* **API送信時の正規化**: API送信時には内部的に `YYYY-MM-DD` 形式に正規化して送信してください。
* このルールは変更指示のない限り厳格に適用され、変更は一切禁止とします。

```
