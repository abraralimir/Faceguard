import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoDataUri } = body as { videoDataUri: string };

    if (!videoDataUri || typeof videoDataUri !== 'string' || !videoDataUri.startsWith('data:video/')) {
      return NextResponse.json({ error: 'Invalid video data URI provided.' }, { status: 400 });
    }

    const base64Data = videoDataUri.split(',')[1];
    if (!base64Data) {
      return NextResponse.json({ error: 'Could not extract video data from URI.' }, { status: 400 });
    }
    const videoBuffer = Buffer.from(base64Data, 'base64');

    const hash = sha256(videoBuffer);
    
    return NextResponse.json({
      hash: hash,
      // We return the original URI so the client can still display the video.
      // The video itself is not modified.
      processedVideoUri: videoDataUri, 
    });

  } catch (error) {
    console.error('Video processing failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json(
      { error: `Video processing failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
    