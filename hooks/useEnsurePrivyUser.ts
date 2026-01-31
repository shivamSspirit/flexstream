'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { useEffect, useState } from 'react';

/**
 * useEnsurePrivyUser - Automatically creates/updates user when Privy authenticates
 *
 * This hook:
 * 1. Monitors Privy authentication state
 * 2. When a user logs in, ensures they have a database record
 * 3. Stores user info in session storage for quick access
 */
export function useEnsurePrivyUser() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useSolanaWallets();
  const [userEnsured, setUserEnsured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get the active wallet (first available)
  const activeWallet = wallets?.[0];
  const walletAddress = activeWallet?.address;

  useEffect(() => {
    async function ensureUser() {
      if (!ready || !authenticated || !walletAddress) {
        setUserEnsured(false);
        return;
      }

      // Skip if already ensured for this wallet
      const storedWallet = sessionStorage.getItem('current_wallet');
      if (storedWallet === walletAddress && userEnsured) {
        return;
      }

      setIsLoading(true);

      try {
        // Get display info from Privy linked accounts
        const googleAccount = user?.linkedAccounts?.find((a: any) => a.type === 'google_oauth') as any;
        const twitterAccount = user?.linkedAccounts?.find((a: any) => a.type === 'twitter_oauth') as any;
        const emailAccount = user?.linkedAccounts?.find((a: any) => a.type === 'email') as any;

        const displayName = googleAccount?.name ||
          twitterAccount?.name ||
          emailAccount?.address?.split('@')[0] ||
          `User_${walletAddress.slice(0, 6)}`;

        const avatarUrl = twitterAccount?.profilePictureUrl || null;
        const email = emailAccount?.address || googleAccount?.email || null;

        console.log('🔄 [Privy] Ensuring user exists:', walletAddress);

        const response = await fetch('/api/users/ensure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            displayName,
            avatarUrl,
            email,
            // Privy user ID for reference
            privyUserId: user?.id,
          })
        });

        const data = await response.json();

        if (data.success) {
          console.log('✅ [Privy] User ready:', data.user?.username);
          // Store user info
          sessionStorage.setItem('current_user', JSON.stringify(data.user));
          sessionStorage.setItem('current_username', data.user?.username || '');
          sessionStorage.setItem('current_wallet', walletAddress);
          setUserEnsured(true);
        } else {
          console.error('❌ [Privy] Failed to ensure user:', data.error);
        }
      } catch (error) {
        console.error('❌ [Privy] Error ensuring user:', error);
      } finally {
        setIsLoading(false);
      }
    }

    ensureUser();
  }, [ready, authenticated, walletAddress, user, userEnsured]);

  // Clear session on logout
  useEffect(() => {
    if (!authenticated) {
      sessionStorage.removeItem('current_user');
      sessionStorage.removeItem('current_username');
      sessionStorage.removeItem('current_wallet');
      setUserEnsured(false);
    }
  }, [authenticated]);

  return {
    userEnsured,
    isLoading,
    walletAddress,
  };
}
