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

### `/infra` - AWS CDK Infrastructure
Infrastructure-as-code using AWS CDK with TypeScript. Provisions S3 bucket, Lambda functions, and Step Functions for video processing workflows.

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
- **Backend**: Vercel Functions, Prisma, PostgreSQL
- **Infrastructure**: AWS CDK, S3, Lambda, Step Functions
- **State Management**: Zustand
- **UI Components**: Shadcn/UI
- **Animations**: Framer Motion
- **Text Editing**: Slate.js
- **Validation**: Zod schemas

## 🚀 Production Deployment

### One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FWeBeCodin%2FProject-Chimera&env=NEXTAUTH_SECRET,POSTGRES_PRISMA_URL,POSTGRES_URL_NON_POOLING,AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,S3_BUCKET_NAME&envDescription=Environment%20variables%20needed%20for%20Project%20Chimera&envLink=https%3A%2F%2Fgithub.com%2FWeBeCodin%2FProject-Chimera%23environment-variables&project-name=project-chimera&repository-name=project-chimera)

### Manual Deployment Steps

1. **Deploy Infrastructure (AWS CDK)**
   ```bash
   cd infra
   npm install
   npx cdk bootstrap
   npx cdk deploy
   ```

2. **Set up Vercel Postgres Database**
   - Create a new Vercel project
   - Add Vercel Postgres to your project
   - Copy the connection strings

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**
   Set the following in your Vercel dashboard:
   - `NEXTAUTH_SECRET` - Random secret for NextAuth.js
   - `NEXTAUTH_URL` - Your production domain
   - `POSTGRES_PRISMA_URL` - From Vercel Postgres
   - `POSTGRES_URL_NON_POOLING` - From Vercel Postgres
   - `AWS_REGION` - AWS region (e.g., us-east-1)
   - `AWS_ACCESS_KEY_ID` - AWS credentials
   - `AWS_SECRET_ACCESS_KEY` - AWS credentials
   - `S3_BUCKET_NAME` - From CDK deployment output

## 🔧 Environment Variables

### Backend (.env)
```env
# Database (from Vercel Postgres)
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.vercel.app"

# AWS Configuration  
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="chimera-videos-123456789012"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="https://your-domain.vercel.app"
```

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
