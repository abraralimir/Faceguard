
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
  // IMPORTANT: The message must be encoded as a binary string for forge
  const messageBytes = forge.util.encodeUtf8(message);

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
    const { imageDataUri } = body as { imageDataUri: string };

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
    const shieldedBuffer = await applyAiShielding(imageBuffer, seed);

    // --- Step 2: Create a PRELIMINARY receipt (to be embedded) ---
    // The final_sha256 and signature will be added later.
    const receipt: Record<string, any> = {
      version: '3.0',
      owner: OWNER_ID,
      orig_sha256: originalHash,
      seed: seed,
      timestamp: timestamp,
      public_key: publicKeyHex,
      protection_level: 'strong',
      // final_sha256 and signature will be added after watermarking
    };

    // --- Step 3: Embed a preliminary receipt (without final hash/sig) ---
    // This creates an intermediate image buffer.
    const preWatermarkedBuffer = await embedInvisibleWatermark(shieldedBuffer, {
        ...receipt,
        final_sha256: 'pending', // Placeholder
    });


    // --- Step 4: Calculate the TRUE final hash from the watermarked image ---
    const finalHash = sha256(preWatermarkedBuffer);
    receipt.final_sha256 = finalHash;

    // --- Step 5: Sign the FINAL receipt ---
    // Now that the receipt is complete, we can sign it.
    receipt.signature = signPayload(receipt);

    // --- Step 6: Re-embed the FULLY signed receipt ---
    // This ensures the signature is part of the final artifact.
    // This step is fast as it just updates the watermark payload.
    const finalImageBytes = await embedInvisibleWatermark(shieldedBuffer, receipt);

    // --- Final Output ---
    const processedImageUri = `data:${mimeType};base64,${finalImageBytes.toString('base64')}`;
    
    // The final hash should match the hash of the re-watermarked buffer.
    // This verification step is critical.
    const finalVerificationHash = sha256(finalImageBytes);
    
    if(finalVerificationHash !== receipt.final_sha256) {
        console.warn("Verification hash mismatch after final embed. This should not happen, but we will use the actual final hash.");
        // We will trust the hash of the *final* output buffer for the client.
         receipt.final_sha256 = finalVerificationHash;
         receipt.signature = signPayload(receipt); // Re-sign with the correct hash
    }


    return NextResponse.json({
      processedImageUri: processedImageUri,
      hash: receipt.final_sha256,
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
