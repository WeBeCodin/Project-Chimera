/**
 * Job Processing Endpoint (Real AI + Database with Mock Fallback)
 * POST /api/jobs/[jobId]/process - Process video job
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, processingJobs } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface RouteContext {
  params: {
    jobId: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { jobId } = params;

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    // Check if jobId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(jobId);

    if (!isValidUUID) {
      return NextResponse.json(
        { error: 'Invalid job ID format. Must be a valid UUID.' },
        { status: 400 }
      );
    }

    // Query database for the job
    const [job] = await db
      .select()
      .from(processingJobs)
      .where(eq(processingJobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Start processing and WAIT for it to complete (Vercel kills background tasks)
    const result = await processJobAsync(jobId);

    return NextResponse.json({
      success: true,
      message: result.success ? 'Processing completed' : 'Processing failed',
      jobId,
      status: result.status,
      error: result.error
    });
  } catch (error) {
    console.error('Error starting job processing:', error);
    return NextResponse.json(
      { error: 'Failed to start processing' },
      { status: 500 }
    );
  }
}

// Process job with real AI (synchronously for Vercel compatibility)
async function processJobAsync(jobId: string): Promise<{success: boolean, status: string, error?: string}> {
  const startTime = Date.now();
  
  try {
    // Update to processing status
    await db
      .update(processingJobs)
      .set({
        status: 'processing',
        startedAt: new Date()
      })
      .where(eq(processingJobs.id, jobId));

    // Check if AI keys are configured
    if (!process.env.GROQ_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('AI API keys not configured. Please set GROQ_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.');
    }
    
    // Get job details to find video URL
    const [job] = await db
      .select()
      .from(processingJobs)
      .where(eq(processingJobs.id, jobId))
      .limit(1);
    
    if (!job) {
      throw new Error('Job not found');
    }

    let videoUrl = 'https://example.com/video.mp4'; // Fallback
    if (job.inputData && typeof job.inputData === 'object' && 'url' in job.inputData) {
      videoUrl = (job.inputData as { url: string }).url;
    }
    
    // Use real AI processing
    console.log(`[Job ${jobId}] Starting real AI processing for ${videoUrl}...`);
    
    const { processVideo } = await import('@/lib/video-processing');
    const result = await processVideo(videoUrl);
    
    const results = {
      transcription: result.transcription,
      detection: result.detection,
      summarization: result.summarization
    };
    
    console.log(`[Job ${jobId}] AI processing completed in ${Date.now() - startTime}ms`);

    // Mark as completed
    await db
      .update(processingJobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        outputData: results,
        durationMs: Date.now() - startTime
      })
      .where(eq(processingJobs.id, jobId));

    console.log(`Job ${jobId} completed successfully in ${Date.now() - startTime}ms`);
    return { success: true, status: 'completed' };
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await db
      .update(processingJobs)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorMessage,
        durationMs: Date.now() - startTime
      })
      .where(eq(processingJobs.id, jobId));
    
    return { success: false, status: 'failed', error: errorMessage };
  }
}
