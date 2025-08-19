import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
export declare class ChimeraStack extends cdk.Stack {
    readonly videoBucket: s3.Bucket;
    readonly videoProcessorFunction: lambda.Function;
    readonly stateMachine: stepfunctions.StateMachine;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
