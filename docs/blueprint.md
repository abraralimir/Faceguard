# **App Name**: FaceGuard Online

## Core Features:

- Image Upload and Processing Request: Allows users to upload an image and initiate the AI protection process. Implements file size and type validation.
- AI Shielding Application: Apply AI-resistance perturbation using a tool like Fawkes, Glaze, or LowKey to protect uploaded images. This module allows modification without perceptible visible degradation of the images.
- Invisible Watermark Embedding: Embed an imperceptible, invisible cryptographic watermark into the image to safeguard against unauthorized modification. This tool serves as evidence of origin without impacting visual quality.
- Metadata Removal: Strip all EXIF metadata from the image to eliminate privacy risks and prevent leakage of personal information.
- SHA-256 Hash Generation: Generates a SHA-256 hash of the processed image. The returned receipt contains the hash and provides verifiable proof of originality and integrity.
- Progress Indicator: Visual progress bar to keep the user informed during the image processing stages.
- Download Processed Image: Provides an instant download link of the protected image, ensuring there is no visible loss in quality.

## Style Guidelines:

- Primary color: Soft blue (#7EC4CF) to communicate trust and security. This color is vibrant enough to be the app's main touch, but without cliches. In HSL, the numbers are approximately H250 S40 L60.
- Background color: Light gray (#F0F4F8) provides a neutral and clean backdrop. In HSL, the numbers are approximately H250 S20 L90.
- Accent color: Pale green (#A2D5AB) is analogous to the primary, and highlights actionable items like the 'Process' and 'Download' buttons. In HSL, the numbers are approximately H120 S30 L70.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines and 'Inter' (sans-serif) for body text. 'Space Grotesk' gives a contemporary touch for primary interface elements; 'Inter' ensures readability.
- Code Font: 'Source Code Pro' for hash values shown in receipts, and inline representation of code.
- Simple, single-column layout optimized for drag-and-drop and mobile responsiveness.
- Use a minimalist icon set with clear affordances for upload, processing, and download actions.