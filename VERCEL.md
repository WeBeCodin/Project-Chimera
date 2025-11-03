# Vercel Configuration Guide

## Root vercel.json

The root `vercel.json` is intentionally minimal:

```json
{
  "version": 2
}
```

## Why So Simple?

This is a **monorepo** project with the main Next.js application located in the `frontend/` directory. 

### ❌ DO NOT Add These Fields to Root vercel.json

**DO NOT** add the following to the root `vercel.json`:
- `buildCommand` - Causes resource provisioning failures with workspace commands
- `outputDirectory` - Conflicts with Vercel's monorepo detection
- `installCommand` - Should be handled by Vercel automatically
- `name` - Project name should be set in Vercel dashboard

These configurations were previously causing deployment to fail with "Resource provisioning failed" error.

### ✅ Correct Deployment Configuration

There are two ways to deploy this monorepo to Vercel:

#### Option 1: Configure Root Directory in Vercel Dashboard (Recommended)

1. Go to your project on [vercel.com/dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings → General**
3. Under **Root Directory**, click **Edit**
4. Set it to: `frontend`
5. Click **Save**

Vercel will then automatically:
- Install dependencies from `frontend/package.json`
- Run `npm run build` in the frontend directory
- Deploy the Next.js application

#### Option 2: Deploy from Frontend Directory

```bash
cd frontend
vercel --prod
```

This deploys directly from the frontend directory without needing root directory configuration.

## Next.js API Routes (Backend)

The "backend" functionality is implemented as Next.js API routes located in:
```
frontend/src/app/api/
├── chat/
├── v2/
│   └── video/
│       ├── ai-assist/
│       ├── process/
│       ├── projects/
│       └── upload/
```

These API routes are automatically deployed as **Vercel Functions** when deploying the Next.js application.

### Testing API Routes Locally

```bash
cd frontend
npm run dev
# API routes available at http://localhost:3000/api/*
```

### API Route Configuration

Vercel Functions are configured in the Next.js route files using:
- `export const runtime = 'nodejs'` or `'edge'`
- `export const maxDuration = 60` (for longer-running functions)

No additional Vercel configuration is needed.

## Environment Variables

Set environment variables in Vercel:
1. Go to **Settings → Environment Variables**
2. Add required variables (see [PRODUCTION.md](./PRODUCTION.md))

## Troubleshooting

### "Resource provisioning failed" Error

This error occurs when:
- Invalid `buildCommand` with workspace syntax in root `vercel.json`
- Missing Root Directory configuration for monorepo
- Conflicting build configurations

**Solution**: Ensure root `vercel.json` is minimal and Root Directory is set to `frontend`.

### Build Works Locally But Fails on Vercel

1. Check that Root Directory is set to `frontend`
2. Verify environment variables are set correctly
3. Check build logs for specific errors
4. Ensure all dependencies are in `frontend/package.json`

## References

- [Vercel Monorepo Documentation](https://vercel.com/docs/monorepos)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Functions](https://vercel.com/docs/functions/serverless-functions)
