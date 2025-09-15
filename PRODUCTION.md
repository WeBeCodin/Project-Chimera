# Production Deployment Guide

This guide walks you through deploying Project Chimera to production using Vercel and AWS.

## Prerequisites

- AWS Account with programmatic access
- Vercel Account  
- Node.js 18+
- Git repository access

## Step 1: AWS Infrastructure Setup

### 1.1 Configure AWS CLI
```bash
# Install AWS CLI if not already installed
npm install -g aws-cdk

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### 1.2 Deploy Infrastructure
```bash
# Navigate to infrastructure directory
cd infra

# Install dependencies
npm install

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy the stack
npx cdk deploy
```

**Save the CDK outputs:**
- `VideoBucketName` - Your S3 bucket name
- `StateMachineArn` - Step Functions ARN
- `VideoProcessorLambdaArn` - Lambda function ARN

## Step 2: Vercel Setup

### 2.1 Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

### 2.2 Create Vercel Project
```bash
# From the root directory
vercel

# Follow the prompts:
# - Link to existing project: No
# - Project name: project-chimera
# - Directory: ./
# - Override settings: No
```

### 2.3 Add Postgres Database
1. Go to your Vercel dashboard
2. Select your project
3. Go to Storage → Create Database → Postgres
4. Choose a region close to your users
5. Copy the connection strings when provided

## Step 3: Environment Variables

### 3.1 Set Vercel Environment Variables

In your Vercel dashboard, go to Settings → Environment Variables and add:

```bash
# Authentication
NEXTAUTH_SECRET=your-random-secret-key-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-project-name.vercel.app

# Database - Option A: Supabase PostgreSQL (Free Tier Recommended)
DATABASE_URL=postgresql://postgres:password@host:5432/database

# Database - Option B: Vercel Postgres
POSTGRES_PRISMA_URL=postgresql://username:password@host/db?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://username:password@host/db

# Vercel Blob Storage (replaces S3)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# AWS Configuration (Optional - for advanced processing workflows only)
# Only needed if you want to use AWS Step Functions for video analysis
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key
# STEP_FUNCTIONS_ARN=arn:aws:states:region:account:stateMachine:name

# Legacy S3 Configuration (Optional - can be removed)
# S3_BUCKET_NAME=chimera-videos-your-account-id

# Optional: Analytics and monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### 3.2 Generate Secrets
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3.3 Get Vercel Blob Token
1. Go to your Vercel dashboard
2. Navigate to Storage → Create → Blob
3. Create a new blob store
4. Copy the `BLOB_READ_WRITE_TOKEN`

## Step 4: Database Migration

### 4.1 Push Prisma Schema
```bash
# From backend directory
cd backend

# Generate Prisma client
npm run prisma:generate

# Push schema to production database
npm run prisma:push

# Optional: Seed with sample data
npm run db:setup
```

## Step 5: Deploy to Production

### 5.1 Deploy with Vercel CLI
```bash
# From root directory
vercel --prod
```

### 5.2 Deploy via Git (Recommended)
1. Push your code to the main branch
2. Vercel will automatically deploy
3. Monitor the deployment in Vercel dashboard

## Step 6: DNS and Custom Domain (Optional)

### 6.1 Add Custom Domain
1. Go to Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel

### 6.2 Update Environment Variables
Update `NEXTAUTH_URL` to your custom domain:
```bash
NEXTAUTH_URL=https://yourdomain.com
```

## Step 7: Monitoring and Analytics

### 7.1 Vercel Analytics
```bash
# Add to vercel.json
{
  "analytics": {
    "id": "your-analytics-id"
  }
}
```

### 7.2 AWS CloudWatch
Monitor your infrastructure:
- Lambda function logs
- Step Functions execution history
- S3 storage metrics

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in Vercel dashboard
# Common fixes:
1. Ensure all environment variables are set
2. Check TypeScript errors
3. Verify package.json scripts
```

#### Database Connection Issues
```bash
# Test connection
npx prisma db seed

# Common fixes:
1. Verify connection strings
2. Check database region matches Vercel deployment region
3. Ensure IP allowlisting if required
```

#### AWS Permissions Issues
```bash
# Common fixes:
1. Verify AWS credentials have necessary permissions
2. Check S3 bucket policies
3. Ensure Lambda execution role has correct permissions
```

### Performance Optimization

#### Frontend Optimization
```bash
# Enable compression in vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### Database Optimization
```sql
-- Add database indexes for common queries
CREATE INDEX idx_jobs_project_id ON jobs(project_id);
CREATE INDEX idx_videos_project_id ON videos(project_id);
CREATE INDEX idx_jobs_status ON jobs(status);
```

## Security Checklist

- [ ] All environment variables set securely
- [ ] NEXTAUTH_SECRET is randomly generated
- [ ] AWS credentials have minimal required permissions
- [ ] Database connections use SSL
- [ ] S3 bucket has proper CORS configuration
- [ ] API rate limiting is configured

## Backup and Recovery

### Database Backup
```bash
# Set up automated backups in Vercel dashboard
# Or create manual backup
pg_dump $POSTGRES_URL > backup.sql
```

### Code Backup
```bash
# Ensure code is backed up in Git
git remote add backup your-backup-repository
git push backup main
```

## Monitoring and Alerting

### Set up monitoring for:
- API response times
- Error rates
- Database connection health
- S3 storage usage
- Lambda function errors

### Recommended tools:
- Vercel Analytics for frontend metrics
- AWS CloudWatch for infrastructure
- Sentry for error tracking
- Uptime monitoring service

## Cost Management

### Monitor costs for:
- Vercel usage (functions, bandwidth)
- AWS services (S3, Lambda, Step Functions)
- Database storage and compute

### Optimization tips:
- Set up billing alerts
- Use S3 lifecycle policies
- Optimize Lambda memory allocation
- Monitor database query performance

## Updates and Maintenance

### Regular maintenance tasks:
- Keep dependencies updated
- Monitor security advisories
- Review and rotate secrets
- Clean up unused S3 objects
- Archive old database records

### Deployment pipeline:
1. Development → Staging → Production
2. Automated testing
3. Gradual rollouts
4. Rollback procedures

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review AWS CloudWatch logs
3. Verify all environment variables
4. Test database connectivity
5. Check API endpoints manually

Contact support channels:
- GitHub Issues for bugs
- Vercel support for platform issues
- AWS support for infrastructure problems