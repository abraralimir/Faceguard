import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'FaceGuard: AI-Resistant Image & Video Protection',
  description: 'Protect your digital identity. FaceGuard applies an AI-resistant shield to your images and provides a cryptographic hash for videos to prevent unauthorized use, tracking, and deepfakes. Secure your photos with our multi-layered defense.',
  keywords: ['image protection', 'video protection', 'AI shield', 'anti-AI', 'facial recognition blocking', 'digital identity', 'privacy', 'security', 'cryptographic hash', 'deepfake prevention'],
  openGraph: {
    title: 'FaceGuard: AI-Resistant Image & Video Protection',
    description: 'Shield your photos and videos from AI misuse with our state-of-the-art protection.',
    url: 'https://faceguard-woad.vercel.app/', // Replace with your actual domain
    siteName: 'FaceGuard',
    images: [
      {
        url: 'https://faceguard-woad.vercel.app/og-image.png', // Replace with your actual OG image URL
        width: 1200,
        height: 630,
        alt: 'FaceGuard logo and tagline',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FaceGuard: AI-Resistant Image & Video Protection',
    description: 'Shield your photos and videos from AI misuse with our state-of-the-art protection.',
    images: ['https://faceguard-woad.vercel.app/og-image.png'], // Replace with your actual Twitter image URL
  },
  icons: {
    icon: '/favicon.ico', // Ensure you have a favicon.ico in your /public folder
    apple: '/apple-touch-icon.png', // Ensure you have this in /public
  },
  manifest: '/site.webmanifest', // Ensure you have this in /public
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
        <div className="background-grid" />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
