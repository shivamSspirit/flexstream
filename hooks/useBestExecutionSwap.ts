'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';
import { Transaction, VersionedTransaction, Connection } from '@solana/web3.js';

/**
 * Quote comparison data
 */
export interface QuoteComparison {
  dbc: {
    amountOut: string;
    minimumAmountOut: string;
    priceImpactBps: number;
    price: number;
    available: boolean;
  } | null;
  jupiter: {
    amountOut: string;
    minimumAmountOut: string;
    priceImpactBps: number;
    price: number;
    available: boolean;
  } | null;
  reason: string;
  advantagePercent: number;
}

/**
 * Best quote data
 */
export interface BestQuote {
  amountIn: string;
  amountOut: string;
  minimumAmountOut: string;
  priceImpactBps: number;
  price: number;
  estimatedExecutionMs: number;
  estimatedFee: number;
}

/**
 * Unified quote response
 */
export interface UnifiedQuote {
  bestRoute: 'DBC' | 'JUPITER';
  bestQuote: BestQuote;
  comparison: QuoteComparison;
  routeDetails: {
    route: string;
    poolAddress: string | null;
    slippageBps: number;
  };
  timestamp: number;
}

/**
 * Jito tip floor data
 */
export interface TipFloor {
  tipFloor: number;
  tipHigh: number;
  tipUrgent: number;
  timestamp: number;
}

/**
 * Jito priority levels
 */
export type JitoPriority = 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Execution result
 */
export interface ExecutionResult {
  success: boolean;
  signature?: string;
  bundleId?: string;
  explorerUrl?: string;
  method: 'JITO_BUNDLE' | 'FALLBACK_RPC' | 'DIRECT_RPC';
  error?: string;
}

/**
 * Hook return type
 */
export interface UseBestExecutionSwapReturn {
  // Quote state
  quote: UnifiedQuote | null;
  isLoadingQuote: boolean;
  quoteError: string | null;

  // Execution state
  isExecuting: boolean;
  executionResult: ExecutionResult | null;

  // Jito settings
  useJito: boolean;
  setUseJito: (enabled: boolean) => void;
  jitoPriority: JitoPriority;
  setJitoPriority: (priority: JitoPriority) => void;
  tipFloor: TipFloor | null;
  estimatedJitoTip: number;

  // Actions
  getQuote: (params: {
    tokenMint: string;
    poolAddress?: string;
    amount: number;
    direction: 'buy' | 'sell';
    slippageBps?: number;
  }) => Promise<UnifiedQuote | null>;

  executeSwap: (params: {
    tokenMint: string;
    poolAddress?: string;
    amount: number;
    direction: 'buy' | 'sell';
    slippageBps?: number;
    route?: 'DBC' | 'JUPITER';
  }) => Promise<ExecutionResult>;

  // Utilities
  clearError: () => void;
  refreshTipFloor: () => Promise<void>;
}

/**
 * useBestExecutionSwap - Unified swap hook with Jupiter/DBC routing and Jito support
 */
export function useBestExecutionSwap(): UseBestExecutionSwapReturn {
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet();

  // Create connection
  const connection = useMemo(() => new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  ), []);

  // Quote state
  const [quote, setQuote] = useState<UnifiedQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  // Jito settings
  const [useJito, setUseJito] = useState(false);
  const [jitoPriority, setJitoPriority] = useState<JitoPriority>('NORMAL');
  const [tipFloor, setTipFloor] = useState<TipFloor | null>(null);

  // Calculate estimated Jito tip based on priority and tip floor
  const estimatedJitoTip = useMemo(() => {
    if (!tipFloor) {
      // Default values if tip floor not loaded
      return jitoPriority === 'NORMAL' ? 10000 : jitoPriority === 'HIGH' ? 25000 : 50000;
    }

    switch (jitoPriority) {
      case 'NORMAL':
        return tipFloor.tipFloor;
      case 'HIGH':
        return tipFloor.tipHigh;
      case 'URGENT':
        return tipFloor.tipUrgent;
      default:
        return tipFloor.tipFloor;
    }
  }, [tipFloor, jitoPriority]);

  /**
   * Fetch tip floor from API
   */
  const refreshTipFloor = useCallback(async () => {
    try {
      const response = await fetch('/api/swap/tip-floor');
      const data = await response.json();

      if (data.success) {
        setTipFloor(data.data);
      }
    } catch (error) {
      console.error('[useBestExecutionSwap] Error fetching tip floor:', error);
    }
  }, []);

  // Fetch tip floor on mount and periodically
  useEffect(() => {
    refreshTipFloor();

    // Refresh every 30 seconds
    const interval = setInterval(refreshTipFloor, 30000);
    return () => clearInterval(interval);
  }, [refreshTipFloor]);

  /**
   * Get quote from API
   */
  const getQuote = useCallback(async (params: {
    tokenMint: string;
    poolAddress?: string;
    amount: number;
    direction: 'buy' | 'sell';
    slippageBps?: number;
  }): Promise<UnifiedQuote | null> => {
    if (!publicKey) {
      setQuoteError('Wallet not connected');
      return null;
    }

    setIsLoadingQuote(true);
    setQuoteError(null);

    try {
      console.log('[useBestExecutionSwap] Getting quote:', params);

      const response = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          userWallet: publicKey.toBase58(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get quote');
      }

      const unifiedQuote: UnifiedQuote = data.data;
      setQuote(unifiedQuote);

      console.log('[useBestExecutionSwap] Quote received:', {
        bestRoute: unifiedQuote.bestRoute,
        advantagePercent: unifiedQuote.comparison.advantagePercent,
      });

      return unifiedQuote;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quote';
      setQuoteError(errorMessage);
      console.error('[useBestExecutionSwap] Quote error:', error);
      return null;
    } finally {
      setIsLoadingQuote(false);
    }
  }, [publicKey]);

  /**
   * Execute swap
   */
  const executeSwap = useCallback(async (params: {
    tokenMint: string;
    poolAddress?: string;
    amount: number;
    direction: 'buy' | 'sell';
    slippageBps?: number;
    route?: 'DBC' | 'JUPITER';
  }): Promise<ExecutionResult> => {
    if (!publicKey || !signTransaction || !connected) {
      return {
        success: false,
        method: 'DIRECT_RPC',
        error: 'Wallet not connected',
      };
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      // Determine route (use provided or from quote)
      const route = params.route || quote?.bestRoute || 'DBC';

      console.log('[useBestExecutionSwap] Executing swap:', {
        ...params,
        route,
        useJito,
        jitoPriority,
      });

      // Step 1: Get transactions from execute API
      const executeResponse = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          userWallet: publicKey.toBase58(),
          route,
          useJito,
          jitoTipLamports: useJito ? estimatedJitoTip : undefined,
        }),
      });

      const executeData = await executeResponse.json();

      if (!executeData.success) {
        throw new Error(executeData.error || 'Failed to build transaction');
      }

      const {
        swapTransaction,
        tipTransaction,
        isVersionedTransaction,
      } = executeData.data;

      // Step 2: Deserialize and sign transactions
      let signedSwapTx: Transaction | VersionedTransaction;
      let signedTipTx: Transaction | undefined;

      if (isVersionedTransaction) {
        // Jupiter - Versioned Transaction
        const swapTxBuffer = Buffer.from(swapTransaction, 'base64');
        const swapTx = VersionedTransaction.deserialize(swapTxBuffer);
        signedSwapTx = await signTransaction(swapTx);
      } else {
        // DBC - Legacy Transaction
        const swapTxBuffer = Buffer.from(swapTransaction, 'base64');
        const swapTx = Transaction.from(swapTxBuffer);
        signedSwapTx = await signTransaction(swapTx);
      }

      // Sign tip transaction if Jito enabled
      if (useJito && tipTransaction) {
        const tipTxBuffer = Buffer.from(tipTransaction, 'base64');
        const tipTx = Transaction.from(tipTxBuffer);
        signedTipTx = await signTransaction(tipTx);
      }

      // Step 3: Execute transaction
      if (useJito && signedTipTx) {
        // Jito bundle execution
        console.log('[useBestExecutionSwap] Submitting Jito bundle');

        // Serialize signed transactions
        const signedSwapBase64 = Buffer.from(
          signedSwapTx.serialize()
        ).toString('base64');

        const signedTipBase64 = Buffer.from(
          signedTipTx.serialize()
        ).toString('base64');

        const jitoResponse = await fetch('/api/swap/jito-execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedSwapTransaction: signedSwapBase64,
            signedTipTransaction: signedTipBase64,
            isVersionedTransaction,
          }),
        });

        const jitoData = await jitoResponse.json();

        if (!jitoData.success) {
          throw new Error(jitoData.error || 'Jito execution failed');
        }

        const result: ExecutionResult = {
          success: true,
          signature: jitoData.data.signature,
          bundleId: jitoData.data.bundleId,
          explorerUrl: jitoData.data.explorerUrl,
          method: jitoData.data.method,
        };

        setExecutionResult(result);
        console.log('[useBestExecutionSwap] Swap executed via', result.method);
        return result;

      } else {
        // Direct RPC execution
        console.log('[useBestExecutionSwap] Sending via direct RPC');

        const serialized = signedSwapTx.serialize();
        const signature = await connection.sendRawTransaction(serialized, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 3,
        });

        console.log('[useBestExecutionSwap] Transaction sent:', signature);

        // Wait for confirmation
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });

        const result: ExecutionResult = {
          success: true,
          signature,
          explorerUrl: `https://solscan.io/tx/${signature}`,
          method: 'DIRECT_RPC',
        };

        setExecutionResult(result);
        console.log('[useBestExecutionSwap] Swap confirmed');
        return result;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Swap failed';
      console.error('[useBestExecutionSwap] Execution error:', error);

      const result: ExecutionResult = {
        success: false,
        method: 'DIRECT_RPC',
        error: errorMessage,
      };

      setExecutionResult(result);
      return result;
    } finally {
      setIsExecuting(false);
    }
  }, [
    publicKey,
    signTransaction,
    connected,
    connection,
    quote,
    useJito,
    jitoPriority,
    estimatedJitoTip,
  ]);

  /**
   * Clear error states
   */
  const clearError = useCallback(() => {
    setQuoteError(null);
    setExecutionResult(null);
  }, []);

  return {
    // Quote state
    quote,
    isLoadingQuote,
    quoteError,

    // Execution state
    isExecuting,
    executionResult,

    // Jito settings
    useJito,
    setUseJito,
    jitoPriority,
    setJitoPriority,
    tipFloor,
    estimatedJitoTip,

    // Actions
    getQuote,
    executeSwap,
    clearError,
    refreshTipFloor,
  };
}

export default useBestExecutionSwap;
