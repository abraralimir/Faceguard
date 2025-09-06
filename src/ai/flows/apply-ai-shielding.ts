'use server';
import sharp from 'sharp';

/**
 * Applies a multi-layered, high-strength perturbation shield to an image.
 * This combines three techniques for maximum resilience against AI models and compression.
 * 1. High-Frequency Grid Noise: A fine, structured pattern to disrupt local features.
 * 2. Mid-Frequency Block Distortion: Larger area warping to confuse structural recognition.
 * 3. Chromatic Aberration: Subtle color channel shifting to throw off color-based analysis.
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

  // --- Layer 1: High-Frequency Structured Grid Noise ---
  const gridStrength = 25; // Increased strength
  const gridSize = 4; // Finer grid for more detail disruption
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const blockX = Math.floor(x / gridSize);
      const blockY = Math.floor(y / gridSize);
      const blockSeed = blockY * Math.floor(width / gridSize) + blockX;
      const noise = (Math.sin(blockSeed * seedValue) * 100000 % 1 - 0.5) * gridStrength;

      const pixelIndex = (y * width + x) * channels;
      for (let c = 0; c < 3; c++) {
        pixels[pixelIndex + c] = Math.max(0, Math.min(255, pixels[pixelIndex + c] + noise));
      }
    }
  }

  // --- Layer 2: Mid-Frequency Block Distortion ---
  // This simulates a mild, localized warping effect by displacing pixels within blocks.
  const distortionStrength = 2; // Max pixel displacement
  const distortionGridSize = 32; // Larger blocks
  const tempPixels = new Uint8ClampedArray(pixels); // Work on a copy
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const blockX = Math.floor(x / distortionGridSize);
      const blockY = Math.floor(y / distortionGridSize);
      const blockSeed = blockY * Math.floor(width / distortionGridSize) + blockX;

      const offsetX = Math.floor((Math.sin(blockSeed * seedValue * 2) % 1) * (distortionStrength * 2 + 1) - distortionStrength);
      const offsetY = Math.floor((Math.cos(blockSeed * seedValue * 2) % 1) * (distortionStrength * 2 + 1) - distortionStrength);
      
      const sourceX = Math.max(0, Math.min(width - 1, x + offsetX));
      const sourceY = Math.max(0, Math.min(height - 1, y + offsetY));

      const targetIndex = (y * width + x) * channels;
      const sourceIndex = (sourceY * width + sourceX) * channels;

      pixels[targetIndex] = tempPixels[sourceIndex];
      pixels[targetIndex + 1] = tempPixels[sourceIndex + 1];
      pixels[targetIndex + 2] = tempPixels[sourceIndex + 2];
    }
  }
  
  // --- Layer 3: Subtle Chromatic Aberration ---
  // Shift R and B channels slightly in opposite directions
  const shift = 1;
  const shiftedPixels = new Uint8ClampedArray(pixels); // Work on another copy
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const rIndex = (y * width + Math.min(width - 1, x + shift)) * channels;
        const bIndex = (y * width + Math.max(0, x - shift)) * channels;
        const gIndex = (y * width + x) * channels;

        pixels[gIndex] = shiftedPixels[rIndex]; // R -> G
        pixels[gIndex + 1] = shiftedPixels[gIndex + 1]; // G stays
        pixels[gIndex + 2] = shiftedPixels[bIndex + 2]; // B -> B
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: {
      width,
      height,
      channels,
    },
  })
  .jpeg({ quality: 95 }) // Maintain high quality to preserve the complex shield
  .toBuffer();
}
