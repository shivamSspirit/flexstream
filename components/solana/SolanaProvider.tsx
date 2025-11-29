'use client';

import { ReactNode, useEffect } from 'react';
import { UnifiedWalletProvider } from '@jup-ag/wallet-adapter';

interface Props {
  children: ReactNode;
}

/**
 * SolanaProvider Configuration:
 *
 * The wallet adapter uses 'mainnet-beta' because:
 * - Jupiter swaps MUST run on mainnet (real tokens)
 * - Meteora DBC token creation uses devnet RPC directly via Connection
 *
 * Network Usage:
 * - Wallet UI/Signing: mainnet-beta (for Jupiter swaps)
 * - Meteora DBC: Uses separate devnet Connection in CreatePostModal
 * - Jupiter Swaps: Uses mainnet Connection in SwapModal
 */

// Get network from env - default to mainnet for Jupiter compatibility
const WALLET_ENV = (process.env.NEXT_PUBLIC_JUPITER_NETWORK === 'mainnet-beta' ? 'mainnet-beta' : 'devnet') as 'mainnet-beta' | 'devnet';

export function SolanaProvider({ children }: Props) {
  // Debug wallet persistence
  useEffect(() => {
    console.log('🔍 [Wallet] SolanaProvider mounted');
    console.log('🔍 [Wallet] Environment:', WALLET_ENV);

    // Check if there's any stored wallet connection
    const checkStoredWallet = () => {
      const stored = localStorage.getItem('jup-wallet-adapter');
      console.log('🔍 [Wallet] Stored wallet data:', stored);
    };

    checkStoredWallet();
  }, []);

  return (
    <UnifiedWalletProvider
      wallets={[]} // Empty array - Jupiter will auto-discover wallets
      config={{
        autoConnect: true,
        env: WALLET_ENV,
        metadata: {
          name: 'FlexStream',
          description: 'Social Platform for Crypto Traders',
          url: 'https://flexstream.app',
          iconUrls: ['/favicon.ico'],
        },
        theme: 'dark',
        lang: 'en',
        walletlistExplanation: {
          href: 'https://station.jup.ag/docs/additional-topics/wallet-list',
        },
      }}
    >
      {children}
    </UnifiedWalletProvider>
  );
}
