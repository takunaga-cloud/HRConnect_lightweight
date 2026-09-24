#!/bin/bash

set -e

# AWS CLIとCDK CLIがインストールされていることを確認
if ! command -v aws &> /dev/null
then
    echo "AWS CLI がインストールされていません。インストールしてください。"
    exit 1
fi

if ! command -v cdk &> /dev/null
then
    echo "AWS CDK CLI がインストールされていません。インストールしてください。"
    exit 1
fi

# ------------------------------------------------------------
# 1. Frontendのビルド
# ------------------------------------------------------------
echo "Starting Frontend build..."
cd frontend
pnpm install
pnpm build
cd ..
echo "Frontend build completed."

# ------------------------------------------------------------
# 2. Backendの依存関係インストール (Dockerイメージビルド用)
# ------------------------------------------------------------
echo "Installing Backend dependencies for Docker build..."
cd backend
# Dockerfile内でpip installを実行するため、ローカルでのインストールはスキップ
# ただし、ローカルでテストする場合は必要
# pip install -r requirements.txt
cd ..
echo "Backend dependencies check completed."

# ------------------------------------------------------------
# 3. AWS CDKのデプロイ
# ------------------------------------------------------------
echo "Deploying AWS CDK infrastructure..."
cd infra
pnpm install
npx cdk deploy --all --require-approval never
cd ..
echo "AWS CDK deployment completed."

# ------------------------------------------------------------
# 4. デプロイ後の環境変数設定 (手動)
# ------------------------------------------------------------
echo "\n======================================================="
echo "デプロイが完了しました。以下の情報を環境変数に設定してください。"
echo "======================================================="
echo "\nCDK Outputs:"
npx cdk -C infra/ls --json output
echo "\nFrontend (.env.local) 例:"
echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=<UserPoolId>"
echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=<UserPoolClientId>"
echo "NEXT_PUBLIC_BACKEND_URL=https://<ApiEndpoint>.execute-api.<region>.amazonaws.com/api/v1"
echo "\nBackend (.env) 例:"
echo "DATABASE_URL=\"postgresql+asyncpg://<username>:<password>@<db-endpoint>:5432/<dbname>\""
echo "COGNITO_USER_POOL_ID=<UserPoolId>"
echo "COGNITO_CLIENT_ID=<UserPoolClientId>"
echo "COGNITO_REGION=<region>"
echo "\n-------------------------------------------------------"
echo "データベースに初期データを投入するには、backendディレクトリで以下を実行してください:"
echo "cd backend && python -m scripts.seed_data"
