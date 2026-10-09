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
# 1. AWS CDKのデプロイ (Serverless Architecture)
# ------------------------------------------------------------
echo "Deploying AWS CDK serverless infrastructure..."
cd infra
pnpm install
npx cdk deploy --all --require-approval never
cd ..
echo "AWS CDK deployment completed."

# ------------------------------------------------------------
# 2. Frontendのビルド (Amplify または Static Export)
# ------------------------------------------------------------
echo "Starting Frontend build..."
cd frontend
pnpm install
pnpm build
cd ..
echo "Frontend build completed."

# ------------------------------------------------------------
# 3. デプロイ後の環境変数設定
# ------------------------------------------------------------
echo ""
echo "======================================================="
echo "サーバーレス構成のデプロイが完了しました。"
echo "アイドル時コスト \$0 の完全従量課金構成です。"
echo "======================================================="
echo ""
echo "CDK Outputsを確認し、Frontend (.env.production / Amplify) を設定してください:"
echo ""
echo "Frontend (.env.production または Amplify環境変数):"
echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=<Outputs: CognitoUserPoolId>"
echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=<Outputs: CognitoClientId>"
echo "NEXT_PUBLIC_BACKEND_URL=<Outputs: ApiEndpoint>"
echo "BACKEND_URL=<Outputs: ApiEndpoint>"
echo ""
echo "-------------------------------------------------------"
echo "DynamoDBに初期ユーザー・マスタデータを投入・初期化する場合:"
echo "cd backend && python3 -m scripts.init_dynamodb"
echo "======================================================="

