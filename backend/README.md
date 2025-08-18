# Backend - Project Chimera

Vercel Functions API for Project Chimera with Prisma ORM and PostgreSQL database.

## Features

- **Vercel Functions** for serverless API
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL
- **NextAuth.js** for authentication (placeholder implementation)
- **API Endpoints** for users, projects, videos, and jobs
- **Database Models**: User, Project, Video, Job with JobStatus enum

## Getting Started

```bash
npm install
npm run prisma:generate
npm run dev
```

## Database Setup

1. Set up a Vercel Postgres database in your Vercel project
2. Copy the connection strings to your `.env` file:

```env
POSTGRES_PRISMA_URL="your_postgres_connection_string_with_pooling"
POSTGRES_URL_NON_POOLING="your_postgres_direct_connection_string"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="your-domain-url"
```

3. Push the database schema:
```bash
npm run prisma:push
```

4. Test the database connection:
```bash
npm run db:setup
```

## Scripts

- `dev` - Start Vercel development server
- `build` - Build TypeScript
- `lint` - Run ESLint
- `type-check` - Run TypeScript type checking
- `prisma:generate` - Generate Prisma client
- `prisma:push` - Push schema to database
- `prisma:studio` - Open Prisma Studio
- `db:setup` - Test database connection and create sample data

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User authentication (placeholder)
- `GET /api/auth/me` - Get current user (placeholder)

### Projects
- `POST /api/projects` - Create a new project
- `GET /api/projects` - List all projects

### Videos
- `POST /api/videos` - Upload video and create transcription job
- `GET /api/videos` - List videos (with optional project filter)

### Jobs
- `POST /api/jobs` - Create a new job
- `GET /api/jobs` - List jobs (with optional filters)
- `GET /api/jobs/[id]/status` - Get job status

## Database Schema

The Prisma schema includes:
- **User** - User accounts and authentication
- **Project** - Video processing projects owned by users
- **Video** - Uploaded video files with metadata
- **Job** - Processing jobs with status tracking and results
- **JobStatus** - Enum for job states (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)

## Environment Variables

Create a `.env` file with:
```
POSTGRES_PRISMA_URL="your_postgres_connection_string"
POSTGRES_URL_NON_POOLING="your_postgres_direct_connection_string"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Deployment

Deploy to Vercel with Postgres database integration. The Prisma client will be automatically generated during deployment.