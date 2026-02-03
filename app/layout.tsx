import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#050505',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Flexit — Trade Social Content on Solana',
  description: 'Create posts that launch tradable tokens on Solana. Share your trading journey and connect with the crypto community.',
  keywords: ['crypto', 'trading', 'solana', 'tokens', 'social media', 'DeFi', 'Meteora', 'web3'],
  authors: [{ name: 'Flexit' }],
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Flexit — Trade Social Content on Solana',
    description: 'Create posts that launch tradable tokens on Solana. Share your trading journey and connect with the crypto community.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Flexit',
    images: [
      {
        url: '/flexit-logo.png',
        width: 1200,
        height: 630,
        alt: 'Flexit — Trade Social Content',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flexit — Trade Social Content on Solana',
    description: 'Create posts that launch tradable tokens on Solana. Share your trading journey and connect with the crypto community.',
    images: ['/flexit-logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Cormorant Garamond — Luxury Editorial Serif */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        {/* IBM Plex Mono — Data Display */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased min-h-screen"
        style={{
          background: '#050505',
          color: '#FAFAFA',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        }}
      >
        {/* Subtle Grain Texture Overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: 0.025,
          }}
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
