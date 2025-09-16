/**
 * Video Upload API - Handle chunked file upload
 * POST /api/v2/video/upload/chunk
 */

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createId } from '@paralleldrive/cuid2';
import { db, videoProjects, processingJobs } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface UploadChunkRequest {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  projectId: string;
}

interface UploadChunkResponse {
  success: boolean;
  chunksReceived: number;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chunk = formData.get('chunk') as File;
    const uploadId = formData.get('uploadId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const projectId = formData.get('projectId') as string;

    if (!chunk || !uploadId || isNaN(chunkIndex) || isNaN(totalChunks) || !projectId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Store chunk temporarily (in a real implementation, you'd use Redis or similar)
    const chunkKey = `upload:${uploadId}:chunk:${chunkIndex}`;
    
    // For now, we'll simulate storing chunks and track progress
    // In production, this would handle actual chunk storage and reassembly
    
    const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
    
    // If this is the final chunk, assemble the file and upload to Vercel Blob
    if (chunkIndex === totalChunks - 1) {
      // In production, reassemble all chunks here
      // For now, we'll use the final chunk as a placeholder for the complete file
      
      const filename = `video_${projectId}_${Date.now()}.mp4`;
      const blob = await put(filename, chunk, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      // Update video project with the upload URL
      await db
        .update(videoProjects)
        .set({
          sourceUrl: blob.url,
          status: 'processing',
          processingStartedAt: new Date(),
        })
        .where(eq(videoProjects.id, projectId));

      // Create a processing job to handle video analysis
      await db.insert(processingJobs).values({
        id: createId(),
        projectId,
        jobType: 'analyze',
        status: 'pending',
        inputData: {
          sourceUrl: blob.url,
          originalFilename: filename,
        },
      });

      const response: UploadChunkResponse = {
        success: true,
        chunksReceived: totalChunks,
        progress: 100,
      };

      return NextResponse.json(response);
    }

    // Return progress for non-final chunks
    const response: UploadChunkResponse = {
      success: true,
      chunksReceived: chunkIndex + 1,
      progress,
      estimatedTimeRemaining: totalChunks > chunkIndex + 1 
        ? Math.round((totalChunks - chunkIndex - 1) * 2) // Rough estimate
        : 0,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chunk upload failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload chunk' },
      { status: 500 }
    );
  }
}