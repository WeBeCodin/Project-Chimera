// Placeholder types for development without Prisma client generation
// In production, these will be replaced by actual Prisma generated types

export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Video {
  id: string;
  filename: string;
  originalUrl: string;
  processedUrl?: string;
  duration?: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  metadata?: any;
  result?: any;
  error?: string;
  projectId: string;
  videoId?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// Mock PrismaClient for development
export class PrismaClient {
  project = {
    create: async (data: any) => ({ id: 'mock', ...data.data }),
    findMany: async (options?: any) => [],
    findUnique: async (options: any) => null,
  };

  job = {
    create: async (data: any) => ({ id: 'mock', ...data.data }),
    findMany: async (options?: any) => [],
    findUnique: async (options: any) => null,
  };

  user = {
    create: async (data: any) => ({ id: 'mock', ...data.data }),
    findMany: async (options?: any) => [],
    findUnique: async (options: any) => null,
  };

  video = {
    create: async (data: any) => ({ id: 'mock', ...data.data }),
    findMany: async (options?: any) => [],
    findUnique: async (options: any) => null,
  };
}