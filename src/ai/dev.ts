import { config } from 'dotenv';
config();

// The genkit-cli will require these imports to register the flows.
// We are not using Genkit flows for the protection pipeline anymore,
// so these imports can be removed.
// import '@/ai/flows/apply-ai-shielding.ts';
// import '@/ai/flows/embed-invisible-watermark.ts';
