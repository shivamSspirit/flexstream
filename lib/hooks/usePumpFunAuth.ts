import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface PumpFunTokenResponse {
  success: boolean;
  token?: string;
  expiresIn?: string;
  userId?: string;
  message?: string;
  error?: string;
  code?: string;
}

export function usePumpFunAuth() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);

  // Query to get JWT token for Pump.fun API
  const {
    data: tokenData,
    isLoading: isTokenLoading,
    error: tokenError,
    refetch: refetchToken,
  } = useQuery<PumpFunTokenResponse>({
    queryKey: ['pump-fun-token', userId],
    queryFn: async () => {
      if (!isSignedIn || !userId) throw new Error('User not authenticated');

      const response = await fetch('/api/auth/pump-fun-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          // You can add wallet address here if needed
          // walletAddress: user.publicMetadata?.walletAddress
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate token');
      }

      return response.json();
    },
    enabled: isLoaded && isSignedIn && !!userId,
    staleTime: 50 * 60 * 1000, // 50 minutes (tokens expire in 1 hour)
    retry: 1,
  });

  // Update token when data changes
  useEffect(() => {
    if (tokenData?.success && tokenData.token) {
      setToken(tokenData.token);
    } else {
      setToken(null);
    }
  }, [tokenData]);

  // Function to refresh token
  const refreshToken = useCallback(async () => {
    await refetchToken();
  }, [refetchToken]);

  // Function to clear token
  const clearToken = useCallback(() => {
    setToken(null);
    queryClient.removeQueries({ queryKey: ['pump-fun-token'] });
  }, [queryClient]);

  // Check if user is authenticated and has a valid token
  const isAuthenticated = isSignedIn && !!userId && !!token;
  const isLoading = !isLoaded || isTokenLoading;

  return {
    // Authentication state
    isAuthenticated,
    isLoading,
    authenticated: isSignedIn,
    user: { id: userId },
    
    // Token management
    token,
    tokenData,
    tokenError,
    refreshToken,
    clearToken,
    
    // Helper functions
    hasValidToken: !!token,
    canAccessPumpFun: isAuthenticated,
  };
}

// Hook for making authenticated Pump.fun API requests
export function usePumpFunRequest() {
  const { token, isAuthenticated, isLoading } = usePumpFunAuth();

  const makeRequest = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    if (!isAuthenticated || !token) {
      throw new Error('Authentication required. Please sign in to access Pump.fun API.');
    }

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication expired. Please sign in again.');
      }
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }, [token, isAuthenticated]);

  return {
    makeRequest,
    isAuthenticated,
    isLoading,
    hasToken: !!token,
  };
}
