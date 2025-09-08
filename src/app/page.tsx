import { FaceGuardApp } from '@/components/faceguard-app';
import { ShieldAlert, FileSignature, FileLock2, Lock, Fingerprint } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 overflow-hidden">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary">
          FaceGuard
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
          Turn your images and videos into an invisible fortress. FaceGuard applies
          a state-of-the-art defense to make your photos unintelligible to AI,
          and registers your videos with an unforgeable cryptographic hash.
        </p>
      </div>

      <FaceGuardApp />

      <div className="mt-20 w-full max-w-5xl text-center">
        <h2 className="text-3xl font-headline font-bold text-foreground mb-10">
          A New Standard in Digital Protection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <ShieldAlert className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-Layered AI Shield</h3>
            <p className="text-sm text-muted-foreground">
              For images, we apply invisible noise and color shifts. This "AI landmine"
              is imperceptible to you but corrupts data for models trying to
              learn from or alter your face.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <FileLock2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Invisible Watermark</h3>
            <p className="text-sm text-muted-foreground">
              A robust, invisible signal is cryptographically embedded across
              your image, surviving compression, cropping, and filtering to
              warn against manipulation.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <FileSignature className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Cryptographic Receipt</h3>
            <p className="text-sm text-muted-foreground">
              You receive a unique, unforgeable digital receipt for your image, signed with
              our server's private key, providing undeniable proof of its
              protected state.
            </p>
          </div>
           <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Fingerprint className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Video Fingerprinting</h3>
            <p className="text-sm text-muted-foreground">
               Your video is not altered. We compute a unique SHA-256 hash (a digital fingerprint) to register its authenticity, giving you proof of the original file.
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
          <p>&copy; 2025 FaceGuard by SASHA, a product of MIR BIN ALI. All Rights Reserved.</p>
       </footer>
    </main>
  );
}
