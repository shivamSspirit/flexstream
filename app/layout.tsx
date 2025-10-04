import type { Metadata } from 'next';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { SolanaProvider } from '@/components/solana/SolanaProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FlexStream - Social Platform for Pump.fun Streamers',
  description: 'Show off your trading success, share stream highlights, and connect with the crypto community',
  keywords: ['crypto', 'trading', 'pump.fun', 'social media', 'streaming', 'earnings'],
  authors: [{ name: 'FlexStream Team' }],
  openGraph: {
    title: 'FlexStream - Social Platform for Pump.fun Streamers',
    description: 'Show off your trading success, share stream highlights, and connect with the crypto community',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlexStream - Social Platform for Pump.fun Streamers',
    description: 'Show off your trading success, share stream highlights, and connect with the crypto community',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={inter.className}>
          <header className="flex justify-end items-center p-4 gap-4 h-14">
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          <Providers>
            <SolanaProvider>
              {children}
            </SolanaProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
