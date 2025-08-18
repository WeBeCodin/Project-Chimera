# Project Chimera

A modern monorepo for video processing and transcript editing, built with Turborepo and npm workspaces.

## Architecture

- **Frontend**: Next.js 14+ app with App Router, TypeScript, Tailwind CSS, Shadcn/UI, Zustand, Framer Motion, and Slate.js for transcript editing
- **Backend**: Vercel Functions API with TypeScript, Prisma ORM, and PostgreSQL for project and job management
- **Infrastructure**: AWS CDK app with S3, Lambda, and Step Functions for video processing workflows
- **Shared**: Common TypeScript libraries with types, utilities, and React hooks

## Quick Start

```bash
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

## Development

The monorepo uses Turborepo for build orchestration and npm workspaces for dependency management. All packages share TypeScript configurations and can import from the shared library.

## Deployment

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Vercel with Postgres database
- **Infrastructure**: Deploy to AWS using CDK

## Environment Variables

Each workspace has its own environment requirements documented in their respective README files.