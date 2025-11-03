# Project Chimera

A modern AI-powered video editing platform built with the **Supercharger Manifesto v3.0** architecture. Features intelligent video processing, AI chat assistance, real-time streaming UI, and timeline-based editing.

🚀 **[Live Demo →](https://project-chimera-beta.vercel.app)**

## ✨ Features

- 🤖 **AI Chat Interface** - Streaming AI responses with multi-provider support (Groq, Google Gemini)
- 🎥 **Video Upload & Processing** - Drag-and-drop video upload with chunked uploads to Vercel Blob
- ⚡ **Smart AI Gateway** - Intelligent model selection with automatic fallback
- 📊 **Real-time Processing** - Live job status tracking and progress updates
- ✏️ **Timeline Editor** - Advanced timeline-based video editing with scene detection
- 🎯 **Scene Analysis** - AI-powered scene detection and analysis
- 📝 **Transcription** - Automated video transcription with timestamps
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## Architecture

**Built on Supercharger Manifesto v3.0 Principles:**
- **Specification First** - All features start with specs in `specs/`
- **Streaming First** - Real-time streaming UI with Vercel AI SDK
- **Free Tier Only** - Groq, Google Gemini, Supabase, Vercel (all free tiers)
- **Test Everything** - TDD approach with comprehensive testing
- **Production First** - Every feature is production-ready from day one

**Stack:**
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS v4, Vercel AI SDK
- **Database**: Supabase PostgreSQL with Drizzle ORM
- **AI Providers**: Groq (primary), Google Gemini (fallback)
- **Storage**: Vercel Blob for video files
- **State Management**: Zustand
- **Animations**: Framer Motion

## Quick Start

**Want to get started in 5 minutes?** Check out [QUICKSTART.md](./QUICKSTART.md) 🚀

### Prerequisites

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org)
- **npm** (comes with Node.js) or yarn
- **Supabase Account** - [Sign up at supabase.com](https://supabase.com) (Free tier)
- **Groq API Key** - [Get from console.groq.com](https://console.groq.com) (Free tier)
- **Google Gemini API Key** - [Get from aistudio.google.com](https://aistudio.google.com/app/apikey) (Free tier)
- **Vercel Account** - [Sign up at vercel.com](https://vercel.com) (Free tier for deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/WeBeCodin/Project-Chimera.git
   cd Project-Chimera
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase database**
   - Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
   - Go to Settings → Database
   - Copy the connection string (Connection Pooling)
   - Create `frontend/.env.local` and add:
     ```env
     DATABASE_URL="your-supabase-connection-string"
     ```

4. **Configure AI providers**
   - Get Groq API key from [console.groq.com](https://console.groq.com)
   - Get Google Gemini key from [aistudio.google.com](https://aistudio.google.com/app/apikey)
   - Add to `frontend/.env.local`:
     ```env
     GROQ_API_KEY="gsk_..."
     GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
     ```

5. **Set up Vercel Blob (for video storage)**
   - Install Vercel CLI: `npm install -g vercel`
   - Link your project: `vercel link`
   - Create a Blob store in Vercel dashboard → Storage → Create → Blob
   - Add token to `frontend/.env.local`:
     ```env
     BLOB_READ_WRITE_TOKEN="vercel_blob_..."
     ```

6. **Initialize database schema**
   ```bash
   cd frontend
   npm run db:push
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quick Commands

```bash
# Start development servers for all workspaces
npm run dev

# Build all packages
npm run build

# Run type checking
npm run type-check

# Lint all packages
npm run lint

# Database commands (from frontend directory)
cd frontend
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run db:generate  # Generate migrations
```

## Project Structure

### `/frontend` - Next.js 15 Application

The main application built with Next.js 15 App Router featuring:
- AI chat interface with streaming responses
- Video upload and processing pipeline
- Timeline-based video editor
- Scene detection and analysis
- Real-time transcription

**Key directories:**
- `src/app/` - Next.js pages and API routes
- `src/components/` - Reusable UI components
- `src/lib/ai/` - AI provider factory and types
- `src/lib/db/` - Database schema and client (Drizzle ORM)
- `src/lib/video/` - Video processing utilities

[Frontend Documentation](./frontend/README.md)

### `/backend` - Legacy Vercel Functions API

⚠️ **Note**: This workspace contains legacy API code using Prisma ORM. The current implementation uses Next.js API routes in the frontend workspace with Drizzle ORM.

[Backend Documentation](./backend/README.md)

### `/infra` - Infrastructure (AWS CDK)

⚠️ **Note**: This workspace contains AWS CDK infrastructure code that is not currently used in the Supercharger Manifesto v3.0 implementation. Video storage now uses Vercel Blob.

[Infrastructure Documentation](./infra/README.md)

### `/specs` - Feature Specifications

Complete specifications for all features following the "Specification First" principle:
- `specs/features/` - Individual feature specifications
- `specs/ai/` - AI provider integration specs
- `specs/ui/` - UI component specifications
- `specs/database/` - Database schema specifications

[Specifications Documentation](./specs/README.md)

## Database Schema

The Drizzle ORM schema (`frontend/src/lib/db/schema.ts`) includes:

**Core Tables:**
- **users** - User accounts and authentication (NextAuth.js compatible)
- **conversations** - AI chat conversation history
- **messages** - Individual chat messages with AI metadata
- **aiUsage** - AI provider usage metrics and analytics
- **rateLimits** - Rate limiting for free tier compliance

**Video Platform Tables:**
- **videoProjects** - Video project metadata and processing status
- **videoScenes** - Auto-detected scenes with AI analysis
- **videoTranscriptions** - Transcription segments with timestamps
- **timelineProjects** - Timeline editing state and export settings
- **processingJobs** - Video processing job tracking
- **exportJobs** - Video export job management

**Authentication Tables (NextAuth.js):**
- **accounts** - OAuth provider accounts
- **sessions** - User sessions
- **verificationTokens** - Email verification tokens

## Technology Stack

**Core Framework & Tools:**
- **Monorepo**: Turborepo with npm workspaces
- **Frontend Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4

**AI & ML:**
- **AI SDK**: Vercel AI SDK v3.4+ with streaming support
- **AI Providers**: Groq (Llama 3.1), Google Gemini 1.5
- **Model Selection**: Intelligent provider factory with fallback

**Database & Storage:**
- **Database**: Supabase PostgreSQL (free tier)
- **ORM**: Drizzle ORM with type safety
- **File Storage**: Vercel Blob for video files
- **Caching**: Vercel KV for rate limiting

**State & UI:**
- **State Management**: Zustand for client state
- **Animations**: Framer Motion for smooth transitions
- **Video Player**: Video.js with custom controls
- **Waveform**: WaveSurfer.js for audio visualization

**Development & Deployment:**
- **Deployment**: Vercel (free tier)
- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint with Next.js config
- **Testing**: Vitest (TDD approach)
- **Text Editing**: Slate.js
- **Validation**: Zod schemas

## 🚀 Production Deployment

### One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FWeBeCodin%2FProject-Chimera&env=DATABASE_URL,GROQ_API_KEY,GOOGLE_GENERATIVE_AI_API_KEY,BLOB_READ_WRITE_TOKEN&envDescription=Environment%20variables%20for%20Project%20Chimera&envLink=https%3A%2F%2Fgithub.com%2FWeBeCodin%2FProject-Chimera%23environment-variables&project-name=project-chimera&repository-name=project-chimera)

### Manual Deployment Steps

**Important**: This is a monorepo. When deploying to Vercel, you need to set the **Root Directory** to `frontend` in your Vercel project settings.

1. **Set up Supabase Database**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy the connection string from Settings → Database

2. **Configure AI Provider Keys**
   - Get Groq API key from [console.groq.com](https://console.groq.com)
   - Get Google Gemini key from [aistudio.google.com](https://aistudio.google.com/app/apikey)

3. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Link and configure for monorepo
   vercel link
   # When prompted, set Root Directory to: frontend
   
   # Deploy
   vercel --prod
   ```
   
   **Alternative**: Deploy from the frontend directory directly:
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Configure Environment Variables in Vercel**
   
   Go to your Vercel project → Settings → Environment Variables and add:
   
   ```env
   # Database
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
   
   # AI Providers
   GROQ_API_KEY=gsk_...
   GOOGLE_GENERATIVE_AI_API_KEY=AIza...
   
   # Vercel Blob (auto-configured if using Vercel Storage)
   BLOB_READ_WRITE_TOKEN=vercel_blob_...
   ```

5. **Initialize Database Schema**
   ```bash
   cd frontend
   npm run db:push
   ```

6. **Verify Deployment**
   - Visit your deployment URL
   - Test AI chat functionality
   - Upload a sample video
   - Check that all features work

See [PRODUCTION.md](./PRODUCTION.md) for detailed production deployment guide.

## 🔧 Environment Variables

### Frontend (.env.local)

Create `frontend/.env.local` with:

```env
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# AI Providers (Free Tier)
GROQ_API_KEY="gsk_..."
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# Optional: NextAuth.js (if using authentication)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Vercel AI Gateway
VERCEL_AI_GATEWAY_URL="https://gateway.vercel.ai/v1"
AI_GATEWAY_LOG_LEVEL="info"
```

### Backend (.env) - Legacy

⚠️ **Note**: The backend workspace is legacy code. Current implementation uses Next.js API routes in the frontend.

See [frontend/.env.example](./frontend/.env.example) for a complete template.

## Development Workflow

Project Chimera follows the **Supercharger Manifesto v3.0** development principles:

### 1. Specification First
- Check `specs/` directory before implementing features
- All features must have a specification
- Specifications are the single source of truth

### 2. Test-Driven Development
- Write tests before implementation
- Maintain ≥80% code coverage
- Run `npm test` frequently during development

### 3. Streaming First
- All AI interactions use `streamText` from Vercel AI SDK
- No blocking AI calls in user-facing features
- Progressive UI updates for better UX

### 4. Production First
- Every feature is production-ready from day one
- Deploy to Vercel staging environment frequently
- Monitor performance and error rates

### Daily Development Process
1. Review specifications for current feature
2. Write tests for new functionality
3. Implement feature with AI assistance
4. Run type checking: `npm run type-check`
5. Run linting: `npm run lint`
6. Run tests: `npm test`
7. Deploy to staging for integration testing

## 📁 Project Structure

```
Project-Chimera/
├── frontend/                 # Main Next.js 15 application
│   ├── src/
│   │   ├── app/             # App Router pages and API routes
│   │   │   ├── api/         # API route handlers
│   │   │   │   ├── chat/    # AI chat endpoints
│   │   │   │   └── v2/      # Video API v2
│   │   │   ├── demo/        # Demo pages
│   │   │   └── editor/      # Video editor
│   │   ├── components/      # Reusable UI components
│   │   │   ├── chat/        # Chat UI components
│   │   │   └── video/       # Video components
│   │   └── lib/             # Core utilities
│   │       ├── ai/          # AI provider factory
│   │       ├── db/          # Database (Drizzle ORM)
│   │       └── video/       # Video processing
│   └── .env.example         # Environment template
├── backend/                 # Legacy API (Prisma)
├── infra/                   # Legacy AWS CDK
├── specs/                   # Feature specifications
│   ├── features/            # Individual specs
│   ├── ai/                  # AI integration specs
│   └── database/            # Database specs
├── .github/
│   ├── copilot-instructions.md
│   └── instructions/
│       └── AGENT_INSTRUCTIONS.md
└── README.md
```
