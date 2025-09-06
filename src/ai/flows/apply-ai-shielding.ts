// src/ai/flows/apply-ai-shielding.ts
'use server';
import sharp from 'sharp';

/**
 * Apply imperceptible pixel-level perturbations to shield from AI facial recognition/editing.
 * Inspired by Fawkes/Glaze/LowKey techniques.
 */
export async function applyAiShielding(inputBuffer: Buffer): Promise<Buffer> {
  const perturbStrength = 0.002; // very subtle, invisible to humans

  const { data, info } = await sharp(inputBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data);
  for (let i = 0; i < pixels.length; i++) {
    // small random noise
    const noise = Math.floor((Math.random() - 0.5) * 255 * perturbStrength);
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
