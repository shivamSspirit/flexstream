/**
 * useBestExecution Hook
 *
 * React hook for FlexIt Best Execution Engine
 * Provides intelligent routing, Jito bundles, and real-time quotes
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';
import { PublicKey, Keypair } from '@solana/web3.js';
import BN from 'bn.js';
import {
  createExecutionEngine,
  SwapDirection,
  SwapParams,
  SwapQuote,
  SwapExecutionResult,
  ExecutionPriority,
  RoutingStrategy,
} from '@/lib/execution';
import { toast } from 'sonner';

interface UseBestExecutionOptions {
  tokenMint?: string;
  poolAddress?: string;
  tokenSymbol?: string;
  autoRefreshQuotes?: boolean;
  refreshIntervalMs?: number;
}

interface BestExecutionState {
  // Quote state
  quote: SwapQuote | null;
  isLoadingQuote: boolean;
  quoteError: string | null;

  // Execution state
  isExecuting: boolean;
  executionResult: SwapExecutionResult | null;
  executionError: string | null;

  // Settings
  routingPreference: RoutingStrategy;
  useJito: boolean;
  priority: ExecutionPriority;
  slippageBps: number;

  // Health
  engineHealth: {
    healthy: boolean;
    components: {
      rpc: boolean;
      jupiter: boolean;
      dbc: boolean;
      jito: boolean;
    };
  } | null;
}

export function useBestExecution(options: UseBestExecutionOptions = {}) {
  const { publicKey, signTransaction } = useWallet();

  // Initialize execution engine (singleton)
  const engine = useMemo(() => createExecutionEngine(), []);

  // State
  const [state, setState] = useState<BestExecutionState>({
    quote: null,
    isLoadingQuote: false,
    quoteError: null,
    isExecuting: false,
    executionResult: null,
    executionError: null,
    routingPreference: RoutingStrategy.USER_PREFERENCE, // Auto-select best route
    useJito: true,
    priority: ExecutionPriority.NORMAL,
    slippageBps: 300, // 3% default
    engineHealth: null,
  });

  // Check engine health on mount
  useEffect(() => {
    engine.checkHealth().then((health) => {
      setState((prev) => ({ ...prev, engineHealth: health }));
    });
  }, [engine]);

  /**
   * Get a quote for a swap
   */
  const getQuote = useCallback(
    async (params: {
      direction: SwapDirection;
      amountIn: number; // Human-readable amount (SOL or tokens)
      tokenDecimals?: number;
    }) => {
      if (!publicKey || !options.tokenMint) {
        setState((prev) => ({
          ...prev,
          quoteError: 'Wallet not connected or token mint missing',
        }));
        return null;
      }

      setState((prev) => ({
        ...prev,
        isLoadingQuote: true,
        quoteError: null,
      }));

      try {
        // Convert human-readable amount to base units
        const decimals = params.tokenDecimals || 9;
        const amountInBaseUnits = new BN(
          params.amountIn * Math.pow(10, params.direction === SwapDirection.BUY ? 9 : decimals)
        );

        // Build swap params
        const swapParams: SwapParams = {
          userWallet: publicKey,
          tokenMint: new PublicKey(options.tokenMint),
          poolAddress: options.poolAddress ? new PublicKey(options.poolAddress) : undefined,
          direction: params.direction,
          amountIn: amountInBaseUnits,
          minimumAmountOut: new BN(0), // Will be calculated from slippage
          slippageBps: state.slippageBps,
          priority: state.priority,
        };

        console.log('[useBestExecution] Getting quote:', swapParams);

        // Get quote from engine
        const quote = await engine.getQuote(
          swapParams,
          state.routingPreference === RoutingStrategy.USER_PREFERENCE
            ? undefined
            : state.routingPreference
        );

        setState((prev) => ({
          ...prev,
          quote,
          isLoadingQuote: false,
        }));

        return quote;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get quote';
        console.error('[useBestExecution] Quote error:', error);

        setState((prev) => ({
          ...prev,
          quoteError: errorMessage,
          isLoadingQuote: false,
          quote: null,
        }));

        toast.error(errorMessage);
        return null;
      }
    },
    [publicKey, options.tokenMint, options.poolAddress, state.slippageBps, state.priority, state.routingPreference, engine]
  );

  /**
   * Execute a swap
   */
  const executeSwap = useCallback(
    async (params: {
      direction: SwapDirection;
      amountIn: number;
      tokenDecimals?: number;
    }) => {
      if (!publicKey || !signTransaction || !options.tokenMint) {
        toast.error('Wallet not connected');
        return null;
      }

      setState((prev) => ({
        ...prev,
        isExecuting: true,
        executionError: null,
        executionResult: null,
      }));

      try {
        // Convert amount to base units
        const decimals = params.tokenDecimals || 9;
        const amountInBaseUnits = new BN(
          params.amountIn * Math.pow(10, params.direction === SwapDirection.BUY ? 9 : decimals)
        );

        // Build swap params
        const swapParams: SwapParams = {
          userWallet: publicKey,
          tokenMint: new PublicKey(options.tokenMint),
          poolAddress: options.poolAddress ? new PublicKey(options.poolAddress) : undefined,
          direction: params.direction,
          amountIn: amountInBaseUnits,
          minimumAmountOut: new BN(0),
          slippageBps: state.slippageBps,
          priority: state.priority,
        };

        console.log('[useBestExecution] Executing swap:', swapParams);

        // Note: For now, we need to create a Keypair for signing
        // In production, we'd use the wallet adapter's signTransaction
        // This is a limitation we'll need to address

        toast.loading('Preparing transaction...', { id: 'swap' });

        // Get quote first to show user
        const quote = await engine.getQuote(swapParams, state.routingPreference === RoutingStrategy.USER_PREFERENCE ? undefined : state.routingPreference);

        toast.loading(`Executing via ${quote.route}...`, { id: 'swap' });

        // For now, we'll build the transaction but not execute it
        // because we need proper wallet adapter integration
        // TODO: Integrate with wallet adapter for transaction signing

        throw new Error('Transaction signing not yet implemented - need wallet adapter integration');

        // This is how it would work:
        // const result = await engine.executeSwap(swapParams, signer, {
        //   useJito: state.useJito,
        //   priority: state.priority,
        //   userPreference: state.routingPreference,
        // });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Swap execution failed';
        console.error('[useBestExecution] Execution error:', error);

        setState((prev) => ({
          ...prev,
          executionError: errorMessage,
          isExecuting: false,
        }));

        toast.error(errorMessage, { id: 'swap' });
        return null;
      }
    },
    [publicKey, signTransaction, options.tokenMint, options.poolAddress, state.useJito, state.priority, state.slippageBps, state.routingPreference, engine]
  );

  /**
   * Compare routing options
   */
  const compareRoutes = useCallback(
    async (params: {
      direction: SwapDirection;
      amountIn: number;
      tokenDecimals?: number;
    }) => {
      if (!publicKey || !options.tokenMint || !options.poolAddress) {
        return null;
      }

      try {
        const decimals = params.tokenDecimals || 9;
        const amountInBaseUnits = new BN(
          params.amountIn * Math.pow(10, params.direction === SwapDirection.BUY ? 9 : decimals)
        );

        const swapParams: SwapParams = {
          userWallet: publicKey,
          tokenMint: new PublicKey(options.tokenMint),
          poolAddress: new PublicKey(options.poolAddress),
          direction: params.direction,
          amountIn: amountInBaseUnits,
          minimumAmountOut: new BN(0),
          slippageBps: state.slippageBps,
        };

        return await engine.compareRoutes(swapParams);
      } catch (error) {
        console.error('[useBestExecution] Route comparison error:', error);
        return null;
      }
    },
    [publicKey, options.tokenMint, options.poolAddress, state.slippageBps, engine]
  );

  /**
   * Update routing preference
   */
  const setRoutingPreference = useCallback((preference: RoutingStrategy) => {
    setState((prev) => ({ ...prev, routingPreference: preference }));
  }, []);

  /**
   * Toggle Jito bundles
   */
  const setUseJito = useCallback((useJito: boolean) => {
    setState((prev) => ({ ...prev, useJito }));
  }, []);

  /**
   * Set execution priority
   */
  const setPriority = useCallback((priority: ExecutionPriority) => {
    setState((prev) => ({ ...prev, priority }));
  }, []);

  /**
   * Set slippage tolerance
   */
  const setSlippageBps = useCallback((slippageBps: number) => {
    setState((prev) => ({ ...prev, slippageBps }));
  }, []);

  /**
   * Auto-refresh quotes
   */
  useEffect(() => {
    if (!options.autoRefreshQuotes || !publicKey || !options.tokenMint) {
      return;
    }

    const intervalMs = options.refreshIntervalMs || 5000; // 5 seconds default

    // Don't auto-refresh if we're executing or loading
    if (state.isExecuting || state.isLoadingQuote) {
      return;
    }

    // Auto-refresh only if we have an existing quote and amount
    if (state.quote) {
      const timer = setInterval(() => {
        // Re-fetch quote with same parameters
        // This would need to store the last parameters
        // For now, skip auto-refresh
      }, intervalMs);

      return () => clearInterval(timer);
    }
  }, [options.autoRefreshQuotes, options.refreshIntervalMs, publicKey, options.tokenMint, state.isExecuting, state.isLoadingQuote, state.quote]);

  return {
    // State
    ...state,

    // Actions
    getQuote,
    executeSwap,
    compareRoutes,

    // Settings
    setRoutingPreference,
    setUseJito,
    setPriority,
    setSlippageBps,

    // Helpers
    isReady: !!publicKey && !!options.tokenMint && state.engineHealth?.healthy,
    routeInfo: state.quote
      ? {
          route: state.quote.route,
          executionTimeMs: state.quote.estimatedExecutionMs,
          priceImpactPercent: state.quote.priceImpactBps / 100,
        }
      : null,
  };
}

export default useBestExecution;
