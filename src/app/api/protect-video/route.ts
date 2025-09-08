import { NextRequest, NextResponse } from 'next/server';
import { protectVideo } from '@/ai/flows/protect-video';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoDataUri } = body as { videoDataUri: string };

    if (!videoDataUri || typeof videoDataUri !== 'string' || !videoDataUri.startsWith('data:video/')) {
      return NextResponse.json({ error: 'Invalid video data URI provided.' }, { status: 400 });
    }

    const result = await protectVideo({ videoDataUri });
    
    return NextResponse.json({
      processedVideoUri: result.processedVideoUri,
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

    