import { z } from 'zod';

// Job Status Enum
export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// User Types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// Project Types  
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Project = z.infer<typeof ProjectSchema>;

// Video Types
export const VideoSchema = z.object({
  id: z.string(),
  filename: z.string().min(1),
  originalUrl: z.string().url(),
  processedUrl: z.string().url().optional(),
  duration: z.number().positive().optional(),
  projectId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Video = z.infer<typeof VideoSchema>;

// Job Types
export const JobSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.nativeEnum(JobStatus),
  metadata: z.record(z.unknown()).optional(),
  result: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  projectId: z.string(),
  videoId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export type Job = z.infer<typeof JobSchema>;

// API Response Types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// API Request Types
export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  userId: z.string(),
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const CreateJobRequestSchema = z.object({
  type: z.string(),
  projectId: z.string(),
  videoId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;