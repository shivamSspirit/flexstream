'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserProvider } from '@/contexts/UserContext';
import { PrivyWalletProvider } from '@/components/providers/PrivyProvider';
import { SolanaWalletsProvider } from '@/hooks/useWalletCompat';

/**
 * Providers - Main app providers
 * Includes: React Query, Theme, User, Privy Wallet, Solana Wallets
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60000, // Cache for 1 minute to reduce duplicate fetches
        retry: 1,
        refetchOnMount: false, // Don't refetch on every mount
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <PrivyWalletProvider>
      <SolanaWalletsProvider>
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </UserProvider>
        </QueryClientProvider>
      </SolanaWalletsProvider>
    </PrivyWalletProvider>
  );
}
