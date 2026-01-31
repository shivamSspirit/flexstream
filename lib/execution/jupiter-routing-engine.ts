/**
 * FlexIt Jupiter Routing Engine
 *
 * Best price routing across 50+ Solana DEXs
 * Used for established tokens with good liquidity
 */

import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import BN from 'bn.js';
import { JupiterSwapParams, JupiterSwapQuote, SwapDirection } from './types';
import { EXECUTION_CONFIG, getCurrentRpcUrl } from './config';

/**
 * Jupiter API v6 quote response
 */
interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: {
    amount: string;
    feeBps: number;
  } | null;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot?: number;
  timeTaken?: number;
}

/**
 * Jupiter swap instruction response
 */
interface JupiterSwapResponse {
  swapTransaction: string; // Base64 encoded transaction
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
}

/**
 * Jupiter Routing Engine
 */
export class JupiterRoutingEngine {
  private connection: Connection;
  private apiUrl: string;

  constructor(connection?: Connection) {
    this.connection = connection || new Connection(getCurrentRpcUrl(), EXECUTION_CONFIG.rpc.commitment);
    this.apiUrl = EXECUTION_CONFIG.jupiter.apiUrl;
  }

  /**
   * Get a quote from Jupiter
   */
  async getQuote(params: JupiterSwapParams): Promise<JupiterSwapQuote> {
    try {
      // Determine input/output mints based on direction
      const SOL_MINT = 'So11111111111111111111111111111111111111112';
      const inputMint = params.direction === SwapDirection.BUY ? SOL_MINT : params.tokenMint.toBase58();
      const outputMint = params.direction === SwapDirection.BUY ? params.tokenMint.toBase58() : SOL_MINT;

      console.log('[Jupiter] Getting quote:', {
        inputMint,
        outputMint,
        amount: params.amountIn.toString(),
        slippageBps: params.slippageBps,
      });

      // Build quote request URL
      const quoteParams = new URLSearchParams({
        inputMint,
        outputMint,
        amount: params.amountIn.toString(),
        slippageBps: params.slippageBps.toString(),
        onlyDirectRoutes: (params.onlyDirectRoutes || false).toString(),
        maxAccounts: (params.maxAccounts || EXECUTION_CONFIG.jupiter.maxAccounts).toString(),
      });

      if (params.platformFeeBps) {
        quoteParams.append('platformFeeBps', params.platformFeeBps.toString());
      }

      // Fetch quote
      const quoteUrl = `${this.apiUrl}/quote?${quoteParams.toString()}`;
      const response = await fetch(quoteUrl);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Jupiter quote failed: ${error}`);
      }

      const quoteData: JupiterQuoteResponse = await response.json();

      // Parse quote data
      const amountOut = new BN(quoteData.outAmount);
      const otherAmountThreshold = new BN(quoteData.otherAmountThreshold);
      const priceImpactBps = Math.round(Math.abs(parseFloat(quoteData.priceImpactPct)) * 100);

      // Calculate price
      const price = params.amountIn.toNumber() / amountOut.toNumber();

      // Estimate fees
      const platformFee = quoteData.platformFee
        ? parseInt(quoteData.platformFee.amount)
        : 0;
      const estimatedFee = 5000 + platformFee; // Base Solana fee + platform fee

      console.log('[Jupiter] Quote received:', {
        amountIn: params.amountIn.toString(),
        amountOut: amountOut.toString(),
        priceImpactBps,
        routePlan: quoteData.routePlan.length,
      });

      return {
        amountIn: params.amountIn,
        amountOut,
        minimumAmountOut: otherAmountThreshold,
        priceImpactBps,
        estimatedFee,
        price,
        route: 'JUPITER',
        estimatedExecutionMs: 1500, // Jupiter typically takes 1-2 seconds
        timestamp: Date.now(),
        routePlan: quoteData.routePlan,
        otherAmountThreshold,
      };
    } catch (error) {
      console.error('[Jupiter] Error getting quote:', error);
      throw new Error(`Failed to get Jupiter quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build a swap transaction from Jupiter
   */
  async buildSwapTransaction(
    params: JupiterSwapParams,
    quote: JupiterSwapQuote
  ): Promise<Transaction | VersionedTransaction> {
    try {
      console.log('[Jupiter] Building swap transaction');

      // Build swap request
      const swapRequest = {
        userPublicKey: params.userWallet.toBase58(),
        quoteResponse: {
          inputMint: params.direction === SwapDirection.BUY
            ? 'So11111111111111111111111111111111111111112'
            : params.tokenMint.toBase58(),
          inAmount: params.amountIn.toString(),
          outputMint: params.direction === SwapDirection.BUY
            ? params.tokenMint.toBase58()
            : 'So11111111111111111111111111111111111111112',
          outAmount: quote.amountOut.toString(),
          otherAmountThreshold: quote.minimumAmountOut.toString(),
          swapMode: 'ExactIn',
          slippageBps: params.slippageBps,
          routePlan: quote.routePlan,
        },
        wrapAndUnwrapSol: true,
        useSharedAccounts: true,
        feeAccount: EXECUTION_CONFIG.jupiter.referralAccount?.toBase58(),
        prioritizationFeeLamports: 'auto',
        asLegacyTransaction: EXECUTION_CONFIG.jupiter.asLegacyTransaction || false,
      };

      // Call Jupiter swap API
      const response = await fetch(`${this.apiUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swapRequest),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Jupiter swap API failed: ${error}`);
      }

      const swapData: JupiterSwapResponse = await response.json();

      // Deserialize transaction
      const transactionBuffer = Buffer.from(swapData.swapTransaction, 'base64');

      let transaction: Transaction | VersionedTransaction;

      if (swapRequest.asLegacyTransaction) {
        transaction = Transaction.from(transactionBuffer);
      } else {
        transaction = VersionedTransaction.deserialize(transactionBuffer);
      }

      console.log('[Jupiter] Transaction built successfully');

      return transaction;
    } catch (error) {
      console.error('[Jupiter] Error building transaction:', error);
      throw new Error(`Failed to build Jupiter swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available routes for comparison
   */
  async getQuoteComparison(params: JupiterSwapParams): Promise<JupiterSwapQuote[]> {
    try {
      // Get multiple quotes with different settings
      const quotes = await Promise.all([
        // Best price (default)
        this.getQuote(params),

        // Only direct routes (faster)
        this.getQuote({
          ...params,
          onlyDirectRoutes: true,
        }),

        // Conservative slippage
        this.getQuote({
          ...params,
          slippageBps: EXECUTION_CONFIG.routing.slippage.conservative,
        }),
      ]);

      return quotes;
    } catch (error) {
      console.error('[Jupiter] Error comparing quotes:', error);
      throw error;
    }
  }

  /**
   * Check Jupiter health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('[Jupiter] Health check failed:', error);
      return false;
    }
  }

  /**
   * Get supported tokens list
   */
  async getSupportedTokens(): Promise<Array<{ address: string; symbol: string; name: string; decimals?: number; logoURI?: string }>> {
    try {
      const response = await fetch('https://token.jup.ag/all');
      if (!response.ok) {
        throw new Error('Failed to fetch token list');
      }
      return await response.json();
    } catch (error) {
      console.error('[Jupiter] Error fetching token list:', error);
      throw error;
    }
  }

  /**
   * Get token metadata
   */
  async getTokenMetadata(mint: string): Promise<{
    address: string;
    symbol: string;
    name: string;
    decimals?: number;
    logoURI?: string;
  } | null> {
    try {
      const tokens = await this.getSupportedTokens();
      return tokens.find(t => t.address === mint) || null;
    } catch (error) {
      console.error('[Jupiter] Error getting token metadata:', error);
      return null;
    }
  }
}

/**
 * Create a Jupiter routing engine instance
 */
export function createJupiterRoutingEngine(connection?: Connection): JupiterRoutingEngine {
  return new JupiterRoutingEngine(connection);
}

export default JupiterRoutingEngine;
