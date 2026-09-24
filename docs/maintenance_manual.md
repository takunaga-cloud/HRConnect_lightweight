# HRConnect メンテナンス手順書

## 1. 開発環境の構築手順 (Development Setup)

本システムは、ローカル環境で Docker および Docker Compose を用いて迅速に起動できます。本番環境は AWS DynamoDB / Cognito を使用しますが、ローカル環境では SQLite（データ投入用）および DynamoDB Local または認証モック（`ALLOW_MOCK_AUTH=true`）を使用して動作させます。

### 1.1 前提条件 (Prerequisites)
* **OS**: Linux / macOS
* **インストール必須コンポーネント**:
  * Docker Engine / Docker Desktop (v20.10以上)
  * Docker Compose (v2.0以上)
  * Python (v3.11以上, ローカル検証用)
  * Node.js (v18.0以上, ローカル検証用)

### 1.2 環境起動手順
1. **リポジトリのクローンと移動**:
   ```bash
   git clone <repository_url>
   cd HRConnect
   ```
2. **環境変数ファイルの配置**:
   `backend` および `frontend` のディレクトリ内に、それぞれの環境用 `.env` ファイルを設定します。ローカル開発時は `.env` で `ALLOW_MOCK_AUTH=true` を指定することで、実際の Cognito や AWS サービスに接続せず、ローカルの SQLite/DynamoDB 構成で動作可能です。
3. **Docker Compose による一括起動**:
   ```bash
   docker-compose up -d --build
   ```
   * このコマンドにより、DynamoDB Local、FastAPI バックエンド、Next.js フロントエンドが自動的にビルドされ、バックグラウンドで起動します。
4. **起動確認**:
   * フロントエンド: `http://localhost:3000`
   * バックエンド (Swagger UI): `http://localhost:8000/docs`

---

## 2. データベース管理・同期手順 (Database Management)

本システムは、ローカルの SQLite データベース (`hr_connect.db`) をマスターデータ元または移行元として用い、本番および動作環境では Amazon DynamoDB をプライマリデータストアとして使用します。

### 2.1 スキーマ変更およびマイグレーション
* SQLite スキーマの更新が必要な場合は、`backend/alembic` ディレクトリ以下のマイグレーションファイルを用いて適用します。
  ```bash
  cd backend
  poetry run alembic upgrade head
  ```
* DynamoDB のテーブルスキーマは、バックエンド起動時に `create_dynamodb_table_if_not_exists()` 関数が実行され、自動的にパーティションキー (PK)、ソートキー (SK)、グローバルセカンダリインデックス (GSI1) が構築されます。

### 2.2 有給休暇初期データの追加スクリプト
特定の年度（例：2025年4月1日）に全員に有給休暇（20日分）を一括付与する場合、初期データ投入スクリプトを実行します。
```bash
# Docker コンテナ内で実行する場合
docker-compose exec backend python scripts/seed_paid_leaves_2025.py
```
* **注意**: スクリプト内のコメントや出力メッセージは必ず日本語ルールに従っています。

### 2.3 SQLite から DynamoDB へのデータ同期
ローカルの SQLite データベース (`hr_connect.db`) に追加されたデータを、DynamoDB テーブルに同期させる場合は、同期スクリプトを実行します。
```bash
# Docker コンテナ内で実行する場合
docker-compose exec backend python scripts/sync_sqlite_to_dynamodb.py
```
* スクリプトにより、SQLite 上の `paid_leave_ledgers` やユーザー、打刻データなどが DynamoDB シングルテーブル設計に適合する PK/SK 形式に自動的にマッピング・同期されます。

---

## 3. デプロイ手順 (Deployment Procedures)

本システムは、Google Cloud Run（コンテナ動作環境）および AWS Serverless（Lambda、Cognito、DynamoDB）に対応しています。

### 3.1 Google Cloud Run へのデプロイ
コンテナイメージをビルドし、GCP Cloud Run にデプロイする場合は、以下のコマンドを実行します。

```bash
# バックエンドのデプロイ
gcloud run deploy hrconnect-backend --source ./backend --region asia-northeast1

# フロントエンドのデプロイ
gcloud run deploy hrconnect-frontend --source ./frontend --region asia-northeast1
```

### 3.2 AWS Serverless 環境へのデプロイ
CDK または AWS CLI を用いて、Lambda 構成および DynamoDB、Cognito 連携設定を本番環境へ適用します。詳細は [AWSデプロイ手順書.md](file:///home/takunaga/HRConnect_Next/HRConnect/AWS%E3%83%87%E3%83%97%E3%83%AD%E3%82%A4%E6%89%8B%E9%A0%86%E6%9B%B8.md) を参照してください。

---

## 4. トラブルシューティング (Troubleshooting)

### 4.1 日付表示が「MM/DD/YYYY」形式で乱れる
* **事象**: ブラウザの言語設定を英語にしているユーザーの画面で、日付が `06/12/2026` のように表示され、保存やバリデーションエラーが発生する。
* **原因と対処法**:
  * HTML標準の `<input type="date">` を使用していると、ブラウザのロケールによって表示が強制変換されます。
  * **対応**: 表示形式は常に `YYYY/MM/DD` に統一する開発ルールになっています。日付入力フォームには必ずカスタムの `DateInput` コンポーネントを使用し、`<input type="date">` の直接使用を中止してください。

### 4.2 打刻修正の承認時に 500 エラーが発生する
* **事象**: 一般ユーザーが提出した打刻修正申請を、管理者が承認した際にサーバーエラーが発生する。
* **原因と対処法**:
  * フロントエンドが打刻修正申請を送信する際、テンプレートの `target_field`（`correction_date`, `new_clock_in`, `new_clock_out`）が JSON の `input_data` の正しい英名キーにマッピングされず、日本語表記のままバックエンドへ送信されていたため、Pydantic バリデーションでエラーになっていました。
  * **対応**: `frontend/src/app/(user)/applications/page.tsx` 内の `handleSubmit` にて、テンプレート項目を正しく `input_data` 内の英名キーへマッピングする動的処理が適用されているか確認してください。

### 4.3 有給管理画面で新規付与された休暇が表示されない
* **事象**: 管理画面から新しい有給を付与しても、一覧に即時反映されない。
* **原因と対処法**:
  * 送信時に日付データが `YYYY/MM/DD` のままバックエンドへ送信され、バックエンドのバリデーションに失敗しているか、保存されたデータが DynamoDB 側に正しく同期されていない可能性があります。
  * **対応**: 送信時は `YYYY-MM-DD` 形式に正規化して API を叩いているか確認してください。また、ローカルでテスト中であれば `sync_sqlite_to_dynamodb.py` を実行して、SQLite 側に追加されたレコードを DynamoDB Local 側に同期してください。
