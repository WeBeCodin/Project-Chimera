# Video Upload Flow Implementation Guide

This guide explains how to deploy and use the complete video upload flow with job orchestration pipeline.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │ Infrastructure  │
│   (Next.js)     │────│ (Vercel Funcs)   │────│   (AWS CDK)     │
│                 │    │                  │    │                 │
│ • Video Upload  │    │ • Pre-signed     │    │ • S3 Bucket     │
│ • Job Status    │    │   URLs           │    │ • Lambda Funcs  │
│ • Drag & Drop   │    │ • Job Management │    │ • Step Functions│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites

- Node.js 18+
- AWS Account with CLI configured
- Vercel account (for deployment)
- PostgreSQL database (Vercel Postgres recommended)

## Step 1: Infrastructure Deployment

Deploy the AWS CDK stack first:

```bash
# Navigate to infrastructure directory
cd infra

# Install dependencies
npm install

# Configure AWS credentials
export AWS_PROFILE=your-profile
# OR
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_DEFAULT_REGION=us-east-1

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy the stack
npx cdk deploy
```

After deployment, note the outputs:
- `VideoBucketName`: Your S3 bucket name
- `VideoBucketArn`: S3 bucket ARN
- `VideoProcessorLambdaArn`: Lambda function ARN
- `StateMachineArn`: Step Functions ARN

## Step 2: Backend Configuration

Configure the backend with database and AWS settings:

```bash
# Navigate to backend directory
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your values:
# - Database connection strings from Vercel
# - AWS credentials and region
# - S3 bucket name from CDK output
```

Install dependencies and set up database:

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run db:setup  # Optional: creates test data
```

## Step 3: Frontend Configuration

Configure the frontend:

```bash
# Navigate to frontend directory
cd frontend

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your API URL
```

Install dependencies:

```bash
npm install
```

## Step 4: Development

Run all services in development mode:

```bash
# From root directory
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: Integrated with Next.js
- CDK: Infrastructure already deployed

## Step 5: Testing the Flow

1. **Access the application**: Navigate to http://localhost:3000
2. **Upload a video**: 
   - Use drag-and-drop or file selection
   - Or input a video URL
3. **Monitor job status**: Jobs appear in the status panel
4. **Check AWS console**: See S3 uploads and Step Functions executions

## API Endpoints

### Upload Flow
- `POST /api/videos/upload-url` - Get pre-signed upload URL
- `POST /api/videos/upload-complete` - Complete upload and create job
- `POST /api/videos` - Create video record (for URL uploads)

### Job Management
- `GET /api/jobs` - List jobs (with optional projectId filter)
- `GET /api/jobs/[id]/status` - Get specific job status
- `POST /api/jobs` - Create new job

## Environment Variables

### Backend (.env)
```bash
# Database
POSTGRES_PRISMA_URL="your_postgres_url"
POSTGRES_URL_NON_POOLING="your_direct_postgres_url"

# Auth
NEXTAUTH_SECRET="your_secret"
NEXTAUTH_URL="http://localhost:3000"

# AWS
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_key"
AWS_SECRET_ACCESS_KEY="your_secret"
AWS_ACCOUNT_ID="your_account"
S3_BUCKET_NAME="chimera-videos-your_account"
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## Deployment

### Monorepo Configuration

This is a monorepo project. When deploying to Vercel:

1. **Via Vercel Dashboard**: Set the **Root Directory** to `frontend` in project settings
2. **Via CLI**: Deploy from the frontend directory:
   ```bash
   cd frontend
   vercel --prod
   ```

The root `vercel.json` is kept minimal to avoid configuration conflicts. Build settings should be configured in the Vercel project settings or by deploying from the frontend directory directly.

### Backend (Vercel Functions)
Backend API routes are included in the frontend Next.js application under `frontend/src/app/api/`.

### Infrastructure (AWS)
Already deployed via CDK in Step 1.

## Features

✅ **Video Upload**
- Drag-and-drop interface
- File selection dialog
- URL ingestion
- Progress tracking

✅ **S3 Integration**
- Pre-signed upload URLs
- Secure direct browser uploads
- Automatic event triggers

✅ **Job Orchestration**
- Step Functions workflow
- Lambda-based processing
- Transcription and analysis

✅ **Real-time Status**
- Job status polling
- Progress indicators
- Error handling

✅ **Infrastructure as Code**
- AWS CDK TypeScript
- Reproducible deployments
- Resource management

## Troubleshooting

### Common Issues

1. **CDK deployment fails**
   - Check AWS credentials and permissions
   - Verify region configuration
   - Run `cdk doctor` for diagnostics

2. **Database connection errors**
   - Verify Postgres connection strings
   - Check Prisma schema is up to date
   - Run `npm run prisma:generate`

3. **S3 upload fails**
   - Confirm bucket name matches CDK output
   - Check AWS credentials in backend
   - Verify CORS configuration

4. **Job polling shows errors**
   - Ensure backend APIs are accessible
   - Check project IDs match
   - Verify database has test data

### Logs and Monitoring

- **Frontend**: Browser DevTools console
- **Backend**: Vercel Functions logs
- **Infrastructure**: CloudWatch logs
- **Step Functions**: AWS Console execution history

## Next Steps

1. **Production Deployment**
   - Configure production domains
   - Set up SSL certificates
   - Update CORS origins

2. **Enhanced Processing**
   - Add real transcription services
   - Implement video analysis
   - Store processing results

3. **User Management**
   - Implement authentication
   - Add user projects
   - Role-based access

4. **Monitoring**
   - Set up alerting
   - Add metrics collection
   - Performance monitoring

## Support

For issues or questions:
1. Check this guide first
2. Review error logs
3. Check AWS console for infrastructure issues
4. Verify environment variables
5. Open an issue in the repository