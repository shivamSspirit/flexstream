/**
 * useTokenCreation Hook
 * Handles the entire token creation flow for posts
 * Follows Single Responsibility Principle
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';
import { Connection, Transaction } from '@solana/web3.js';
import { toast } from 'sonner';
import { useTransactionSubmit } from './useTransactionSubmit';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

export type TokenCreationStep =
  | 'idle'
  | 'uploading'
  | 'creating'
  | 'signing'
  | 'confirming'
  | 'complete'
  | 'error';

export interface TokenCreationData {
  mint: string;
  pool: string;
  bondingCurve: string;
  metadataUri: string;
  transaction: string;
}

export interface TokenCreationParams {
  title: string;
  ticker: string;
  content: string;
  mediaFile: File;
  username?: string;
}

export interface TokenCreationState {
  currentStep: TokenCreationStep;
  progress: string;
  error: string | null;
  isCreating: boolean;
  tokenData: TokenCreationData | null;
}

export interface UseTokenCreationReturn {
  createToken: (params: TokenCreationParams) => Promise<boolean>;
  state: TokenCreationState;
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useTokenCreation(
  connection: Connection
): UseTokenCreationReturn {
  const { connected, publicKey } = useWallet();
  const { submitTransaction } = useTransactionSubmit(connection);

  const [state, setState] = useState<TokenCreationState>({
    currentStep: 'idle',
    progress: '',
    error: null,
    isCreating: false,
    tokenData: null,
  });

  /**
   * Updates the state with a new step and progress message
   */
  const updateStep = useCallback(
    (step: TokenCreationStep, progress: string) => {
      setState((prev) => ({
        ...prev,
        currentStep: step,
        progress,
        error: null,
      }));
    },
    []
  );

  /**
   * Sets an error state
   */
  const setError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      currentStep: 'error',
      error,
      isCreating: false,
    }));
    toast.error(error);
  }, []);

  /**
   * Creates a token with post
   */
  const createToken = useCallback(
    async (params: TokenCreationParams): Promise<boolean> => {
      // Validation
      if (!connected || !publicKey) {
        setError(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
        return false;
      }

      if (!params.mediaFile) {
        setError('Please upload an image for your token');
        return false;
      }

      if (!params.ticker || params.ticker.length < 3) {
        setError(ERROR_MESSAGES.TICKER_TOO_SHORT);
        return false;
      }

      // Start creation
      setState((prev) => ({ ...prev, isCreating: true, error: null }));

      try {
        // Step 1: Upload media and create token
        updateStep('uploading', 'Uploading media...');

        const formData = new FormData();
        formData.append('title', params.title || params.ticker);
        formData.append('ticker', params.ticker.toUpperCase());
        formData.append('content', params.content || `Launch of $${params.ticker}`);
        formData.append('wallet', publicKey.toBase58());
        formData.append('username', params.username || 'user');
        formData.append('media', params.mediaFile);

        updateStep('creating', 'Creating token on Solana...');

        const response = await fetch('/api/posts/create', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create token');
        }

        const result = await response.json();

        if (!result.success || !result.requiresSignature) {
          throw new Error('Unexpected response from server');
        }

        // Step 2: Sign and submit transaction
        updateStep('signing', 'Please sign the transaction in your wallet...');

        const transaction = Transaction.from(
          Buffer.from(result.data.token.transaction, 'base64')
        );

        const signature = await submitTransaction(transaction, {
          successMessage: SUCCESS_MESSAGES.TRANSACTION_CONFIRMED,
          errorMessage: ERROR_MESSAGES.TRANSACTION_FAILED,
          skipConfirmation: false,
        });

        if (!signature) {
          throw new Error('Transaction was cancelled or failed');
        }

        // Step 3: Save to database
        updateStep('confirming', 'Saving to database...');

        const confirmResponse = await fetch('/api/posts/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signature,
            postData: {
              title: params.title || params.ticker,
              ticker: params.ticker.toUpperCase(),
              content: params.content || `Launch of $${params.ticker}`,
              wallet: publicKey.toBase58(),
              mediaUrls: result.data.post.media_urls,
              mint: result.data.token.mint,
              pool: result.data.token.pool,
              metadataUri: result.data.token.metadataUri,
            },
          }),
        });

        if (!confirmResponse.ok) {
          console.error('Failed to save to database');
          // Don't fail here - token was created successfully
        }

        // Success!
        setState((prev) => ({
          ...prev,
          currentStep: 'complete',
          progress: `🎉 $${params.ticker} launched successfully!`,
          isCreating: false,
          tokenData: result.data.token,
        }));

        toast.success(SUCCESS_MESSAGES.TOKEN_CREATED);

        return true;
      } catch (error) {
        console.error('Token creation error:', error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to create token. Please try again.';

        setError(errorMessage);
        return false;
      }
    },
    [connected, publicKey, submitTransaction, updateStep, setError]
  );

  /**
   * Resets the state
   */
  const reset = useCallback(() => {
    setState({
      currentStep: 'idle',
      progress: '',
      error: null,
      isCreating: false,
      tokenData: null,
    });
  }, []);

  return {
    createToken,
    state,
    reset,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets a user-friendly step label
 */
export function getStepLabel(step: TokenCreationStep): string {
  const labels: Record<TokenCreationStep, string> = {
    idle: 'Ready',
    uploading: 'Uploading Media',
    creating: 'Creating Token',
    signing: 'Awaiting Signature',
    confirming: 'Confirming',
    complete: 'Complete',
    error: 'Error',
  };

  return labels[step];
}

/**
 * Gets step progress percentage
 */
export function getStepProgress(step: TokenCreationStep): number {
  const progress: Record<TokenCreationStep, number> = {
    idle: 0,
    uploading: 20,
    creating: 40,
    signing: 60,
    confirming: 80,
    complete: 100,
    error: 0,
  };

  return progress[step];
}
