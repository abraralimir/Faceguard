import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'FaceGuard: Protect Your Digital Identity',
  description: 'FaceGuard provides state-of-the-art protection for your images. Apply an invisible, AI-resistant shield and watermark to prevent unauthorized editing, deepfakes, and misuse on social media.',
  openGraph: {
    title: 'FaceGuard: Protect Your Digital Identity',
    description: 'Shield your photos from AI misuse.',
    url: 'https://your-faceguard-url.com', // Replace with your actual URL
    siteName: 'FaceGuard',
    images: [
      {
        url: 'https://your-faceguard-url.com/og-image.png', // Replace with an actual OG image URL
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
    description: 'Shield your photos from AI misuse.',
    // creator: '@your-twitter-handle', // Replace with your twitter handle
    images: ['https://your-faceguard-url.com/og-image.png'], // Replace
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
      </body>
    </html>
  );
}
