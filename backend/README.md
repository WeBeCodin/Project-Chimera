# Backend

Vercel Functions API for Project Chimera.

## Features

- **Vercel Functions** for serverless API
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL
- **API Endpoints** for projects and jobs
- **Database Models**: User, Project, Video, Job with JobStatus enum

## Getting Started

```bash
npm install
npm run prisma:generate
npm run dev
```

## Scripts

- `dev` - Start Vercel development server
- `build` - Build TypeScript
- `lint` - Run ESLint
- `type-check` - Run TypeScript type checking
- `prisma:generate` - Generate Prisma client
- `prisma:push` - Push schema to database
- `prisma:studio` - Open Prisma Studio

## API Endpoints

### Projects
- `POST /api/projects` - Create a new project
- `GET /api/projects` - List all projects

### Jobs
- `POST /api/jobs` - Create a new job
- `GET /api/jobs` - List jobs (with optional filters)
- `GET /api/jobs/[id]/status` - Get job status

## Database Schema

The Prisma schema includes:
- **User** - User accounts
- **Project** - Video processing projects
- **Video** - Uploaded video files
- **Job** - Processing jobs with status tracking
- **JobStatus** - Enum for job states (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)

## Environment Variables

Create a `.env` file with:
```
POSTGRES_PRISMA_URL="your_postgres_connection_string"
POSTGRES_URL_NON_POOLING="your_postgres_direct_connection_string"
```

## Deployment

Deploy to Vercel with Postgres database integration.