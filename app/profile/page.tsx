'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useWallet } from '@/hooks/useWalletCompat';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/ui/loading';

/**
 * Profile redirect page
 * Redirects to the user's profile based on their wallet address
 * User is auto-created when wallet connects (via UserEnsurer in SolanaProvider)
 */
export default function MyProfilePage() {
  const router = useRouter();
  const { authenticated, ready: privyReady } = usePrivy();
  const { connected, publicKey, ready } = useWallet();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    async function redirectToProfile() {
      if (isRedirecting) return;

      console.log('[PROFILE] State - connected:', connected, 'ready:', ready, 'authenticated:', authenticated);

      // Wait for Privy SDK to initialize
      if (!privyReady) {
        console.log('[PROFILE] Waiting for Privy SDK to be ready...');
        return;
      }

      // If Privy says user is NOT authenticated, redirect to home
      if (!authenticated) {
        console.log('[PROFILE] Not authenticated, redirecting to home');
        router.push('/');
        return;
      }

      // Wait for wallet compat bridge to finish loading
      if (!ready || !connected || !publicKey) {
        console.log('[PROFILE] Authenticated, waiting for wallet to populate...');
        return;
      }

      setIsRedirecting(true);

      // Check if profile setup is needed
      const needsSetup = sessionStorage.getItem('needs_profile_setup');
      if (needsSetup === 'true') {
        console.log('[PROFILE] Profile setup needed, redirecting to edit');
        router.push('/profile/edit');
        return;
      }

      // If we have publicKey, always redirect to wallet-based profile URL
      // This ensures consistent routing regardless of username state
      const walletAddress = publicKey.toBase58();

      // Check sessionStorage for user data to decide if setup is needed
      const storedUser = sessionStorage.getItem('current_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Check if it's an auto-generated username (needs setup)
          const isAutoUsername = userData.username?.match(/^user[a-z0-9]{10,}$/);
          if (isAutoUsername || sessionStorage.getItem('needs_profile_setup') === 'true') {
            console.log('[PROFILE] Profile setup needed, redirecting to edit');
            router.push('/profile/edit');
            return;
          }
          // Redirect to wallet-based profile URL
          console.log('[PROFILE] Found stored user, redirecting to wallet profile:', walletAddress);
          router.push(`/profile/${walletAddress}`);
          return;
        } catch {
          // Invalid stored data, continue to API check
        }
      }

      // If not in sessionStorage, call ensure API
      console.log('[PROFILE] Ensuring user exists for:', walletAddress);

      try {
        const response = await fetch('/api/users/ensure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress })
        });

        const data = await response.json();

        if (data.success && data.user) {
          console.log('[PROFILE] User ready:', data.user.wallet_address);
          sessionStorage.setItem('current_username', data.user.username);
          sessionStorage.setItem('current_user', JSON.stringify(data.user));

          // Check if profile setup is needed
          if (data.needsProfileSetup) {
            sessionStorage.setItem('needs_profile_setup', 'true');
            router.push('/profile/edit');
          } else {
            sessionStorage.removeItem('needs_profile_setup');
            // Always route to wallet address
            router.push(`/profile/${data.user.wallet_address}`);
          }
        } else {
          console.error('[PROFILE] Failed to ensure user:', data.error);
          router.push('/profile/edit');
        }
      } catch (error) {
        console.error('[PROFILE] Error:', error);
        router.push('/profile/edit');
      }
    }

    redirectToProfile();
  }, [connected, publicKey, ready, router, isRedirecting, privyReady, authenticated]);

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <LoadingSpinner message="Loading your profile" submessage="Just a moment..." />
    </AppLayout>
  );
}
