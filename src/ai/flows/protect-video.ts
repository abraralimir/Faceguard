'use server';
/**
 * @fileOverview A video protection agent.
 * This file is currently not a Genkit flow, but contains types for video processing.
 *
 * - ProtectVideoInput - The input type for the protectVideo function.
 * - ProtectVideoOutput - The return type for the protectVideo function.
 */

import {z} from 'genkit';

// Note: These types are used by the API route, not a Genkit flow.

export const ProtectVideoInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ProtectVideoInput = z.infer<typeof ProtectVideoInputSchema>;

export const ProtectVideoOutputSchema = z.object({
  hash: z.string().describe('The SHA-256 hash of the video.'),
});
export type ProtectVideoOutput = z.infer<typeof ProtectVideoOutputSchema>;

    