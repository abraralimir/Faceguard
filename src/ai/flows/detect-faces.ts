'use server';
/**
 * @fileOverview A face detection AI agent.
 *
 * - detectFaces - A function that handles the face detection process.
 * - FaceDetectionInput - The input type for the detectFaces function.
 * - FaceDetectionOutput - The return type for the detectFaces function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


export const FaceDetectionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FaceDetectionInput = z.infer<typeof FaceDetectionInputSchema>;

const FaceDetectionSchema = z.object({
  x: z.number().describe('The x-coordinate of the top-left corner of the bounding box.'),
  y: z.number().describe('The y-coordinate of the top-left corner of the bounding box.'),
  w: z.number().describe('The width of the bounding box.'),
  h: z.number().describe('The height of the bounding box.'),
});
export type FaceDetection = z.infer<typeof FaceDetectionSchema>;


export const FaceDetectionOutputSchema = z.object({
  detections: z.array(FaceDetectionSchema).describe("An array of detected faces with their bounding box coordinates.")
});
export type FaceDetectionOutput = z.infer<typeof FaceDetectionOutputSchema>;


export async function detectFaces(input: FaceDetectionInput): Promise<FaceDetectionOutput> {
  return detectFacesFlow(input);
}


const detectFacesFlow = ai.defineFlow(
  {
    name: 'detectFacesFlow',
    inputSchema: FaceDetectionInputSchema,
    outputSchema: FaceDetectionOutputSchema,
  },
  async (input) => {

    const model = ai.getModel({
      model: 'googleai/gemini-2.5-flash-image-preview',
      tools: [
        ai.defineTool(
          {
            name: 'faceDetection',
            description: 'Detect faces in an image',
            inputSchema: FaceDetectionOutputSchema,
            outputSchema: z.void(),
          },
          async () => {}
        ),
      ],
      toolConfig: {
        mode: 'required',
        requiredTool: {
          toolName: 'faceDetection',
        },
      },
    });

    const {output} = await model.generate({
        prompt: [
            { text: "Detect any faces in this image and provide their bounding boxes." },
            { media: { url: input.photoDataUri } }
        ]
    });
    
    if (output?.toolCalls) {
        try {
            const detections = output.toolCalls[0].args;
            // Validate with Zod schema before returning
            return FaceDetectionOutputSchema.parse(detections);
        } catch (e) {
             console.error("Face detection parsing error:", e);
             return { detections: [] };
        }
    }
    
    return { detections: [] };
  }
);
