/**
 * useTransactionSubmit Hook
 * Handles Solana transaction submission and confirmation
 * Follows Single Responsibility Principle and DRY
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { Connection, Transaction, TransactionSignature } from '@solana/web3.js';
import { toast } from 'sonner';
import {
  BLOCKCHAIN_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface TransactionSubmitOptions {
  onSuccess?: (signature: TransactionSignature) => void | Promise<void>;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  skipConfirmation?: boolean;
}

export interface TransactionSubmitState {
  isSubmitting: boolean;
  signature: TransactionSignature | null;
  error: Error | null;
}

export interface UseTransactionSubmitReturn {
  submitTransaction: (
    transaction: Transaction,
    options?: TransactionSubmitOptions
  ) => Promise<TransactionSignature | null>;
  state: TransactionSubmitState;
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useTransactionSubmit(
  connection: Connection
): UseTransactionSubmitReturn {
  const { sendTransaction, connected, publicKey } = useWallet();

  const [state, setState] = useState<TransactionSubmitState>({
    isSubmitting: false,
    signature: null,
    error: null,
  });

  /**
   * Submits a transaction to the blockchain
   */
  const submitTransaction = useCallback(
    async (
      transaction: Transaction,
      options: TransactionSubmitOptions = {}
    ): Promise<TransactionSignature | null> => {
      const {
        onSuccess,
        onError,
        successMessage = SUCCESS_MESSAGES.TRANSACTION_CONFIRMED,
        errorMessage = ERROR_MESSAGES.TRANSACTION_FAILED,
        skipConfirmation = false,
      } = options;

      // Validation
      if (!connected || !publicKey) {
        const error = new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
        setState({ isSubmitting: false, signature: null, error });
        toast.error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
        onError?.(error);
        return null;
      }

      setState({ isSubmitting: true, signature: null, error: null });

      try {
        // Send transaction
        const signature = await sendTransaction(transaction, connection);

        setState((prev) => ({ ...prev, signature }));

        // Wait for confirmation if not skipped
        if (!skipConfirmation) {
          await confirmTransaction(connection, signature);
        }

        // Success!
        setState({ isSubmitting: false, signature, error: null });
        toast.success(successMessage);

        // Call success callback
        if (onSuccess) {
          await onSuccess(signature);
        }

        return signature;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(errorMessage);

        setState({ isSubmitting: false, signature: null, error: err });

        // Handle specific error types
        if (err.message.includes('User rejected')) {
          toast.error(ERROR_MESSAGES.WALLET_SIGNATURE_REJECTED);
        } else if (err.message.includes('insufficient')) {
          toast.error(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
        } else {
          toast.error(errorMessage);
        }

        // Call error callback
        onError?.(err);

        console.error('Transaction submission error:', err);
        return null;
      }
    },
    [connection, sendTransaction, connected, publicKey]
  );

  /**
   * Resets the state
   */
  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      signature: null,
      error: null,
    });
  }, []);

  return {
    submitTransaction,
    state,
    reset,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Confirms a transaction on the blockchain
 * Implements retry logic with exponential backoff
 */
export async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature,
  maxRetries: number = BLOCKCHAIN_CONFIG.MAX_RETRY_ATTEMPTS
): Promise<void> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const latestBlockhash = await connection.getLatestBlockhash();

      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        BLOCKCHAIN_CONFIG.DEFAULT_COMMITMENT_LEVEL as any
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      // Success!
      return;
    } catch (error) {
      retries++;

      if (retries >= maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = BLOCKCHAIN_CONFIG.RETRY_DELAY_MS * Math.pow(2, retries - 1);
      await sleep(delay);
    }
  }
}

/**
 * Deserializes a base64 transaction string
 */
export function deserializeTransaction(
  transactionBase64: string
): Transaction {
  try {
    return Transaction.from(Buffer.from(transactionBase64, 'base64'));
  } catch (error) {
    console.error('Error deserializing transaction:', error);
    throw new Error('Invalid transaction data');
  }
}

/**
 * Sleep utility for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
