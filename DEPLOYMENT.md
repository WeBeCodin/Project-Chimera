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

## Step 1: Database Setup (Supabase)

Set up a free PostgreSQL database:

```bash
# 1. Create a Supabase account and project at https://supabase.com
# 2. Go to Settings > Database and copy the connection string
# 3. Configure your environment variables
```

Note the database URL:
- `DATABASE_URL`: Direct connection to Supabase PostgreSQL

## Step 2: Backend Configuration

Configure the backend with database and blob storage settings:

```bash
# Navigate to backend directory
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your values:
# - Database connection string from Supabase
# - Vercel Blob token
# - NextAuth secret
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
   - File uploads directly to Vercel Blob
   - Or input a video URL
3. **Monitor job status**: Jobs appear in the status panel
4. **Check storage**: Files are stored in Vercel Blob (check your Vercel dashboard)

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
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/[database]"

# Auth
NEXTAUTH_SECRET="your_secret"
NEXTAUTH_URL="http://localhost:3000"

# Vercel Blob Storage  
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Optional: AWS (for advanced processing)
# AWS_REGION="us-east-1"
# AWS_ACCESS_KEY_ID="your_key"
# AWS_SECRET_ACCESS_KEY="your_secret"  
# STEP_FUNCTIONS_ARN="your-step-functions-arn"
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## Deployment

### Backend (Vercel)
```bash
cd backend
vercel --prod
```

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Infrastructure (Optional AWS)
AWS CDK infrastructure is now optional. Only deploy if you need advanced video processing workflows:

```bash
cd infra
npx cdk deploy
```

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