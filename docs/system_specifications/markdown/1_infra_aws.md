# インフラ & AWSサーバーレス構成 仕様詳細書

本ドキュメントは、HRConnectにおける「インフラ & AWSサーバーレス構成」カテゴリに属する全ファイルの仕様・構成・詳細を網羅した資料です。

**対象ファイル数:** 11 ファイル

---

## 掲載ファイル一覧

- [`.env.production.template`](#-env-production-template) : .env.production.template モジュール / 設定ファイル
- [`amplify.yml`](#amplify-yml) : AWS Amplify Hosting CI/CDビルド設定
- [`backend/Dockerfile.lambda`](#backend-Dockerfile-lambda) : Dockerfile.lambda モジュール / 設定ファイル
- [`deploy.sh`](#deploy-sh) : !/bin/bash
- [`docker-compose.prod.yml`](#docker-compose-prod-yml) : NOTE: 本番稼働は EC2/常時稼働コンテナではなく、AWS Lambda + DynamoDB + S3 + Cognito の
- [`infra/bin/infra.ts`](#infra-bin-infra-ts) : infra.ts モジュール / 設定ファイル
- [`infra/cdk.json`](#infra-cdk-json) : cdk.json モジュール / 設定ファイル
- [`infra/lib/hrconnect-serverless-stack.ts`](#infra-lib-hrconnect-serverless-stack-ts) : AWS CDK サーバーレススタック定義 (DynamoDB/S3/Cognito/Lambda/API Gateway)
- [`infra/package.json`](#infra-package-json) : package.json モジュール / 設定ファイル
- [`infra/tsconfig.json`](#infra-tsconfig-json) : tsconfig.json モジュール / 設定ファイル
- [`template.yaml`](#template-yaml) : ============================================================

---

## <a id="-env-production-template"></a> .env.production.template

- **ファイル概要:** .env.production.template モジュール / 設定ファイル
- **行数:** 27 行
- **カテゴリ:** インフラ & AWSサーバーレス構成

### コード先頭プレビュー
```text
# Production Environment Variables Template (AWS Serverless Architecture)
# アイドル時維持コスト $0 のサーバーレス構成用環境変数テンプレート

# Project Base
PROJECT_NAME="HR-Connect Production"
SECRET_KEY="GENERATED_STRONG_SECRET_KEY"

# Authentication (Amazon Cognito)
COGNITO_USER_POOL_ID="ap-northeast-1_xxxxxxxxx"
COGNITO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
COGNITO_REGION="ap-northeast-1"

# Database (Amazon DynamoDB - オンデマンド課金・サーバーレス)
DYNAMODB_TABLE_NAME="HRConnectTable-prod"
# Lambda環境下ではローカル用エンドポイントURLは不要 (NoneでAWS本番DynamoDBに自動接続)
```

---

## <a id="amplify-yml"></a> amplify.yml

- **ファイル概要:** AWS Amplify Hosting CI/CDビルド設定
- **行数:** 20 行
- **カテゴリ:** インフラ & AWSサーバーレス構成

### コード先頭プレビュー
```text
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - pnpm install
    build:
      commands:
        - env | grep -e NEXT_PUBLIC_ >> .env.production
        - pnpm build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
```

---

## <a id="backend-Dockerfile-lambda"></a> backend/Dockerfile.lambda

- **ファイル概要:** Dockerfile.lambda モジュール / 設定ファイル
- **行数:** 15 行
- **カテゴリ:** インフラ & AWSサーバーレス構成

### コード先頭プレビュー
```text
FROM public.ecr.aws/lambda/python:3.11

# Set working directory to Lambda task root
WORKDIR ${LAMBDA_TASK_ROOT}

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY app/ ./app/

# Set AWS Lambda handler
CMD ["app.main.handler"]

```

---

## <a id="deploy-sh"></a> deploy.sh

- **ファイル概要:** !/bin/bash
- **行数:** 59 行
- **カテゴリ:** インフラ & AWSサーバーレス構成

### コード先頭プレビュー
```text
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
```

---

## <a id="docker-compose-prod-yml"></a> docker-compose.prod.yml

- **ファイル概要:** NOTE: 本番稼働は EC2/常時稼働コンテナではなく、AWS Lambda + DynamoDB + S3 + Cognito の
- **行数:** 41 行
- **カテゴリ:** インフラ & AWSサーバーレス構成

### コード先頭プレビュー
```text
# NOTE: 本番稼働は EC2/常時稼働コンテナではなく、AWS Lambda + DynamoDB + S3 + Cognito の
# 完全サーバーレス構成（アイドル時固定費 $0）が推奨されます。
# デプロイには `./deploy.sh` (AWS CDK) または AWS SAM / AWS Amplify を使用してください。
# 本ファイルは、コンテナ環境でのステージング・動作確認用として保持しています。

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      - DYNAMODB_TABLE_NAME=${DYNAMODB_TABLE_NAME:-HRConnectTable-prod}
      - AWS_REGION=${AWS_REGION:-ap-northeast-1}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
```

---

## <a id="infra-bin-infra-ts"></a> infra/bin/infra.ts

- **ファイル概要:** infra.ts モジュール / 設定ファイル
- **行数:** 20 行
- **カテゴリ:** インフラ & AWSサーバーレス構成

### 主な依存モジュール (Imports)
`aws-cdk-lib`, `../lib/hrconnect-serverless-stack`

### コード先頭プレビュー
```text
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HRConnectServerlessStack } from '../lib/hrconnect-serverless-stack';

const app = new cdk.App();

const stage = app.node.tryGetContext('stage') || 'prod';

new HRConnectServerlessStack(app, `HRConnectServerlessStack-${stage}`, {
  stage: stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
  },
```

---

## <a id="infra-cdk-json"></a> infra/cdk.json

- **ファイル概要:** cdk.json モジュール / 設定ファイル
- **行数:** 29 行
- **カテゴリ:** インフラ & AWSサーバーレス構成

### コード先頭プレビュー
```text
{
  "app": "npx ts-node --prefer-ts-exts bin/infra.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
```

---

## <a id="infra-lib-hrconnect-serverless-stack-ts"></a> infra/lib/hrconnect-serverless-stack.ts

- **ファイル概要:** AWS CDK サーバーレススタック定義 (DynamoDB/S3/Cognito/Lambda/API Gateway)
- **行数:** 214 行
- **カテゴリ:** インフラ & AWSサーバーレス構成

### 型定義 / インターフェース
- `HRConnectStackProps`

### 主な依存モジュール (Imports)
`constructs`, `aws-cdk-lib/aws-cognito`, `aws-cdk-lib`, `aws-cdk-lib/aws-iam`, `aws-cdk-lib/aws-apigatewayv2-integrations`, `aws-cdk-lib/aws-lambda`, `path`, `aws-cdk-lib/aws-s3`, `aws-cdk-lib/aws-apigatewayv2`, `aws-cdk-lib/aws-dynamodb`

### コード先頭プレビュー
```text
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export interface HRConnectStackProps extends cdk.StackProps {
  stage?: string;
}

```

---

## <a id="infra-package-json"></a> infra/package.json

- **ファイル概要:** package.json モジュール / 設定ファイル
- **行数:** 24 行
- **カテゴリ:** インフラ & AWSサーバーレス構成

### コード先頭プレビュー
```text
{
  "name": "hrconnect-infra",
  "version": "1.0.0",
  "description": "AWS CDK Serverless Infrastructure for HRConnect",
  "bin": {
    "infra": "bin/infra.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "aws-cdk": "^2.130.0",
```

---

## <a id="infra-tsconfig-json"></a> infra/tsconfig.json

- **ファイル概要:** tsconfig.json モジュール / 設定ファイル
- **行数:** 24 行
- **カテゴリ:** インフラ & AWSサーバーレス構成

### コード先頭プレビュー
```text
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["es2022"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
```

---

## <a id="template-yaml"></a> template.yaml

- **ファイル概要:** ============================================================
- **行数:** 181 行
- **カテゴリ:** インフラ & AWSサーバーレス構成

### コード先頭プレビュー
```text
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: >
  HRConnect Fully Serverless Infrastructure
  FastAPI on AWS Lambda, DynamoDB (Pay-Per-Request), Amazon S3, Amazon Cognito, and API Gateway HTTP API.
  Idle Running Cost: $0/month.

Parameters:
  Stage:
    Type: String
    Default: prod
    Description: Deployment stage (dev, stg, prod)

Globals:
  Function:
```

---

