/**
 * Videos API Route
 * POST /api/videos - Process video from URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, videoProjects, processingJobs, users } from '@/lib/db';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, originalUrl, projectId, filename, userId } = body;
    const videoUrl = url || originalUrl;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'url or originalUrl is required' },
        { status: 400 }
      );
    }

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    // Validate projectId is a valid UUID if provided
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let videoId: string;
    
    if (projectId && uuidRegex.test(projectId)) {
      // Check if a video already exists with this ID
      const { eq } = await import('drizzle-orm');
      const existingVideos = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId)).limit(1);
      
      if (existingVideos.length > 0) {
        // Video already exists, generate new UUID for this upload
        videoId = randomUUID();
      } else {
        // Use the provided projectId as videoId for first video
        videoId = projectId;
      }
    } else {
      // Invalid or missing projectId, generate new UUID
      videoId = randomUUID();
    }
    
    const jobId = randomUUID();
    
    // Ensure we have a user - create anonymous user if needed
    let effectiveUserId = userId;
    
    if (!effectiveUserId) {
      const anonymousUserId = '00000000-0000-0000-0000-000000000000';
      
      // Check if anonymous user exists, if not create it
      try {
        const { eq } = await import('drizzle-orm');
        const existingUser = await db.select().from(users).where(eq(users.id, anonymousUserId)).limit(1);
        
        if (existingUser.length === 0) {
          await db.insert(users).values({
            id: anonymousUserId,
            email: 'anonymous@system.local',
            name: 'Anonymous User'
          });
          console.log('Created anonymous user');
        }
      } catch (err) {
        // User creation failed, log error
        console.error('Anonymous user setup error:', err);
      }
      
      effectiveUserId = anonymousUserId;
    }

    // Create video project
    const [videoProject] = await db.insert(videoProjects).values({
      id: videoId,
      userId: effectiveUserId,
      title: filename || videoUrl.split('/').pop() || 'Untitled Video',
      status: 'uploading',
      sourceUrl: videoUrl,
      originalFilename: filename || videoUrl.split('/').pop() || 'video.mp4',
    }).returning();

    // Create processing job
    const [job] = await db.insert(processingJobs).values({
      id: jobId,
      projectId: videoId,
      jobType: 'transcription',
      status: 'pending',
      inputData: { url: videoUrl }
    }).returning();

    return NextResponse.json({
      success: true,
      video: {
        id: videoProject.id,
        filename: videoProject.originalFilename,
        url: videoUrl,
        projectId: videoProject.id,
        status: videoProject.status,
        createdAt: videoProject.createdAt.toISOString()
      },
      transcriptionJob: {
        id: job.id,
        videoId: videoProject.id,
        type: job.jobType,
        status: job.status,
        createdAt: job.createdAt.toISOString()
      },
      message: 'Video URL received. Processing will start automatically.'
    });
  } catch (error) {
    console.error('Error processing video URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      { 
        error: 'Failed to process video URL',
        message: errorMessage,
        stack: errorStack?.split('\n').slice(0, 3).join('\n')
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit a video URL.' },
    { status: 405 }
  );
}
