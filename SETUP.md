# Setup Guide - Project Chimera

## Overview

This guide explains how to set up and run Project Chimera locally for development. The platform is built on the **Supercharger Manifesto v3.0** architecture using:

- ✅ **Next.js 15** with App Router and TypeScript
- ✅ **Supabase PostgreSQL** with Drizzle ORM
- ✅ **Vercel AI SDK** with multi-provider support (Groq, Google Gemini)
- ✅ **Vercel Blob** for video file storage
- ✅ **Free Tier Only** - No paid services required for development

## Quick Setup (5 minutes)

### 1. Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org)
- **npm** (comes with Node.js)
- **Git** - For cloning the repository

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/WeBeCodin/Project-Chimera.git
cd Project-Chimera

# Install all dependencies
npm install
```

### 3. Set Up Supabase Database

1. **Create a Supabase project** (free tier):
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Choose a name and set a secure database password
   - Wait for the project to be created (~2 minutes)

2. **Get your database connection string**:
   - In Supabase dashboard, go to Settings → Database
   - Scroll to "Connection string" section
   - Select "Connection pooling" → "Transaction mode"
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your database password

3. **Create environment file**:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

4. **Add connection string to `.env.local`**:
   ```env
   DATABASE_URL="postgresql://postgres.xxx:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
   ```

### 4. Configure AI Providers (Free Tier)

#### Groq API Key (Primary AI Provider)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys
4. Create a new API key
5. Add to `frontend/.env.local`:
   ```env
   GROQ_API_KEY="gsk_..."
   ```

#### Google Gemini API Key (Fallback Provider)

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Add to `frontend/.env.local`:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
   ```

### 5. Set Up Vercel Blob Storage

For local development with video uploads:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Link your project**:
   ```bash
   vercel link
   ```

3. **Create a Blob store**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project (or create one)
   - Go to Storage → Create Database → Blob
   - Copy the `BLOB_READ_WRITE_TOKEN`

4. **Add to `.env.local`**:
   ```env
   BLOB_READ_WRITE_TOKEN="vercel_blob_..."
   ```

### 6. Initialize Database

```bash
cd frontend
npm run db:push
```

This will create all necessary tables in your Supabase database.

### 7. Start Development Server

```bash
# From the project root
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables Reference

Create `frontend/.env.local` with these variables:

```env
# Database (Required)
DATABASE_URL="postgresql://..."

# AI Providers (At least one required)
GROQ_API_KEY="gsk_..."
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."

# Vercel Blob (Required for video uploads)
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# Optional: NextAuth.js (if using authentication)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Vercel AI Gateway
VERCEL_AI_GATEWAY_URL="https://gateway.vercel.ai/v1"
AI_GATEWAY_LOG_LEVEL="info"

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="your-analytics-id"
```

## Testing Your Setup

### 1. Test AI Chat

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Try the AI chat interface
3. Send a message like "Hello, how are you?"
4. You should see a streaming response from the AI

### 2. Test Video Upload (if Blob storage configured)

1. Go to the video editor: [http://localhost:3000/editor](http://localhost:3000/editor)
2. Try uploading a small video file
3. Check that the upload progresses and completes

### 3. Test Database Connection

```bash
cd frontend
npm run db:studio
```

This opens Drizzle Studio at [http://localhost:4983](http://localhost:4983) where you can view and edit your database.

### 4. Run Type Checking

```bash
npm run type-check
```

This should complete without errors (ignore warnings).

### 5. Run Linting

```bash
npm run lint
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run type-check       # Check TypeScript types
npm run lint             # Lint code

# Database (from frontend/)
npm run db:push          # Push schema changes to database
npm run db:generate      # Generate migrations
npm run db:studio        # Open Drizzle Studio
npm run db:migrate       # Run migrations

# Deployment
vercel --prod           # Deploy to production
vercel                  # Deploy to preview
```

## Features to Test

Once setup is complete, you can test these features:

### ✅ AI Chat Interface
- Navigate to homepage
- Send messages and receive streaming AI responses
- Test conversation history
- Try different types of questions

### ✅ Video Upload
- Go to `/editor`
- Upload a video file
- Monitor upload progress
- View uploaded video

### ✅ Video Processing
- Auto-generated thumbnails
- Scene detection
- Timeline creation

### ✅ AI Video Assistant
- Chat about uploaded videos
- Get AI-generated descriptions
- Request scene analysis

## Architecture Overview

```
User Request
    ↓
Next.js App Router (frontend/)
    ↓
API Routes (/app/api/)
    ├─→ AI Provider Factory
    │   ├─→ Groq (Primary)
    │   └─→ Google Gemini (Fallback)
    ├─→ Drizzle ORM
    │   └─→ Supabase PostgreSQL
    └─→ Vercel Blob
        └─→ Video Storage
```

## Database Schema

Your Supabase database will have these tables:

**Core Tables:**
- `users` - User accounts
- `conversations` - Chat conversations
- `messages` - Chat messages
- `ai_usage` - AI usage tracking
- `rate_limits` - Rate limiting

**Video Tables:**
- `video_projects` - Video projects
- `video_scenes` - Scene metadata
- `video_transcriptions` - Transcripts
- `timeline_projects` - Timeline data
- `processing_jobs` - Job status
- `export_jobs` - Export tasks

**Auth Tables (NextAuth.js):**
- `accounts` - OAuth accounts
- `sessions` - User sessions
- `verification_tokens` - Email verification

## Troubleshooting

### Database Connection Issues

**Error: "Connection refused" or "Unable to connect"**

Solutions:
1. Verify your DATABASE_URL is correct
2. Check that Supabase project is active
3. Ensure you're using the Connection Pooling URL (with `pgbouncer=true`)
4. Test connection in Supabase dashboard SQL Editor

**Error: "Schema not found" or "Table doesn't exist"**

Solutions:
```bash
cd frontend
npm run db:push
```

### AI Provider Issues

**Error: "API key invalid" or "Authentication failed"**

Solutions:
1. Verify API keys are correctly copied (no extra spaces)
2. Check that keys are in `frontend/.env.local`
3. Restart the development server after adding keys
4. Test keys directly:
   - Groq: [console.groq.com](https://console.groq.com)
   - Gemini: [aistudio.google.com](https://aistudio.google.com)

**Error: "Rate limit exceeded"**

Solutions:
- Free tier limits: Groq (30 req/min), Gemini (60 req/min)
- Wait a few minutes and try again
- The system automatically falls back to alternate provider

### Build/Type Errors

**Error: Type checking fails**

Solutions:
```bash
# Check specific errors
npm run type-check

# Common fixes:
cd frontend
npm install @types/node --save-dev
npm run type-check
```

**Error: Module not found**

Solutions:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Video Upload Issues

**Error: "Blob token invalid"**

Solutions:
1. Verify BLOB_READ_WRITE_TOKEN in `.env.local`
2. Create Blob store in Vercel dashboard
3. Link project with `vercel link`
4. Pull environment variables: `vercel env pull`

**Error: "File too large"**

Solutions:
- Vercel Blob free tier: 500MB total storage
- Maximum file size: 100MB per file
- Compress video before uploading
- Use lower resolution for testing

### Port Already in Use

**Error: "Port 3000 is already in use"**

Solutions:
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Environment Variables Not Loading

**Error: "process.env.XXX is undefined"**

Solutions:
1. Ensure file is named `.env.local` (not `.env`)
2. Restart development server after changes
3. Check that variables don't have quotes in values
4. Verify file is in `frontend/` directory

### Getting Help

If you encounter issues not covered here:

1. **Check logs**: Look at terminal output for error messages
2. **Check browser console**: Open DevTools → Console
3. **Review specs**: Check `specs/` for feature documentation
4. **GitHub Issues**: Search or create an issue at [github.com/WeBeCodin/Project-Chimera/issues](https://github.com/WeBeCodin/Project-Chimera/issues)
5. **Supabase Status**: Check [status.supabase.com](https://status.supabase.com)
6. **Vercel Status**: Check [status.vercel.com](https://status.vercel.com)

## Next Steps

After completing the setup:

1. **Explore Features**: Try all the main features (chat, video upload, editor)
2. **Read Specifications**: Review `specs/` to understand the architecture
3. **Review Code**: Explore `frontend/src/lib/ai/` for AI integration
4. **Contribute**: See contributing guidelines in the repository
5. **Deploy**: Follow [PRODUCTION.md](./PRODUCTION.md) for deployment guide

## Free Tier Limits

Be aware of these free tier limits:

**Groq:**
- 30 requests per minute
- Llama 3.1 70B and 8B models included

**Google Gemini:**
- 60 requests per minute
- 1.5 Flash model included

**Supabase:**
- 500MB database storage
- 2GB bandwidth per month
- 2 simultaneous connections

**Vercel:**
- 100GB bandwidth per month
- 6000 serverless function execution hours
- 500MB Blob storage

The application is designed to stay within these limits for development and small-scale production use.