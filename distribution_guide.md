# Windows向けアプリケーション配布・起動手順書

本システム（HRConnect）を、何も開発環境が導入されていないWindowsパソコンで動かすための、準備から起動までの手順書です。この内容をそのまま配布先の方へお渡しいただけます。

---

## 1. 配布先（Windows）での準備（事前セットアップ）

Docker環境をWindowsで動かすために、以下の手順で環境を構築します。

### ステップA: WSL2（Windows Subsystem for Linux）のインストール
DockerをWindows上で高速に動作させるため、Windows標準のLinux実行環境（WSL2）を有効化します。

1. **PowerShell** を「管理者として実行」で開きます。
2. 以下のコマンドを入力して実行します：
   ```powershell
   wsl --install
   ```
3. インストール完了後、**パソコンを再起動**します。
4. 再起動後、UbuntuなどのLinuxターミナルが自動的に開き、ユーザー名とパスワードの登録を求められます。画面の指示に従って任意の文字で設定してください。

### ステップB: Docker Desktop for Windows のインストール
システム全体をワンクリックで起動するためのコンテナ管理ツールを導入します。

1. [Dockerの公式サイト](https://www.docker.com/products/docker-desktop/) にアクセスし、**「Download for Windows」**ボタンからインストーラーをダウンロードします。
2. ダウンロードしたインストーラー（`Docker Desktop Installer.exe`）を実行します。
3. インストール設定画面で **「Use WSL 2 instead of Hyper-V (recommended)」** にチェックが入っていることを確認し、インストールを進めます。
4. インストールが完了したら、Docker Desktop を起動します（利用規約の同意画面などが出たら、同意して進めます）。
5. 画面の右下やタスクバーで、Dockerのクジラアイコンが「緑色（Running）」になっていれば準備完了です。

---

## 2. 配布するファイル（軽量ZIPパッケージング & GitHub Codespaces）

### 方法A: メール送信用 軽量ZIPアーカイブの自動生成（推奨）
プロジェクト直下で提供している軽量化スクリプトを実行することで、`node_modules` や `.venv`、`.next` などの巨大ファイルを除外した **数MB以下（約600KB〜）の極小ZIPファイル** を自動生成できます。

以下のコマンドを実行すると、ルート直下に `HRConnect_lightweight.zip` が作成されます：

```bash
./scripts/create_lightweight_zip.sh
```

このZIPファイルはサイズが小さいため、メール添付（上限25MB等）やチャットツールで簡単に送信可能です。

### 方法B: GitHub Codespaces での起動（環境構築不要）
GitHub上に本プロジェクトをプッシュしている場合、ブラウザから開発・実行が可能です。

1. GitHub リポジトリページを開き、**[Code]** ボタンをクリックします。
2. **[Codespaces]** タブを選択し、**[Create codespace on main]** をクリックします。
3. `.devcontainer` 設定に基づき、クラウド上に Node.js・Python・Docker コンテナ環境が自動で立ち上がります。
4. ポート `3000` (フロントエンド) および `8000` (バックエンド API) が自動的にフォワードされます。

---

### 配布パッケージに含まれるフォルダ・ファイル構造
軽量ZIPに含まれる主なコード構造は以下の通りです：

```text
HRConnect/
├── backend/ (Python FastAPI ソースコード)
├── frontend/ (Next.js フロントエンド ソースコード)
├── infra/ (CDK インフラコード)
├── .devcontainer/ (GitHub Codespaces / Dev Container 設定)
├── scripts/
│   └── create_lightweight_zip.sh (軽量ZIP生成スクリプト)
├── docker-compose.yml
└── hr_connect.db
```

> [!WARNING]
> **ZIPに含まれないもの（自動除外）**
> * `backend/.venv` / `venv` (Python仮想環境)
> * `frontend/node_modules` (Node依存パッケージ)
> * `frontend/.next` (ローカルビルドキャッシュ)
> * `.git` 履歴ディレクトリ
> * `.tar.gz` などの大容量イメージアーカイブ

---

## 3. 配布先での起動手順（実行）

環境構築が終わったWindows PCで、受け取ったZIPファイルを解凍し、以下の手順でDockerイメージをロードして起動します。**イメージ同梱のため、初回のプログラムダウンロードやビルド（5〜10分かかる処理）を完全にスキップして、即座に起動できます！**

1. 配布されたZIPファイルを、Cドライブ直下など分かりやすい場所に解凍します（例: `C:\HRConnect`）。
2. **PowerShell** を開きます。
3. 解凍したフォルダに移動します：
   ```powershell
   cd C:\HRConnect
   ```
4. **【重要】事前ビルド済みDockerイメージをロード（読み込み）します**：
   以下のコマンドを実行します：
   ```powershell
   docker load -i hrconnect_images.tar.gz
   ```
   *(※ 数十秒〜1分程度で、すべてのイメージの取り込みが完了します。)*
   
5. **システムを起動します**：
   以下のコマンドを入力してバックグラウンドで起動します：
   ```powershell
   docker compose up -d
   ```
   *(※ `--build` オプションおよびビルド処理は不要です。一瞬でコンテナが立ち上がります。)*

6. コマンドが完了し、すべての項目が `Started` または `Running` になったら起動成功です！

---

## 4. アプリへのアクセス方法

正常に起動したら、ブラウザを開いて以下のURLにアクセスします。

* **フロントエンド（画面）**: `http://localhost:3000`
* **バックエンド（APIドキュメント）**: `http://localhost:8000/docs`

### テスト用ログインアカウント
ログイン画面（`http://localhost:3000/login`）で以下を入力してログインできます。

* **管理者アカウント (Admin)**
  * メールアドレス: `admin@hr-connect.com`
  * パスワード: ` `
* **一般ユーザーアカウント (User)**
  * メールアドレス: `user1@hr-connect.com`
  * パスワード: `User@7m*qR8#tN4`

### ローカルデータベース (SQLite)
本システムはローカルデータベースとして `backend/app/hr_connect.db` (SQLite) を使用して動作します。AWSやDynamoDB等の外部クラウドサービスへの接続・契約は不要です。

---

## 5. 終了方法

システムの利用を終了し、PCのメモリを解放したい場合は、同じフォルダで以下のコマンドを実行します：

```powershell
docker compose down
```
これですべてのコンテナが停止します。
