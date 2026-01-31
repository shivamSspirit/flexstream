'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { UnifiedWalletProvider, useWallet } from '@jup-ag/wallet-adapter';

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

// Get network from env - default to devnet for development
const WALLET_ENV = (process.env.NEXT_PUBLIC_JUPITER_NETWORK === 'mainnet-beta' ? 'mainnet-beta' : 'devnet') as 'mainnet-beta' | 'devnet';

/**
 * Component that auto-creates user when wallet connects
 */
function UserEnsurer({ children }: { children: ReactNode }) {
  const { connected, publicKey } = useWallet();
  const [userEnsured, setUserEnsured] = useState(false);

  useEffect(() => {
    async function ensureUser() {
      if (!connected || !publicKey) {
        setUserEnsured(false);
        return;
      }

      const walletAddress = publicKey.toBase58();
      console.log('🔄 [UserEnsurer] Wallet connected, ensuring user exists:', walletAddress);

      try {
        const response = await fetch('/api/users/ensure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress })
        });

        const data = await response.json();

        if (data.success) {
          console.log('✅ [UserEnsurer] User ready:', data.user?.username, data.isNewUser ? '(new)' : '(existing)');
          // Store user info for quick access
          sessionStorage.setItem('current_user', JSON.stringify(data.user));
          sessionStorage.setItem('current_username', data.user?.username || '');
          setUserEnsured(true);
        } else {
          console.error('❌ [UserEnsurer] Failed to ensure user:', data.error);
        }
      } catch (error) {
        console.error('❌ [UserEnsurer] Error ensuring user:', error);
      }
    }

    ensureUser();
  }, [connected, publicKey]);

  return <>{children}</>;
}

export function SolanaProvider({ children }: Props) {
  const [mounted, setMounted] = useState(false);

  // Only render on client side to avoid SSR issues
  useEffect(() => {
    setMounted(true);
    console.log('🔍 [Wallet] SolanaProvider mounted');
    console.log('🔍 [Wallet] Environment:', WALLET_ENV);
    console.log('🔍 [Wallet] Browser:', typeof window !== 'undefined' ? navigator.userAgent : 'SSR');

    // Check if there's any stored wallet connection
    const checkStoredWallet = () => {
      try {
        const stored = localStorage.getItem('jup-wallet-adapter');
        console.log('🔍 [Wallet] Stored wallet data:', stored ? 'Found' : 'None');
      } catch (error) {
        console.warn('🔍 [Wallet] Could not access localStorage:', error);
      }
    };

    checkStoredWallet();

    // Check if Solana wallets are available
    const checkWalletAvailability = () => {
      const hasPhantom = !!(window as any).phantom?.solana;
      const hasSolflare = !!(window as any).solflare;
      const hasBackpack = !!(window as any).backpack;

      console.log('🔍 [Wallet] Available wallets:', {
        phantom: hasPhantom,
        solflare: hasSolflare,
        backpack: hasBackpack,
      });

      if (!hasPhantom && !hasSolflare && !hasBackpack) {
        console.warn('⚠️ [Wallet] No Solana wallets detected. Please install Phantom, Solflare, or Backpack.');
      }
    };

    // Check wallet availability after a short delay to let extensions load
    setTimeout(checkWalletAvailability, 1000);
  }, []);

  // Don't render until mounted to avoid hydration errors
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <UnifiedWalletProvider
      wallets={[]} // Empty array - Jupiter will auto-discover wallets
      config={{
        autoConnect: true, // Auto-reconnect wallet on page navigation
        env: WALLET_ENV,
        metadata: {
          name: 'FlexStream',
          description: 'Social Platform for Crypto Traders',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://flexstream.app',
          iconUrls: ['/favicon.ico'],
        },
        theme: 'dark',
        lang: 'en',
        walletlistExplanation: {
          href: 'https://station.jup.ag/docs/additional-topics/wallet-list',
        },
      }}
    >
      <UserEnsurer>
        {children}
      </UserEnsurer>
    </UnifiedWalletProvider>
  );
}
