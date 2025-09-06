'use server';
import Jimp from 'jimp';

/**
 * Embed invisible watermark by steganography in LSB of pixels.
 * This will be upgraded to a more robust DCT-based watermarking.
 */
export async function embedInvisibleWatermark(
  inputBuffer: Buffer,
  receipt: Record<string, any>
): Promise<Buffer> {
  const image = await Jimp.read(inputBuffer);
  // Create a compact payload from the receipt for watermarking
  const watermarkText = `FGv2::${receipt.seed}::${receipt.final_sha256.substring(
    0,
    16
  )}`;

  // TODO: Replace this LSB implementation with a robust DCT-based watermark.
  // The current LSB method is not resilient to compression.
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
      // Embed in Red, Green, and Blue channels, skipping Alpha
      for (let c = 0; c < 3 && bitIndex < watermarkText.length * 8; c++) {
        const channelIdx = idx + c;
        const value = image.bitmap.data[channelIdx];
        const charCode = watermarkText.charCodeAt(Math.floor(bitIndex / 8));
        const bit = (charCode >> (bitIndex % 8)) & 1;
        image.bitmap.data[channelIdx] = (value & 0xfe) | bit;
        bitIndex++;
      }
    }
  }

  return image.getBufferAsync(Jimp.MIME_JPEG);
}
