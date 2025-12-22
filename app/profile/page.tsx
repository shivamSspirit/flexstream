'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@jup-ag/wallet-adapter';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/ui/loading';

/**
 * Profile redirect page
 * Redirects to the user's profile based on their wallet address
 * This handles the case where users click "My Profile" without a username
 */
export default function MyProfilePage() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    async function redirectToProfile() {
      // If not connected, redirect to home
      if (!connected || !publicKey) {
        console.log('❌ Not connected, redirecting to home');
        router.push('/');
        return;
      }

      try {
        const walletAddress = publicKey.toBase58();
        console.log('🔍 [PROFILE REDIRECT] Looking up user for wallet:', walletAddress);

        if (!supabase) {
          console.error('❌ [PROFILE REDIRECT] Supabase not configured');
          router.push('/explore');
          return;
        }

        // AUTO-FIX: Try multiple times with delays to account for user creation
        let user = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (!user && attempts < maxAttempts) {
          attempts++;

          // Wait before each attempt (longer for first attempt to let auto-creation finish)
          await new Promise(resolve => setTimeout(resolve, attempts === 1 ? 1500 : 500));

          console.log(`🔍 [PROFILE REDIRECT] Attempt ${attempts}/${maxAttempts}...`);

          const { data, error } = await supabase
            .from('users')
            .select('username, id, created_at')
            .eq('wallet_address', walletAddress)
            .single();

          if (data) {
            user = data;
            console.log('✅ [PROFILE REDIRECT] Found user on attempt', attempts);
            break;
          }

          if (error && error.code !== 'PGRST116') {
            // Real error, not just "not found"
            console.error('❌ [PROFILE REDIRECT] Database error:', error);
            break;
          }
        }

        if (!user) {
          console.error('❌ [PROFILE REDIRECT] User not found after', maxAttempts, 'attempts');
          console.log('🔄 [PROFILE REDIRECT] Creating user now...');

          // AUTO-CREATE: Try to create the user if they don't exist
          try {
            const createResponse = await fetch('/api/users/ensure', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress })
            });

            const createData = await createResponse.json();

            if (createData.success && createData.user) {
              console.log('✅ [PROFILE REDIRECT] User created:', createData.user.username);
              router.push(`/profile/${createData.user.username}`);
              return;
            }
          } catch (createError) {
            console.error('❌ [PROFILE REDIRECT] Failed to create user:', createError);
          }

          router.push('/explore');
          return;
        }

        console.log('✅ [PROFILE REDIRECT] Found user:', {
          username: user.username,
          id: user.id,
          created_at: user.created_at
        });
        console.log('🔄 [PROFILE REDIRECT] Redirecting to:', `/profile/${user.username}`);

        // Store username for future use
        sessionStorage.setItem('current_username', user.username);

        // Redirect to their profile page
        router.push(`/profile/${user.username}`);
      } catch (error) {
        console.error('❌ [PROFILE REDIRECT] Unexpected error:', error);
        router.push('/explore');
      }
    }

    redirectToProfile();
  }, [connected, publicKey, router]);

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <LoadingSpinner message="Loading your profile" submessage="Just a moment..." />
    </AppLayout>
  );
}
