# Migration to Free-Tier Services

Project Chimera has been updated to use free-tier services instead of expensive AWS resources. This change makes the application accessible for development and small-scale production use without ongoing costs.

## What Changed

### 🔄 File Storage: S3 → Vercel Blob
- **Before**: AWS S3 bucket for video storage
- **After**: Vercel Blob storage (generous free tier)
- **Impact**: No more S3 storage costs, simpler setup

### 🔄 Database Options: Multiple Free Tiers
- **Before**: Vercel Postgres only
- **After**: Supabase PostgreSQL (recommended) or Vercel Postgres
- **Impact**: True free-tier option with Supabase

### 🔄 Processing: AWS Optional
- **Before**: Required AWS Step Functions for video processing
- **After**: AWS Step Functions are optional (gracefully handled when not configured)
- **Impact**: System works without AWS, can add advanced processing later

## New Environment Variables

### Required
```env
# Database (Supabase - Free Tier)
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/[database]"

# File Storage (Vercel Blob - Free Tier)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

### Optional (Advanced Processing)
```env
# AWS Step Functions (Optional)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
STEP_FUNCTIONS_ARN="arn:aws:states:region:account:stateMachine:name"
```

## Migration Steps

### For New Deployments
1. Follow the updated [SETUP.md](./SETUP.md) guide
2. Use Supabase PostgreSQL for the database
3. Create Vercel Blob storage
4. Deploy to Vercel

### For Existing S3 Deployments
1. Your existing S3 setup continues to work (backward compatible)
2. New uploads will use Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set
3. Gradually migrate by updating environment variables
4. Old videos remain accessible via S3 URLs

## Cost Comparison

| Service | Before (AWS) | After (Free Tier) |
|---------|-------------|-------------------|
| Database | Vercel Postgres (~$20/month) | Supabase PostgreSQL (Free up to 2GB) |
| File Storage | AWS S3 (~$5-20/month) | Vercel Blob (Free up to 1GB) |
| Processing | AWS Lambda + Step Functions (~$10-50/month) | Optional AWS (pay as needed) |
| **Total** | **~$35-90/month** | **$0/month** |

## Features Still Available

✅ Video upload and storage  
✅ Project management  
✅ Job status tracking  
✅ All API endpoints  
✅ Authentication  
✅ Database operations  
✅ Frontend functionality  

## Advanced Processing (Optional)

When you need advanced video analysis:
1. Set up AWS credentials
2. Deploy the CDK infrastructure (`cd infra && npx cdk deploy`)
3. Add `STEP_FUNCTIONS_ARN` to environment variables
4. Advanced processing will trigger automatically

## Support

- Basic video management: Works with free services only
- Advanced processing: Requires AWS setup (optional)
- Documentation: Updated in [SETUP.md](./SETUP.md) and [PRODUCTION.md](./PRODUCTION.md)
- Issues: Create GitHub issues for help

## Next Steps

1. Try the free-tier deployment following [SETUP.md](./SETUP.md)
2. Test basic functionality with your videos
3. Add AWS processing later if needed
4. Scale up services as your usage grows

---

🎉 **Project Chimera is now accessible for everyone with free-tier services!**