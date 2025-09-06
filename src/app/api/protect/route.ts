import { NextRequest, NextResponse } from 'next/server';
import { applyAiShielding } from '@/ai/flows/apply-ai-shielding';
import { embedInvisibleWatermark } from '@/ai/flows/embed-invisible-watermark';
import sharp from 'sharp';
import { createHash, randomBytes, createHmac } from 'crypto';
import forge from 'node-forge';

// --- CONFIGURATION ---
const OWNER_ID = 'FaceGuardUser'; // A default owner ID
const MASTER_KEY = process.env.FACEGUARD_MASTER_KEY || 'default-secret-key-that-is-long-and-secure';

// --- CRYPTOGRAPHIC SETUP (Ed25519) ---
// This setup generates a key pair when the server starts.
// In a real production environment, you would load the private key from a secure secret manager.
let privateKey: forge.pki.ed25519.KeyPair;
let publicKeyHex: string;

try {
  const seed = createHash('sha256').update(MASTER_KEY).digest();
  privateKey = forge.pki.ed25519.generateKeyPair({ seed: seed });
  publicKeyHex = Buffer.from(privateKey.publicKey).toString('hex');
  console.log("FaceGuard signing public key:", publicKeyHex);
} catch (e) {
  console.error("Critical: Could not generate server key pair. Signing will fail.", e);
  privateKey = {} as any; // Prevent server from running without keys
  publicKeyHex = '';
}


// --- UTILITY FUNCTIONS ---
function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

// Derives a unique and unpredictable seed for each protection run.
function deriveSeed(): string {
  const timestamp = Date.now().toString();
  const random = randomBytes(16).toString('hex');
  const message = `${timestamp}|${random}|${OWNER_ID}`;
  // Use HMAC with the master key to create a deterministic but unpredictable seed
  return createHmac('sha256', MASTER_KEY).update(message).digest('hex');
}

// Signs a payload with the server's Ed25519 private key.
function signPayload(payload: Record<string, any>): string {
  if (!privateKey || !privateKey.privateKey) {
    throw new Error("Server key pair not available for signing. Check server logs.");
  }
  // Sorting keys ensures a consistent JSON string, which is critical for verification.
  const message = JSON.stringify(payload, Object.keys(payload).sort());
  const messageBytes = Buffer.from(message, 'utf8');

  // Use forge to sign the message bytes
  const signature = forge.pki.ed25519.sign({
    privateKey: privateKey.privateKey,
    message: messageBytes,
    encoding: 'binary', // Important: work with raw bytes
  });

  return Buffer.from(signature, 'binary').toString('hex');
}

// --- RATE LIMITING ---
// Simple in-memory rate limiting. For production, consider a distributed solution like Redis.
const ipRequestCounts = new Map<string, number>();
const RATE_LIMIT_MAX_REQUESTS = 20; // Max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  if (process.env.NODE_ENV !== 'production') return true; // Disable in dev

  const now = Date.now();
  const currentCount = ipRequestCounts.get(ip) || 0;

  if (currentCount >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  ipRequestCounts.set(ip, currentCount + 1);
  // Decrement the count after the window expires
  setTimeout(() => {
    const count = ipRequestCounts.get(ip) || 1;
    ipRequestCounts.set(ip, count - 1);
  }, RATE_LIMIT_WINDOW_MS);

  return true;
}

// --- API ENDPOINT ---
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

    if (!imageDataUri || typeof imageDataUri !== 'string' || !imageDataUri.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image data URI provided.' }, { status: 400 });
    }

    const mimeType = imageDataUri.substring(imageDataUri.indexOf(':') + 1, imageDataUri.indexOf(';'));
    const base64Data = imageDataUri.split(',')[1];
    if (!base64Data) {
      return NextResponse.json({ error: 'Could not extract image data from URI.' }, { status: 400 });
    }
    let imageBuffer = Buffer.from(base64Data, 'base64');
    const originalHash = sha256(imageBuffer);

    // --- Generate a unique, cryptographically secure seed for this run ---
    const seed = deriveSeed();
    const timestamp = Date.now();

    // --- Step 1: Apply Multi-Layered AI Shielding ---
    let shieldedBuffer = await applyAiShielding(imageBuffer, seed);

    // --- Step 2: Strip All Metadata (important for privacy) ---
    // Note: We are not explicitly stripping metadata here anymore because applyAiShielding
    // and embedInvisibleWatermark both process the raw pixel data and rebuild the image,
    // which effectively strips most metadata. Sharp's final output will also not carry it over.
    const strippedBuffer = shieldedBuffer; // Renaming for clarity in the flow

    const finalHash = sha256(strippedBuffer);

    // --- Step 3: Create the Digital Receipt (to be signed) ---
    const receipt: Record<string, any> = {
      version: '3.0',
      owner: OWNER_ID,
      orig_sha256: originalHash,
      final_sha256: finalHash,
      seed: seed,
      timestamp: timestamp,
      public_key: publicKeyHex,
    };
    // The signature is calculated on the receipt *without* the signature field itself.
    receipt.signature = signPayload(receipt);

    // --- Step 4: Embed Resilient Invisible Watermark ---
    let watermarkedBuffer = await embedInvisibleWatermark(strippedBuffer, receipt);

    // --- Final Compression and Output ---
    const finalImageBytes = await sharp(watermarkedBuffer)
      .jpeg({ quality: 95, optimize_coding: true, mozjpeg: true })
      .toBuffer();

    const processedImageUri = `data:${mimeType};base64,${finalImageBytes.toString('base64')}`;

    return NextResponse.json({
      processedImageUri: processedImageUri,
      hash: finalHash,
      receipt: receipt,
    });
  } catch (error) {
    console.error('Image processing failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json(
      { error: `Image processing failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
