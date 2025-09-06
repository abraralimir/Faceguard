'use server';
import sharp from 'sharp';

/**
 * Apply a more robust, structured perturbation to shield from AI facial recognition.
 * This version uses a seeded pseudo-random pattern to create a noticeable but
 * minimally invasive "glaze" over the image, which is more resistant to compression
 * than simple random noise.
 */
export async function applyAiShielding(
  inputBuffer: Buffer,
  seed: string
): Promise<Buffer> {
  const { data, info } = await sharp(inputBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data);
  const perturbStrength = 20; // Increased strength for noticeable disruption to AI

  // Create a seeded pseudo-random number generator for reproducibility
  let seedValue = 0;
  for (let i = 0; i < seed.length; i++) {
    seedValue = (seedValue + seed.charCodeAt(i)) % 10000;
  }
  const seededRandom = () => {
    const x = Math.sin(seedValue++) * 10000;
    return x - Math.floor(x);
  };

  // Apply a structured, grid-based pattern of noise
  const gridSize = 8; // Perturbations will be consistent within an 8x8 block
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const blockX = Math.floor(x / gridSize);
      const blockY = Math.floor(y / gridSize);

      // Generate a consistent noise value for each block based on the seed
      const blockSeed = blockY * Math.floor(info.width / gridSize) + blockX;
      const blockRandom = () => {
        const x = Math.sin(seedValue + blockSeed) * 10000;
        return x - Math.floor(x);
      };

      const noise = (blockRandom() - 0.5) * perturbStrength;
      const pixelIndex = (y * info.width + x) * info.channels;

      for (let c = 0; c < 3; c++) { // Iterate over R, G, B channels
        pixels[pixelIndex + c] = Math.max(0, Math.min(255, pixels[pixelIndex + c] + noise));
      }
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
  .jpeg({ quality: 95 }) // Use high quality to preserve the shield
  .toBuffer();
}
