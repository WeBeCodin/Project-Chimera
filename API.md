# API Documentation

Project Chimera provides a RESTful API built with Vercel Functions and TypeScript. All endpoints use JSON for data exchange and follow REST conventions.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.vercel.app/api`

## Authentication

The API uses NextAuth.js for authentication. Most endpoints require authentication via session cookies.

## Endpoints

### Projects

#### GET /api/projects
Get all projects for the authenticated user.

**Response:**
```json
{
  "projects": [
    {
      "id": "proj_123",
      "name": "My Video Project",
      "description": "Project description",
      "userId": "user_456",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /api/projects
Create a new project.

**Request Body:**
```json
{
  "name": "Project Name",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "id": "proj_123",
  "name": "Project Name",
  "description": "Optional description",
  "userId": "user_456",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Videos

#### GET /api/videos
Get all videos for the authenticated user.

**Query Parameters:**
- `projectId` (optional): Filter videos by project ID

**Response:**
```json
{
  "videos": [
    {
      "id": "video_123",
      "filename": "sample-video.mp4",
      "originalUrl": "https://example.com/video.mp4",
      "s3Key": "videos/video_123.mp4",
      "projectId": "proj_123",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /api/videos/upload-url
Get a pre-signed URL for uploading a video to S3.

**Request Body:**
```json
{
  "filename": "my-video.mp4",
  "contentType": "video/mp4",
  "projectId": "proj_123"
}
```

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/signed-url",
  "videoId": "video_123",
  "s3Key": "videos/video_123.mp4"
}
```

#### POST /api/videos/upload-complete
Mark a video upload as complete and trigger processing.

**Request Body:**
```json
{
  "videoId": "video_123",
  "s3Key": "videos/video_123.mp4"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job_456"
}
```

#### GET /api/videos/[id]/analysis
Get analysis results for a video.

**Response:**
```json
{
  "video": {
    "id": "video_123",
    "filename": "sample-video.mp4",
    "originalUrl": "https://example.com/video.mp4"
  },
  "transcription": {
    "transcript": "Hello world, this is a test video...",
    "confidence": 0.95,
    "segments": [
      {
        "start": 0,
        "end": 5,
        "text": "Hello world"
      }
    ]
  },
  "detection": {
    "objects": ["person", "laptop", "desk"],
    "scenes": ["office", "indoor"],
    "faces": 1
  },
  "summarization": {
    "summary": "A brief summary of the video content",
    "keyPoints": ["Point 1", "Point 2"],
    "sentiment": "positive",
    "topics": ["technology", "presentation"]
  }
}
```

### Jobs

#### GET /api/jobs
Get all jobs for the authenticated user.

**Query Parameters:**
- `projectId` (optional): Filter jobs by project ID
- `status` (optional): Filter jobs by status (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)

**Response:**
```json
{
  "jobs": [
    {
      "id": "job_123",
      "type": "transcription",
      "status": "COMPLETED",
      "projectId": "proj_123",
      "videoId": "video_456",
      "metadata": {
        "duration": 120,
        "fileSize": 1048576
      },
      "result": {
        "transcriptUrl": "s3://bucket/transcript.json",
        "confidence": 0.95
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:05:00Z"
    }
  ]
}
```

#### GET /api/jobs/[id]/status
Get the status of a specific job.

**Response:**
```json
{
  "id": "job_123",
  "status": "RUNNING",
  "progress": 0.75,
  "message": "Processing video..."
}
```

#### PUT /api/jobs/[id]/update
Update a job status (typically used by processing workflows).

**Request Body:**
```json
{
  "status": "COMPLETED",
  "result": {
    "transcriptUrl": "s3://bucket/transcript.json"
  }
}
```

#### GET /api/jobs/[id]/results
Get the results of a completed job.

**Response:**
```json
{
  "jobId": "job_123",
  "status": "COMPLETED",
  "result": {
    "transcriptUrl": "s3://bucket/transcript.json",
    "thumbnailUrl": "s3://bucket/thumbnail.jpg",
    "duration": "00:02:30",
    "confidence": 0.95
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

## WebSocket Events

For real-time job updates, the frontend connects to job status WebSocket events:

```javascript
// Subscribe to job updates
const ws = new WebSocket('wss://your-domain.vercel.app/api/jobs/ws');
ws.onmessage = (event) => {
  const { jobId, status, progress } = JSON.parse(event.data);
  // Update UI with job status
};
```

## SDK Usage Example

```typescript
import { ChimeraClient } from '@chimera/shared';

const client = new ChimeraClient({
  apiUrl: 'https://your-domain.vercel.app/api'
});

// Upload a video
const uploadResult = await client.uploadVideo({
  file: videoFile,
  projectId: 'proj_123'
});

// Monitor job progress
const job = await client.getJob(uploadResult.jobId);
console.log(`Job status: ${job.status}`);
```