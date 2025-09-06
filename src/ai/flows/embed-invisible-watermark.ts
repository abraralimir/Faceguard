'use server';
import Jimp from 'jimp';
import crypto from 'crypto';

/**
 * Embed invisible watermark by steganography in LSB of pixels.
 */
export async function embedInvisibleWatermark(
  inputBuffer: Buffer
): Promise<Buffer> {
  const image = await Jimp.read(inputBuffer);
  const watermarkText = `FACEGUARD-${Date.now()}-${crypto
    .randomBytes(8)
    .toString('hex')}`;

  // Simple LSB watermark in red channel
  let bitIndex = 0;
  for (
    let y = 0;
    y < image.bitmap.height && bitIndex < watermarkText.length * 8;
    y++
  ) {
    for (
      let x = 0;
      x < image.bitmap.width && bitIndex < watermarkText.length * 8;
      x++
    ) {
      const idx = (y * image.bitmap.width + x) * 4;
      const red = image.bitmap.data[idx];
      const charCode = watermarkText.charCodeAt(Math.floor(bitIndex / 8));
      const bit = (charCode >> (bitIndex % 8)) & 1;
      image.bitmap.data[idx] = (red & 0xfe) | bit;
      bitIndex++;
    }
  }

  return image.getBufferAsync(Jimp.MIME_JPEG);
}
