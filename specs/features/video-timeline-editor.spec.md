# Feature: Video Timeline Editor Interface

## Overview
Implement a professional-grade, browser-based video timeline editor that rivals desktop applications like Adobe Premiere or Final Cut Pro. This is the core editing interface where users perform cuts, add transitions, apply effects, and create their final video.

## User Stories
- As an editor, I want a familiar timeline interface similar to professional tools
- As a content creator, I want to make precise frame-accurate cuts
- As a user, I want real-time preview of my edits without rendering
- As a team member, I want to see who made which edits in collaborative projects
- As a mobile user, I want a responsive timeline that works on tablets

## Technical Requirements

### Core Timeline Implementation
```typescript
// src/lib/editor/timeline-types.ts
export interface Timeline {
  tracks: Track[];
  duration: number;
  playhead: number;
  zoom: number; // pixels per second
  selection: TimeRange | null;
  markers: Marker[];
}

export interface Track {
  id: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  name: string;
  locked: boolean;
  visible: boolean;
  clips: Clip[];
  height: number; // pixels
}

export interface Clip {
  id: string;
  assetId: string; // Reference to video_projects or other assets
  trackId: string;
  startTime: number; // Timeline position in seconds
  duration: number; // Clip duration
  inPoint: number; // Start point in source media
  outPoint: number; // End point in source media
  
  // Transformations
  scale: number;
  position: { x: number; y: number };
  rotation: number;
  opacity: number;
  
  // Effects & Transitions
  effects: Effect[];
  transitionIn?: Transition;
  transitionOut?: Transition;
  
  // Audio properties
  volume: number;
  audioFadeIn: number;
  audioFadeOut: number;
}

export interface Effect {
  id: string;
  type: string; // 'colorCorrection', 'blur', 'stabilization', etc.
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface Transition {
  type: 'cut' | 'dissolve' | 'wipe' | 'slide' | 'custom';
  duration: number;
  parameters?: Record<string, any>;
}
```

### Canvas-Based Rendering Engine
```typescript
// src/lib/editor/timeline-renderer.ts
export class TimelineRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrame: number;
  
  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    container.appendChild(this.canvas);
    
    this.setupEventListeners();
    this.startRenderLoop();
  }
  
  private startRenderLoop() {
    const render = () => {
      this.clearCanvas();
      this.drawRuler();
      this.drawTracks();
      this.drawClips();
      this.drawPlayhead();
      this.drawSelection();
      this.drawMarkers();
      
      this.animationFrame = requestAnimationFrame(render);
    };
    render();
  }
  
  private drawClips() {
    // Efficient clip rendering with culling
    const visibleRange = this.getVisibleTimeRange();
    
    this.timeline.tracks.forEach(track => {
      track.clips
        .filter(clip => this.isClipVisible(clip, visibleRange))
        .forEach(clip => {
          this.drawClip(clip, track);
          this.drawWaveform(clip);
          this.drawThumbnails(clip);
        });
    });
  }
  
  private drawWaveform(clip: Clip) {
    // Audio waveform visualization
    if (clip.audioData) {
      const peaks = this.getAudioPeaks(clip);
      this.ctx.fillStyle = '#00ff00';
      peaks.forEach((peak, i) => {
        const x = this.timeToPixel(clip.startTime) + i;
        const height = peak * clip.trackHeight;
        this.ctx.fillRect(x, clip.y, 1, height);
      });
    }
  }
}
```

### Video Preview System
```typescript
// src/lib/editor/preview-engine.ts
export class PreviewEngine {
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private timeline: Timeline;
  private isPlaying: boolean = false;
  
  constructor(container: HTMLElement, timeline: Timeline) {
    this.timeline = timeline;
    this.setupVideoElements(container);
    this.setupCompositor();
  }
  
  async renderFrame(timestamp: number) {
    // Get all clips at this timestamp
    const activeClips = this.getActiveClipsAt(timestamp);
    
    // Clear canvas
    const ctx = this.canvasElement.getContext('2d')!;
    ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    // Composite clips in track order
    for (const clip of activeClips) {
      await this.renderClip(ctx, clip, timestamp);
    }
    
    // Apply global effects
    await this.applyGlobalEffects(ctx);
  }
  
  private async renderClip(
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    timestamp: number
  ) {
    // Calculate source time
    const clipTime = timestamp - clip.startTime + clip.inPoint;
    
    // Seek video to correct time
    this.videoElement.currentTime = clipTime;
    await this.waitForSeek();
    
    // Apply transformations
    ctx.save();
    ctx.globalAlpha = clip.opacity;
    ctx.translate(clip.position.x, clip.position.y);
    ctx.rotate(clip.rotation);
    ctx.scale(clip.scale, clip.scale);
    
    // Draw video frame
    ctx.drawImage(this.videoElement, 0, 0);
    
    // Apply effects
    for (const effect of clip.effects) {
      await this.applyEffect(ctx, effect);
    }
    
    ctx.restore();
  }
}
```

## React Components

### Main Editor Component
```typescript
// app/(editor)/editor/[projectId]/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Timeline } from '@/components/editor/Timeline';
import { Preview } from '@/components/editor/Preview';
import { ToolPanel } from '@/components/editor/ToolPanel';
import { AssetBrowser } from '@/components/editor/AssetBrowser';
import { useTimeline } from '@/hooks/useTimeline';
import { useHotkeys } from '@/hooks/useHotkeys';

export default function VideoEditor({ params }: { params: { projectId: string } }) {
  const { timeline, updateTimeline, undo, redo } = useTimeline(params.projectId);
  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Keyboard shortcuts
  useHotkeys('space', () => togglePlayback());
  useHotkeys('cmd+z', () => undo());
  useHotkeys('cmd+shift+z', () => redo());
  useHotkeys('i', () => setInPoint());
  useHotkeys('o', () => setOutPoint());
  useHotkeys('delete', () => deleteSelected());
  
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top toolbar */}
      <div className="h-16 border-b border-gray-700 flex items-center px-4">
        <Button onClick={undo} disabled={!timeline.canUndo}>
          <UndoIcon />
        </Button>
        <Button onClick={redo} disabled={!timeline.canRedo}>
          <RedoIcon />
        </Button>
        {/* More tools... */}
      </div>
      
      {/* Main editor area */}
      <div className="flex-1 flex">
        {/* Asset browser */}
        <div className="w-64 border-r border-gray-700">
          <AssetBrowser projectId={params.projectId} />
        </div>
        
        {/* Center: Preview + Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Preview */}
          <div className="flex-1 bg-black">
            <Preview 
              timeline={timeline}
              playbackRate={playbackRate}
            />
          </div>
          
          {/* Timeline */}
          <div className="h-96 border-t border-gray-700">
            <Timeline
              timeline={timeline}
              onUpdate={updateTimeline}
              selectedClips={selectedClips}
              onSelectionChange={setSelectedClips}
            />
          </div>
        </div>
        
        {/* Right: Properties panel */}
        <div className="w-80 border-l border-gray-700">
          <ToolPanel
            selectedClips={selectedClips}
            timeline={timeline}
            onUpdate={updateTimeline}
          />
        </div>
      </div>
    </div>
  );
}
```

## API Endpoints

### Endpoint: `GET /api/v2/editor/timeline/:projectId`
**Purpose**: Load the timeline for a project

**Response**:
```typescript
interface TimelineResponse {
  timeline: Timeline;
  assets: Asset[]; // All media assets used in timeline
  lastModified: string;
  collaborators: User[]; // Currently editing
}
```

### Endpoint: `POST /api/v2/editor/timeline/:projectId/update`
**Purpose**: Save timeline changes

**Request**:
```typescript
interface TimelineUpdateRequest {
  operations: Operation[]; // Array of atomic operations
  timestamp: number; // Client timestamp for conflict resolution
}

type Operation = 
  | { type: 'ADD_CLIP'; track: string; clip: Clip }
  | { type: 'REMOVE_CLIP'; clipId: string }
  | { type: 'MOVE_CLIP'; clipId: string; newTime: number }
  | { type: 'TRIM_CLIP'; clipId: string; inPoint: number; outPoint: number }
  | { type: 'ADD_EFFECT'; clipId: string; effect: Effect }
  | { type: 'REMOVE_EFFECT'; clipId: string; effectId: string };
```

### Endpoint: `POST /api/v2/editor/export/:projectId`
**Purpose**: Export final video

**Request**:
```typescript
interface ExportRequest {
  format: 'mp4' | 'mov' | 'webm';
  quality: '4K' | '1080p' | '720p' | '480p';
  bitrate?: number;
  frameRate?: number;
  audioQuality: 'high' | 'medium' | 'low';
}
```

## Database Schema

```sql
-- Timeline Projects (extends video_projects)
CREATE TABLE timeline_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_project_id UUID REFERENCES video_projects(id) NOT NULL,
  timeline_data JSONB NOT NULL, -- Complete timeline state
  version INTEGER DEFAULT 1,
  
  -- Export settings
  export_settings JSONB,
  last_export_url TEXT,
  last_export_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Timeline Tracks
CREATE TABLE timeline_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES timeline_projects(id) ON DELETE CASCADE,
  track_index INTEGER NOT NULL,
  track_type TEXT NOT NULL, -- video, audio, text, effect
  name TEXT NOT NULL,
  locked BOOLEAN DEFAULT FALSE,
  visible BOOLEAN DEFAULT TRUE,
  height INTEGER DEFAULT 60,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Timeline Clips
CREATE TABLE timeline_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES timeline_tracks(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES video_projects(id),
  
  -- Timeline positioning
  start_time DECIMAL NOT NULL,
  duration DECIMAL NOT NULL,
  
  -- Source media trimming
  in_point DECIMAL NOT NULL DEFAULT 0,
  out_point DECIMAL NOT NULL,
  
  -- Transformations
  scale DECIMAL DEFAULT 1.0,
  position_x DECIMAL DEFAULT 0,
  position_y DECIMAL DEFAULT 0,
  rotation DECIMAL DEFAULT 0,
  opacity DECIMAL DEFAULT 1.0,
  
  -- Audio properties
  volume DECIMAL DEFAULT 1.0,
  audio_fade_in DECIMAL DEFAULT 0,
  audio_fade_out DECIMAL DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Effects applied to clips
CREATE TABLE clip_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID REFERENCES timeline_clips(id) ON DELETE CASCADE,
  effect_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  parameters JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transitions between clips
CREATE TABLE clip_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_clip_id UUID REFERENCES timeline_clips(id) ON DELETE CASCADE,
  to_clip_id UUID REFERENCES timeline_clips(id) ON DELETE CASCADE,
  transition_type TEXT NOT NULL,
  duration DECIMAL NOT NULL,
  parameters JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Timeline markers and annotations
CREATE TABLE timeline_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES timeline_projects(id) ON DELETE CASCADE,
  time_position DECIMAL NOT NULL,
  label TEXT,
  color TEXT DEFAULT '#ff0000',
  marker_type TEXT DEFAULT 'standard', -- standard, chapter, note
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Export jobs
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES timeline_projects(id),
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- Export configuration
  format TEXT NOT NULL,
  quality TEXT NOT NULL,
  bitrate INTEGER,
  frame_rate DECIMAL,
  
  -- Output
  output_url TEXT,
  file_size_bytes BIGINT,
  
  -- Processing metrics
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  progress_percent INTEGER DEFAULT 0,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_timeline_tracks_project ON timeline_tracks(project_id);
CREATE INDEX idx_timeline_clips_track ON timeline_clips(track_id);
CREATE INDEX idx_timeline_clips_time ON timeline_clips(start_time);
CREATE INDEX idx_clip_effects_clip ON clip_effects(clip_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
```

## Performance Requirements

- Timeline rendering: 60 FPS with smooth scrolling and zooming
- Clip manipulation: < 16ms response time for drag operations
- Video preview: < 100ms seek time for timeline scrubbing
- Effect preview: Real-time application without lag
- Export performance: < 3x video duration for standard quality
- Memory usage: < 4GB for 4K projects with 100+ clips

## Keyboard Shortcuts

```typescript
const KEYBOARD_SHORTCUTS = {
  // Playback
  'space': 'Toggle play/pause',
  'j': 'Rewind',
  'k': 'Pause',
  'l': 'Fast forward',
  
  // Editing
  'i': 'Set in point',
  'o': 'Set out point',
  'x': 'Cut at playhead',
  'v': 'Select tool',
  'r': 'Razor tool',
  
  // Timeline navigation
  'home': 'Go to start',
  'end': 'Go to end',
  'left': 'Previous frame',
  'right': 'Next frame',
  
  // Selection
  'cmd+a': 'Select all',
  'cmd+d': 'Deselect all',
  'delete': 'Delete selected',
  
  // History
  'cmd+z': 'Undo',
  'cmd+shift+z': 'Redo',
  
  // Timeline
  'cmd++': 'Zoom in',
  'cmd+-': 'Zoom out',
  'cmd+0': 'Zoom to fit'
};
```

## Test Scenarios

### Unit Tests
```typescript
// tests/unit/timeline-renderer.test.ts
describe('TimelineRenderer', () => {
  test('renders clips in correct positions', () => {
    const timeline = createMockTimeline();
    const renderer = new TimelineRenderer(mockContainer);
    
    renderer.setTimeline(timeline);
    
    expect(renderer.getClipPosition('clip-1')).toEqual({ x: 100, y: 50 });
  });
  
  test('handles clip overlaps correctly', () => {
    const overlappingClips = createOverlappingClips();
    const renderer = new TimelineRenderer(mockContainer);
    
    renderer.setTimeline({ tracks: [{ clips: overlappingClips }] });
    
    expect(renderer.hasOverlap()).toBe(true);
  });
});
```

### Integration Tests
```typescript
// tests/integration/timeline-api.test.ts
describe('Timeline API', () => {
  test('saves timeline operations', async () => {
    const operations = [
      { type: 'ADD_CLIP', track: 'track-1', clip: mockClip }
    ];
    
    const response = await fetch('/api/v2/editor/timeline/proj-1/update', {
      method: 'POST',
      body: JSON.stringify({ operations })
    });
    
    expect(response.ok).toBe(true);
  });
});
```

## Success Criteria

- [ ] Timeline supports 100+ clips without performance degradation
- [ ] Frame-accurate editing (1/30th second precision)
- [ ] Real-time preview at 30+ FPS
- [ ] Professional keyboard shortcuts implemented
- [ ] Collaborative editing with conflict resolution
- [ ] Export in multiple formats and qualities