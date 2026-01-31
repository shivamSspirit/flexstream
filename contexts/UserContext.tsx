'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';

// ============================================================================
// TYPES
// ============================================================================

interface UserProfile {
  id: string;
  wallet_address: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  updated_at?: string;
}

interface UserContextValue {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const UserContext = createContext<UserContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function UserProvider({ children }: { children: ReactNode }) {
  const { authenticated, user: privyUser } = usePrivy();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate fetches
  const fetchingRef = useRef(false);
  const lastWalletRef = useRef<string | null>(null);

  // Get wallet address from Privy
  const walletAddress = privyUser?.wallet?.address || null;

  const fetchUser = useCallback(async () => {
    if (!walletAddress) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Prevent duplicate fetches for same wallet
    if (fetchingRef.current && lastWalletRef.current === walletAddress) {
      return;
    }

    // If we already have user data for this wallet, skip
    if (user?.wallet_address === walletAddress) {
      return;
    }

    fetchingRef.current = true;
    lastWalletRef.current = walletAddress;
    setLoading(true);
    setError(null);

    try {
      // First ensure user exists (creates if needed)
      const ensureResponse = await fetch('/api/users/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      const ensureResult = await ensureResponse.json();

      if (ensureResult.success && ensureResult.user) {
        setUser(ensureResult.user);
      } else {
        // Fallback: try to fetch existing user
        const fetchResponse = await fetch(`/api/users/by-wallet?wallet=${walletAddress}`);
        const fetchResult = await fetchResponse.json();

        if (fetchResult.success && fetchResult.data) {
          setUser(fetchResult.data);
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error('[UserContext] Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user');
      setUser(null);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [walletAddress, user?.wallet_address]);

  // Fetch user when wallet connects
  useEffect(() => {
    if (authenticated && walletAddress) {
      fetchUser();
    } else {
      setUser(null);
      lastWalletRef.current = null;
    }
  }, [authenticated, walletAddress, fetchUser]);

  const value: UserContextValue = {
    user,
    loading,
    error,
    refetch: fetchUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// ============================================================================
// OPTIONAL HOOK (doesn't throw if outside provider)
// ============================================================================

export function useUserOptional(): UserContextValue | null {
  const context = useContext(UserContext);
  return context ?? null;
}
