'use server';
/**
 * @fileOverview Embeds an invisible cryptographic watermark into an image.
 *
 * - embedInvisibleWatermark - A function that embeds the watermark.
 * - EmbedInvisibleWatermarkInput - The input type for the embedInvisibleWatermark function.
 * - EmbedInvisibleWatermarkOutput - The return type for the embedInvisibleWatermark function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmbedInvisibleWatermarkInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to embed a watermark into, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  watermark: z.string().describe('The invisible watermark to embed.'),
});
export type EmbedInvisibleWatermarkInput = z.infer<typeof EmbedInvisibleWatermarkInputSchema>;

const EmbedInvisibleWatermarkOutputSchema = z.object({
  watermarkedPhotoDataUri: z
    .string()
    .describe(
      'The watermarked photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'"
    ),
});
export type EmbedInvisibleWatermarkOutput = z.infer<typeof EmbedInvisibleWatermarkOutputSchema>;

export async function embedInvisibleWatermark(
  input: EmbedInvisibleWatermarkInput
): Promise<EmbedInvisibleWatermarkOutput> {
  return embedInvisibleWatermarkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'embedInvisibleWatermarkPrompt',
  input: {schema: EmbedInvisibleWatermarkInputSchema},
  output: {schema: EmbedInvisibleWatermarkOutputSchema},
  prompt: `You are an expert in steganography and digital watermarking.  You can embed the invisible watermark {{{watermark}}} into the photo at the URL {{{media url=photoDataUri}}}. Return the watermarked image as a data URI in the watermarkedPhotoDataUri field. Do not modify the image in any way other than to embed the provided watermark, and ensure that the image quality is preserved.`,
});

const embedInvisibleWatermarkFlow = ai.defineFlow(
  {
    name: 'embedInvisibleWatermarkFlow',
    inputSchema: EmbedInvisibleWatermarkInputSchema,
    outputSchema: EmbedInvisibleWatermarkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
