# HRConnect 基本設計書

## 1. システムアーキテクチャ (System Architecture)

本システムは、モダンなSPA (Single Page Application) フロントエンドと、軽量かつ高速なバックエンドAPIで構成されたモノレポ（Monorepo）構造を採用し、AWSのサーバーレスアーキテクチャ上で稼働します。

```mermaid
graph TD
    User((ユーザー/管理者))
    
    subgraph "Frontend (Next.js)"
        NextJS[Next.js App Router]
        Geo[Geolocation API]
    end

    subgraph "Authentication (IdP)"
        Cognito[Amazon Cognito\n(User Pools)]
    end

    subgraph "Backend API (AWS Serverless)"
        APIGw[API Gateway]
        Lambda[AWS Lambda (FastAPI + Mangum)]
    end

    subgraph "Data Store & Storage"
        DynamoDB[(Amazon DynamoDB\nSingle Table Design)]
        S3[Amazon S3\n(一時出力/添付ファイル)]
    end

    User -->|HTTPS| NextJS
    NextJS -->|1. ログイン/MFA認証| Cognito
    Cognito -->>|ID/Access Token (JWT)| NextJS
    
    NextJS -->|2. GPS位置情報取得| Geo
    NextJS -->|3. APIリクエスト + JWT| APIGw
    
    APIGw -->|プロキシ転送| Lambda
    Lambda -->|トークン検証 (Public Key)| Cognito
    Lambda -->|boto3 / aioboto3| DynamoDB
    Lambda -->|CSV/Excel生成・保存| S3
    Lambda -->|Presigned URL返却| NextJS
```

### 1.1 技術スタック選定と採用理由

| レイヤー | 技術 / サービス | 選定理由 |
| :--- | :--- | :--- |
| **Frontend** | **Next.js (App Router, TypeScript)** | 高速な画面描画、コンポーネント指向の開発、レスポンシブWebデザインによるスマホ対応を同一コードベースで実現するため。 |
| **Backend** | **FastAPI (Python)** | Pydanticによる堅牢な型安全性、非同期処理の標準サポート、およびPandas等のデータ解析ライブラリを用いた複雑な「工数集計」や「帳票出力」の処理効率を最大化するため。 |
| **Compute** | **AWS Lambda** | サーバー管理が不要であり、朝夕の打刻ラッシュなどの突発的なトラフィックに対して自動で高速にスケーリングし、未使用時のインフラコストを最小限に抑えるため。 |
| **Database** | **Amazon DynamoDB** | 完全サーバーレスのNoSQLデータベース。従量課金制（オンデマンド）を採用することで、小規模（10人程度）利用におけるアイドル時コストをほぼゼロ（無料枠内）に抑えつつ、書き込み・読み込み性能を自動スケールさせるため。 |
| **Authentication** | **Amazon Cognito** | 認証機能、パスワードポリシーの強制、多要素認証（MFA）、グループ管理などのセキュリティ要件を完全に委譲し、セキュアに保つため。 |
| **Storage** | **Amazon S3** | 生成されたCSV/Excel帳票の一時保存や、申請時の添付ファイルを低コストかつ高信頼性で保管するため。SSE-S3/SSE-KMSによる暗号化。 |

---

## 2. 認証・認可設計 (Authentication & Authorization)

### 2.1 認証フロー (Authentication Flow)
1. ユーザーはフロントエンド画面でメールアドレスとパスワードを入力します。
2. フロントエンドは Amazon Cognito User Pools に対して認証を要求します。
3. 必要に応じて、MFA（多要素認証）コードの入力が求められます。
4. 認証成功後、CognitoからフロントエンドへJWT（JSON Web Token: IDトークン、アクセストークン、リフレッシュトークン）が返却されます。
5. フロントエンドは、以降のバックエンドAPI呼び出しの際、`Authorization: Bearer <JWT>` ヘッダーを付与します。

### 2.2 バックエンドでのトークン検証
バックエンドAPI (`FastAPI`) は、リクエストごとに以下の処理を行います：
1. Cognitoの公開鍵（JWKS）を用いて、JWTの署名を検証します（キャッシュされた公開鍵を使用）。
2. トークンの有効期限（`exp`）、発行者（`iss`）、クライアントID（`aud`）をチェックします。
3. トークン内から `sub` (CognitoのユニークユーザーID) を取得し、データベースの `users` テーブルと照合してユーザーを特定します。

### 2.3 ロールと権限モデル (Role & Permission Model)
ユーザーは以下のいずれかのロールを持ち、APIエンドポイントへのアクセス認可が制御されます。

| ロール名 | 対象ユーザー | 主な付与権限 |
| :--- | :--- | :--- |
| **Admin** | システム管理者 | 全機能へのアクセス、システム全般の設定、マスタデータの管理。 |
| **Manager** | 部門長・店長・PM | 部下のシフト作成、各種申請の承認/却下、部下のアラート状況確認。 |
| **Leader** | プロジェクト管理者 | 担当プロジェクトの管理、プロジェクトメンバーの工数実績確認。 |
| **HR_Payroll** | 人事・労務・経理担当者 | 月次締め処理の実行/解除、給与計算用データの出力、就業規則の設定管理。 |
| **Employee** | 一般従業員 | 自身の打刻（出退勤）、シフト予定の確認、日報工数の入力、各種申請の起票。 |

---

## 3. ネットワーク・セキュリティ設計 (Network & Security)

### 3.1 通信の保護
* **HTTPSの強制**: クライアントとフロントエンド、およびAPI Gateway間の通信はすべてTLS 1.2以上を用いて暗号化します。
* **CORS (Cross-Origin Resource Sharing)**: API GatewayおよびFastAPIにおいて、許可されたオリジン（フロントエンドのドメイン）からのリクエストのみを受け付けるよう制限します。

### 3.2 データベースとストレージの保護
* **VPCエンドポイント（Gateway型）**: LambdaをVPC内に配置する場合、DynamoDBへのアクセスはインターネットを経由せず、VPCエンドポイントを介してセキュアに行われます。
* **データの暗号化**: 
  * DynamoDBは、保管時のデフォルト暗号化（AWSマネージドキーまたはAWS KMSキー）によってすべてのデータが自動的に暗号化されます。
  * S3バケットはデフォルトの暗号化（SSE-S3またはSSE-KMS）を強制し、SSL経由のアクセスのみを許可するバケットポリシーを設定します。
* **一時的アクセス（Presigned URL）**: S3に保存されたエクスポートファイル等は、フロントエンドへ直接ファイルを返却するのではなく、有効期限付きの署名付きURL（Presigned URL）を生成して一時的にアクセスを許可します。

---

## 4. UI/UXの標準設計規約 (UI/UX Design Standards)

### 4.1 日付形式の統一
* 本システムにおいて、すべてのフロントエンド画面での日付表示およびユーザーからの日付入力欄は **`YYYY/MM/DD`** 形式（例: `2026/06/12`）に統一します。
* HTML標準の `<input type="date">` は、ブラウザ設定によって `MM/DD/YYYY` 等に自動変形される恐れがあるため使用を禁止し、カスタム `DateInput` コンポーネントを使用します。
* APIとのデータ送受信時において、日付はフロントエンド内部で `YYYY-MM-DD` 形式に正規化して送信します。この規則の変更は一切禁止とします。

