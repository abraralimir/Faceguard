/**
 * @fileoverview This file initializes and configures the Genkit AI library.
 *
 * It sets up the Gemini plugin and exports a configured `ai` object for use
 * throughout the application. This centralized setup allows for consistent AI

 * model configuration and behavior.
 */
'use server';

import {genkit, GenerationCommonConfig} from '@genkit-ai/ai';
import {configureGenkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin.
// This makes Google's AI models, like Gemini, available to the application.
export const ai = genkit({
  plugins: [googleAI({apiVersion: 'v1beta'})],
});
