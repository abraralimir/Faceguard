import {genkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';

genkit({
  plugins: [googleAI({apiVersion: 'v1beta'})],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
