/**
 * Video Upload API - Initialize video upload session
 * POST /api/v2/video/upload/initiate
 */

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createId } from '@paralleldrive/cuid2';
import type { UploadInitiateRequest, UploadInitiateResponse } from '@/lib/video/types';

export async function POST(request: NextRequest) {
  try {
    const body: UploadInitiateRequest = await request.json();
    
    // Validate request
    const validation = validateUploadRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate unique IDs
    const uploadId = createId();
    const projectId = body.projectId || createId();

    // Create video project record in database
    const project = await createVideoProject({
      id: projectId,
      workspaceId: body.metadata.workspaceId,
      userId: getUserIdFromRequest(request), // Extract from auth
      title: body.metadata.title,
      description: body.metadata.description,
      originalFilename: body.fileName,
      originalSizeBytes: body.fileSize,
      originalFormat: body.mimeType,
      status: 'uploading'
    });

    // Generate presigned URL for Vercel Blob upload
    const blobPath = `videos/original/${projectId}/${body.fileName}`;
    
    // For now, we'll return a basic response structure
    // In a full implementation, this would integrate with Vercel Blob
    const uploadUrl = `/api/v2/video/upload/chunk?uploadId=${uploadId}`;

    const response: UploadInitiateResponse = {
      uploadId,
      uploadUrl,
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      project: {
        id: projectId,
        status: 'uploading'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Upload initiation failed:', error);
    return NextResponse.json(
      { error: 'Failed to initiate upload' },
      { status: 500 }
    );
  }
}

function validateUploadRequest(body: UploadInitiateRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.fileName || typeof body.fileName !== 'string') {
    errors.push('fileName is required');
  }

  if (!body.fileSize || typeof body.fileSize !== 'number' || body.fileSize <= 0) {
    errors.push('fileSize must be a positive number');
  }

  if (body.fileSize > 5 * 1024 * 1024 * 1024) { // 5GB limit
    errors.push('File size exceeds 5GB limit');
  }

  if (!body.mimeType || typeof body.mimeType !== 'string') {
    errors.push('mimeType is required');
  }

  const supportedTypes = [
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/avi',
    'video/x-msvideo',
    'video/mkv',
    'video/x-matroska'
  ];

  if (!supportedTypes.includes(body.mimeType)) {
    errors.push(`Unsupported MIME type: ${body.mimeType}`);
  }

  if (!body.metadata) {
    errors.push('metadata is required');
  } else {
    if (!body.metadata.title || typeof body.metadata.title !== 'string') {
      errors.push('metadata.title is required');
    }
    if (!body.metadata.workspaceId || typeof body.metadata.workspaceId !== 'string') {
      errors.push('metadata.workspaceId is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Mock function - replace with actual database integration
async function createVideoProject(data: any) {
  // In a real implementation, this would use Supabase or another database
  console.log('Creating video project:', data);
  return {
    id: data.id,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Mock function - replace with actual auth integration
function getUserIdFromRequest(request: NextRequest): string {
  // In a real implementation, this would extract the user ID from JWT/session
  return 'user_' + createId();
}