/**
 * Mock Job Store - Vercel KV storage for demo jobs
 * Uses Vercel KV (Redis) for persistence across serverless function invocations
 */

import { kv } from '@vercel/kv';

interface MockJob {
  id: string;
  type: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  video: {
    id: string;
    filename: string;
  };
  project: {
    id: string;
    name: string;
  };
  result?: {
    transcription?: any;
    detection?: any;
    summarization?: any;
  };
}

// Fallback in-memory store if KV not available
const fallbackStore = new Map<string, MockJob>();
const hasKV = Boolean(process.env.KV_REST_API_URL);

export const mockJobStore = {
  async create(job: MockJob) {
    if (hasKV) {
      await kv.set(`job:${job.id}`, job);
      await kv.sadd(`project:${job.project.id}:jobs`, job.id);
    } else {
      fallbackStore.set(job.id, job);
    }
    return job;
  },

  async get(id: string): Promise<MockJob | undefined> {
    if (hasKV) {
      return await kv.get<MockJob>(`job:${id}`) || undefined;
    }
    return fallbackStore.get(id);
  },

  async getAll(projectId: string): Promise<MockJob[]> {
    if (hasKV) {
      const jobIds = await kv.smembers(`project:${projectId}:jobs`) as string[];
      const jobs = await Promise.all(
        jobIds.map(id => kv.get<MockJob>(`job:${id}`))
      );
      return jobs
        .filter((job): job is MockJob => job !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return Array.from(fallbackStore.values())
      .filter(job => job.project.id === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async update(id: string, updates: Partial<MockJob>): Promise<MockJob | undefined> {
    if (hasKV) {
      const job = await kv.get<MockJob>(`job:${id}`);
      if (!job) return undefined;
      const updated = { ...job, ...updates };
      await kv.set(`job:${id}`, updated);
      return updated;
    }
    const job = fallbackStore.get(id);
    if (!job) return undefined;
    
    const updated = { ...job, ...updates };
    jobStore.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return jobStore.delete(id);
  },

  clear() {
    jobStore.clear();
  }
};
