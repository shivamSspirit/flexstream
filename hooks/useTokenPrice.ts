import { useState, useEffect, useCallback, useRef } from 'react';
import { birdeyeService } from '@/lib/services/BirdeyeService';
import { CachedPrice } from '@/lib/services/PriceCache';

interface TokenPriceState {
  price: CachedPrice | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface UseTokenPriceOptions {
  enabled?: boolean;
  refreshInterval?: number; // in milliseconds
  onError?: (error: Error) => void;
}

/**
 * React hook for fetching and auto-updating token prices
 * Uses DexScreener API with caching and automatic refresh
 */
export function useTokenPrice(
  mint: string | null | undefined,
  options: UseTokenPriceOptions = {}
) {
  const {
    enabled = true,
    refreshInterval = 60000, // 60 seconds default
    onError
  } = options;

  const [state, setState] = useState<TokenPriceState>({
    price: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  const fetchPrice = useCallback(async () => {
    if (!mint || !enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const price = await birdeyeService.getPrice(mint);

      if (isMountedRef.current) {
        setState({
          price,
          loading: false,
          error: price ? null : 'Price not available',
          lastUpdated: Date.now()
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch price';

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));

        onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [mint, enabled, onError]);

  // Initial fetch
  useEffect(() => {
    if (mint && enabled) {
      fetchPrice();
    }
  }, [mint, enabled, fetchPrice]);

  // Auto-refresh
  useEffect(() => {
    if (!mint || !enabled || !refreshInterval) return;

    const intervalId = setInterval(fetchPrice, refreshInterval);

    return () => clearInterval(intervalId);
  }, [mint, enabled, refreshInterval, fetchPrice]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    refetch: fetchPrice
  };
}

/**
 * Hook for fetching multiple token prices
 */
export function useTokenPrices(
  mints: (string | null | undefined)[],
  options: UseTokenPriceOptions = {}
) {
  const {
    enabled = true,
    refreshInterval = 60000,
    onError
  } = options;

  const [state, setState] = useState<{
    prices: Map<string, CachedPrice>;
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
  }>({
    prices: new Map(),
    loading: false,
    error: null,
    lastUpdated: null
  });

  const isMountedRef = useRef(true);
  const validMints = mints.filter((m): m is string => !!m);

  const fetchPrices = useCallback(async () => {
    if (validMints.length === 0 || !enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const prices = await birdeyeService.getPrices(validMints);

      if (isMountedRef.current) {
        setState({
          prices,
          loading: false,
          error: prices.size === 0 ? 'No prices available' : null,
          lastUpdated: Date.now()
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch prices';

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));

        onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [validMints.join(','), enabled, onError]);

  // Initial fetch
  useEffect(() => {
    if (validMints.length > 0 && enabled) {
      fetchPrices();
    }
  }, [validMints.join(','), enabled, fetchPrices]);

  // Auto-refresh
  useEffect(() => {
    if (validMints.length === 0 || !enabled || !refreshInterval) return;

    const intervalId = setInterval(fetchPrices, refreshInterval);

    return () => clearInterval(intervalId);
  }, [validMints.join(','), enabled, refreshInterval, fetchPrices]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    refetch: fetchPrices,
    getPrice: (mint: string) => state.prices.get(mint) || null
  };
}

/**
 * Hook for prefetching common tokens on app load
 */
export function usePrefetchCommonTokens() {
  useEffect(() => {
    // Prefetch on mount
    birdeyeService.prefetchCommonTokens();

    // Prefetch every 5 minutes
    const intervalId = setInterval(() => {
      birdeyeService.prefetchCommonTokens();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);
}
