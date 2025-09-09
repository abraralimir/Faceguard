
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { 
    applyAiShielding, 
    embedInvisibleWatermark,
    applyVisibleWatermark 
} from '@/ai/flows/apply-ai-shielding';
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
    const originalImageBuffer = Buffer.from(base64Data, 'base64');
    const originalHash = sha256(originalImageBuffer);

    // --- Generate a unique, cryptographically secure seed for this run ---
    const seed = deriveSeed();
    const timestamp = Date.now();

    // --- Start Unified Processing with Sharp ---
    const image = sharp(originalImageBuffer);
    const { data: rawPixels, info } = await image.raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    const pixels = new Uint8ClampedArray(rawPixels);

    // --- Step 1: Apply Multi-Layered AI Shielding (in-place) ---
    await applyAiShielding(pixels, width, height, channels, seed);

    // --- Step 2: Create the initial receipt (to be embedded) ---
    const receipt: Record<string, any> = {
      version: '3.0',
      owner: OWNER_ID,
      orig_sha256: originalHash,
      seed: seed,
      timestamp: timestamp,
      public_key: publicKeyHex,
      protection_level: 'strong',
      final_sha256: 'pending', // Placeholder
      signature: 'pending',   // Placeholder
    };
    
    // --- Step 3 & 4 (Combined): Embed, Finalize Hash, Sign, Re-Embed ---
    const processAndSign = async (pixelData: Uint8ClampedArray, firstPass: boolean): Promise<Buffer> => {
        // Embed the current state of the receipt
        embedInvisibleWatermark(pixelData, width, height, receipt);

        // Rebuild the buffer from pixels
        const processedBuffer = await sharp(pixelData, { raw: { width, height, channels } }).toBuffer();

        if (firstPass) {
            // This is the first pass, so we calculate the hash and sign
            const finalHash = sha256(processedBuffer);
            receipt.final_sha256 = finalHash;
            receipt.signature = signPayload(receipt);
            
            // Now, do the second pass with the complete receipt
            // We need to re-read the shielded pixels to avoid re-applying the shield
            const { data: shieldedPixelsOnly } = await sharp(originalImageBuffer).raw().toBuffer({ resolveWithObject: true });
            const finalPixels = new Uint8ClampedArray(shieldedPixelsOnly);
            await applyAiShielding(finalPixels, width, height, channels, seed); // Re-apply shield only
            return processAndSign(finalPixels, false); // Second pass
        }
        
        // This is the second pass, return the final buffer
        return processedBuffer;
    };

    // --- Execute the two-pass process ---
    const finalInvisiblyWatermarkedBuffer = await processAndSign(pixels, true);

    // --- Final Verification (Optional but Recommended) ---
    if (sha256(finalInvisiblyWatermarkedBuffer) !== receipt.final_sha256) {
        console.warn("Verification hash mismatch after final embed. The signature may be invalid.");
    }

    // --- Step 5: Apply the visible watermark as the very last step ---
    const finalImageBytes = await applyVisibleWatermark(finalInvisiblyWatermarkedBuffer);
    
    // --- Final Output ---
    const processedImageUri = `data:${mimeType};base64,${finalImageBytes.toString('base64')}`;
    
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
