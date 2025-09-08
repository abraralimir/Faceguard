import { FaceGuardApp } from '@/components/faceguard-app';
import { ShieldAlert, FileSignature, FileLock2, Lock } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 overflow-hidden">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">
          FaceGuard
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
          Turn your images into an invisible fortress. FaceGuard applies a
          state-of-the-art, multi-layered defense to make your photos
          unintelligible to AI, protecting you from deepfakes, data scraping,
          and unauthorized use.
        </p>
      </div>

      <FaceGuardApp />

      <div className="mt-20 w-full max-w-5xl text-center">
        <h2 className="text-3xl font-headline font-bold text-foreground mb-10">
          A New Standard in Digital Protection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <ShieldAlert className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-Layered AI Shield</h3>
            <p className="text-sm text-muted-foreground">
              We apply several layers of subtle, randomized noise and color
              shifts. This "AI landmine" is invisible to you but corrupts data
              for models trying to learn from or alter your face.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <FileLock2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Resilient Invisible Watermark</h3>
            <p className="text-sm text-muted-foreground">
              A robust, invisible signal is cryptographically embedded across
              the image, warning against manipulation and surviving
              compression, cropping, and filtering.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <FileSignature className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Cryptographic Receipt</h3>
            <p className="text-sm text-muted-foreground">
              You receive a unique, unforgeable digital receipt signed with our
              server's private key, providing undeniable proof of your image's
              protected state and authenticity.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-20 w-full max-w-2xl text-center p-8 bg-card/50 rounded-lg border border-border">
         <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 mb-4 mx-auto">
              <Lock className="w-8 h-8 text-green-400" />
            </div>
        <h2 className="text-2xl font-headline font-bold text-foreground mb-4">Your Privacy is Paramount</h2>
        <p className="text-muted-foreground">
          We process your files entirely in memory. Your images and videos are
          <span className="text-primary font-semibold"> never stored or logged</span> on our servers. The protection happens, and the
          data vanishes. Period.
        </p>
      </div>

       <footer className="w-full max-w-5xl text-center mt-20 text-muted-foreground text-sm">
          <p>&copy; 2025 FaceGuard by SASHA, a product of MIR BIN ALI. All Rights Reserved.</p>
       </footer>
    </main>
  );
}
