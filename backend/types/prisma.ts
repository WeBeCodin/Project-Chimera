// Prisma client types and exports with fallback support
// This handles both development (without generated client) and production

// Fallback types matching the Prisma schema
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
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
  projects?: Project[];
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  videos?: Video[];
  jobs?: Job[];
  _count?: {
    jobs: number;
  };
}

export interface Video {
  id: string;
  filename: string;
  originalUrl: string;
  processedUrl?: string | null;
  duration?: number | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  jobs?: Job[];
}

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  metadata?: any;
  result?: any;
  error?: string | null;
  projectId: string;
  videoId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  project?: Project;
  video?: Video;
}

// Try to import the real PrismaClient, fall back to our own implementation
let RealPrismaClient: any;
try {
  const prismaClient = require('@prisma/client');
  RealPrismaClient = prismaClient.PrismaClient;
} catch (error) {
  // Prisma client not generated, use mock
  RealPrismaClient = null;
}

// PrismaClient implementation that works in both dev and production
export class PrismaClient {
  private client: any;

  constructor() {
    if (RealPrismaClient) {
      this.client = new RealPrismaClient();
    } else {
      // Mock implementation for development
      this.client = null;
    }
  }

  get project() {
    if (this.client) {
      return this.client.project;
    }
    // Mock for development
    return {
      create: async (data: any) => ({ id: 'mock-project-id', ...data.data }),
      findMany: async (options?: any) => [],
      findUnique: async (options: any) => null,
    };
  }

  get job() {
    if (this.client) {
      return this.client.job;
    }
    // Mock for development
    return {
      create: async (data: any) => ({ id: 'mock-job-id', ...data.data }),
      findMany: async (options?: any) => [],
      findUnique: async (options: any) => null,
    };
  }

  get user() {
    if (this.client) {
      return this.client.user;
    }
    // Mock for development
    return {
      create: async (data: any) => ({ id: 'mock-user-id', ...data.data }),
      findMany: async (options?: any) => [],
      findUnique: async (options: any) => null,
    };
  }

  get video() {
    if (this.client) {
      return this.client.video;
    }
    // Mock for development
    return {
      create: async (data: any) => ({ id: 'mock-video-id', ...data.data }),
      findMany: async (options?: any) => [],
      findUnique: async (options: any) => null,
    };
  }
}