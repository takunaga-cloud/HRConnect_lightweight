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
  description: 'HRConnect Fully Serverless Infrastructure (FastAPI on Lambda, DynamoDB, S3, Cognito, API Gateway)',
});

app.synth();

