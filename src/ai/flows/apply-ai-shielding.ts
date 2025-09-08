'use server';
import sharp from 'sharp';

export type ProtectionLevel = 'light' | 'medium' | 'strong';

const STRENGTHS = {
  light: { noise: 3, shift: 1 },
  medium: { noise: 5, shift: 1 },
  strong: { noise: 7, shift: 1 }, // Tuned for imperceptibility
};

/**
 * Applies a multi-layered, high-strength but visually subtle perturbation shield.
 * This version is tuned to be nearly imperceptible to the human eye.
 * 1. High-Frequency Dithered Noise: A very fine, structured pattern to disrupt local features.
 * 2. Subtle Chromatic Aberration: A minimal color channel shift.
 * 3. Fluid Transparent Watermark: An almost invisible text warning.
 */
export async function applyAiShielding(
  inputBuffer: Buffer,
  seed: string
): Promise<Buffer> {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  if (!width || !height) {
    throw new Error('Could not determine image dimensions.');
  }

  // --- Step 1: Get the raw pixel data for manipulation ---
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data);
  const { channels } = info;
  const strength = STRENGTHS['strong']; // Always use strong

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
  const noiseStrength = strength.noise;
  for (let i = 0; i < pixels.length; i += channels) {
    const noise = (seededRandom() - 0.5) * noiseStrength;
    pixels[i] = Math.max(0, Math.min(255, pixels[i] + noise));
    pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + noise));
    pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + noise));
  }

  // --- Layer 2: Ultra-Subtle Chromatic Aberration ---
  const shift = strength.shift;
  if (shift > 0) {
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
  }

  // --- Rebuild the image from perturbed pixels ---
  const perturbedImage = sharp(Buffer.from(pixels), {
    raw: {
      width,
      height,
      channels,
    },
  });

  // --- Layer 3: Fluid Transparent Watermark ---
  const watermarkText = "Warning: This image is protected by SASHA. Any edit on this image is a misuse.";
  const fontSize = Math.max(12, Math.round(width / 50)); // Responsive font size
  const svgWatermark = `
    <svg width="${width}" height="${height}">
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
        opacity="0.05"
        style="
          text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
          transform: rotate(-15deg);
        "
      >
        ${watermarkText}
      </text>
    </svg>
  `;
  const watermarkBuffer = Buffer.from(svgWatermark);

  // --- Composite the watermark over the perturbed image ---
  return perturbedImage
    .composite([{ input: watermarkBuffer, tile: false, blend: 'over' }])
    .jpeg({ quality: 98, mozjpeg: true }) // Use very high quality to preserve subtlety
    .toBuffer();
}
