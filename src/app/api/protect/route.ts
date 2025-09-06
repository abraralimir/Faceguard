import { NextRequest, NextResponse } from 'next/server';
import { applyAiShielding } from '@/ai/flows/apply-ai-shielding';
import { embedInvisibleWatermark } from '@/ai/flows/embed-invisible-watermark';
import { randomUUID } from 'crypto';

// Node.js crypto module for hashing
import { createHash } from 'crypto';

// Basic in-memory rate limiting
const ipRequestCounts = new Map<string, number>();
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const currentCount = ipRequestCounts.get(ip) || 0;

  if (currentCount >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  ipRequestCounts.set(ip, currentCount + 1);
  // Reset count after the window
  setTimeout(() => {
    const count = ipRequestCounts.get(ip) || 1;
    ipRequestCounts.set(ip, count - 1);
  }, RATE_LIMIT_WINDOW_MS);

  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.ip ?? '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    let { imageDataUri } = body;

    if (!imageDataUri || typeof imageDataUri !== 'string' || !imageDataUri.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image data URI provided.' }, { status: 400 });
    }

    // --- Step 1: Apply AI Shielding ---
    // This is a placeholder call to a GenAI flow.
    const shieldingResult = await applyAiShielding({ photoDataUri: imageDataUri });
    let processedUri = shieldingResult.protectedPhotoDataUri;

    // --- Step 2: Embed Invisible Watermark ---
    // This is also a placeholder call to a GenAI flow.
    const watermarkPayload = randomUUID();
    const watermarkResult = await embedInvisibleWatermark({ 
      photoDataUri: processedUri,
      watermark: watermarkPayload,
    });
    processedUri = watermarkResult.watermarkedPhotoDataUri;

    // --- Step 3: Strip Metadata ---
    // TODO: The user will insert their Python pipeline for this.
    // For a Node.js implementation, a library like `sharp` would be used here.
    // As we are not adding new dependencies, this step is currently a placeholder.
    // Example with sharp:
    // const imageBuffer = Buffer.from(processedUri.split(',')[1], 'base64');
    // const strippedBuffer = await sharp(imageBuffer).withMetadata(false).toBuffer();
    // processedUri = `data:${fileMimeType};base64,${strippedBuffer.toString('base64')}`;

    // --- Step 4: Generate SHA-256 Hash ---
    const base64Data = processedUri.split(',')[1];
    if (!base64Data) {
        return NextResponse.json({ error: 'Could not extract image data for hashing.' }, { status: 500 });
    }
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const hash = createHash('sha256').update(imageBuffer).digest('hex');

    return NextResponse.json({
      processedImageUri: processedUri,
      hash: hash,
    });

  } catch (error) {
    console.error('Image processing failed:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during image processing.' }, { status: 500 });
  }
}
