'use client';

import dynamic from 'next/dynamic';
import { ReactNode, useCallback, useMemo } from 'react';
import { WalletError } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

// Styles for wallet modal
require('@solana/wallet-adapter-react-ui/styles.css');

// Optional: expose a ready-made connect button
export const SolanaConnectButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

interface Props { children: ReactNode }

export function SolanaProvider({ children }: Props) {
  const endpoint = useMemo(() => process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com', []);
  const onError = useCallback((error: WalletError) => {
    console.error('[Solana Wallet Error]', error);
  }, []);

  // Include wallet adapters - Jupiter, Phantom, and other Wallet Standard wallets will be auto-detected
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      // Jupiter wallet will be auto-detected via Wallet Standard
      // Other wallets (Solflare, Backpack, etc.) will also be auto-detected
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
