'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@jup-ag/wallet-adapter';
import { AppLayout } from '@/components/layout/AppLayout';
import { WalletIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading';

function ProfilePageContent() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();

  // Redirect to username-based profile
  useEffect(() => {
    if (!connected || !publicKey) {
      return;
    }

    async function redirectToUserProfile() {
      if (!supabase || !publicKey) return;

      try {
        // Get user's username from wallet address
        const { data: user, error } = await supabase
          .from('users')
          .select('username')
          .eq('wallet_address', publicKey.toBase58())
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // User doesn't exist yet, create one
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                wallet_address: publicKey.toBase58(),
                username: `user_${publicKey.toBase58().substring(0, 8)}`,
                display_name: `User ${publicKey.toBase58().substring(0, 8)}`,
              })
              .select('username')
              .single();

            if (createError) {
              console.error('❌ Error creating user:', createError);
              return;
            }

            // Redirect to new user's profile
            router.replace(`/profile/${newUser.username}`);
          } else {
            console.error('❌ Error loading profile:', error);
          }
          return;
        }

        // Redirect to user's profile
        router.replace(`/profile/${user.username}`);
      } catch (error) {
        console.error('❌ Error redirecting to profile:', error);
      }
    }

    redirectToUserProfile();
  }, [connected, publicKey, router]);

  if (!connected || !publicKey) {
    return (
      <AppLayout showWallet={true} showSearch={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <WalletIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-white/70 mb-6">Please connect your wallet to view your profile</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show loading while redirecting
  return (
    <AppLayout showWallet={true} showSearch={true}>
      <LoadingSpinner message="Loading your profile" submessage="Redirecting to your profile page..." />
    </AppLayout>
  );
}

// Wrapper component with Suspense boundary
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <AppLayout showWallet={true} showSearch={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner message="Loading" submessage="Getting ready..." />
        </div>
      </AppLayout>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
