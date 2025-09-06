// src/ai/flows/apply-ai-shielding.ts
'use server';
import sharp from 'sharp';

/**
 * Apply imperceptible pixel-level perturbations to shield from AI facial recognition/editing.
 * This version uses a seeded random pattern for more structured noise.
 * This is a step towards full DCT-based perturbation.
 */
export async function applyAiShielding(
  inputBuffer: Buffer,
  seed: string
): Promise<Buffer> {
  // TODO: Replace this with full DCT-based perturbation.
  // This placeholder uses a seeded RNG to create a more structured, reproducible noise
  // pattern, which is more robust than Math.random().
  const perturbStrength = 0.002; // very subtle, invisible to humans

  const { data, info } = await sharp(inputBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data);

  // Simple seeded pseudo-random number generator
  let seedValue = 0;
  for (let i = 0; i < seed.length; i++) {
    seedValue = (seedValue + seed.charCodeAt(i)) % 10000;
  }
  const seededRandom = () => {
    const x = Math.sin(seedValue++) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < pixels.length; i++) {
    // small random noise from our seeded generator
    const noise = Math.floor((seededRandom() - 0.5) * 255 * perturbStrength);
    pixels[i] = Math.min(255, Math.max(0, pixels[i] + noise));
  }

  return sharp(Buffer.from(pixels), {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .jpeg({ quality: 100 })
    .toBuffer();
}
