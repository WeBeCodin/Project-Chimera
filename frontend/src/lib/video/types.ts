/**
 * Video Processing Types for Project Chimera
 * Core type definitions for video editing platform
 */

export interface VideoProject {
  id: string;
  workspaceId?: string;
  userId: string;
  title: string;
  description?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  
  // Original file info
  originalFilename: string;
  originalSizeBytes: number;
  originalFormat: string;
  
  // Processed versions
  sourceUrl: string; // Original in Vercel Blob
  proxyUrl?: string; // Low-res editing proxy
  previewUrl?: string; // Web-optimized preview
  
  // Video metadata
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
  
  // Processing metadata
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  processingError?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoScene {
  id: string;
  projectId: string;
  sceneIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  
  // Scene analysis
  dominantColor?: string;
  brightnessLevel?: number;
  motionIntensity?: number;
  
  // AI-generated
  description?: string;
  detectedObjects?: unknown[];
  detectedFaces?: unknown[];
  
  // Thumbnail
  thumbnailUrl?: string;
  keyframeUrl?: string;
  
  createdAt: Date;
}

export interface VideoTranscription {
  id: string;
  projectId: string;
  language: string;
  
  // Transcript segments
  segments: TranscriptionSegment[];
  fullText: string; // Complete transcript for search
  
  // AI processing
  modelUsed: string;
  processingTimeMs: number;
  confidenceAvg: number;
  
  createdAt: Date;
}

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

export interface ProcessingJob {
  id: string;
  projectId: string;
  jobType: 'upload' | 'transcode' | 'analyze' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Job details
  inputData: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorMessage?: string;
  
  // Metrics
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  
  createdAt: Date;
}

// Timeline Editor Types
export interface Timeline {
  id: string;
  projectId: string;
  tracks: Track[];
  duration: number;
  playhead: number;
  zoom: number; // pixels per second
  selection?: TimeRange;
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
  assetId: string; // Reference to video projects or other assets
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

export interface TimeRange {
  start: number;
  end: number;
}

export interface Marker {
  id: string;
  time: number;
  label?: string;
  color: string;
  type: 'standard' | 'chapter' | 'note';
}

// Video Processing Types
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  bitRate: number;
  codec: string;
  audioStreams: number;
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface UploadSession {
  id: string;
  uploadUrl: string;
  chunkSize: number;
  expiresAt: Date;
}

export interface UploadInitiateRequest {
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

export interface UploadInitiateResponse {
  uploadId: string;
  uploadUrl: string;
  chunkSize: number;
  expiresAt: string;
  project: {
    id: string;
    status: 'uploading';
  };
}

export interface ProcessVideoRequest {
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

export interface TranscodingResult {
  resolution: string;
  url: string;
  fileSize: number;
  bitRate: number;
}

export interface VideoAnalysis {
  transcription?: VideoTranscription;
  scenes?: VideoScene[];
  contentAnalysis?: {
    objects: DetectedObject[];
    faces: DetectedFace[];
    text: DetectedText[];
    emotions: EmotionAnalysis[];
  };
  audioAnalysis?: {
    silences: AudioSegment[];
    musicSegments: AudioSegment[];
    speechSegments: AudioSegment[];
    volume: VolumeAnalysis[];
  };
  recommendations?: AIRecommendation[];
}

export interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  timestamp: number;
}

export interface DetectedFace {
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  timestamp: number;
  attributes?: {
    age?: number;
    gender?: string;
    emotion?: string;
  };
}

export interface DetectedText {
  text: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  timestamp: number;
}

export interface EmotionAnalysis {
  timestamp: number;
  emotions: Record<string, number>; // emotion -> confidence
  dominantEmotion: string;
}

export interface AudioSegment {
  startTime: number;
  endTime: number;
  confidence?: number;
  volume?: number;
}

export interface VolumeAnalysis {
  timestamp: number;
  volume: number; // 0-1 scale
  peak: boolean;
}

export interface AIRecommendation {
  id: string;
  type: 'cut' | 'transition' | 'effect' | 'color_correction' | 'audio_enhancement';
  confidence: number;
  timeRange: { start: number; end: number };
  description: string;
  parameters?: Record<string, any>;
  reasoning: string;
}

// Export Job Types
export interface ExportRequest {
  format: 'mp4' | 'mov' | 'webm';
  quality: '4K' | '1080p' | '720p' | '480p';
  bitrate?: number;
  frameRate?: number;
  audioQuality: 'high' | 'medium' | 'low';
}

export interface ExportJob {
  id: string;
  projectId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Export configuration
  format: string;
  quality: string;
  bitrate?: number;
  frameRate?: number;
  
  // Output
  outputUrl?: string;
  fileSizeBytes?: number;
  
  // Processing metrics
  startedAt?: Date;
  completedAt?: Date;
  progressPercent: number;
  errorMessage?: string;
  
  createdAt: Date;
}