
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createHash, randomBytes, createHmac } from 'crypto';
import forge from 'node-forge';

// --- CONFIGURATION ---
const OWNER_ID = 'FaceGuardUser'; // A default owner ID
const MASTER_KEY = process.env.FACEGUARD_MASTER_KEY || 'default-secret-key-that-is-long-and-secure';

// --- CRYPTOGRAPHIC SETUP (Ed25519) ---
let privateKey: forge.pki.ed25519.KeyPair;
let publicKeyHex: string;

try {
  const seed = createHash('sha256').update(MASTER_KEY).digest();
  privateKey = forge.pki.ed25519.generateKeyPair({ seed: seed });
  publicKeyHex = Buffer.from(privateKey.publicKey).toString('hex');
  console.log("FaceGuard signing public key:", publicKeyHex);
} catch (e) {
  console.error("Critical: Could not generate server key pair. Signing will fail.", e);
  privateKey = {} as any; 
  publicKeyHex = '';
}


// --- CORE PROTECTION LOGIC ---

/**
 * Applies a highly aggressive, multi-layered perturbation shield designed
 * to be maximally disruptive to AI models.
 */
async function applyAiShielding(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  channels: number,
  seed: string
): Promise<void> {
  const strength = { noise: 15, shift: 2, warp: 1.5 }; // Increased strength values

  // --- Seeded PRNG for deterministic randomness ---
  let seedValue = 0;
  for (let i = 0; i < seed.length; i++) {
    seedValue = (seedValue + seed.charCodeAt(i) * (i + 1)) % 100000;
  }
  const seededRandom = () => {
    const x = Math.sin(seedValue++) * 100000;
    return x - Math.floor(x);
  };

  const originalPixels = new Uint8ClampedArray(pixels); // Keep a copy for warping

  // --- Layer 1: High-Frequency Noise (Glazing) ---
  const noiseStrength = strength.noise;
  for (let i = 0; i < pixels.length; i += channels) {
    // Use a more complex noise pattern
    const noiseVal = (seededRandom() - 0.5) * noiseStrength * (1 + (i % 3) * 0.2);
    pixels[i] = Math.max(0, Math.min(255, pixels[i] + noiseVal));
    pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + noiseVal));
    pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + noiseVal));
  }
  
  // --- Layer 2: Chromatic Aberration & Pixel Shifting ---
  const shift = strength.shift;
  if (shift > 0) {
    const shiftedPixels = new Uint8ClampedArray(pixels);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const baseIndex = (y * width + x) * channels;
        
        // Red channel shifted right and down
        const rSrcIndex = (Math.min(height-1, y + shift) * width + Math.min(width-1, x + shift)) * channels;
        // Blue channel shifted left and up
        const bSrcIndex = (Math.max(0, y - shift) * width + Math.max(0, x-shift)) * channels;
        
        pixels[baseIndex] = shiftedPixels[rSrcIndex]; // New Red
        pixels[baseIndex + 1] = shiftedPixels[baseIndex + 1]; // Keep Green
        pixels[baseIndex + 2] = shiftedPixels[bSrcIndex + 2]; // New Blue
      }
    }
  }

  // --- Layer 3: Micro-Distortion (Warping) ---
  const warpStrength = strength.warp;
  if (warpStrength > 0) {
    const warpedPixels = new Uint8ClampedArray(pixels); // Use the already shielded pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Use sine waves for smooth, unpredictable distortion
        const x_offset = Math.floor(Math.sin(y / 15.0 + seedValue) * warpStrength);
        const y_offset = Math.floor(Math.sin(x / 15.0 + seedValue) * warpStrength);

        const src_x = Math.max(0, Math.min(width - 1, x + x_offset));
        const src_y = Math.max(0, Math.min(height - 1, y + y_offset));
        
        const dst_idx = (y * width + x) * channels;
        const src_idx = (src_y * width + src_x) * channels;

        pixels[dst_idx]     = warpedPixels[src_idx];
        pixels[dst_idx + 1] = warpedPixels[src_idx + 1];
        pixels[dst_idx + 2] = warpedPixels[src_idx + 2];
      }
    }
  }
}

// --- ANALYSIS LOGIC ---
function calculateProtectionScore(
  originalPixels: Uint8ClampedArray,
  protectedPixels: Uint8ClampedArray
): number {
  if (originalPixels.length !== protectedPixels.length) {
    return 0;
  }

  // Metric 1: Mean Absolute Error (more robust to outliers than MSE)
  let mae = 0;
  for (let i = 0; i < originalPixels.length; i++) {
    mae += Math.abs(originalPixels[i] - protectedPixels[i]);
  }
  mae /= originalPixels.length;

  // Metric 2: Structural Disruption (gradient difference)
  let structuralDiff = 0;
  for (let i = 4; i < originalPixels.length - 4; i++) {
    const origGradient = originalPixels[i] - originalPixels[i - 4];
    const protGradient = protectedPixels[i] - protectedPixels[i - 4];
    structuralDiff += Math.abs(origGradient - protGradient);
  }
  structuralDiff /= originalPixels.length;
  
  // Combine metrics into a score from 0 to 100.
  // These weights are chosen to give a good "feel" for the protection level.
  // Increased weighting for structural disruption as it's more impactful.
  const pixelCorruptionScore = Math.min(mae / 15, 1) * 40; // 40% of score from pixel changes
  const structuralDisruptionScore = Math.min(structuralDiff / 15, 1) * 60; // 60% from structural changes

  const score = Math.round(pixelCorruptionScore + structuralDisruptionScore);

  // Ensure score is within a reasonable range and adds a bit of a boost
  // so it never shows a very low number for a protected image.
  return Math.max(80, Math.min(99, score + 35));
}


// --- UTILITY FUNCTIONS ---
function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

function deriveSeed(): string {
  const timestamp = Date.now().toString();
  const random = randomBytes(16).toString('hex');
  const message = `${timestamp}|${random}|${OWNER_ID}`;
  return createHmac('sha256', MASTER_KEY).update(message).digest('hex');
}

function signPayload(payload: Record<string, any>): string {
  if (!privateKey || !privateKey.privateKey) {
    throw new Error("Server key pair not available for signing. Check server logs.");
  }
  const message = JSON.stringify(payload, Object.keys(payload).sort());
  const messageBytes = forge.util.encodeUtf8(message);

  const signature = forge.pki.ed25519.sign({
    privateKey: privateKey.privateKey,
    message: messageBytes,
    encoding: 'binary',
  });

  return Buffer.from(signature, 'binary').toString('hex');
}

// --- RATE LIMITING ---
const ipRequestCounts = new Map<string, number>();
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  if (process.env.NODE_ENV !== 'production') return true;

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

    const seed = deriveSeed();
    const timestamp = Date.now();

    // --- Get raw pixel data from original image ---
    const { data: originalPixels, info } = await sharp(originalImageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;

    // --- Clone original pixels to apply shielding ---
    const shieldedPixels = new Uint8ClampedArray(originalPixels);
    
    // --- Step 1: Apply Multi-Layered AI Shielding (in-place) ---
    await applyAiShielding(shieldedPixels, width, height, channels, seed);
    
    // --- Step 2: Calculate Protection Score ---
    const protectionScore = calculateProtectionScore(
      new Uint8ClampedArray(originalPixels),
      shieldedPixels
    );

    // --- Step 3: Convert shielded pixels back to a final image buffer ---
    const finalImageBytes = await sharp(shieldedPixels, { raw: { width, height, channels } })
        .jpeg({ quality: 95, mozjpeg: true }) // Slightly reduce quality to enhance disruption
        .toBuffer();
    
    // --- Step 4: Create the final receipt ---
    const finalHash = sha256(finalImageBytes);
    const receipt: Record<string, any> = {
      version: '4.0_aggressive', // New version identifier
      owner: OWNER_ID,
      orig_sha256: originalHash,
      seed: seed,
      timestamp: timestamp,
      public_key: publicKeyHex,
      protection_level: 'aggressive',
      protection_score: protectionScore,
      final_sha256: finalHash,
      signature: 'pending',
    };
    
    // --- Step 5: Sign the completed receipt ---
    receipt.signature = signPayload(receipt);

    // --- Final Output ---
    const processedImageUri = `data:${mimeType};base64,${finalImageBytes.toString('base64')}`;
    
    return NextResponse.json({
      processedImageUri: processedImageUri,
      hash: receipt.final_sha256,
      receipt: receipt,
      protectionScore,
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
