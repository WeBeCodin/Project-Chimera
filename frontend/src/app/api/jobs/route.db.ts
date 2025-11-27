/**
 * Database-backed Jobs API Route
 * GET /api/jobs - List jobs for a project (using real database)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, processingJobs, videoProjects } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      // Fall back to mock store if database not configured
      const { mockJobStore } = await import('@/lib/mock-job-store');
      const jobs = mockJobStore.getAll(projectId);
      return NextResponse.json({
        jobs,
        projectId,
        count: jobs.length,
        source: 'mock'
      });
    }

    // Fetch jobs from database with video project details
    const jobs = await db
      .select({
        id: processingJobs.id,
        type: processingJobs.jobType,
        status: processingJobs.status,
        createdAt: processingJobs.createdAt,
        startedAt: processingJobs.startedAt,
        completedAt: processingJobs.completedAt,
        errorMessage: processingJobs.errorMessage,
        outputData: processingJobs.outputData,
        video: {
          id: videoProjects.id,
          filename: videoProjects.originalFilename
        },
        project: {
          id: videoProjects.id,
          name: videoProjects.title
        }
      })
      .from(processingJobs)
      .leftJoin(videoProjects, eq(processingJobs.projectId, videoProjects.id))
      .where(eq(videoProjects.id, projectId))
      .orderBy(desc(processingJobs.createdAt))
      .limit(50);

    return NextResponse.json({
      jobs,
      projectId,
      count: jobs.length,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    
    // If database error, try mock fallback
    try {
      const searchParams = request.nextUrl.searchParams;
      const projectId = searchParams.get('projectId');
      const { mockJobStore } = await import('@/lib/mock-job-store');
      const jobs = mockJobStore.getAll(projectId || 'demo-project-123');
      return NextResponse.json({
        jobs,
        projectId,
        count: jobs.length,
        source: 'mock-fallback',
        warning: 'Using mock data due to database error'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: String(error) },
        { status: 500 }
      );
    }
  }
}
