import {
  AuthorizationType,
  AwsIntegration,
  ContentHandling,
  Cors,
  IResource,
  LambdaIntegration,
  MockIntegration,
  PassthroughBehavior,
  Period,
  RestApi
} from 'aws-cdk-lib/aws-apigateway';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import {App, Duration, Stack, StackProps, Fn} from 'aws-cdk-lib';
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs';
import {PolicyStatement, Role, ServicePrincipal} from 'aws-cdk-lib/aws-iam'
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {join} from 'path'
import {getTest} from "./lambda/queries/test";
import {Vpc} from "aws-cdk-lib/aws-ec2";


export class BackendStack extends Stack {
  constructor(scope: App, id: string, props: StackProps) {
    super(scope, id, props);

    const bucket = Bucket.fromBucketArn(this, "Bucket", "arn:aws:s3:::test")
    const vpc = Vpc.fromVpcAttributes(this, "VPC", {
      vpcId: "vpc-0000000000000000000",
      availabilityZones: Fn.getAzs(),
      privateSubnetIds: ["subnet-00000000000000000"],
      publicSubnetIds: []
    })

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk',
        ],
      },
      depsLockFilePath: join(__dirname, 'package-lock.json'),
      environment: {
        ENDPOINT: "test.eu-west-1.rds.amazonaws.com"
      },
      runtime: Runtime.NODEJS_16_X,
    }

    const testLambda = new NodejsFunction(this, 'getTestFunction', {
      entry: join(__dirname, "lambda", "queries", "test.ts"),
      timeout: Duration.seconds(20),
      handler: "getTest",
      vpc: vpc,
      ...nodeJsFunctionProps,
    });

    const integrationRole = new Role(this, 'IntegrationRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    })

    integrationRole.addToPolicy(
      new PolicyStatement({
        resources: [
          bucket.bucketArn,
          `${bucket.bucketArn}/*`
        ],
        actions: [
          "s3:*"
        ],
      })
    )

    bucket.grantRead(integrationRole)

    const testIntegration = new LambdaIntegration(testLambda, {
      allowTestInvoke: true,
      proxy: false,
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        }
      ]
    });

    const imagesIntegration = new AwsIntegration({
      service: 's3',
      integrationHttpMethod: "GET",
      region: "eu-north-1",
      path: `${bucket.bucketName}/?list-type=2&prefix={folder}/`,
      options: {
        credentialsRole: integrationRole,
        passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
        contentHandling: ContentHandling.CONVERT_TO_TEXT,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Credentials': "'false'",
              'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
              'method.response.header.Content-Type': 'integration.response.header.Content-Type',
            },
          },
        ],
        requestParameters: {
          //'integration.request.querystring.prefix': 'method.request.querystring.prefix',
          "integration.request.path.folder": "method.request.path.folder",
        },
      }
    })

    const api = new RestApi(this, 'Api', {
      restApiName: 'TestApi',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS
      },
      binaryMediaTypes: ["image/*"]
    })

    api.addUsagePlan("ApiUsage", {
      name: "ApiUsage",
      throttle: {
        rateLimit: 500,
        burstLimit: 1000
      },
      quota: {
        limit: 10000,
        period: Period.MONTH
      }
    })

    api.root.addResource("test")
      .addMethod("POST", testIntegration, {
        methodResponses: [{
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        }]
      })

    api.root.addResource("images")
      .addResource("{folder}")
      .addMethod("GET", imagesIntegration, {
      authorizationType: AuthorizationType.NONE,
      methodResponses: [{
        statusCode: "200",
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          "method.response.header.Content-Type": true,
        },
      }],
      requestParameters: {
        "method.request.path.folder": true,
        "method.request.header.Content-Type": true,
      },
    })
  }
}

const app = new App()
new BackendStack(app, "BackendStack", {
  env: {
    account: "accountid",
    region: 'eu-west-1',
  }
})
app.synth()