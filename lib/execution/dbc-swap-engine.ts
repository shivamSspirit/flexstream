/**
 * FlexIt DBC Swap Engine
 *
 * Direct-to-pool swaps for Meteora DBC tokens
 * Faster than Jupiter for new/low-liquidity tokens
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { DynamicBondingCurveClient, swapQuote, getCurrentPoint, ActivationType } from '@meteora-ag/dynamic-bonding-curve-sdk';
import BN from 'bn.js';
import { DBCSwapParams, DBCSwapQuote, SwapDirection } from './types';
import { EXECUTION_CONFIG, getCurrentRpcUrl } from './config';

/**
 * DBC Swap Engine
 * Handles direct swaps on Meteora DBC pools
 */
export class DBCSwapEngine {
  private connection: Connection;
  private dbcClient: DynamicBondingCurveClient;

  constructor(connection?: Connection) {
    this.connection = connection || new Connection(getCurrentRpcUrl(), EXECUTION_CONFIG.rpc.commitment);
    this.dbcClient = new DynamicBondingCurveClient(this.connection, EXECUTION_CONFIG.rpc.commitment);
  }

  /**
   * Get a swap quote from a DBC pool
   */
  async getQuote(params: DBCSwapParams): Promise<DBCSwapQuote> {
    try {
      console.log('[DBC Swap] Getting quote:', {
        pool: params.poolAddress.toBase58(),
        direction: params.direction,
        amountIn: params.amountIn.toString(),
        slippageBps: params.slippageBps,
      });

      // Fetch pool state
      const poolState = await this.dbcClient.state.getPool(params.poolAddress);
      if (!poolState) {
        throw new Error(`Pool not found: ${params.poolAddress.toBase58()}`);
      }

      // Fetch config state
      const configState = await this.dbcClient.state.getPoolConfig(poolState.config);
      if (!configState) {
        throw new Error('Pool config not found');
      }

      // Get current point (slot or timestamp based on activation type)
      const currentPoint = await getCurrentPoint(this.connection, ActivationType.Slot);

      // Calculate swap quote
      const swapBaseForQuote = params.direction === SwapDirection.SELL; // true = SELL tokens for SOL

      const quote = swapQuote(
        poolState,
        configState,
        swapBaseForQuote,
        params.amountIn,
        params.slippageBps,
        false, // hasReferral
        currentPoint
      );

      // Calculate price impact
      const baseReserve = poolState.baseReserve || new BN(0);
      const quoteReserve = poolState.quoteReserve || new BN(0);

      const priceImpactBps = this.calculatePriceImpact(
        params.amountIn,
        quote.minimumAmountOut,
        baseReserve,
        quoteReserve,
        params.direction
      );

      // Calculate current price
      const price = params.direction === SwapDirection.BUY
        ? quoteReserve.toNumber() / baseReserve.toNumber() // SOL per token
        : baseReserve.toNumber() / quoteReserve.toNumber(); // Tokens per SOL

      // Estimate fees
      const feeBpsRaw = configState.poolFees?.baseFee?.cliffFeeNumerator;
      const feeBps = typeof feeBpsRaw === 'number' ? feeBpsRaw : (feeBpsRaw?.toNumber?.() || 0);
      const amountInNum = params.amountIn.toNumber();
      const estimatedFee = Math.floor((amountInNum * feeBps) / 10000);

      console.log('[DBC Swap] Quote calculated:', {
        amountIn: params.amountIn.toString(),
        amountOut: quote.minimumAmountOut.toString(),
        priceImpactBps,
        feeBps,
        price,
      });

      return {
        amountIn: params.amountIn,
        amountOut: quote.minimumAmountOut,
        minimumAmountOut: quote.minimumAmountOut,
        priceImpactBps,
        estimatedFee,
        price,
        route: 'DIRECT_DBC',
        estimatedExecutionMs: 800, // Direct DBC swaps are fast (< 1 second)
        timestamp: Date.now(),
        baseReserve,
        quoteReserve,
        sqrtPrice: (poolState as any).sqrtPrice || new BN(0),
        liquidity: (poolState as any).liquidity || new BN(0),
        feeBps: feeBps / 100, // Convert to bps
      };
    } catch (error) {
      console.error('[DBC Swap] Error getting quote:', error);
      throw new Error(`Failed to get DBC quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build a swap transaction
   */
  async buildSwapTransaction(params: DBCSwapParams): Promise<Transaction> {
    try {
      console.log('[DBC Swap] Building transaction:', {
        pool: params.poolAddress.toBase58(),
        user: params.userWallet.toBase58(),
        direction: params.direction,
      });

      const swapBaseForQuote = params.direction === SwapDirection.SELL;

      // Create swap transaction using DBC SDK
      const transaction = await this.dbcClient.pool.swap({
        owner: params.userWallet,
        pool: params.poolAddress,
        amountIn: params.amountIn,
        minimumAmountOut: params.minimumAmountOut,
        swapBaseForQuote,
        referralTokenAccount: params.referralAccount || null,
        payer: params.userWallet,
      });

      // Add recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash(
        EXECUTION_CONFIG.rpc.commitment
      );

      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = params.userWallet;

      console.log('[DBC Swap] Transaction built successfully');

      return transaction;
    } catch (error) {
      console.error('[DBC Swap] Error building transaction:', error);
      throw new Error(`Failed to build swap transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate price impact in basis points
   */
  private calculatePriceImpact(
    amountIn: BN,
    amountOut: BN,
    baseReserve: BN,
    quoteReserve: BN,
    direction: SwapDirection
  ): number {
    try {
      if (baseReserve.isZero() || quoteReserve.isZero()) {
        return 0;
      }

      // Calculate spot price before trade
      const spotPrice = direction === SwapDirection.BUY
        ? quoteReserve.toNumber() / baseReserve.toNumber()
        : baseReserve.toNumber() / quoteReserve.toNumber();

      // Calculate execution price
      const executionPrice = amountIn.toNumber() / amountOut.toNumber();

      // Price impact = (execution price - spot price) / spot price * 10000 (bps)
      const priceImpact = Math.abs((executionPrice - spotPrice) / spotPrice) * 10000;

      return Math.round(priceImpact);
    } catch (error) {
      console.error('[DBC Swap] Error calculating price impact:', error);
      return 0;
    }
  }

  /**
   * Get pool info for a token
   */
  async getPoolInfo(poolAddress: PublicKey) {
    try {
      const poolState = await this.dbcClient.state.getPool(poolAddress);
      if (!poolState) {
        throw new Error('Pool not found');
      }

      const baseReserve = poolState.baseReserve || new BN(0);
      const quoteReserve = poolState.quoteReserve || new BN(0);

      const price = baseReserve.isZero()
        ? 0
        : quoteReserve.toNumber() / baseReserve.toNumber();

      const marketCap = price * 1_000_000_000; // Assuming 1B token supply
      const liquidity = quoteReserve.toNumber() / 1e9; // SOL in pool

      return {
        pool: poolAddress,
        mint: poolState.baseMint,
        baseReserve: baseReserve.toNumber() / 1e9,
        quoteReserve: quoteReserve.toNumber() / 1e9,
        price,
        marketCap,
        liquidity,
        sqrtPrice: poolState.sqrtPrice?.toString() || '0',
      };
    } catch (error) {
      console.error('[DBC Swap] Error getting pool info:', error);
      throw error;
    }
  }

  /**
   * Check if a pool exists and is tradable
   */
  async isPoolTradable(poolAddress: PublicKey): Promise<boolean> {
    try {
      const poolState = await this.dbcClient.state.getPool(poolAddress);
      if (!poolState) {
        return false;
      }

      // Check if pool has liquidity
      const quoteReserve = poolState.quoteReserve || new BN(0);
      return !quoteReserve.isZero();
    } catch (error) {
      console.error('[DBC Swap] Error checking pool tradability:', error);
      return false;
    }
  }

  /**
   * Estimate optimal slippage based on pool state
   */
  async estimateOptimalSlippage(poolAddress: PublicKey, amountIn: BN): Promise<number> {
    try {
      const poolInfo = await this.getPoolInfo(poolAddress);

      // Calculate what % of liquidity this trade represents
      const tradeSizePercent = (amountIn.toNumber() / 1e9) / poolInfo.liquidity * 100;

      // Adjust slippage based on trade size
      if (tradeSizePercent < 1) {
        return 100; // 1% for small trades
      } else if (tradeSizePercent < 5) {
        return 300; // 3% for medium trades
      } else if (tradeSizePercent < 10) {
        return 500; // 5% for large trades
      } else {
        return 1000; // 10% for very large trades
      }
    } catch (error) {
      console.error('[DBC Swap] Error estimating slippage:', error);
      return EXECUTION_CONFIG.routing.slippage.default;
    }
  }
}

/**
 * Create a DBC swap engine instance
 */
export function createDBCSwapEngine(connection?: Connection): DBCSwapEngine {
  return new DBCSwapEngine(connection);
}

/**
 * Helper: Convert SOL to lamports
 */
export function solToLamports(sol: number): BN {
  return new BN(sol * 1e9);
}

/**
 * Helper: Convert lamports to SOL
 */
export function lamportsToSol(lamports: BN | number): number {
  const amount = typeof lamports === 'number' ? lamports : lamports.toNumber();
  return amount / 1e9;
}

/**
 * Helper: Convert tokens to base units (assuming 9 decimals)
 */
export function tokensToBaseUnits(tokens: number, decimals: number = 9): BN {
  return new BN(tokens * Math.pow(10, decimals));
}

/**
 * Helper: Convert base units to tokens
 */
export function baseUnitsToTokens(baseUnits: BN | number, decimals: number = 9): number {
  const amount = typeof baseUnits === 'number' ? baseUnits : baseUnits.toNumber();
  return amount / Math.pow(10, decimals);
}

export default DBCSwapEngine;
