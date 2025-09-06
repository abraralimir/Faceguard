'use server';
import Jimp from 'jimp';

/**
 * Embed a more compact and identifiable invisible watermark using LSB steganography.
 * This version uses a clear signature and a more compact payload to improve resilience,
 * although true DCT-based watermarking remains the goal for ultimate robustness.
 */
export async function embedInvisibleWatermark(
  inputBuffer: Buffer,
  receipt: Record<string, any>
): Promise<Buffer> {
  const image = await Jimp.read(inputBuffer);
  // Create a compact, identifiable payload. FGv2 signifies FaceGuard version 2.
  const watermarkText = `FGv2::${receipt.seed}::${receipt.final_sha256.substring(0, 16)}`;

  // Convert text to a binary string
  let watermarkBinary = '';
  for (let i = 0; i < watermarkText.length; i++) {
    watermarkBinary += watermarkText[i].charCodeAt(0).toString(2).padStart(8, '0');
  }

  let bitIndex = 0;
  // Embed the watermark payload
  for (let y = 0; y < image.bitmap.height && bitIndex < watermarkBinary.length; y++) {
    for (let x = 0; x < image.bitmap.width && bitIndex < watermarkBinary.length; x++) {
      const pixelIndex = image.getPixelIndex(x, y);
      
      // Embed one bit per color channel (R, G, B)
      for (let c = 0; c < 3 && bitIndex < watermarkBinary.length; c++) {
        const channelIndex = pixelIndex + c;
        const bit = parseInt(watermarkBinary[bitIndex], 2);
        
        // Modify the least significant bit
        image.bitmap.data[channelIndex] = (image.bitmap.data[channelIndex] & 0xFE) | bit;
        bitIndex++;
      }
    }
  }

  return image.getBufferAsync(Jimp.MIME_JPEG);
}
