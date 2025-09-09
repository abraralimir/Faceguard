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


const faceDetectionTool = ai.defineTool(
    {
      name: 'faceDetection',
      description: 'Detect faces in an image and return their bounding boxes.',
      inputSchema: FaceDetectionOutputSchema,
      outputSchema: z.void(),
    },
    async () => {} // The tool itself doesn't need to do anything, the model provides the arguments.
);

const detectFacesFlow = ai.defineFlow(
  {
    name: 'detectFacesFlow',
    inputSchema: FaceDetectionInputSchema,
    outputSchema: FaceDetectionOutputSchema,
  },
  async (input) => {

    const model = ai.getModel({
      model: 'googleai/gemini-2.5-flash-image-preview',
      tools: [faceDetectionTool],
      toolConfig: {
        mode: 'required',
        requiredTool: {
          toolName: 'faceDetection',
        },
      },
    });

    try {
        const {output} = await model.generate({
            prompt: [
                { text: "Detect any faces in this image and provide their bounding boxes using the faceDetection tool." },
                { media: { url: input.photoDataUri } }
            ]
        });
        
        if (output?.toolCalls && output.toolCalls.length > 0) {
            const toolCall = output.toolCalls[0];
            if (toolCall.name === 'faceDetection' && toolCall.args) {
                // Validate with Zod schema before returning
                const parsed = FaceDetectionOutputSchema.safeParse(toolCall.args);
                if (parsed.success) {
                    return parsed.data;
                } else {
                    console.error("Face detection Zod parsing error:", parsed.error);
                    return { detections: [] };
                }
            }
        }
    } catch (e) {
        console.error("Error during face detection flow:", e);
    }
    
    // Return empty array if anything goes wrong
    return { detections: [] };
  }
);
