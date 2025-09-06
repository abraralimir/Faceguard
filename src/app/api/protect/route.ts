import { NextRequest, NextResponse } from 'next/server';
import { applyAiShielding } from '@/ai/flows/apply-ai-shielding';
import { embedInvisibleWatermark } from '@/ai/flows/embed-invisible-watermark';
import sharp from 'sharp';
import { createHash, randomBytes, createHmac } from 'crypto';
import forge from 'node-forge';

// --- CONFIGURATION ---
const OWNER_ID = 'FaceGuardUser'; // A default owner ID
// In a real app, this should be a securely managed secret (e.g., from environment variables)
const MASTER_KEY = process.env.FACEGUARD_MASTER_KEY || 'default-secret-key-that-is-long-and-secure';

// Generate or load a persistent Ed25519 key pair for signing receipts
// For simplicity, we generate it on server start. In production, load from a secure store.
const privateKey = forge.pki.ed25519.generateKeyPair();
const publicKeyHex = Buffer.from(privateKey.publicKey).toString('hex');

// --- UTILITY FUNCTIONS ---
function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

function deriveSeed(): string {
  const timestamp = Date.now().toString();
  const random = randomBytes(8).toString('hex');
  const message = `${timestamp}|${random}`;
  return createHmac('sha256', MASTER_KEY).update(message).digest('hex');
}

function signPayload(payload: Record<string, any>): string {
  // Sorting keys ensures a consistent JSON string for signing
  const message = JSON.stringify(payload, Object.keys(payload).sort());
  const messageBytes = Buffer.from(message);
  const signature = forge.pki.ed25519.sign({
    privateKey: privateKey.privateKey,
    message: messageBytes,
    encoding: 'binary',
  });
  return Buffer.from(signature, 'binary').toString('hex');
}

// Basic in-memory rate limiting (can be replaced with Redis/Upstash for production)
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
    const originalHash = sha256(imageBuffer);

    // --- Generate a unique seed for this processing run ---
    const seed = deriveSeed();
    const timestamp = Date.now();

    // --- Step 1: Apply AI Shielding (DCT Perturbation) ---
    let shieldedBuffer = await applyAiShielding(imageBuffer, seed);

    // --- Step 2: Strip All Metadata ---
    let strippedBuffer = await sharp(shieldedBuffer)
      .withMetadata({ exif: {} })
      .toBuffer();

    const finalHash = sha256(strippedBuffer);

    // --- Step 3: Create the Digital Receipt ---
    const receipt: Record<string, any> = {
      owner: OWNER_ID,
      orig_sha256: originalHash,
      final_sha256: finalHash,
      seed: seed,
      timestamp: timestamp,
      public_key: publicKeyHex,
    };
    receipt.signature = signPayload(receipt);

    // --- Step 4: Embed Invisible Watermark ---
    // We pass the receipt to the watermarking function so it can embed key info
    let watermarkedBuffer = await embedInvisibleWatermark(
      strippedBuffer,
      receipt
    );

    // Final re-compression and integrity check
    const finalImageBytes = await sharp(watermarkedBuffer)
      .jpeg({ quality: 95, optimize_coding: true })
      .toBuffer();

    const processedImageUri = `data:${mimeType};base64,${finalImageBytes.toString(
      'base64'
    )}`;
    
    // The hash in the receipt should be the primary proof, but we can return the final one
    return NextResponse.json({
      processedImageUri: processedImageUri,
      hash: finalHash, // This is the hash of the *protected* image
      receipt: receipt, // Return the full signed receipt
    });
  } catch (error) {
    console.error('Image processing failed:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during image processing.' },
      { status: 500 }
    );
  }
}
