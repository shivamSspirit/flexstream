/**
 * FlexIt Best Execution Engine - Main Entry Point
 *
 * This is the unified API that powers FlexIt's best execution:
 * - DBC direct routing (fastest for new tokens)
 * - Jupiter aggregation (best price for established tokens)
 * - Jito bundles (MEV protection + priority)
 * - Intelligent routing (auto-selects best strategy)
 *
 * Usage:
 *   const engine = createExecutionEngine();
 *   const quote = await engine.getQuote(...);
 *   const result = await engine.executeSwap(...);
 */

import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import BN from 'bn.js';
import {
  SwapParams,
  SwapQuote,
  SwapExecutionResult,
} from './types';
import { EXECUTION_CONFIG, getCurrentRpcUrl, RoutingStrategy, ExecutionPriority } from './config';
import { RoutingEngine } from './routing-engine';
import { DBCSwapEngine } from './dbc-swap-engine';
import { JupiterRoutingEngine } from './jupiter-routing-engine';
import { JitoBundleEngine } from './jito-bundle-engine';
import { getPlatformKeypair } from '@/lib/meteora-dbc';

/**
 * Main Execution Engine
 * Orchestrates all routing, execution, and bundling logic
 */
export class ExecutionEngine {
  private connection: Connection;
  private routingEngine: RoutingEngine;
  private dbcEngine: DBCSwapEngine;
  private jupiterEngine: JupiterRoutingEngine;
  private jitoEngine: JitoBundleEngine;

  constructor(connection?: Connection) {
    this.connection = connection || new Connection(getCurrentRpcUrl(), EXECUTION_CONFIG.rpc.commitment);
    this.routingEngine = new RoutingEngine(this.connection);
    this.dbcEngine = new DBCSwapEngine(this.connection);
    this.jupiterEngine = new JupiterRoutingEngine(this.connection);
    this.jitoEngine = new JitoBundleEngine(this.connection);

    console.log('[ExecutionEngine] Initialized with network:', EXECUTION_CONFIG.rpc.network);
  }

  /**
   * Get a swap quote (auto-routes to best option)
   */
  async getQuote(params: SwapParams, userPreference?: RoutingStrategy): Promise<SwapQuote> {
    try {
      console.log('[ExecutionEngine] Getting quote for:', {
        token: params.tokenMint.toBase58(),
        direction: params.direction,
        amount: params.amountIn.toString(),
      });

      const quote = await this.routingEngine.getOptimalQuote(params, userPreference);

      console.log('[ExecutionEngine] Quote received:', {
        route: quote.route,
        amountOut: quote.amountOut.toString(),
        priceImpact: quote.priceImpactBps / 100 + '%',
        estimatedTime: quote.estimatedExecutionMs + 'ms',
      });

      return quote;
    } catch (error) {
      console.error('[ExecutionEngine] Error getting quote:', error);
      throw error;
    }
  }

  /**
   * Compare routing options (for power users)
   */
  async compareRoutes(params: SwapParams) {
    return await this.routingEngine.compareQuotes(params);
  }

  /**
   * Execute a swap with best execution
   */
  async executeSwap(
    params: SwapParams,
    signer: Keypair,
    options?: {
      useJito?: boolean;
      priority?: ExecutionPriority;
      userPreference?: RoutingStrategy;
    }
  ): Promise<SwapExecutionResult> {
    const startTime = Date.now();

    try {
      console.log('[ExecutionEngine] Executing swap:', {
        token: params.tokenMint.toBase58(),
        direction: params.direction,
        useJito: options?.useJito ?? true,
        priority: options?.priority || 'NORMAL',
      });

      // Get quote first
      const quote = await this.getQuote(params, options?.userPreference);

      // Build transaction based on routing
      let transaction: Transaction;

      if (quote.route === 'DIRECT_DBC' && params.poolAddress) {
        // DBC swap
        transaction = await this.dbcEngine.buildSwapTransaction({
          ...params,
          poolAddress: params.poolAddress,
          tokenType: 'post',
        });
      } else {
        // Jupiter swap
        const jupiterTx = await this.jupiterEngine.buildSwapTransaction(
          params,
          quote as any // Type cast for simplicity
        );

        // Convert to regular Transaction if needed
        if (jupiterTx instanceof Transaction) {
          transaction = jupiterTx;
        } else {
          throw new Error('Versioned transactions not yet supported');
        }
      }

      // Execute with or without Jito
      const useJito = options?.useJito ?? EXECUTION_CONFIG.jito.enabled;
      let signature: string;
      let bundleId: string | undefined;
      let jitoTip = 0;

      if (useJito && this.jitoEngine.isAvailable()) {
        console.log('[ExecutionEngine] Using Jito bundle execution');

        // Create bundle
        const bundle = await this.jitoEngine.createBundle(
          [transaction],
          params.userWallet,
          options?.priority || ExecutionPriority.NORMAL
        );

        jitoTip = bundle.tipLamports;

        // Execute bundle
        const bundleStatus = await this.jitoEngine.executeBundle(bundle, [signer]);

        if (bundleStatus.status !== 'LANDED') {
          throw new Error(`Bundle execution failed: ${bundleStatus.error}`);
        }

        signature = bundleStatus.bundleId;
        bundleId = bundleStatus.bundleId;

        console.log('[ExecutionEngine] Jito bundle landed:', signature);
      } else {
        console.log('[ExecutionEngine] Using direct RPC execution');

        // Sign and send transaction
        transaction.sign(signer);

        signature = await this.connection.sendRawTransaction(
          transaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: EXECUTION_CONFIG.rpc.commitment,
          }
        );

        // Wait for confirmation
        const confirmation = await this.connection.confirmTransaction(
          signature,
          EXECUTION_CONFIG.rpc.commitment
        );

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        console.log('[ExecutionEngine] Transaction confirmed:', signature);
      }

      // Get final block number
      const slot = await this.connection.getSlot();

      const executionTimeMs = Date.now() - startTime;

      const result: SwapExecutionResult = {
        success: true,
        signature,
        actualAmountOut: quote.amountOut,
        executionTimeMs,
        blockNumber: slot,
        bundleId,
        gasFee: 5000, // Estimate
        jitoTip,
        timestamp: Date.now(),
      };

      console.log('[ExecutionEngine] Swap executed successfully:', {
        signature,
        executionTime: executionTimeMs + 'ms',
        route: quote.route,
      });

      return result;
    } catch (error) {
      console.error('[ExecutionEngine] Swap execution failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Health check for all components
   */
  async checkHealth() {
    const checks = await Promise.allSettled([
      // RPC check
      this.connection.getSlot(),

      // Jupiter check
      this.jupiterEngine.checkHealth(),

      // DBC check (check if we can fetch config)
      EXECUTION_CONFIG.dbc.postPoolConfig
        ? this.dbcEngine.isPoolTradable(EXECUTION_CONFIG.dbc.postPoolConfig)
        : Promise.resolve(false),
    ]);

    return {
      healthy: checks.every(c => c.status === 'fulfilled'),
      components: {
        rpc: checks[0].status === 'fulfilled',
        jupiter: checks[1].status === 'fulfilled' && checks[1].value === true,
        dbc: checks[2].status === 'fulfilled' && checks[2].value === true,
        jito: this.jitoEngine.isAvailable(),
      },
      errors: checks
        .filter(c => c.status === 'rejected')
        .map(c => (c as PromiseRejectedResult).reason?.message || 'Unknown error'),
      timestamp: Date.now(),
    };
  }

  /**
   * Get execution statistics
   */
  getStats() {
    return {
      network: EXECUTION_CONFIG.rpc.network,
      jitoEnabled: EXECUTION_CONFIG.jito.enabled,
      jupiterEnabled: EXECUTION_CONFIG.jupiter.enabled,
      dbcPoolConfig: EXECUTION_CONFIG.dbc.postPoolConfig?.toBase58(),
      routingThresholds: {
        newTokenSeconds: EXECUTION_CONFIG.routing.newTokenThresholdSeconds,
        highVolumeUSD: EXECUTION_CONFIG.routing.highVolumeThresholdUSD,
      },
    };
  }
}

/**
 * Create an execution engine instance
 */
export function createExecutionEngine(connection?: Connection): ExecutionEngine {
  return new ExecutionEngine(connection);
}

/**
 * Re-export all types and engines for convenience
 */
export * from './types';
export * from './config';
export { DBCSwapEngine } from './dbc-swap-engine';
export { JupiterRoutingEngine } from './jupiter-routing-engine';
export { JitoBundleEngine } from './jito-bundle-engine';
export { RoutingEngine } from './routing-engine';

export default ExecutionEngine;
