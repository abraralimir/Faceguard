import { FaceGuardApp } from '@/components/faceguard-app';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-foreground">
          FaceGuard Online
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground">
          Protect your images with AI-resistance layers and an invisible
          watermark.
        </p>
      </div>
      <FaceGuardApp />
    </main>
  );
}
