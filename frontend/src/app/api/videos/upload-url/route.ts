/**
 * Video Upload URL API Route
 * POST /api/videos/upload-url - Get presigned upload URL
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'filename and contentType are required' },
        { status: 400 }
      );
    }

    // Check if Vercel Blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { 
          error: 'File uploads not configured',
          message: 'File upload functionality requires Vercel Blob storage. Please use the "Video URL" option instead, or configure BLOB_READ_WRITE_TOKEN environment variable.'
        },
        { status: 503 }
      );
    }

    // TODO: Implement Vercel Blob upload URL generation
    // const { put } = await import('@vercel/blob');
    // const blob = await put(filename, file, { access: 'public' });
    
    return NextResponse.json(
      { 
        error: 'File upload not yet implemented',
        message: 'Please use the "Video URL" option to process videos.'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
