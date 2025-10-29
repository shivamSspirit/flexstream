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
  title: 'FlexStream - Social Platform for Crypto Traders',
  description: 'Create posts that launch tradable tokens on Solana. Share your trading journey and connect with the crypto community.',
  keywords: ['crypto', 'trading', 'solana', 'tokens', 'social media', 'DeFi', 'Meteora'],
  authors: [{ name: 'FlexStream Team' }],
  openGraph: {
    title: 'FlexStream - Social Platform for Crypto Traders',
    description: 'Create posts that launch tradable tokens on Solana. Share your trading journey and connect with the crypto community.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlexStream - Social Platform for Crypto Traders',
    description: 'Create posts that launch tradable tokens on Solana. Share your trading journey and connect with the crypto community.',
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
