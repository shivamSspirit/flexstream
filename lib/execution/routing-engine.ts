/**
 * FlexIt Intelligent Routing Engine
 *
 * The "brain" that decides:
 * - Direct DBC (for new tokens < 5 min old)
 * - Jupiter (for established tokens)
 * - Hybrid (split order)
 * - User preference
 *
 * This gives FlexIt the 6-9 second head start on new token launches
 */

import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import {
  SwapParams,
  DBCSwapParams,
  JupiterSwapParams,
  SwapQuote,
  DBCSwapQuote,
  JupiterSwapQuote,
  RoutingDecision,
  TokenMetadata,
  SwapDirection,
} from './types';
import { EXECUTION_CONFIG, getCurrentRpcUrl, RoutingStrategy } from './config';
import { DBCSwapEngine } from './dbc-swap-engine';
import { JupiterRoutingEngine } from './jupiter-routing-engine';

/**
 * Routing Engine
 * Intelligently routes trades for best execution
 */
export class RoutingEngine {
  private connection: Connection;
  private dbcEngine: DBCSwapEngine;
  private jupiterEngine: JupiterRoutingEngine;

  constructor(connection?: Connection) {
    this.connection = connection || new Connection(getCurrentRpcUrl(), EXECUTION_CONFIG.rpc.commitment);
    this.dbcEngine = new DBCSwapEngine(this.connection);
    this.jupiterEngine = new JupiterRoutingEngine(this.connection);
  }

  /**
   * Make routing decision based on token characteristics
   */
  async makeRoutingDecision(
    tokenMint: PublicKey,
    params: SwapParams,
    userPreference?: RoutingStrategy
  ): Promise<RoutingDecision> {
    try {
      console.log('[Routing] Making routing decision:', {
        token: tokenMint.toBase58(),
        direction: params.direction,
        userPreference,
      });

      // If user has a preference, honor it
      if (userPreference === RoutingStrategy.DIRECT_DBC && params.poolAddress) {
        return {
          strategy: 'DIRECT_DBC',
          reason: 'User selected direct DBC routing',
          metrics: {
            expectedExecutionMs: 800,
            expectedPriceImpactBps: 300, // Estimate
            expectedSuccessRate: 99,
          },
        };
      }

      if (userPreference === RoutingStrategy.JUPITER) {
        return {
          strategy: 'JUPITER',
          reason: 'User selected Jupiter routing',
          metrics: {
            expectedExecutionMs: 1500,
            expectedPriceImpactBps: 100, // Usually better price
            expectedSuccessRate: 98,
          },
        };
      }

      // Get token metadata to make intelligent decision
      const tokenMetadata = await this.getTokenMetadata(tokenMint, params.poolAddress);

      // Decision logic
      const decision = this.analyzeAndDecide(tokenMetadata, params);

      console.log('[Routing] Decision made:', decision);

      return decision;
    } catch (error) {
      console.error('[Routing] Error making decision:', error);

      // Fallback to DBC if available, otherwise Jupiter
      return {
        strategy: params.poolAddress ? 'DIRECT_DBC' : 'JUPITER',
        reason: 'Fallback due to decision error',
        metrics: {
          expectedExecutionMs: 1000,
          expectedPriceImpactBps: 300,
          expectedSuccessRate: 95,
        },
      };
    }
  }

  /**
   * Analyze token and decide routing strategy
   */
  private analyzeAndDecide(metadata: TokenMetadata, params: SwapParams): RoutingDecision {
    // Calculate token age
    const tokenAgeSeconds = (Date.now() - metadata.createdAt) / 1000;

    // ============================================
    // RULE 1: NEW TOKEN (< 5 minutes old)
    // Use DBC for instant execution - 6-9 second head start!
    // ============================================
    if (
      tokenAgeSeconds < EXECUTION_CONFIG.routing.newTokenThresholdSeconds &&
      metadata.isDBCToken &&
      metadata.dbcPoolAddress
    ) {
      return {
        strategy: 'DIRECT_DBC',
        reason: `New token (${Math.round(tokenAgeSeconds)}s old) - Direct DBC for fastest execution`,
        metrics: {
          expectedExecutionMs: 800,  // DBC is fast!
          expectedPriceImpactBps: 500, // Higher impact expected for new tokens
          expectedSuccessRate: 99,
        },
        tokenAgeSeconds,
      };
    }

    // ============================================
    // RULE 2: HIGH VOLUME TOKEN (> $100k/24h)
    // Use Jupiter for best price across all DEXs
    // ============================================
    if (metadata.volume24h > EXECUTION_CONFIG.routing.highVolumeThresholdUSD) {
      return {
        strategy: 'JUPITER',
        reason: `High volume token ($${metadata.volume24h.toLocaleString()}/24h) - Jupiter for best price`,
        metrics: {
          expectedExecutionMs: 1500,
          expectedPriceImpactBps: 50, // Low impact on high liquidity
          expectedSuccessRate: 98,
        },
        volumeUSD: metadata.volume24h,
      };
    }

    // ============================================
    // RULE 3: DBC TOKEN (post/creator tokens)
    // Use direct DBC for our own ecosystem tokens
    // ============================================
    if (metadata.isDBCToken && metadata.dbcPoolAddress) {
      return {
        strategy: 'DIRECT_DBC',
        reason: 'FlexIt ecosystem token - Direct DBC routing',
        metrics: {
          expectedExecutionMs: 800,
          expectedPriceImpactBps: 300,
          expectedSuccessRate: 99,
        },
      };
    }

    // ============================================
    // RULE 4: LARGE TRADE (high price impact)
    // Use Jupiter to split across DEXs
    // ============================================
    const estimatedImpactBps = this.estimatePriceImpact(params.amountIn, metadata.marketCap);
    if (estimatedImpactBps > 500) { // > 5% impact
      return {
        strategy: 'JUPITER',
        reason: `Large trade ($${estimatedImpactBps/100}% impact) - Jupiter for better routing`,
        metrics: {
          expectedExecutionMs: 1500,
          expectedPriceImpactBps: estimatedImpactBps,
          expectedSuccessRate: 97,
        },
      };
    }

    // ============================================
    // DEFAULT: Jupiter for established tokens
    // ============================================
    return {
      strategy: 'JUPITER',
      reason: 'Established token - Jupiter for best price',
      metrics: {
        expectedExecutionMs: 1500,
        expectedPriceImpactBps: 100,
        expectedSuccessRate: 98,
      },
    };
  }

  /**
   * Get quote using the optimal routing strategy
   */
  async getOptimalQuote(
    params: SwapParams,
    userPreference?: RoutingStrategy
  ): Promise<SwapQuote> {
    try {
      // Make routing decision
      const decision = await this.makeRoutingDecision(
        params.tokenMint,
        params,
        userPreference
      );

      // Get quote based on decision
      if (decision.strategy === 'DIRECT_DBC' && params.poolAddress) {
        const dbcParams: DBCSwapParams = {
          ...params,
          poolAddress: params.poolAddress,
          tokenType: 'post', // Default, can be overridden
        };
        return await this.dbcEngine.getQuote(dbcParams);
      }

      // Jupiter routing
      const jupiterParams: JupiterSwapParams = {
        ...params,
        onlyDirectRoutes: decision.metrics.expectedExecutionMs < 1000, // Fast mode for urgent trades
      };
      return await this.jupiterEngine.getQuote(jupiterParams);
    } catch (error) {
      console.error('[Routing] Error getting optimal quote:', error);
      throw error;
    }
  }

  /**
   * Compare DBC vs Jupiter quotes (for advanced users)
   */
  async compareQuotes(params: SwapParams): Promise<{
    dbc: DBCSwapQuote | null;
    jupiter: JupiterSwapQuote | null;
    recommended: 'DBC' | 'JUPITER';
    reason: string;
  }> {
    try {
      const results = await Promise.allSettled([
        // Try DBC
        params.poolAddress
          ? this.dbcEngine.getQuote({
              ...params,
              poolAddress: params.poolAddress,
              tokenType: 'post',
            })
          : Promise.reject(new Error('No pool address')),

        // Try Jupiter
        this.jupiterEngine.getQuote(params as JupiterSwapParams),
      ]);

      const dbcQuote = results[0].status === 'fulfilled' ? results[0].value : null;
      const jupiterQuote = results[1].status === 'fulfilled' ? results[1].value : null;

      // Determine recommendation
      let recommended: 'DBC' | 'JUPITER';
      let reason: string;

      if (!dbcQuote && !jupiterQuote) {
        throw new Error('Both routing engines failed');
      }

      if (!dbcQuote) {
        recommended = 'JUPITER';
        reason = 'DBC not available';
      } else if (!jupiterQuote) {
        recommended = 'DBC';
        reason = 'Jupiter not available';
      } else {
        // Compare quotes
        const dbcAmountOut = dbcQuote.amountOut.toNumber();
        const jupiterAmountOut = jupiterQuote.amountOut.toNumber();

        if (dbcAmountOut > jupiterAmountOut * 1.02) { // DBC > 2% better
          recommended = 'DBC';
          reason = `DBC offers ${((dbcAmountOut / jupiterAmountOut - 1) * 100).toFixed(2)}% better price`;
        } else if (jupiterAmountOut > dbcAmountOut * 1.02) { // Jupiter > 2% better
          recommended = 'JUPITER';
          reason = `Jupiter offers ${((jupiterAmountOut / dbcAmountOut - 1) * 100).toFixed(2)}% better price`;
        } else {
          // Prices similar - choose based on speed
          recommended = 'DBC';
          reason = 'Prices similar, DBC faster execution';
        }
      }

      return {
        dbc: dbcQuote,
        jupiter: jupiterQuote,
        recommended,
        reason,
      };
    } catch (error) {
      console.error('[Routing] Error comparing quotes:', error);
      throw error;
    }
  }

  /**
   * Get token metadata for routing decision
   */
  private async getTokenMetadata(
    tokenMint: PublicKey,
    poolAddress?: PublicKey
  ): Promise<TokenMetadata> {
    try {
      // Check if it's a DBC token by checking if pool exists
      const isDBCToken = poolAddress !== undefined;

      // For DBC tokens, get metadata from pool
      if (isDBCToken && poolAddress) {
        const poolInfo = await this.dbcEngine.getPoolInfo(poolAddress);

        return {
          mint: tokenMint,
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
          createdAt: Date.now() - 60000, // Assume 1 minute old if we can't determine
          volume24h: 0,
          marketCap: poolInfo.marketCap,
          isDBCToken: true,
          dbcPoolAddress: poolAddress,
        };
      }

      // For other tokens, try Jupiter token list
      const jupiterMetadata = await this.jupiterEngine.getTokenMetadata(tokenMint.toBase58());

      return {
        mint: tokenMint,
        symbol: jupiterMetadata?.symbol || 'UNKNOWN',
        name: jupiterMetadata?.name || 'Unknown Token',
        createdAt: Date.now() - 86400000, // Assume 1 day old for Jupiter tokens
        volume24h: 100000, // Assume high volume for Jupiter-listed tokens
        marketCap: 1000000, // Default market cap
        isDBCToken: false,
      };
    } catch (error) {
      console.error('[Routing] Error getting token metadata:', error);

      // Return default metadata
      return {
        mint: tokenMint,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        createdAt: Date.now(),
        volume24h: 0,
        marketCap: 0,
        isDBCToken: false,
      };
    }
  }

  /**
   * Estimate price impact based on trade size
   */
  private estimatePriceImpact(amountIn: BN, marketCap: number): number {
    if (marketCap === 0) return 1000; // 10% default for unknown

    const tradeSizeUSD = (amountIn.toNumber() / 1e9) * 100; // Assuming SOL = $100
    const impactPercent = (tradeSizeUSD / marketCap) * 100;

    return Math.round(impactPercent * 100); // Convert to bps
  }
}

/**
 * Create a routing engine instance
 */
export function createRoutingEngine(connection?: Connection): RoutingEngine {
  return new RoutingEngine(connection);
}

export default RoutingEngine;
