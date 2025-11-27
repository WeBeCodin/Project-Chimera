/**
 * Video Upload Complete API Route
 * POST /api/videos/upload-complete - Mark upload as complete
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, blobUrl } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      );
    }

    // TODO: Mark upload complete and start processing
    // For now, return success
    return NextResponse.json({
      success: true,
      videoId,
      blobUrl,
      status: 'uploaded',
      message: 'Upload marked complete. Processing will start when database is configured.'
    });
  } catch (error) {
    console.error('Error marking upload complete:', error);
    return NextResponse.json(
      { error: 'Failed to mark upload complete' },
      { status: 500 }
    );
  }
}
