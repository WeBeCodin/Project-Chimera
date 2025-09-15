# Feature: Video Upload & Processing Pipeline

## Overview
Enable users to upload video files for editing with automatic processing, transcoding, and AI-powered analysis. This is the foundation of the video editing platform, providing the core infrastructure for all subsequent editing features.

## User Stories
- As a content creator, I want to upload my raw footage quickly and reliably
- As an editor, I want automatic scene detection and timeline generation
- As a user, I want to see real-time processing progress with accurate ETAs
- As a team member, I want to access shared video projects in my workspace
- As a mobile user, I want optimized video versions for different devices

## Technical Requirements

### Core Upload Implementation
- [ ] Support for MP4, MOV, WebM, AVI, MKV formats
- [ ] Chunked upload for large files (up to 5GB on Vercel Blob)
- [ ] Resumable uploads with progress tracking
- [ ] Multi-file batch upload support
- [ ] Drag-and-drop interface with visual feedback
- [ ] Background upload while continuing to work

### Processing Pipeline
```typescript
// src/lib/video/processing-pipeline.ts
export interface VideoProcessingPipeline {
  stages: {
    upload: {
      provider: '@vercel/blob',
      maxSize: '5GB',
      chunking: true,
      resumable: true,
    },
    transcode: {
      formats: ['mp4', 'webm'],
      resolutions: ['4K', '1080p', '720p', '480p'],
      codec: 'h264' | 'h265' | 'av1',
      bitrate: 'adaptive',
    },
    analysis: {
      sceneDetection: true,
      audioExtraction: true,
      thumbnailGeneration: true,
      metadataExtraction: true,
      aiAnalysis: {
        transcription: 'whisper',
        objectDetection: 'yolo',
        faceRecognition: 'optional',
        colorGrading: 'auto',
      },
    },
    storage: {
      raw: '@vercel/blob',
      processed: '@vercel/blob',
      cache: '@vercel/kv',
      metadata: 'supabase',
    },
  }
}
```

### FFmpeg Integration
```typescript
// Browser-side processing for previews
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export class VideoProcessor {
  private ffmpeg: FFmpeg;
  
  async initialize() {
    this.ffmpeg = new FFmpeg();
    await this.ffmpeg.load({
      coreURL: '/ffmpeg/ffmpeg-core.js',
      wasmURL: '/ffmpeg/ffmpeg-core.wasm',
    });
  }
  
  async generateThumbnail(videoBlob: Blob, timestamp: number): Promise<Blob> {
    await this.ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));
    await this.ffmpeg.exec([
      '-i', 'input.mp4',
      '-ss', timestamp.toString(),
      '-frames:v', '1',
      '-f', 'image2',
      'thumbnail.jpg'
    ]);
    const data = await this.ffmpeg.readFile('thumbnail.jpg');
    return new Blob([data], { type: 'image/jpeg' });
  }
  
  async extractAudioTrack(videoBlob: Blob): Promise<Blob> {
    await this.ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));
    await this.ffmpeg.exec([
      '-i', 'input.mp4',
      '-vn',
      '-acodec', 'libmp3lame',
      'audio.mp3'
    ]);
    const data = await this.ffmpeg.readFile('audio.mp3');
    return new Blob([data], { type: 'audio/mp3' });
  }
}
```

## API Specification

### Endpoint: `POST /api/v2/video/upload/initiate`
**Purpose**: Initialize a new video upload session

**Request**:
```typescript
interface UploadInitiateRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  projectId?: string;
  metadata: {
    title: string;
    description?: string;
    tags?: string[];
    workspaceId: string;
  };
}
```

**Response**:
```typescript
interface UploadInitiateResponse {
  uploadId: string;
  uploadUrl: string; // Presigned URL for Vercel Blob
  chunkSize: number;
  expiresAt: string;
  project: {
    id: string;
    status: 'uploading';
  };
}
```

### Endpoint: `POST /api/v2/video/upload/chunk`
**Purpose**: Upload a chunk of the video file

**Request**:
```typescript
interface UploadChunkRequest {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  data: ArrayBuffer; // Binary chunk data
}
```

**Response**:
```typescript
interface UploadChunkResponse {
  success: boolean;
  chunksReceived: number;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
}
```

### Endpoint: `POST /api/v2/video/process`
**Purpose**: Trigger video processing after upload

**Request**:
```typescript
interface ProcessVideoRequest {
  projectId: string;
  processingOptions: {
    generateProxies: boolean;
    autoTranscribe: boolean;
    detectScenes: boolean;
    extractKeyframes: boolean;
    aiEnhancements: {
      stabilization: boolean;
      colorCorrection: boolean;
      noiseReduction: boolean;
    };
  };
}
```

**Response** (Server-Sent Events):
```typescript
// Stage updates streamed to client
data: {
  "type": "processing_stage",
  "stage": "transcoding",
  "progress": 45,
  "message": "Creating 1080p version..."
}

data: {
  "type": "scene_detected",
  "sceneId": "scene_001",
  "startTime": 0,
  "endTime": 5.5,
  "thumbnail": "blob:..."
}

data: {
  "type": "transcription_segment",
  "text": "Hello, welcome to my video",
  "startTime": 0,
  "endTime": 2.5,
  "confidence": 0.95
}

data: {
  "type": "processing_complete",
  "projectId": "proj_123",
  "duration": 120,
  "scenes": 24,
  "editableUrl": "/editor/proj_123"
}
```

## Data Models

```sql
-- Video Projects
CREATE TABLE video_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'uploading', -- uploading, processing, ready, error
  
  -- Original file info
  original_filename TEXT,
  original_size_bytes BIGINT,
  original_format TEXT,
  
  -- Processed versions
  source_url TEXT, -- Original in Vercel Blob
  proxy_url TEXT, -- Low-res editing proxy
  preview_url TEXT, -- Web-optimized preview
  
  -- Video metadata
  duration_seconds DECIMAL,
  width INTEGER,
  height INTEGER,
  fps DECIMAL,
  bitrate INTEGER,
  codec TEXT,
  
  -- Processing metadata
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  processing_error TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Video Scenes (auto-detected)
CREATE TABLE video_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES video_projects(id) ON DELETE CASCADE,
  scene_index INTEGER NOT NULL,
  start_time DECIMAL NOT NULL,
  end_time DECIMAL NOT NULL,
  duration DECIMAL GENERATED ALWAYS AS (end_time - start_time) STORED,
  
  -- Scene analysis
  dominant_color TEXT,
  brightness_level DECIMAL,
  motion_intensity DECIMAL,
  
  -- AI-generated
  description TEXT,
  detected_objects JSONB,
  detected_faces JSONB,
  
  -- Thumbnail
  thumbnail_url TEXT,
  keyframe_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Video Transcriptions
CREATE TABLE video_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES video_projects(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'en',
  
  -- Transcript segments
  segments JSONB NOT NULL, -- Array of {text, start, end, confidence}
  full_text TEXT, -- Complete transcript for search
  
  -- AI processing
  model_used TEXT DEFAULT 'whisper',
  processing_time_ms INTEGER,
  confidence_avg DECIMAL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Processing Jobs
CREATE TABLE video_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES video_projects(id),
  job_type TEXT NOT NULL, -- upload, transcode, analyze, export
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- Job details
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  
  -- Metrics
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_workspace ON video_projects(workspace_id);
CREATE INDEX idx_projects_status ON video_projects(status);
CREATE INDEX idx_scenes_project ON video_scenes(project_id);
CREATE INDEX idx_transcriptions_project ON video_transcriptions(project_id);
CREATE INDEX idx_jobs_project_status ON video_processing_jobs(project_id, status);
```

## Test Scenarios

### E2E Tests (Playwright)
```typescript
// tests/e2e/video-upload.spec.ts
test.describe('Video Upload & Processing', () => {
  test('uploads video file successfully', async ({ page }) => {
    await page.goto('/upload');
    
    // Upload a test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-video.mp4');
    
    // Verify upload progress
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-progress"]')).toHaveAttribute(
      'aria-valuenow',
      '100',
      { timeout: 30000 }
    );
    
    // Verify processing starts
    await expect(page.locator('[data-testid="processing-status"]')).toContainText('Processing');
    
    // Wait for completion
    await expect(page.locator('[data-testid="edit-button"]')).toBeEnabled({ timeout: 60000 });
  });
  
  test('handles upload interruption gracefully', async ({ page, context }) => {
    await page.goto('/upload');
    
    // Start upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/large-video.mp4');
    
    // Wait for upload to start
    await page.waitForTimeout(2000);
    
    // Simulate network interruption
    await context.setOffline(true);
    
    // Verify error handling
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('Connection lost');
    
    // Restore connection
    await context.setOffline(false);
    
    // Verify resume capability
    await expect(page.locator('[data-testid="resume-upload"]')).toBeVisible();
    await page.click('[data-testid="resume-upload"]');
    
    // Verify upload continues
    await expect(page.locator('[data-testid="upload-progress"]')).toHaveAttribute(
      'aria-valuenow',
      /[1-9]\d*/
    );
  });
});
```

### Unit Tests (Jest)
```typescript
// tests/unit/video-processor.test.ts
describe('VideoProcessor', () => {
  let processor: VideoProcessor;
  
  beforeEach(async () => {
    processor = new VideoProcessor();
    await processor.initialize();
  });
  
  test('generates thumbnail at specific timestamp', async () => {
    const videoBlob = new Blob([testVideoData], { type: 'video/mp4' });
    const thumbnail = await processor.generateThumbnail(videoBlob, 5.0);
    
    expect(thumbnail).toBeInstanceOf(Blob);
    expect(thumbnail.type).toBe('image/jpeg');
    expect(thumbnail.size).toBeGreaterThan(0);
  });
  
  test('extracts audio track from video', async () => {
    const videoBlob = new Blob([testVideoData], { type: 'video/mp4' });
    const audio = await processor.extractAudioTrack(videoBlob);
    
    expect(audio).toBeInstanceOf(Blob);
    expect(audio.type).toBe('audio/mp3');
  });
  
  test('handles corrupted video gracefully', async () => {
    const corruptedBlob = new Blob(['invalid data'], { type: 'video/mp4' });
    
    await expect(processor.generateThumbnail(corruptedBlob, 0)).rejects.toThrow();
  });
});
```

## Performance Requirements

- Upload speed: ≥ 10 MB/s for users with sufficient bandwidth
- Processing time: < 2x video duration for standard processing
- Thumbnail generation: < 500ms per thumbnail
- Scene detection: < 1x video duration
- Transcription: < 0.5x video duration with Whisper
- Storage efficiency: Proxy files < 10% of original size

## Security Considerations

- [ ] Virus scanning on all uploaded files
- [ ] Content moderation for public projects
- [ ] Signed URLs with expiration for all media access
- [ ] Rate limiting on upload endpoints
- [ ] File type validation beyond MIME types
- [ ] Maximum file size enforcement at multiple layers

## Success Criteria

- [ ] 99.9% upload success rate for files < 1GB
- [ ] Average processing time < 2x video duration
- [ ] Zero data loss incidents
- [ ] User satisfaction score > 4.5/5 for upload experience
- [ ] Support for 4K video processing
- [ ] Concurrent upload support for 100+ users