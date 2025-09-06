import { NextRequest, NextResponse } from 'next/server';
import { applyAiShielding } from '@/ai/flows/apply-ai-shielding';
import { embedInvisibleWatermark } from '@/ai/flows/embed-invisible-watermark';
import sharp from 'sharp';

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
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { imageDataUri } = body;

    if (
      !imageDataUri ||
      typeof imageDataUri !== 'string' ||
      !imageDataUri.startsWith('data:image/')
    ) {
      return NextResponse.json(
        { error: 'Invalid image data URI provided.' },
        { status: 400 }
      );
    }

    const mimeType = imageDataUri.substring(
      imageDataUri.indexOf(':') + 1,
      imageDataUri.indexOf(';')
    );
    const base64Data = imageDataUri.split(',')[1];
    if (!base64Data) {
      return NextResponse.json(
        { error: 'Could not extract image data from URI.' },
        { status: 400 }
      );
    }
    let imageBuffer = Buffer.from(base64Data, 'base64');

    // --- Step 1: Apply AI Shielding ---
    imageBuffer = await applyAiShielding(imageBuffer);

    // --- Step 2: Embed Invisible Watermark ---
    imageBuffer = await embedInvisibleWatermark(imageBuffer);

    // --- Step 3: Strip Metadata ---
    imageBuffer = await sharp(imageBuffer).withMetadata({ exif: {} }).toBuffer();

    // --- Step 4: Generate SHA-256 Hash ---
    const hash = createHash('sha256').update(imageBuffer).digest('hex');

    const processedImageUri = `data:${mimeType};base64,${imageBuffer.toString(
      'base64'
    )}`;

    return NextResponse.json({
      processedImageUri: processedImageUri,
      hash: hash,
    });
  } catch (error) {
    console.error('Image processing failed:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during image processing.' },
      { status: 500 }
    );
  }
}
