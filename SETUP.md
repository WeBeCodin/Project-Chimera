# Database & Backend Setup Guide

## Overview

This guide explains how to set up and use the complete backend and database system for Project Chimera. The implementation includes:

- ✅ **Vercel Postgres Database** integration with Prisma ORM
- ✅ **Complete API Endpoints** for all core functionality  
- ✅ **NextAuth.js Authentication** (placeholder implementation)
- ✅ **Video Processing Pipeline** with automatic job creation
- ✅ **Job Status Tracking** system

## Quick Setup

### 1. Database Setup

1. Create a free Supabase PostgreSQL database:
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project 
   - Go to Settings > Database
   - Copy the connection string
   
2. Copy the connection string to `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/[database]"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

### 2. Deploy to Vercel

```bash
# Push database schema
cd backend
npm run prisma:push

# Deploy backend
vercel --prod
```

### 3. Test the System

```bash
# Test database connection
npm run db:setup
```

## API Usage Examples

### Authentication
```javascript
// Sign in user
POST /api/auth/signin
{
  "email": "user@example.com",
  "name": "John Doe"
}

// Get current user  
GET /api/auth/me?token=placeholder-token-user123
```

### Project Management
```javascript
// Create project
POST /api/projects
{
  "name": "My Video Project",
  "description": "Project description",
  "userId": "user123"
}

// List projects
GET /api/projects
```

### Video Processing Pipeline
```javascript
// Upload video (automatically creates transcription job)
POST /api/videos
{
  "filename": "interview.mp4",
  "originalUrl": "https://storage.com/video.mp4",
  "duration": 1800,
  "projectId": "project123"
}

// Response includes both video and auto-created job:
{
  "video": { "id": "video123", ... },
  "transcriptionJob": { "id": "job123", "status": "PENDING", ... },
  "message": "Video uploaded successfully and transcription job created"
}
```

### Job Management
```javascript
// List jobs for a project
GET /api/jobs?projectId=project123

// Check job status
GET /api/jobs/job123/status

// Create custom job
POST /api/jobs
{
  "type": "analysis",
  "projectId": "project123", 
  "videoId": "video123",
  "metadata": { "analysisType": "sentiment" }
}
```

## Database Schema

The system uses these main models:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  projects  Project[]
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  videos      Video[]
  jobs        Job[]
}

model Video {
  id          String   @id @default(cuid())
  filename    String
  originalUrl String
  processedUrl String?
  duration    Int?
  projectId   String
  jobs        Job[]
}

model Job {
  id          String    @id @default(cuid())
  type        String    // "transcription", "analysis", etc.
  status      JobStatus @default(PENDING)
  metadata    Json?
  result      Json?
  error       String?
  projectId   String
  videoId     String?
  startedAt   DateTime?
  completedAt DateTime?
}

enum JobStatus {
  PENDING | RUNNING | COMPLETED | FAILED | CANCELLED
}
```

## Deployment Architecture

```
Frontend (Next.js) → API Routes (Vercel Functions) → Prisma → Supabase PostgreSQL
                              ↓
                        Vercel Blob (File Storage)
                              ↓
                    Optional: AWS Lambda (Processing)
```

## Job Processing Flow

1. **Video Upload** → Uploads to Vercel Blob → Creates video record + analysis jobs
2. **Job Status Polling** → Frontend monitors job progress  
3. **Optional Processing** → AWS Lambda functions can update job status/results
4. **Results Storage** → Job results stored in database

## Security Notes

- The current authentication is a **placeholder implementation**
- In production, implement proper JWT tokens and session management
- Add proper input validation and rate limiting
- Secure database connections with proper SSL

## Testing

Use the provided test script to verify everything works:

```bash
cd backend
npm run db:setup
```

This creates test data and verifies all database operations work correctly.