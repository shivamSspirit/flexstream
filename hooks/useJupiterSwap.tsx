import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { toast } from 'sonner';

export interface QuoteResponse {
  transaction: string;
  requestId: string;
  inAmount: string;
  outAmount: string;
  slippageBps: number;
  priceImpact: number;
  feeMint?: string;
  feeBps?: number;
  routePlan?: any[];
  fees?: {
    signatureFee: number;
    prioritizationFee: number;
    rent: number;
  };
  swapType?: 'aggregator' | 'RFQ';
  processingTime?: number;
  isGasless?: boolean;
  rateLimit?: {
    tier: string;
    rps: number;
    note: string;
  };
}

export interface ExecuteResponse {
  status: 'success' | 'processing' | 'failed';
  signature?: string;
  explorerUrl?: string;
  error?: string;
  message?: string;
  details?: any;
}

export interface SwapParams {
  inputMint: string;
  outputMint: string;
  amount: number; // in lamports
}

export function useJupiterSwap() {
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch quote from Jupiter
  const getQuote = useCallback(
    async (params: SwapParams): Promise<QuoteResponse | null> => {
      if (!publicKey) {
        const errorMsg = 'Wallet not connected';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/jupiter/quote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputMint: params.inputMint,
            outputMint: params.outputMint,
            amount: params.amount,
            taker: publicKey.toString()
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get quote');
        }

        const quoteData: QuoteResponse = await response.json();
        setQuote(quoteData);
        return quoteData;

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get quote';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;

      } finally {
        setLoading(false);
      }
    },
    [publicKey]
  );

  // Execute swap
  const executeSwap = useCallback(
    async (quoteData?: QuoteResponse): Promise<ExecuteResponse | null> => {
      const activeQuote = quoteData || quote;

      if (!activeQuote) {
        const errorMsg = 'No quote available';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }

      if (!publicKey || !signTransaction) {
        const errorMsg = 'Wallet not connected';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Deserialize transaction
        const transactionBuffer = Buffer.from(activeQuote.transaction, 'base64');
        const transaction = VersionedTransaction.deserialize(transactionBuffer);

        // Sign transaction
        const signedTransaction = await signTransaction(transaction);

        // Serialize signed transaction
        const signedTransactionBase64 = Buffer.from(
          signedTransaction.serialize()
        ).toString('base64');

        // Execute on Jupiter
        const response = await fetch('/api/jupiter/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            signedTransaction: signedTransactionBase64,
            requestId: activeQuote.requestId
          })
        });

        const result: ExecuteResponse = await response.json();

        if (result.status === 'success') {
          toast.success(
            <div>
              <p>Swap completed!</p>
              {result.explorerUrl && (
                <a
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  View transaction
                </a>
              )}
            </div>
          );
          return result;
        }

        if (result.status === 'processing') {
          toast.info('Transaction is being processed...');
          return result;
        }

        // Handle errors
        const errorMsg = result.error || 'Swap failed';
        setError(errorMsg);
        toast.error(errorMsg);
        return result;

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to execute swap';
        setError(errorMsg);
        toast.error(errorMsg);
        return {
          status: 'failed',
          error: errorMsg
        };

      } finally {
        setLoading(false);
      }
    },
    [quote, publicKey, signTransaction]
  );

  // Combined function: get quote and execute in one call
  const swap = useCallback(
    async (params: SwapParams): Promise<ExecuteResponse | null> => {
      const quoteData = await getQuote(params);
      if (!quoteData) {
        return null;
      }

      return executeSwap(quoteData);
    },
    [getQuote, executeSwap]
  );

  // Reset state
  const reset = useCallback(() => {
    setQuote(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    // State
    loading,
    quote,
    error,

    // Functions
    getQuote,
    executeSwap,
    swap,
    reset
  };
}
