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

export class HRConnectServerlessStack extends cdk.Stack {
  public readonly apiEndpoint: string;
  public readonly dynamoTableName: string;
  public readonly storageBucketName: string;
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;

  constructor(scope: Construct, id: string, props?: HRConnectStackProps) {
    super(scope, id, props);

    const stage = props?.stage || 'prod';

    // ------------------------------------------------------------
    // 1. Amazon DynamoDB (完全サーバーレス・オンデマンド課金: アイドル時 $0)
    // ------------------------------------------------------------
    const table = new dynamodb.Table(this, 'HRConnectDynamoTable', {
      tableName: `HRConnectTable-${stage}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // オンデマンド課金
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: false, // 最安運用の為デフォルトOFF
    });

    // GSI1 (SKをPK、PKをSKとして検索可能にするインデックス)
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.dynamoTableName = table.tableName;

    // ------------------------------------------------------------
    // 2. Amazon S3 (帳票エクスポート・ファイル保管用: アイドル時 ほぼ $0)
    // ------------------------------------------------------------
    const storageBucket = new s3.Bucket(this, 'HRConnectStorageBucket', {
      bucketName: `hrconnect-storage-${this.account}-${this.region}-${stage}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: stage !== 'prod',
      lifecycleRules: [
        {
          id: 'ExpireTempExports',
          expiration: cdk.Duration.days(30), // 30日後に一時ファイルを自動削除し課金を抑制
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    this.storageBucketName = storageBucket.bucketName;

    // ------------------------------------------------------------
    // 3. Amazon Cognito (認証基盤: 月間50,000 MAUまで完全無料)
    // ------------------------------------------------------------
    const userPool = new cognito.UserPool(this, 'HRConnectUserPool', {
      userPoolName: `hrconnect-userpool-${stage}`,
      selfSignUpEnabled: false, // 管理者招待制
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'HRConnectUserPoolClient', {
      userPool,
      userPoolClientName: `hrconnect-web-client-${stage}`,
      generateSecret: false, // SPA / フロントエンド向け
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;

    // ------------------------------------------------------------
    // 4. AWS Lambda Backend API (FastAPI + Mangum: 起動時のみ課金 / アイドル時 $0)
    // ------------------------------------------------------------
    const backendFunction = new lambda.DockerImageFunction(this, 'HRConnectBackendFunction', {
      functionName: `hrconnect-backend-${stage}`,
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../backend'), {
        file: 'Dockerfile.lambda',
      }),
      memorySize: 1024, // FastAPI + Pandas に適したメモリサイズ
      timeout: cdk.Duration.seconds(30),
      environment: {
        AWS_REGION: this.region,
        DYNAMODB_TABLE_NAME: table.tableName,
        AWS_S3_BUCKET: storageBucket.bucketName,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        COGNITO_REGION: this.region,
        SECRET_KEY: 'hrconnect-secure-prod-key-' + this.account,
        API_V1_STR: '/api/v1',
      },
    });

    // DynamoDB & S3 へのアクセス権限を付与
    table.grantReadWriteData(backendFunction);
    storageBucket.grantReadWrite(backendFunction);

    // ------------------------------------------------------------
    // 5. Amazon API Gateway HTTP API (低コスト・低レイテンシ: $1.00/100万req)
    // ------------------------------------------------------------
    const httpApi = new apigwv2.HttpApi(this, 'HRConnectHttpApi', {
      apiName: `hrconnect-api-${stage}`,
      description: 'Serverless HTTP API for HRConnect Backend',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['*'],
        allowCredentials: false,
      },
    });

    const lambdaIntegration = new apigwv2_integrations.HttpLambdaIntegration(
      'BackendIntegration',
      backendFunction
    );

    // すべてのリクエストを Lambda にプロキシ
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigwv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    this.apiEndpoint = httpApi.apiEndpoint;

    // ------------------------------------------------------------
    // 6. CloudFormation Outputs (デプロイ後の接続設定)
    // ------------------------------------------------------------
    new cdk.CfnOutput(this, 'ApiEndpointOutput', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway HTTP API Endpoint URL',
      exportName: `HRConnect-ApiEndpoint-${stage}`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableNameOutput', {
      value: table.tableName,
      description: 'DynamoDB Table Name',
      exportName: `HRConnect-DynamoTable-${stage}`,
    });

    new cdk.CfnOutput(this, 'S3BucketNameOutput', {
      value: storageBucket.bucketName,
      description: 'S3 Storage Bucket Name',
      exportName: `HRConnect-S3Bucket-${stage}`,
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolIdOutput', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `HRConnect-UserPoolId-${stage}`,
    });

    new cdk.CfnOutput(this, 'CognitoClientIdOutput', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `HRConnect-ClientId-${stage}`,
    });
  }
}

