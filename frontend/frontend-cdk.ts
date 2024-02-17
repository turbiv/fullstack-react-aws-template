import {App, Duration, Stack, CfnOutput, RemovalPolicy, StackProps} from 'aws-cdk-lib';
import {CertificateValidation, Certificate} from "aws-cdk-lib/aws-certificatemanager"
import {PolicyStatement, CanonicalUserPrincipal} from 'aws-cdk-lib/aws-iam'
import { Distribution, ViewerProtocolPolicy, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import {Bucket, BlockPublicAccess} from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import {HostedZone, ARecord, RecordTarget} from 'aws-cdk-lib/aws-route53';
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets"

export class FrontendStack extends Stack {
  constructor(scope: App, id: string, props: StackProps) {
    super(scope, id, props);

    const path = "./dist";
    const domain = "mydomain.net"
    const subdomain = "www"
    const fulldomain = subdomain + "." + domain

    const zone = HostedZone.fromLookup(this, 'Zone', { domainName: domain });
    const cloudfrontOAI = new OriginAccessIdentity(this, 'cloudfront-OAI', {
      comment: `OAI for ${id}`
    });

    const siteBucket = new Bucket(this, 'FrontendBucket', {
      bucketName: domain,
      autoDeleteObjects: false,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    siteBucket.addToResourcePolicy(new PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [siteBucket.arnForObjects('*')],
      principals: [new CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }));
    new CfnOutput(this, 'BucketName', { value: siteBucket.bucketName });

    const certificate = new Certificate(this, 'SiteCertificate', {
      domainName: fulldomain,
      validation: CertificateValidation.fromDns(zone),
    });
    new CfnOutput(this, 'SiteCertificateOutput', { value: certificate.certificateArn });


    const distribution = new Distribution(this, 'CloudfrontDistribution', {
      certificate: certificate,
      defaultRootObject: "index.html",
      domainNames: [fulldomain],
      //minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses:[
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(30),
        }
      ],
      defaultBehavior: {
        origin: new S3Origin(siteBucket, {originAccessIdentity: cloudfrontOAI}),
        compress: true,
        //allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      }
    });

    new ARecord(this, 'SiteAliasRecord', {
      recordName: fulldomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone
    });

    new BucketDeployment(this, 'BucketDeployment', {
      sources: [Source.asset(path)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new CfnOutput(this, 'CloudFrontURL', {
      value: distribution.domainName,
      description: 'The distribution URL',
      exportName: 'CloudfrontURL',
    });

  }
}

const app = new App()
new FrontendStack(app, "FrontendStack", {
  env: {
    account: "account number",
    /**
     * Stack must be in us-east-1, because the ACM certificate for a
     * global CloudFront distribution must be requested in us-east-1.
     */
    region: 'us-east-1',
  }
})
app.synth()