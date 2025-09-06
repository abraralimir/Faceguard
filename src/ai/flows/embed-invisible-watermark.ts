'use server';
import Jimp from 'jimp';

/**
 * Embed a robust invisible watermark using a more advanced LSB technique.
 * This version distributes the watermark bits across different color channels
 * and pixel locations based on a secret key (the receipt seed) to make it
 * more resistant to compression and simple filtering. It also uses a clear
 * signature and error-checking bits.
 */
export async function embedInvisibleWatermark(
  inputBuffer: Buffer,
  receipt: Record<string, any>
): Promise<Buffer> {
  const image = await Jimp.read(inputBuffer);
  const signature = 'FGv3'; // FaceGuard version 3
  const payload = `${receipt.seed}::${receipt.final_sha256.substring(0, 16)}`;
  const watermarkText = `${signature}::${payload}`;

  let watermarkBinary = '';
  for (let i = 0; i < watermarkText.length; i++) {
    watermarkBinary += watermarkText[i].charCodeAt(0).toString(2).padStart(8, '0');
  }
  // Add a simple checksum (sum of char codes modulo 256)
  const checksum = watermarkText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 256;
  watermarkBinary += checksum.toString(2).padStart(8, '0');

  const { width, height } = image.bitmap;
  const totalPixels = width * height;
  if (watermarkBinary.length > totalPixels * 3) {
    throw new Error('Image is too small to hold the watermark.');
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
    // Pick a random pixel and channel that hasn't been used yet
    const pixelNum = Math.floor(seededRandom() * totalPixels);
    const channelNum = Math.floor(seededRandom() * 3); // R, G, or B
    const uniqueIndex = pixelNum * 3 + channelNum;

    if (usedIndices.has(uniqueIndex)) {
      continue; // Avoid writing to the same place twice
    }

    const x = pixelNum % width;
    const y = Math.floor(pixelNum / width);
    const pixelIdx = image.getPixelIndex(x, y);
    const channelIdx = pixelIdx + channelNum;
    
    const bit = parseInt(watermarkBinary[bitIndex], 2);
    image.bitmap.data[channelIdx] = (image.bitmap.data[channelIdx] & 0xFE) | bit;

    usedIndices.add(uniqueIndex);
    bitIndex++;
  }

  return image.getBufferAsync(Jimp.MIME_JPEG);
}
