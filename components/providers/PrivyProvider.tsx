'use client';

import { PrivyProvider as PrivyProviderBase, usePrivy } from '@privy-io/react-auth';
import { toSolanaWalletConnectors, useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { ReactNode, useEffect, useState } from 'react';

// Configure Solana external wallet connectors (Phantom, Solflare, Backpack, etc.)
const solanaConnectors = toSolanaWalletConnectors();

interface PrivyWalletProviderProps {
  children: ReactNode;
}

/**
 * PrivyWalletProvider - Handles wallet authentication with Privy
 */
export function PrivyWalletProvider({ children }: PrivyWalletProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!appId) {
    console.warn('[Privy] No NEXT_PUBLIC_PRIVY_APP_ID found.');
    return <>{children}</>;
  }

  // Avoid SSR issues
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <PrivyProviderBase
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#00ff88',
          logo: '/flexit-logo.png',
          walletChainType: 'solana-only',
          walletList: ['phantom', 'solflare', 'backpack'],
          landingHeader: 'Welcome to Flexit',
          loginMessage: 'Sign in to start flexing',
        },
        // Social first, wallet optional
        loginMethods: ['google', 'twitter', 'email', 'wallet'],
        // Embedded wallets - Solana for social login users
        embeddedWallets: {
          solana: {
            createOnLogin: 'all-users',
          },
        },
        // External wallet connectors - enables detection of browser extension wallets
        // (Phantom, Solflare, Backpack, etc.)
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      <UserEnsurer>{children}</UserEnsurer>
    </PrivyProviderBase>
  );
}

/**
 * UserEnsurer - Ensures user exists in DB after auth
 */
function UserEnsurer({ children }: { children: ReactNode }) {
  const { authenticated, user, ready } = usePrivy();
  const { wallets } = useSolanaWallets();
  const [ensured, setEnsured] = useState(false);

  useEffect(() => {
    async function ensureUser() {
      if (!ready || !authenticated || ensured) return;

      // Get wallet address - since config is Solana-only, use first available wallet
      const walletAddress = wallets?.[0]?.address;

      if (!walletAddress) {
        console.log('[UserEnsurer] Waiting for Solana wallet...');
        return;
      }

      console.log('[UserEnsurer] Ensuring user:', walletAddress);

      try {
        const response = await fetch('/api/users/ensure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            privyUserId: user?.id,
            email: user?.email?.address,
            googleName: user?.google?.name,
            twitterUsername: user?.twitter?.username,
            twitterProfilePicture: user?.twitter?.profilePictureUrl,
          }),
        });

        const data = await response.json();

        if (data.success) {
          console.log('[UserEnsurer] User ready:', data.user?.username);
          sessionStorage.setItem('current_user', JSON.stringify(data.user));
          sessionStorage.setItem('current_username', data.user?.username || '');

          if (data.needsProfileSetup) {
            sessionStorage.setItem('needs_profile_setup', 'true');
          } else {
            sessionStorage.removeItem('needs_profile_setup');
          }

          setEnsured(true);
        } else {
          console.error('[UserEnsurer] Failed:', data.error);
        }
      } catch (error) {
        console.error('[UserEnsurer] Error:', error);
      }
    }

    ensureUser();
  }, [ready, authenticated, wallets, user, ensured]);

  // Reset on logout
  useEffect(() => {
    if (!authenticated) {
      setEnsured(false);
      sessionStorage.removeItem('current_user');
      sessionStorage.removeItem('current_username');
      sessionStorage.removeItem('needs_profile_setup');
    }
  }, [authenticated]);

  return <>{children}</>;
}

export default PrivyWalletProvider;
