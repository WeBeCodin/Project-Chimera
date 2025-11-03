# Production Deployment Guide

This guide walks you through deploying Project Chimera to production using **free tier services only**: Vercel, Supabase, Groq, and Google Gemini.

## Prerequisites

- **Vercel Account** - [Sign up at vercel.com](https://vercel.com) (free tier)
- **Supabase Account** - [Sign up at supabase.com](https://supabase.com) (free tier)
- **Groq API Key** - [Get from console.groq.com](https://console.groq.com) (free tier)
- **Google Gemini API Key** - [Get from aistudio.google.com](https://aistudio.google.com/app/apikey) (free tier)
- **Node.js 18+** - For local build verification
- **Git** - Repository access

## Deployment Options

### Option 1: One-Click Deploy (Fastest)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FWeBeCodin%2FProject-Chimera&env=DATABASE_URL,GROQ_API_KEY,GOOGLE_GENERATIVE_AI_API_KEY,BLOB_READ_WRITE_TOKEN&envDescription=Environment%20variables%20for%20Project%20Chimera&envLink=https%3A%2F%2Fgithub.com%2FWeBeCodin%2FProject-Chimera%23environment-variables&project-name=project-chimera&repository-name=project-chimera)

1. Click the "Deploy" button above
2. Follow the Vercel deployment wizard
3. Add environment variables when prompted (see Step 3 below)
4. Wait for deployment to complete

### Option 2: Manual Deployment (Recommended)

Follow these steps for full control over your deployment:

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - **Name**: `project-chimera-prod`
   - **Database Password**: Use a strong password (save it securely)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait ~2 minutes for provisioning

### 1.2 Get Connection String

1. In Supabase dashboard, go to **Settings → Database**
2. Scroll to "Connection string" section
3. Select **"Connection pooling"**
4. Copy the URI (Transaction mode)
5. Replace `[YOUR-PASSWORD]` with your database password
6. Save this for Step 3

Example:
```
postgresql://postgres.xxx:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

## Step 2: Configure AI Providers

### 2.1 Get Groq API Key (Primary AI Provider)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create API Key"
5. Name it "Project Chimera Production"
6. Copy the key (starts with `gsk_`)
7. Save it securely

### 2.2 Get Google Gemini API Key (Fallback Provider)

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select "Create API key in new project"
5. Copy the key (starts with `AIza`)
6. Save it securely

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Link Repository

```bash
# From your project root
vercel login
vercel link
```

Follow the prompts to connect your GitHub repository.

### 3.3 Set Environment Variables

Add environment variables via Vercel CLI or dashboard:

**Via CLI:**
```bash
# Database
vercel env add DATABASE_URL production
# Paste your Supabase connection string

# AI Providers
vercel env add GROQ_API_KEY production
# Paste your Groq API key

vercel env add GOOGLE_GENERATIVE_AI_API_KEY production
# Paste your Gemini API key
```

**Via Dashboard:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add the following:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Your Supabase connection string | Production |
| `GROQ_API_KEY` | Your Groq API key | Production |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Your Gemini API key | Production |

### 3.4 Set Up Vercel Blob Storage

1. In Vercel dashboard, go to **Storage**
2. Click **Create Database** → **Blob**
3. Name it `project-chimera-videos`
4. The `BLOB_READ_WRITE_TOKEN` will be automatically added to your environment

### 3.5 Deploy

```bash
# Deploy to production
vercel --prod
```

Or push to your main branch if you have automatic deployments enabled.

## Step 4: Initialize Database Schema

After successful deployment:

```bash
# Clone the environment variables locally
vercel env pull

# Push database schema to Supabase
cd frontend
npm run db:push
```

This creates all necessary tables in your production database.

## Step 5: Verify Deployment

### 5.1 Check Deployment Status

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Check that deployment is successful
4. Note your production URL

### 5.2 Test Key Features

Visit your production URL and test:

1. **Homepage loads**: Check that the site is accessible
2. **AI Chat works**: Send a test message
3. **Streaming works**: Verify real-time AI responses
4. **Database works**: Check that conversations are saved
5. **Video upload** (if configured): Upload a test video

### 5.3 Check Logs

```bash
# View real-time logs
vercel logs --follow

# Or in Vercel dashboard → Logs
```

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain

1. In Vercel dashboard, go to **Settings → Domains**
2. Click **Add Domain**
3. Enter your domain name
4. Follow DNS configuration instructions

### 6.2 Update DNS Records

Add these records to your DNS provider:

**For root domain (example.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 6.3 Update Environment Variables

If using a custom domain, update `NEXTAUTH_URL`:

```bash
vercel env add NEXTAUTH_URL production
# Enter: https://yourdomain.com
```

## Step 7: Enable Analytics (Optional)

### 7.1 Vercel Analytics

Vercel Analytics is automatically enabled for all deployments. View metrics in:
- Vercel Dashboard → Analytics

### 7.2 Configure Speed Insights

Add to `frontend/app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## Monitoring and Maintenance

### Application Monitoring

**Vercel Dashboard:**
- **Analytics**: Track page views, users, and performance
- **Logs**: Real-time function execution logs
- **Speed Insights**: Core Web Vitals monitoring
- **Build Logs**: Deployment history and build output

**Supabase Dashboard:**
- **Database**: Query performance and connection pooling
- **Storage**: Database size and growth
- **Logs**: SQL query logs and errors
- **API**: API usage and rate limiting

### Performance Monitoring

Monitor these key metrics:

| Metric | Target | Dashboard |
|--------|--------|-----------|
| Time to First Byte (TTFB) | <100ms | Vercel Analytics |
| Streaming Latency | <500ms | Vercel Logs |
| Database Query Time | <200ms | Supabase |
| Function Duration | <10s | Vercel Functions |
| Error Rate | <1% | Vercel Logs |

### Cost Monitoring (Free Tier Limits)

**Vercel Free Tier:**
- ✅ 100GB bandwidth/month
- ✅ 6000 function hours/month
- ✅ 500MB Blob storage
- ⚠️ Monitor: Vercel Dashboard → Usage

**Supabase Free Tier:**
- ✅ 500MB database storage
- ✅ 2GB bandwidth/month
- ✅ 2 concurrent connections
- ⚠️ Monitor: Supabase Dashboard → Usage

**Groq Free Tier:**
- ✅ 30 requests per minute
- ✅ Unlimited requests per day
- ⚠️ Rate limit handled automatically with fallback

**Google Gemini Free Tier:**
- ✅ 60 requests per minute
- ✅ 1500 requests per day
- ⚠️ Used as fallback provider

## Troubleshooting Production Issues

### Deployment Failures

**Issue: Build fails with type errors**

```bash
# Check build locally first
npm run build
npm run type-check

# Fix errors and redeploy
git add .
git commit -m "Fix type errors"
git push
```

**Issue: Environment variables not found**

```bash
# Verify all variables are set
vercel env ls

# Pull environment variables locally
vercel env pull

# Check that variables exist in Vercel dashboard
```

### Database Issues

**Issue: Connection timeouts**

Solutions:
1. Check Supabase project is active
2. Verify DATABASE_URL uses connection pooling
3. Check connection limits (2 concurrent on free tier)
4. Restart Supabase project if needed

**Issue: Table doesn't exist**

```bash
# Push schema again
cd frontend
npm run db:push

# Or check Supabase SQL Editor
```

### AI Provider Issues

**Issue: All AI providers failing**

Solutions:
1. Check API keys in Vercel dashboard
2. Verify keys are valid in provider dashboards
3. Check rate limits (view Vercel logs)
4. Test providers individually:
   - Groq: [console.groq.com](https://console.groq.com)
   - Gemini: [aistudio.google.com](https://aistudio.google.com)

**Issue: Slow AI responses**

Solutions:
1. Check provider status pages
2. Review model selection in `/lib/ai/provider-factory.ts`
3. Consider switching default provider
4. Check network latency in Vercel region

### Video Upload Issues

**Issue: Upload fails or times out**

Solutions:
1. Check Blob storage quota (500MB free tier)
2. Verify BLOB_READ_WRITE_TOKEN is set
3. Check file size limits (<100MB recommended)
4. Review Vercel function timeout (10s default)

## Security Best Practices

### Environment Security

✅ **Do:**
- Use Vercel environment variables (encrypted)
- Rotate API keys every 90 days
- Enable Vercel authentication for preview deployments
- Use separate keys for staging and production

❌ **Don't:**
- Commit `.env` files to git
- Share API keys in code or comments
- Use production keys in development
- Store secrets in client-side code

### Database Security

✅ **Enabled by default in Supabase:**
- Row Level Security (RLS)
- SSL/TLS encryption
- Connection pooling
- IP allowlisting (optional)

✅ **Additional steps:**
1. Enable RLS policies for all tables
2. Create service role keys for admin operations
3. Use anon key for client access
4. Regular database backups

### API Security

✅ **Built-in protection:**
- Vercel Edge Network DDoS protection
- Automatic SSL certificates
- CORS configured correctly
- Rate limiting with Vercel KV

## Backup and Recovery

### Database Backups

**Automatic backups:**
- Supabase performs daily automatic backups
- 7-day retention on free tier
- Restore via Supabase dashboard

**Manual backup:**
```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Import backup
psql $DATABASE_URL < backup.sql
```

### Code Backups

**Git repository:**
- Main branch contains production code
- Tag releases: `git tag v1.0.0`
- Push tags: `git push --tags`

**Vercel deployments:**
- All deployments are immutable
- Instant rollback available
- 30-day deployment history

### Blob Storage Backups

Currently, Vercel Blob doesn't support automatic backups. For critical videos:

1. Download important files locally
2. Consider separate backup storage
3. Implement export functionality

## Scaling Considerations

### When to Upgrade

Consider upgrading from free tier when:

- **Traffic**: >100GB bandwidth/month
- **Storage**: >500MB database or Blob storage
- **Processing**: >6000 function hours/month
- **AI Usage**: Need higher rate limits

### Upgrade Path

1. **Vercel Pro** ($20/month):
   - 1TB bandwidth
   - 100GB Blob storage
   - Advanced analytics

2. **Supabase Pro** ($25/month):
   - 8GB database
   - 100GB bandwidth
   - Daily backups

3. **AI Providers**:
   - Groq: Currently free, paid tier TBD
   - Gemini: Pay-as-you-go for higher limits

## Deployment Checklist

Before going live, verify:

- [ ] All environment variables set correctly
- [ ] Database schema pushed and verified
- [ ] AI providers tested and working
- [ ] Video upload functionality tested
- [ ] Custom domain configured (if applicable)
- [ ] Analytics and monitoring enabled
- [ ] Error tracking configured
- [ ] Backup strategy in place
- [ ] Security best practices followed
- [ ] Performance metrics acceptable
- [ ] Free tier limits understood
- [ ] Upgrade path planned

## Support Resources

**Documentation:**
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)

**Status Pages:**
- [Vercel Status](https://status.vercel.com)
- [Supabase Status](https://status.supabase.com)
- [Groq Status](https://status.groq.com)

**Community:**
- GitHub Issues: [Project Chimera Issues](https://github.com/WeBeCodin/Project-Chimera/issues)
- Vercel Discord: [vercel.com/discord](https://vercel.com/discord)
- Supabase Discord: [supabase.com/discord](https://supabase.com/discord)

## Post-Deployment

After successful deployment:

1. **Monitor for 24 hours**: Watch logs and analytics
2. **Test all features**: Verify everything works in production
3. **Set up alerts**: Configure monitoring alerts
4. **Document custom changes**: Update team documentation
5. **Plan maintenance window**: Schedule regular updates
6. **Review security**: Regular security audits
7. **Optimize performance**: Based on real usage data

Congratulations! Your Project Chimera instance is now live in production! 🎉