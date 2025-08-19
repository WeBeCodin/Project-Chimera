import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ChimeraStack extends cdk.Stack {
  public readonly videoBucket: s3.Bucket;
  public readonly videoProcessorFunction: lambda.Function;
  public readonly stateMachine: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for video storage
    this.videoBucket = new s3.Bucket(this, 'VideoBucket', {
      bucketName: `chimera-videos-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change for production
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'], // Restrict in production
          maxAge: 3600,
        },
      ],
      publicReadAccess: false,
      versioned: false,
    });

    // Lambda function for video processing
    this.videoProcessorFunction = new lambda.Function(this, 'VideoProcessorFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Processing video:', JSON.stringify(event, null, 2));
          
          // Placeholder video processing logic
          const { videoKey, projectId, jobId } = event;
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          return {
            statusCode: 200,
            body: {
              videoKey,
              projectId,
              jobId,
              status: 'completed',
              result: {
                duration: '00:02:30',
                transcriptUrl: \`s3://\${process.env.BUCKET_NAME}/transcripts/\${videoKey}.json\`,
                thumbnailUrl: \`s3://\${process.env.BUCKET_NAME}/thumbnails/\${videoKey}.jpg\`,
              }
            }
          };
        };
      `),
      environment: {
        BUCKET_NAME: this.videoBucket.bucketName,
      },
      timeout: cdk.Duration.minutes(5),
    });

    // Grant the Lambda function read/write access to the S3 bucket
    this.videoBucket.grantReadWrite(this.videoProcessorFunction);

    // Step Functions State Machine for orchestrating video processing
    const processVideoTask = new sfnTasks.LambdaInvoke(this, 'ProcessVideoTask', {
      lambdaFunction: this.videoProcessorFunction,
      outputPath: '$.Payload',
    });

    const definition = stepfunctions.Chain
      .start(processVideoTask)
      .next(new stepfunctions.Succeed(this, 'VideoProcessingComplete'));

    this.stateMachine = new stepfunctions.StateMachine(this, 'VideoProcessingStateMachine', {
      definition,
      timeout: cdk.Duration.minutes(30),
    });

    // IAM role for API access to Step Functions
    const apiRole = new iam.Role(this, 'ApiRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      inlinePolicies: {
        StepFunctionsExecute: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'states:StartExecution',
                'states:DescribeExecution',
                'states:StopExecution',
              ],
              resources: [this.stateMachine.stateMachineArn],
            }),
          ],
        }),
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'VideoBucketName', {
      value: this.videoBucket.bucketName,
      description: 'Name of the S3 bucket for video storage',
    });

    new cdk.CfnOutput(this, 'VideoBucketArn', {
      value: this.videoBucket.bucketArn,
      description: 'ARN of the S3 bucket for video storage',
    });

    new cdk.CfnOutput(this, 'VideoProcessorLambdaArn', {
      value: this.videoProcessorFunction.functionArn,
      description: 'ARN of the video processor Lambda function',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: this.stateMachine.stateMachineArn,
      description: 'ARN of the Step Functions state machine',
    });
  }
}