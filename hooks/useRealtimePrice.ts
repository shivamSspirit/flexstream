/**
 * useRealtimePrice Hook
 *
 * Real-time price updates for tokens via WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getWebSocketManager, PriceUpdate } from '@/lib/execution/websocket-manager';
import { createDBCSwapEngine } from '@/lib/execution/dbc-swap-engine';

interface RealtimePriceState {
  price: number | null;
  baseReserve: number;
  quoteReserve: number;
  marketCap: number;
  liquidity: number;
  lastUpdate: number | null;
  isConnected: boolean;
  error: string | null;
}

interface UseRealtimePriceOptions {
  poolAddress?: string;
  enabled?: boolean;
  refreshIntervalMs?: number;
}

export function useRealtimePrice(options: UseRealtimePriceOptions = {}) {
  const { poolAddress, enabled = true, refreshIntervalMs = 1000 } = options;

  const [state, setState] = useState<RealtimePriceState>({
    price: null,
    baseReserve: 0,
    quoteReserve: 0,
    marketCap: 0,
    liquidity: 0,
    lastUpdate: null,
    isConnected: false,
    error: null,
  });

  const wsManager = useRef(getWebSocketManager());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const dbcEngine = useRef(createDBCSwapEngine());

  /**
   * Fetch pool info manually (polling fallback)
   */
  const fetchPoolInfo = useCallback(async () => {
    if (!poolAddress) return;

    try {
      const poolInfo = await dbcEngine.current.getPoolInfo(new PublicKey(poolAddress));

      setState((prev) => ({
        ...prev,
        price: poolInfo.price,
        baseReserve: poolInfo.baseReserve,
        quoteReserve: poolInfo.quoteReserve,
        marketCap: poolInfo.marketCap,
        liquidity: poolInfo.liquidity,
        lastUpdate: Date.now(),
        error: null,
      }));
    } catch (error) {
      console.error('[RealtimePrice] Error fetching pool info:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch price',
      }));
    }
  }, [poolAddress]);

  /**
   * Handle WebSocket price updates
   */
  const handlePriceUpdate = useCallback((update: PriceUpdate) => {
    setState((prev) => ({
      ...prev,
      price: update.price,
      baseReserve: update.baseReserve,
      quoteReserve: update.quoteReserve,
      marketCap: update.marketCap,
      liquidity: update.liquidity,
      lastUpdate: update.timestamp,
      error: null,
    }));
  }, []);

  /**
   * Set up WebSocket subscription
   */
  useEffect(() => {
    if (!enabled || !poolAddress) {
      return;
    }

    // Connect WebSocket
    wsManager.current.connect().catch((error) => {
      console.error('[RealtimePrice] WebSocket connection failed:', error);
      setState((prev) => ({ ...prev, error: 'WebSocket connection failed' }));
    });

    // Subscribe to pool updates
    try {
      const poolPubkey = new PublicKey(poolAddress);
      unsubscribeRef.current = wsManager.current.subscribeToPool(poolPubkey, handlePriceUpdate);

      setState((prev) => ({ ...prev, isConnected: true }));

      console.log('[RealtimePrice] Subscribed to pool:', poolAddress);
    } catch (error) {
      console.error('[RealtimePrice] Subscription failed:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Subscription failed',
      }));
    }

    // Initial fetch
    fetchPoolInfo();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enabled, poolAddress, handlePriceUpdate, fetchPoolInfo]);

  /**
   * Polling fallback (if WebSocket fails)
   */
  useEffect(() => {
    if (!enabled || !poolAddress) {
      return;
    }

    // Poll for updates as fallback
    const interval = setInterval(() => {
      // Only poll if we haven't received an update recently
      const timeSinceUpdate = state.lastUpdate ? Date.now() - state.lastUpdate : Infinity;

      if (timeSinceUpdate > refreshIntervalMs * 2) {
        console.log('[RealtimePrice] Polling for updates (WebSocket inactive)');
        fetchPoolInfo();
      }
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [enabled, poolAddress, refreshIntervalMs, state.lastUpdate, fetchPoolInfo]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(() => {
    fetchPoolInfo();
  }, [fetchPoolInfo]);

  /**
   * Calculate price change
   */
  const priceChange = useCallback((oldPrice: number | null): number | null => {
    if (!state.price || !oldPrice || oldPrice === 0) {
      return null;
    }
    return ((state.price - oldPrice) / oldPrice) * 100;
  }, [state.price]);

  return {
    ...state,
    refresh,
    priceChange,
    isStale: state.lastUpdate ? Date.now() - state.lastUpdate > refreshIntervalMs * 3 : true,
  };
}

export default useRealtimePrice;
