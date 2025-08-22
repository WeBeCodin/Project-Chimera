# Project Chimera

A modern video processing and transcript editing platform built with a Turborepo monorepo architecture. Upload videos, process them through AWS infrastructure, and edit transcripts with real-time collaboration.

🚀 **[Live Demo →](https://project-chimera-beta.vercel.app)**

## ✨ Features

- 🎥 **Video Upload & Processing** - Drag-and-drop, file select, and URL ingestion
- ☁️ **AWS S3 Storage** - Secure cloud storage with pre-signed URLs
- ⚡ **Step Functions Orchestration** - Automated transcription and analysis pipeline
- 📊 **Real-time Job Status** - Live polling and progress tracking
- ✏️ **Transcript Editor** - Rich text editing with Slate.js
- 👨‍💼 **Admin Monitoring** - System overview and job management
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Architecture

- **Frontend**: Next.js 14+ app with App Router, TypeScript, Tailwind CSS, Shadcn/UI, Zustand, Framer Motion, and Slate.js for transcript editing
- **Backend**: Vercel Functions API with TypeScript, Prisma ORM, and PostgreSQL for project and job management
- **Infrastructure**: AWS CDK app with S3, Lambda, and Step Functions for video processing workflows
- **Shared**: Common TypeScript libraries with types, utilities, and React hooks

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS Account (for infrastructure)
- Vercel Account (for deployment)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/WeBeCodin/Project-Chimera.git
cd Project-Chimera

# Install all dependencies
npm install

# Start development servers
npm run dev

# Build all packages
npm run build

# Run type checking
npm run type-check

# Lint all packages
npm run lint
```

## Workspaces

### `/frontend` - Next.js Application

Next.js 14+ with App Router, TypeScript, Tailwind CSS v4, Shadcn/UI components, Zustand state management, Framer Motion animations, and Slate.js for transcript editing.

[Frontend Documentation](./frontend/README.md)

### `/backend` - Vercel Functions API

Serverless API with TypeScript, Prisma ORM, and PostgreSQL. Includes endpoints for project creation, job management, and status polling.

[Backend Documentation](./backend/README.md)

### `/infra` - AWS CDK Infrastructure (Optional)

Infrastructure-as-code using AWS CDK with TypeScript. Provisions Lambda functions and Step Functions for advanced video processing workflows. **This is optional** - the system works with just Vercel Blob storage for basic video management.

[Infrastructure Documentation](./infra/README.md)

### `/packages/shared` - Shared Libraries

Common TypeScript libraries including Zod schemas, utility functions, and React hooks used across all workspaces.

[Shared Documentation](./packages/shared/README.md)

## Database Schema

The Prisma schema includes:

- **User** - User accounts and authentication
- **Project** - Video processing projects
- **Video** - Video file metadata and URLs
- **Job** - Processing jobs with status tracking
- **JobStatus** - Enum for job states (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)

## Technology Stack

- **Monorepo**: Turborepo with npm workspaces
- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS v4
- **Backend**: Vercel Functions, Prisma, PostgreSQL (Supabase/Vercel)
- **File Storage**: Vercel Blob (replaces S3)
- **Infrastructure**: AWS CDK (optional for advanced processing)
- **State Management**: Zustand
- **UI Components**: Shadcn/UI
- **Animations**: Framer Motion
- **Text Editing**: Slate.js
- **Validation**: Zod schemas

## 🔧 Environment Variables

### Backend (.env)

```env
# Database (Supabase PostgreSQL - Recommended)
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/[database]"

# Alternative: Vercel Postgres
# POSTGRES_PRISMA_URL="postgresql://..."
# POSTGRES_URL_NON_POOLING="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Optional: AWS Configuration (for advanced processing)
# AWS_REGION="us-east-1"
# AWS_ACCESS_KEY_ID="your-access-key"
# AWS_SECRET_ACCESS_KEY="your-secret-key"
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL="https://your-domain.vercel.app"
```

## 🚀 Production Deployment

### One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FWeBeCodin%2FProject-Chimera&env=NEXTAUTH_SECRET,DATABASE_URL,BLOB_READ_WRITE_TOKEN&envDescription=Environment%20variables%20needed%20for%20Project%20Chimera&envLink=https%3A%2F%2Fgithub.com%2FWeBeCodin%2FProject-Chimera%23environment-variables&project-name=project-chimera&repository-name=project-chimera)

### Manual Deployment Steps

1. **Set up Database**

   **Option A: Supabase PostgreSQL (Recommended - Free Tier)**
   - Create a free Supabase project at [supabase.com](https://supabase.com)
   - Go to Settings → Database and copy the connection string
   
   **Option B: Vercel Postgres**
   - Create a new Vercel project
   - Add Vercel Postgres to your project
   - Copy the connection strings

2. **Set up Vercel Blob Storage**

   - In your Vercel dashboard, go to Storage → Create → Blob
   - Create a new blob store and copy the token

3. **Deploy to Vercel**

   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**
   Set the following in your Vercel dashboard:
   - `NEXTAUTH_SECRET` - Random secret for NextAuth.js
   - `NEXTAUTH_URL` - Your production domain
   - `DATABASE_URL` - From Supabase (or use Vercel Postgres URLs)
   - `BLOB_READ_WRITE_TOKEN` - From Vercel Blob setup
   
   **Optional (for advanced processing):**
   - `AWS_REGION` - AWS region (e.g., us-east-1)
   - `AWS_ACCESS_KEY_ID` - AWS credentials
   - `AWS_SECRET_ACCESS_KEY` - AWS credentials
   - `STEP_FUNCTIONS_ARN` - Step Functions state machine ARN

## Development

The monorepo uses Turborepo for build orchestration and npm workspaces for dependency management. All packages share TypeScript configurations and can import from the shared library.

## 📁 Project Structure

```
project-chimera/
├── frontend/          # Next.js application
├── backend/           # Vercel Functions API
├── infra/            # AWS CDK infrastructure
├── packages/shared/  # Shared TypeScript libraries
├── vercel.json      # Vercel deployment config
└── turbo.json       # Turborepo configuration



<!-- Deployment trigger: August 21, 2025 -->

```

<<<<<<< HEAD

# <!-- Deployment trigger: August 21, 2025 -->

> > > > > > > 1304e7a99658f583a9db1fec687c65401777f17a
