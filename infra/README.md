# Infrastructure

AWS CDK infrastructure-as-code for Project Chimera.

## Features

- **AWS CDK** with TypeScript
- **S3 Bucket** for video storage
- **Lambda Functions** for video processing
- **Step Functions** for workflow orchestration
- **IAM Roles** and permissions

## Getting Started

```bash
npm install
npm run build
npx cdk bootstrap  # First time setup
npx cdk deploy
```

## Scripts

- `build` - Compile TypeScript
- `watch` - Watch mode for development
- `test` - Run unit tests
- `cdk` - CDK CLI commands
- `type-check` - Run TypeScript type checking
- `lint` - Run ESLint

## Resources Created

- **S3 Bucket** - `chimera-videos-{account-id}` for video storage
- **Lambda Function** - Video processing placeholder
- **Step Functions** - Video processing state machine
- **IAM Roles** - Appropriate permissions for services

## CDK Commands

- `npx cdk ls` - List all stacks
- `npx cdk synth` - Synthesize CloudFormation template
- `npx cdk deploy` - Deploy the stack
- `npx cdk destroy` - Destroy the stack
- `npx cdk diff` - Compare deployed stack with current state

## Environment

Set your AWS credentials and region:
```bash
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
```

Or use AWS profiles:
```bash
export AWS_PROFILE=your_profile
```

## Architecture

The infrastructure supports:
- Video upload and processing workflows
- Serverless compute with Lambda
- Orchestrated workflows with Step Functions
- Secure storage with S3