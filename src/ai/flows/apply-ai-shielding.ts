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
 */
export async function applyAiShielding(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  channels: number,
  seed: string
): Promise<void> {
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
}

/**
 * Embed a robust invisible watermark using a more advanced LSB technique.
 * This function directly manipulates the pixel buffer.
 */
export function embedInvisibleWatermark(
    pixels: Uint8ClampedArray,
    width: number,
    height: number,
    receipt: Record<string, any>
): void {
    const signature = 'FG-WARN'; // FaceGuard Warning Signal
    const warning = 'FACEGUARD_DO_NOT_EDIT_OR_MANIPULATE';
    // Use a placeholder if final_sha256 isn't ready yet.
    const hashPayload = (receipt.final_sha256 && receipt.final_sha256 !== 'pending')
      ? receipt.final_sha256.substring(0, 16)
      : '0'.repeat(16);
  
    const payload = `${receipt.seed}::${hashPayload}`;
    const watermarkText = `${signature}::${warning}::${payload}`;
  
    let watermarkBinary = '';
    for (let i = 0; i < watermarkText.length; i++) {
      watermarkBinary += watermarkText[i].charCodeAt(0).toString(2).padStart(8, '0');
    }
    // Add a simple checksum (sum of char codes modulo 256)
    const checksum = watermarkText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 256;
    watermarkBinary += checksum.toString(2).padStart(8, '0');
  
    const totalPixels = width * height;
    if (watermarkBinary.length > totalPixels * 3) {
      console.warn("Image too small to hold watermark. Skipping watermarking.");
      return; // Skip if image is too small
    }
  
    // Use the receipt seed to create a pseudo-random sequence of pixel locations
    let seedValue = 0;
    for (let i = 0; i < receipt.seed.length; i++) {
      seedValue = (seedValue + receipt.seed.charCodeAt(i) * (i + 1)) % 100000;
    }
    const seededRandom = () => {
      const x = Math.sin(seedValue++) * 100000;
      return x - Math.floor(x);
    };
  
    const usedIndices = new Set<number>();
    let bitIndex = 0;
  
    while(bitIndex < watermarkBinary.length) {
      const pixelNum = Math.floor(seededRandom() * totalPixels);
      const channelNum = Math.floor(seededRandom() * 3); // R, G, or B
      const uniqueIndex = pixelNum * 3 + channelNum;
  
      if (usedIndices.has(uniqueIndex)) {
        continue;
      }
  
      const pixelIdx = pixelNum * 4; // Assuming 4 channels (RGBA) from sharp
      const channelIdx = pixelIdx + channelNum;
  
      if (channelIdx >= pixels.length) {
          continue;
      }
      
      const bit = parseInt(watermarkBinary[bitIndex], 2);
      pixels[channelIdx] = (pixels[channelIdx] & 0xFE) | bit;
  
      usedIndices.add(uniqueIndex);
      bitIndex++;
    }
}


/**
 * Applies a fluid, transparent, and machine-readable watermark.
 * This is designed to be the final step in the protection process.
 */
export async function applyVisibleWatermark(
  inputBuffer: Buffer
): Promise<Buffer> {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    if (!width || !height) {
        throw new Error('Could not determine image dimensions.');
    }

    const watermarkText = "WARNING DO NOT EDIT THIS IMAGE THIS IMAGE HAVE COPYRIGHTS OF SASHA";
    const fontSize = Math.max(12, Math.round(width / 50)); // Responsive font size
    const svgWatermarkBase = `
    <svg width="${width}" height="${height}">
      <text
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        style="transform: rotate(-15deg);"
        fill="{color}"
        opacity="{opacity}"
        x="{x}"
        y="{y}"
      >
        ${watermarkText}
      </text>
    </svg>
  `;

  const watermarkOpacity = 0.05;
  
  // Create two layers for an embossed effect, more detectable by AI
  const watermarkWhite = Buffer.from(
      svgWatermarkBase
        .replace('{color}', 'white')
        .replace('{opacity}', String(watermarkOpacity))
        .replace('{x}', '50.1%')
        .replace('{y}', '50.1%')
  );

  const watermarkBlack = Buffer.from(
      svgWatermarkBase
        .replace('{color}', 'black')
        .replace('{opacity}', String(watermarkOpacity))
        .replace('{x}', '50%')
        .replace('{y}', '50%')
  );


  // --- Composite the watermark over the perturbed image ---
  return image
    .composite([
        { input: watermarkBlack, tile: false, blend: 'over' },
        { input: watermarkWhite, tile: false, blend: 'over' }
    ])
    .jpeg({ quality: 98, mozjpeg: true }) // Use very high quality to preserve subtlety
    .toBuffer();
}
