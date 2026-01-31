'use client';

import { useEffect } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';

/**
 * Hook that automatically creates a user record when wallet connects
 * This prevents redirect loops when accessing profile pages
 */
export function useEnsureUser() {
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    if (!connected || !publicKey) return;

    const ensureUserExists = async () => {
      try {
        console.log('🔄 [ENSURE USER] Checking if user exists for wallet:', publicKey.toBase58());

        const response = await fetch('/api/users/ensure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: publicKey.toBase58(),
          }),
        });

        const result = await response.json();

        if (result.success) {
          if (result.isNewUser) {
            console.log('✅ [ENSURE USER] New user created:', result.user.username);
          } else {
            console.log('✅ [ENSURE USER] Existing user found:', result.user.username);
          }
        } else {
          console.error('❌ [ENSURE USER] Failed:', result.error);
        }
      } catch (error) {
        console.error('❌ [ENSURE USER] Error:', error);
      }
    };

    ensureUserExists();
  }, [connected, publicKey]);
}
