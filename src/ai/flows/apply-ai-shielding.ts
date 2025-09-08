'use server';
import sharp from 'sharp';

/**
 * Applies a multi-layered, high-strength but visually subtle perturbation shield.
 * This version is tuned to be nearly imperceptible to the human eye.
 * 1. High-Frequency Dithered Noise: A very fine, structured pattern to disrupt local features.
 * 2. Subtle Chromatic Aberration: A minimal 1px color channel shift.
 */
export async function applyAiShielding(
  inputBuffer: Buffer,
  seed: string
): Promise<Buffer> {
  const { data, info } = await sharp(inputBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data);
  const { width, height, channels } = info;

  // --- Seeded PRNG for deterministic randomness ---
  let seedValue = 0;
  for (let i = 0; i < seed.length; i++) {
    seedValue = (seedValue + seed.charCodeAt(i) * (i + 1)) % 100000;
  }
  const seededRandom = () => {
    const x = Math.sin(seedValue++) * 100000;
    return x - Math.floor(x);
  };

  // --- Layer 1: High-Frequency Dithered Noise ---
  const noiseStrength = 5; // Drastically reduced for invisibility
  for (let i = 0; i < pixels.length; i += channels) {
    const noise = (seededRandom() - 0.5) * noiseStrength;
    pixels[i] = Math.max(0, Math.min(255, pixels[i] + noise));
    pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + noise));
    pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + noise));
  }

  // --- Layer 2: Ultra-Subtle Chromatic Aberration ---
  // Shift R and B channels slightly in opposite directions
  const shift = 1; // Minimal 1px shift
  const shiftedPixels = new Uint8ClampedArray(pixels); // Work on a copy
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const rIndex = (y * width + Math.min(width - 1, x + shift)) * channels;
        const bIndex = (y * width + Math.max(0, x - shift)) * channels;
        const gIndex = (y * width + x) * channels;

        pixels[gIndex] = shiftedPixels[rIndex]; 
        pixels[gIndex + 1] = shiftedPixels[gIndex + 1];
        pixels[gIndex + 2] = shiftedPixels[bIndex + 2];
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: {
      width,
      height,
      channels,
    },
  })
  .jpeg({ quality: 98, mozjpeg: true }) // Use very high quality to preserve subtlety
  .toBuffer();
}
