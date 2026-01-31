import { useState, useCallback, useMemo } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';
import { Transaction, Connection } from '@solana/web3.js';

export interface PoolInfo {
  mint: string;
  pool: string;
  virtualBaseReserves: number;
  virtualQuoteReserves: number;
  marketCap: number;
  buyPrice: number;
  sellPrice: number;
  liquidity: number;
}

export interface UseDBC {
  // State
  isLoading: boolean;
  error: string | null;
  poolInfo: PoolInfo | null;

  // Functions
  getPoolInfo: (poolAddress: string) => Promise<PoolInfo | null>;
  buyTokens: (poolAddress: string, solAmount: number, slippageBps?: number) => Promise<string | null>;
  sellTokens: (poolAddress: string, tokenAmount: number, slippageBps?: number) => Promise<string | null>;
}

export function useDBC(): UseDBC {
  const { publicKey, signTransaction } = useWallet();

  // Create connection - use devnet RPC
  const connection = useMemo(() => new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  ), []);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);

  /**
   * Fetch pool information
   */
  const getPoolInfo = useCallback(async (poolAddress: string): Promise<PoolInfo | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dbc/pool-info?pool=${poolAddress}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch pool info');
      }

      const info: PoolInfo = data.data;
      setPoolInfo(info);
      return info;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pool info';
      setError(errorMessage);
      console.error('[useDBC] Error fetching pool info:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Buy tokens from DBC pool
   */
  const buyTokens = async (
    poolAddress: string,
    solAmount: number,
    slippageBps: number = 500
  ): Promise<string | null> => {
    if (!publicKey || !signTransaction) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useDBC] Buying tokens:', { poolAddress, solAmount, slippageBps });

      // Request buy transaction from API
      const response = await fetch('/api/dbc/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolAddress,
          buyerWallet: publicKey.toBase58(),
          solAmount,
          slippageBps,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create buy transaction');
      }

      // Deserialize transaction (blockhash already set by API)
      const transactionBuffer = Buffer.from(data.data.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);

      // Use blockhash from API response
      const { blockhash, lastValidBlockHeight } = data.data;

      // Sign transaction with wallet
      const signedTransaction = await signTransaction(transaction);

      // Send signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      console.log('[useDBC] Buy transaction sent:', signature);

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      console.log('[useDBC] Buy transaction confirmed');

      return signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to buy tokens';
      setError(errorMessage);
      console.error('[useDBC] Error buying tokens:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sell tokens to DBC pool
   */
  const sellTokens = async (
    poolAddress: string,
    tokenAmount: number,
    slippageBps: number = 500
  ): Promise<string | null> => {
    if (!publicKey || !signTransaction) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useDBC] Selling tokens:', { poolAddress, tokenAmount, slippageBps });

      // Request sell transaction from API
      const response = await fetch('/api/dbc/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolAddress,
          sellerWallet: publicKey.toBase58(),
          tokenAmount,
          slippageBps,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create sell transaction');
      }

      // Deserialize transaction (blockhash already set by API)
      const transactionBuffer = Buffer.from(data.data.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);

      // Use blockhash from API response
      const { blockhash, lastValidBlockHeight } = data.data;

      // Sign transaction with wallet
      const signedTransaction = await signTransaction(transaction);

      // Send signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      console.log('[useDBC] Sell transaction sent:', signature);

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      console.log('[useDBC] Sell transaction confirmed');

      return signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sell tokens';
      setError(errorMessage);
      console.error('[useDBC] Error selling tokens:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    poolInfo,
    getPoolInfo,
    buyTokens,
    sellTokens,
  };
}
