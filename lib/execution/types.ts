/**
 * FlexIt Execution Engine - Core Types
 *
 * Type definitions for the best execution engine
 */

import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import BN from 'bn.js';

// ============================================
// SWAP TYPES
// ============================================

/**
 * Swap direction
 */
export enum SwapDirection {
  BUY = 'BUY',   // SOL -> Token
  SELL = 'SELL', // Token -> SOL
}

/**
 * Token standard
 */
export enum TokenStandard {
  SPL = 'SPL',
  TOKEN_2022 = 'TOKEN_2022',
}

/**
 * Base swap parameters
 */
export interface SwapParams {
  /** User's wallet address */
  userWallet: PublicKey;

  /** Token mint address */
  tokenMint: PublicKey;

  /** Pool address (for DBC) */
  poolAddress?: PublicKey;

  /** Swap direction */
  direction: SwapDirection;

  /** Input amount (in base units: lamports for SOL, base units for tokens) */
  amountIn: BN;

  /** Minimum output amount (slippage protection) */
  minimumAmountOut: BN;

  /** Slippage tolerance in basis points (100 = 1%) */
  slippageBps: number;

  /** Priority level for Jito bundles */
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  /** Optional referral account */
  referralAccount?: PublicKey;
}

/**
 * DBC-specific swap parameters
 */
export interface DBCSwapParams extends SwapParams {
  /** DBC pool address (required for DBC swaps) */
  poolAddress: PublicKey;

  /** Token type */
  tokenType: 'post' | 'creator';
}

/**
 * Jupiter swap parameters
 */
export interface JupiterSwapParams extends SwapParams {
  /** Only use direct routes (faster but possibly worse price) */
  onlyDirectRoutes?: boolean;

  /** Max number of accounts (Solana limit = 64) */
  maxAccounts?: number;

  /** Platform fee in BPS */
  platformFeeBps?: number;
}

// ============================================
// QUOTE TYPES
// ============================================

/**
 * Base swap quote
 */
export interface SwapQuote {
  /** Input amount */
  amountIn: BN;

  /** Expected output amount */
  amountOut: BN;

  /** Minimum output amount after slippage */
  minimumAmountOut: BN;

  /** Price impact in basis points (100 = 1%) */
  priceImpactBps: number;

  /** Estimated fee in lamports */
  estimatedFee: number;

  /** Current price (output per input) */
  price: number;

  /** Routing strategy used */
  route: 'DIRECT_DBC' | 'JUPITER' | 'HYBRID';

  /** Estimated execution time in milliseconds */
  estimatedExecutionMs: number;

  /** Quote timestamp */
  timestamp: number;
}

/**
 * DBC swap quote with pool state
 */
export interface DBCSwapQuote extends SwapQuote {
  route: 'DIRECT_DBC';

  /** Pool reserves (base token) */
  baseReserve: BN;

  /** Pool reserves (quote token / SOL) */
  quoteReserve: BN;

  /** Current sqrt price */
  sqrtPrice: BN;

  /** Pool liquidity */
  liquidity: BN;

  /** Fee in basis points */
  feeBps: number;
}

/**
 * Jupiter swap quote
 */
export interface JupiterSwapQuote extends SwapQuote {
  route: 'JUPITER';

  /** Route plan (which DEXs used) */
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

  /** Other routes available (for comparison) */
  otherAmountThreshold?: BN;
}

// ============================================
// EXECUTION TYPES
// ============================================

/**
 * Swap execution result
 */
export interface SwapExecutionResult {
  /** Success status */
  success: boolean;

  /** Transaction signature */
  signature?: string;

  /** Error message if failed */
  error?: string;

  /** Actual output amount received */
  actualAmountOut?: BN;

  /** Execution time in milliseconds */
  executionTimeMs: number;

  /** Block number where transaction landed */
  blockNumber?: number;

  /** Jito bundle ID (if used) */
  bundleId?: string;

  /** Gas fees paid (lamports) */
  gasFee?: number;

  /** Jito tip paid (lamports) */
  jitoTip?: number;

  /** Timestamp */
  timestamp: number;
}

// ============================================
// BUNDLE TYPES
// ============================================

/**
 * Jito bundle configuration
 */
export interface BundleConfig {
  /** Bundle ID */
  id: string;

  /** Transactions in bundle */
  transactions: Array<Transaction | VersionedTransaction>;

  /** Tip transaction */
  tipTransaction: Transaction;

  /** Tip amount in lamports */
  tipLamports: number;

  /** Max retries */
  maxRetries: number;

  /** Timeout in milliseconds */
  timeoutMs: number;
}

/**
 * Bundle execution status
 */
export interface BundleExecutionStatus {
  /** Bundle ID */
  bundleId: string;

  /** Status */
  status: 'PENDING' | 'PROCESSING' | 'LANDED' | 'FAILED' | 'TIMEOUT';

  /** Landed block (if successful) */
  landedBlock?: number;

  /** Error message (if failed) */
  error?: string;

  /** Retry count */
  retries: number;

  /** Created timestamp */
  createdAt: number;

  /** Updated timestamp */
  updatedAt: number;
}

// ============================================
// ROUTING TYPES
// ============================================

/**
 * Token metadata for routing decisions
 */
export interface TokenMetadata {
  /** Token mint */
  mint: PublicKey;

  /** Token symbol */
  symbol: string;

  /** Token name */
  name: string;

  /** Creation timestamp */
  createdAt: number;

  /** 24h trading volume (USD) */
  volume24h: number;

  /** Market cap (USD) */
  marketCap: number;

  /** Is this a DBC token? */
  isDBCToken: boolean;

  /** DBC pool address (if applicable) */
  dbcPoolAddress?: PublicKey;

  /** Token type (if DBC) */
  tokenType?: 'post' | 'creator';
}

/**
 * Routing decision
 */
export interface RoutingDecision {
  /** Selected strategy */
  strategy: 'DIRECT_DBC' | 'JUPITER' | 'HYBRID';

  /** Reasoning */
  reason: string;

  /** Estimated performance metrics */
  metrics: {
    expectedExecutionMs: number;
    expectedPriceImpactBps: number;
    expectedSuccessRate: number;
  };

  /** Token age in seconds */
  tokenAgeSeconds?: number;

  /** Volume in USD */
  volumeUSD?: number;
}

// ============================================
// MONITORING TYPES
// ============================================

/**
 * Execution metrics for monitoring
 */
export interface ExecutionMetrics {
  /** Total swaps executed */
  totalSwaps: number;

  /** Successful swaps */
  successfulSwaps: number;

  /** Failed swaps */
  failedSwaps: number;

  /** Average execution time (ms) */
  avgExecutionTimeMs: number;

  /** Average price impact (bps) */
  avgPriceImpactBps: number;

  /** Total volume (USD) */
  totalVolumeUSD: number;

  /** Total fees collected (lamports) */
  totalFeesLamports: number;

  /** Metrics period */
  period: '1h' | '24h' | '7d' | '30d' | 'all';

  /** Last updated */
  updatedAt: number;
}

/**
 * Health check status
 */
export interface HealthStatus {
  /** Overall health */
  healthy: boolean;

  /** Individual component statuses */
  components: {
    rpc: boolean;
    jito: boolean;
    jupiter: boolean;
    dbc: boolean;
  };

  /** Error messages */
  errors: string[];

  /** Timestamp */
  timestamp: number;
}

export default {
  SwapDirection,
  TokenStandard,
};
