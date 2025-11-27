/**
 * Videos List API Route
 * GET /api/videos/list - List all videos for the user
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, videoProjects } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    // Fetch all videos for anonymous user
    const videos = await db
      .select({
        id: videoProjects.id,
        title: videoProjects.title,
        description: videoProjects.description,
        status: videoProjects.status,
        sourceUrl: videoProjects.sourceUrl,
        originalFilename: videoProjects.originalFilename,
        durationSeconds: videoProjects.durationSeconds,
        width: videoProjects.width,
        height: videoProjects.height,
        createdAt: videoProjects.createdAt,
      })
      .from(videoProjects)
      .where(eq(videoProjects.userId, '00000000-0000-0000-0000-000000000000'))
      .orderBy(desc(videoProjects.createdAt))
      .limit(50);

    return NextResponse.json({
      videos,
      count: videos.length,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching videos from database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos from database' },
      { status: 500 }
    );
  }
}
