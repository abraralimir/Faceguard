import { FaceGuardApp } from '@/components/faceguard-app';
import { ShieldAlert, FileSignature, Fingerprint, Lock, ArrowRight, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 overflow-hidden">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">
          FaceGuard
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
          Turn your images and videos into an invisible fortress. FaceGuard enhances
          your media, applies a state-of-the-art defense to make it
          unintelligible to AI, and registers it with an unforgeable cryptographic hash.
        </p>
      </div>

      <FaceGuardApp />

      <div className="mt-20 w-full max-w-5xl text-center">
        <h2 className="text-3xl font-headline font-bold text-foreground mb-10">
          The New Standard in Digital Protection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center p-6 bg-card/50 rounded-lg border border-border/50 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Quality Enhancement</h3>
            <p className="text-sm text-muted-foreground">
              Your images are automatically upscaled and sharpened, resulting in a higher-quality photo before any protection is even applied.
            </p>
          </div>
          <div className="flex flex-col items-center p-6 bg-card/50 rounded-lg border border-border/50 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <ShieldAlert className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Imperceptible AI Shield</h3>
            <p className="text-sm text-muted-foreground">
              A multi-layered defense of noise, color shifts, and micro-distortions is applied, corrupting data for AI models while remaining invisible to the human eye.
            </p>
          </div>
          <div className="flex flex-col items-center p-6 bg-card/50 rounded-lg border border-border/50 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <FileSignature className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Cryptographic Proof</h3>
            <p className="text-sm text-muted-foreground">
               Receive an unforgeable digital receipt (SHA-256 hash) for every file, providing undeniable proof of its protected state and authenticity.
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
          <span className="text-primary font-semibold"> never stored or logged</span> on our servers. The protection is applied, and then the data vanishes forever.
        </p>
      </div>

       <footer className="w-full max-w-5xl text-center mt-20 text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} FaceGuard. All Rights Reserved.</p>
       </footer>
    </main>
  );
}
