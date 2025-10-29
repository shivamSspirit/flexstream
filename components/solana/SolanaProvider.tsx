'use client';

import { ReactNode, useEffect } from 'react';
import { UnifiedWalletProvider } from '@jup-ag/wallet-adapter';

interface Props { 
  children: ReactNode;
}

export function SolanaProvider({ children }: Props) {
  // Debug wallet persistence
  useEffect(() => {
    console.log('🔍 [Wallet] SolanaProvider mounted');
    
    // Check if there's any stored wallet connection
    const checkStoredWallet = () => {
      const stored = localStorage.getItem('jup-wallet-adapter');
      console.log('🔍 [Wallet] Stored wallet data:', stored);
      
      // Also check for other common wallet storage keys
      const phantom = localStorage.getItem('phantom');
      const solflare = localStorage.getItem('solflare');
      console.log('🔍 [Wallet] Phantom data:', phantom);
      console.log('🔍 [Wallet] Solflare data:', solflare);
    };
    
    checkStoredWallet();
  }, []);

  return (
    <UnifiedWalletProvider
      wallets={[]} // Empty array - Jupiter will auto-discover wallets
      config={{
        autoConnect: true,
        env: 'devnet',
        metadata: {
          name: 'FlexStream',
          description: 'Social Platform for Pump.fun Streamers',
          url: 'https://flexstream.app',
          iconUrls: ['/favicon.ico'],
        },
        theme: 'dark',
        lang: 'en',
        // Additional persistence settings
        walletlistExplanation: {
          href: 'https://station.jup.ag/docs/additional-topics/wallet-list',
        },
      }}
    >
      {children}
    </UnifiedWalletProvider>
  );
}
