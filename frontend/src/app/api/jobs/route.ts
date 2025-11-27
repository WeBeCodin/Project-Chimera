/**
 * Database-backed Jobs API Route
 * GET /api/jobs - List jobs for a project (using real database)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, processingJobs, videoProjects } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    // projectId is optional now - we return all jobs for anonymous user
    // This simplifies the UX since we don't have proper multi-tenancy yet

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    // Fetch jobs from database with video project details
    // Note: We fetch all jobs for videos belonging to the anonymous user since we don't have
    // a proper workspace/project structure yet. This shows all user's videos.
    const dbJobs = await db
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
      .where(eq(videoProjects.userId, '00000000-0000-0000-0000-000000000000'))
      .orderBy(desc(processingJobs.createdAt))
      .limit(50);

    // Convert status to uppercase and map 'processing' to 'RUNNING' for UI compatibility
    const jobs = dbJobs.map(job => ({
      ...job,
      status: job.status === 'processing' ? 'RUNNING' : job.status.toUpperCase(),
      error: job.errorMessage
    }));

    return NextResponse.json({
      jobs,
      projectId,
      count: jobs.length,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching jobs from database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs from database' },
      { status: 500 }
    );
  }
}
