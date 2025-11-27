# 🗄️ Database Setup Guide - Project Chimera

## Prerequisites Completed ✅
- Drizzle ORM schema defined (`frontend/src/lib/db/schema.ts`)
- Database client configured (`frontend/src/lib/db/index.ts`)
- Migration config ready (`frontend/drizzle.config.ts`)
- `.env.local` file created

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New project"**
3. Fill in:
   - **Name**: `project-chimera` (or any name)
   - **Database Password**: Generate or create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier
4. Click **"Create new project"** and wait ~2 minutes for provisioning

---

## Step 2: Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll to **"Connection Pooling"** section
3. **Important**: Select **"Transaction"** mode (not Session mode)
4. Copy the connection string. It should look like:
   ```
   postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
5. **Replace `[YOUR-PASSWORD]` with your actual database password!**

---

## Step 3: Add to Local Environment

1. Open `/workspaces/Project-Chimera/frontend/.env.local`
2. Paste your connection string:
   ```bash
   DATABASE_URL=postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

---

## Step 4: Add to Vercel (Production)

Run these commands from `/workspaces/Project-Chimera/frontend`:

```bash
# Add DATABASE_URL to production
vercel env add DATABASE_URL production

# When prompted, paste your Supabase connection string
# (the one with ?pgbouncer=true parameter)

# Also add to preview and development environments
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
```

**Tip**: Use the same connection string for all environments

---

## Step 5: Create Database Tables

From `/workspaces/Project-Chimera/frontend`, run:

```bash
npm run db:push
```

This will create all 15+ tables in your Supabase database:
- `processingJobs` - Job queue and status tracking
- `videoProjects` - Video project metadata
- `videoTranscriptions` - Transcription results with segments
- `videoScenes` - Scene detection results
- `timelineProjects` - Video editing timelines
- `exportJobs` - Export queue
- `users` - User accounts
- `conversations` - Chat history
- `messages` - Individual chat messages
- And more...

**Expected output**: You should see `✓ Everything's fine` or similar success message.

---

## Step 6: Verify Tables in Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. You should see all the tables listed
3. Click on `processingJobs` to verify schema

---

## Step 7: Optional - Add Storage & AI Keys

### Vercel Blob Storage (for video uploads):

1. Go to Vercel Dashboard → **Storage** → **Create Store**
2. Select **Blob** → Create
3. Copy the `BLOB_READ_WRITE_TOKEN`
4. Run:
   ```bash
   vercel env add BLOB_READ_WRITE_TOKEN production
   vercel env add BLOB_READ_WRITE_TOKEN preview
   vercel env add BLOB_READ_WRITE_TOKEN development
   ```

### AI API Keys (for video processing):

**Groq (Fast, Free):**
1. Go to https://console.groq.com/keys
2. Create an API key
3. Run:
   ```bash
   vercel env add GROQ_API_KEY production
   vercel env add GROQ_API_KEY preview
   vercel env add GROQ_API_KEY development
   ```

**Google Gemini (Free):**
1. Go to https://aistudio.google.com/app/apikey
2. Create an API key
3. Run:
   ```bash
   vercel env add GOOGLE_GENERATIVE_AI_API_KEY production
   vercel env add GOOGLE_GENERATIVE_AI_API_KEY preview
   vercel env add GOOGLE_GENERATIVE_AI_API_KEY development
   ```

Also add these to your local `.env.local` file.

---

## Step 8: Deploy with Database

From `/workspaces/Project-Chimera/frontend`:

```bash
# Build locally first to verify
npm run build

# Deploy to production
vercel --prod
```

The app will automatically detect `DATABASE_URL` and use the real database instead of the mock store!

---

## Verification Checklist

- [ ] Supabase project created
- [ ] Database password saved
- [ ] Connection string copied (Transaction mode)
- [ ] DATABASE_URL added to `.env.local`
- [ ] DATABASE_URL added to Vercel (production, preview, development)
- [ ] `npm run db:push` executed successfully
- [ ] Tables visible in Supabase Table Editor
- [ ] Local build successful (`npm run build`)
- [ ] Deployed to Vercel (`vercel --prod`)

---

## Testing

1. Go to your Vercel URL: `/projects`
2. Upload a video URL
3. Check Supabase → **Table Editor** → `processingJobs`
4. You should see the job appear in the database!

---

## Troubleshooting

**Error: "getaddrinfo ENOTFOUND"**
- Your DATABASE_URL is incorrect or missing
- Verify you added it to Vercel: `vercel env ls`

**Error: "password authentication failed"**
- Replace `[YOUR-PASSWORD]` in the connection string with your actual password
- Make sure there are no spaces or extra characters

**Error: "relation does not exist"**
- Tables not created yet
- Run `npm run db:push` from frontend directory

**Error: "drizzle-kit not found"**
- Install dependencies: `npm install` in frontend directory

**Tables not showing in Supabase**
- Check you're in the correct project
- Verify DATABASE_URL points to the right database
- Run `npm run db:studio` to open Drizzle Studio for local inspection

---

## Next Steps After Database Setup

1. **Switch API routes from mock to database** - Replace `/api/jobs/route.ts` with `/api/jobs/route.db.ts` logic
2. **Configure real video processing** - Add AI keys and implement actual transcription/analysis
3. **Set up authentication** - Enable Supabase Auth for multi-tenant support
4. **Deploy RAG pipeline** - Connect video embeddings for AI chat

---

## Commands Reference

```bash
# Navigate to frontend
cd /workspaces/Project-Chimera/frontend

# Install dependencies
npm install

# Generate migrations (if schema changes)
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio (local DB viewer)
npm run db:studio

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Check Vercel environment variables
vercel env ls

# Pull Vercel environment to local
vercel env pull
```

---

**Ready to continue?** Start with Step 1: Create your Supabase project! 🚀
