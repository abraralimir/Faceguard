import { FaceGuardApp } from '@/components/faceguard-app';
import { ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 overflow-hidden">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">
          FaceGuard
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          In an AI-driven world, your digital identity is your most valuable
          asset. FaceGuard applies a state-of-the-art, invisible shield to your
          images, protecting them from unauthorized AI editing and deepfake
          misuse.
        </p>
      </div>

      <FaceGuardApp />

      <div className="mt-12 w-full max-w-4xl text-center">
        <h2 className="text-2xl font-headline font-bold text-foreground mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Shielding</h3>
            <p className="text-sm text-muted-foreground">
              We apply robust, compression-resistant perturbations to your image, making it difficult for AI models to recognize or manipulate faces.
            </p>
          </div>
          <div className="flex flex-col items-center">
             <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
               <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Invisible Watermark</h3>
            <p className="text-sm text-muted-foreground">
              A secure, invisible watermark is embedded, containing a cryptographic signature that proves your ownership and the image's authenticity.
            </p>
          </div>
          <div className="flex flex-col items-center">
             <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
               <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Digital Receipt</h3>
            <p className="text-sm text-muted-foreground">
              You receive a signed digital receipt with a unique hash of your image, providing undeniable proof of its protected state.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
