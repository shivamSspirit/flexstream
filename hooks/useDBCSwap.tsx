import { useState, useCallback } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { toast } from 'sonner';
import { createDBCClient } from '@/lib/meteora-dbc';

export interface DBCSwapParams {
  poolAddress: string;
  amount: number;
  tradeType: 'buy' | 'sell';
  slippageBps?: number;
}

export interface SwapResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export function useDBCSwap() {
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSwap = useCallback(
    async (params: DBCSwapParams): Promise<SwapResult> => {
      if (!publicKey || !signTransaction) {
        const errorMsg = 'Wallet not connected';
        setError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      setLoading(true);
      setError(null);

      try {
        const { poolAddress, amount, tradeType, slippageBps = 500 } = params;

        // Connect to devnet
        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
          'confirmed'
        );

        // Create DBC client
        const dbcClient = createDBCClient(connection);

        console.log(`[DBC Swap] Creating ${tradeType} transaction:`, {
          pool: poolAddress,
          amount,
          wallet: publicKey.toBase58()
        });

        // Create transaction based on trade type
        let transaction: Transaction;
        if (tradeType === 'buy') {
          transaction = await dbcClient.createBuyTransaction(
            new PublicKey(poolAddress),
            publicKey,
            amount,
            slippageBps
          );
        } else {
          transaction = await dbcClient.createSellTransaction(
            new PublicKey(poolAddress),
            publicKey,
            amount,
            slippageBps
          );
        }

        console.log('[DBC Swap] Transaction created, getting blockhash...');

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = publicKey;

        console.log('[DBC Swap] Requesting signature...');

        // Sign transaction
        const signedTransaction = await signTransaction(transaction);

        console.log('[DBC Swap] Transaction signed, sending...');

        // Send transaction
        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
          }
        );

        console.log('[DBC Swap] Transaction sent:', signature);

        // Wait for confirmation
        toast.info('Confirming transaction...');
        const confirmation = await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          'confirmed'
        );

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        console.log('[DBC Swap] Transaction confirmed!');

        const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

        toast.success(
          <div>
            <p>{tradeType === 'buy' ? 'Buy' : 'Sell'} successful!</p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              View on Explorer
            </a>
          </div>
        );

        return {
          success: true,
          signature
        };

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Swap failed';
        console.error('[DBC Swap] Error:', err);
        setError(errorMsg);
        toast.error(errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      } finally {
        setLoading(false);
      }
    },
    [publicKey, signTransaction]
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    executeSwap,
    reset
  };
}
