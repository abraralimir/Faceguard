import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'FaceGuard: Protect Your Digital Identity',
  description: 'FaceGuard provides state-of-the-art protection for your images and videos. Apply an AI-resistant shield and get a cryptographic hash to prevent unauthorized use.',
  openGraph: {
    title: 'FaceGuard: Protect Your Digital Identity',
    description: 'Shield your photos and videos from AI misuse.',
    url: 'https://faceguard-woad.vercel.app/',
    siteName: 'FaceGuard',
    images: [
      {
        url: 'https://faceguard-woad.vercel.app/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FaceGuard: Protect Your Digital Identity',
    description: 'Shield your photos and videos from AI misuse.',
    images: ['https://faceguard-woad.vercel.app/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Source+Code+Pro:wght@400;600&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <div className="background-gradient" />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
