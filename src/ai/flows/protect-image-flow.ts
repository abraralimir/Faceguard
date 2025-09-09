'use server';
/**
 * @fileOverview An AI flow to protect an image from manipulation.
 *
 * This flow uses a generative AI model to subtly modify an image,
 * making it more resistant to unauthorized AI editing and analysis
 * while preserving visual quality for human viewers.
 *
 * - protectImage - A function that handles the image protection process.
 * - ProtectImageInput - The input type for the protectImage function.
 * - ProtectImageOuptut - The return type for the protectImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const ProtectImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ProtectImageInput = z.infer<typeof ProtectImageInputSchema>;

export const ProtectImageOutputSchema = z.object({
  protectedPhotoDataUri: z
    .string()
    .describe('The data URI of the AI-protected image.'),
});
export type ProtectImageOutput = z.infer<typeof ProtectImageOutputSchema>;

const protectImagePrompt = `You are a world-class expert in protecting images from unauthorized AI editing, manipulation, and facial recognition. Subtly modify this image to make it resistant to such AI models. Preserve the original visual quality for humans as much as possible, but introduce imperceptible changes that will poison the data for any AI attempting to analyze it. Prioritize protecting any human faces you detect.`;

const protectImageFlow = ai.defineFlow(
  {
    name: 'protectImageFlow',
    inputSchema: ProtectImageInputSchema,
    outputSchema: ProtectImageOutputSchema,
  },
  async (input: ProtectImageInput): Promise<ProtectImageOutput> => {

    const { media } = await ai.generate({
      model: 'googleai/gemini-pro-vision',
      prompt: [
        {text: protectImagePrompt},
        {media: {url: input.photoDataUri}},
      ],
      config: {
        temperature: 0.2, // Low temperature for more deterministic, subtle changes
      },
    });

    if (!media) {
      throw new Error('AI model did not return a protected image.');
    }

    return {
      protectedPhotoDataUri: media.url,
    };
  }
);

export async function protectImage(
  input: ProtectImageInput
): Promise<ProtectImageOutput> {
  const result = await protectImageFlow(input);
  return result;
}
