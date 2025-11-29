import type { Metadata } from 'next';
import { Inter, Space_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { SolanaProvider } from '@/components/solana/SolanaProvider';

// Inter font - Primary font family (optimized for UI/screens)
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

// Space Mono - Monospace font for numbers, addresses, code
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FlexIt - Social Platform for Crypto Traders',
  description: 'Create posts that launch tradable tokens on Solana. Share your trading journey and connect with the crypto community.',
  keywords: ['crypto', 'trading', 'solana', 'tokens', 'social media', 'DeFi', 'Meteora'],
  authors: [{ name: 'FlexIt Team' }],
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico?v=2' },
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
    title: 'FlexIt - Social Platform for Crypto Traders',
    description: 'Create posts that launch tradable tokens on Solana. Share your trading journey and connect with the crypto community.',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/flexit-logo.png',
        width: 1200,
        height: 630,
        alt: 'FlexIt Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlexIt - Social Platform for Crypto Traders',
    description: 'Create posts that launch tradable tokens on Solana. Share your trading journey and connect with the crypto community.',
    images: ['/flexit-logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceMono.variable} font-sans antialiased`}>
        <Providers>
          <SolanaProvider>
            {children}
          </SolanaProvider>
        </Providers>
      </body>
    </html>
  );
}
