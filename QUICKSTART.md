# Quick Start Guide - Project Chimera

Get Project Chimera running locally in **5 minutes**! ⚡

## Prerequisites (2 minutes)

You'll need free accounts for these services:

1. **Supabase** - [supabase.com](https://supabase.com) → New Project
2. **Groq** - [console.groq.com](https://console.groq.com) → API Keys
3. **Google Gemini** - [aistudio.google.com](https://aistudio.google.com/app/apikey) → Create API Key

## Setup Steps (3 minutes)

### 1. Clone and Install
```bash
git clone https://github.com/WeBeCodin/Project-Chimera.git
cd Project-Chimera
npm install
```

### 2. Configure Environment

Create `frontend/.env.local`:
```env
# From Supabase Dashboard → Settings → Database → Connection String
DATABASE_URL="postgresql://postgres.xxx:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"

# From Groq Console → API Keys
GROQ_API_KEY="gsk_..."

# From Google AI Studio → Get API Key
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
```

### 3. Initialize Database
```bash
cd frontend
npm run db:push
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## What's Included

✅ **AI Chat** - Streaming AI responses with Groq & Gemini  
✅ **Video Upload** - Chunked uploads to Vercel Blob  
✅ **Timeline Editor** - Advanced video editing interface  
✅ **Scene Detection** - AI-powered video analysis  
✅ **Transcription** - Automated video transcripts  

## Next Steps

- **Full Setup Guide** → [SETUP.md](./SETUP.md)
- **Production Deployment** → [PRODUCTION.md](./PRODUCTION.md)
- **Architecture Overview** → [specs/features/architecture-overview.spec.md](./specs/features/architecture-overview.spec.md)

## Troubleshooting

**Database connection fails?**
- Verify your Supabase project is active
- Check password in connection string
- Ensure you're using Connection Pooling URL

**AI not responding?**
- Verify API keys are correct (no extra spaces)
- Restart dev server after adding keys
- Check rate limits (Groq: 30/min, Gemini: 60/min)

**Need help?**
- [GitHub Issues](https://github.com/WeBeCodin/Project-Chimera/issues)
- [Full Documentation](./README.md)
- [Setup Guide](./SETUP.md)

## Technology Stack

- **Framework**: Next.js 15 + App Router
- **AI**: Vercel AI SDK + Groq + Google Gemini
- **Database**: Supabase PostgreSQL + Drizzle ORM
- **Storage**: Vercel Blob
- **Deployment**: Vercel (free tier)

**All free tier, no credit card required!** 💳❌

---

Built with the **Supercharger Manifesto v3.0** 🚀
