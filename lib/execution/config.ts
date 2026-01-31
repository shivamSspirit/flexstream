/**
 * FlexIt Best Execution Engine Configuration
 *
 * This config powers:
 * - Direct-to-pool routing (DBC tokens)
 * - Jupiter routing (established tokens)
 * - Jito bundle execution (MEV protection)
 * - Real-time pricing (Helius Geyser)
 */

import { PublicKey } from '@solana/web3.js';

export const EXECUTION_CONFIG = {
  // ============================================
  // RPC CONFIGURATION
  // ============================================
  rpc: {
    helius: {
      mainnet: process.env.HELIUS_RPC_MAINNET || process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
      devnet: process.env.HELIUS_RPC_DEVNET || 'https://api.devnet.solana.com',
      websocket: process.env.NEXT_PUBLIC_HELIUS_WEBSOCKET_URL,
      apiKey: process.env.HELIUS_API_KEY,
    },
    network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as 'mainnet-beta' | 'devnet',
    commitment: 'confirmed' as const,
  },

  // ============================================
  // JITO BUNDLE CONFIGURATION
  // ============================================
  jito: {
    enabled: true,
    blockEngineUrl: process.env.JITO_BLOCK_ENGINE_URL || 'https://mainnet.block-engine.jito.wtf/api/v1',
    authKeypair: process.env.JITO_AUTH_KEYPAIR,
    tips: {
      default: parseInt(process.env.JITO_DEFAULT_TIP_LAMPORTS || '10000'), // 0.00001 SOL
      min: 5000, // 0.000005 SOL
      max: parseInt(process.env.JITO_MAX_TIP_LAMPORTS || '100000'), // 0.0001 SOL
      aggressive: 50000, // 0.00005 SOL (for new tokens)
    },
    bundleRetries: 3,
    bundleTimeout: 30000, // 30 seconds
  },

  // ============================================
  // JUPITER ROUTING CONFIGURATION
  // ============================================
  jupiter: {
    enabled: true,
    apiUrl: process.env.NEXT_PUBLIC_JUPITER_API_URL || 'https://quote-api.jup.ag/v6',
    referralAccount: process.env.JUPITER_REFERRAL_ACCOUNT
      ? new PublicKey(process.env.JUPITER_REFERRAL_ACCOUNT)
      : undefined,
    platformFeeBps: parseInt(process.env.JUPITER_FEE_BPS || '50'), // 0.5% platform fee
    maxAccounts: 64, // Solana transaction limit
    restrictIntermediateTokens: false,
    onlyDirectRoutes: false,
    asLegacyTransaction: false,
  },

  // ============================================
  // ROUTING DECISION ENGINE
  // ============================================
  routing: {
    // Token age threshold for direct-to-pool routing (5 minutes)
    newTokenThresholdSeconds: parseInt(process.env.ROUTING_NEW_TOKEN_THRESHOLD_SECONDS || '300'),

    // Volume threshold for Jupiter routing ($100k 24h volume)
    highVolumeThresholdUSD: parseInt(process.env.ROUTING_HIGH_VOLUME_THRESHOLD_USD || '100000'),

    // Slippage settings
    slippage: {
      default: parseInt(process.env.ROUTING_DEFAULT_SLIPPAGE_BPS || '300'), // 3%
      aggressive: 500, // 5% for new tokens
      conservative: 100, // 1% for established tokens
      max: parseInt(process.env.ROUTING_MAX_SLIPPAGE_BPS || '1000'), // 10%
    },

    // Routing priorities
    priorities: {
      speed: 100, // Weight for execution speed
      price: 80,  // Weight for best price
      reliability: 90, // Weight for success rate
    },
  },

  // ============================================
  // DBC TOKEN CONFIGURATION
  // ============================================
  dbc: {
    programId: new PublicKey('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN'),
    postPoolConfig: process.env.POST_POOL_CONFIG_KEY
      ? new PublicKey(process.env.POST_POOL_CONFIG_KEY)
      : undefined,
    creatorPoolConfig: process.env.CREATOR_POOL_CONFIG_KEY
      ? new PublicKey(process.env.CREATOR_POOL_CONFIG_KEY)
      : undefined,
    defaultSlippage: 500, // 5% for DBC tokens (higher volatility)
  },

  // ============================================
  // EXECUTION MONITORING
  // ============================================
  monitoring: {
    enabled: process.env.EXECUTION_ANALYTICS_ENABLED === 'true',
    logLevel: (process.env.EXECUTION_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
    trackMetrics: true,
    sendToAnalytics: true,
  },

  // ============================================
  // RATE LIMITING
  // ============================================
  rateLimits: {
    maxRequestsPerSecond: 10,
    maxBundlesPerMinute: 30,
    maxSwapsPerUser: 100, // per hour
  },

  // ============================================
  // PLATFORM CONFIGURATION
  // ============================================
  platform: {
    keypair: process.env.PLATFORM_KEYPAIR_SECRET,
    feeAccount: process.env.PLATFORM_FEE_ACCOUNT
      ? new PublicKey(process.env.PLATFORM_FEE_ACCOUNT)
      : undefined,
  },
} as const;

/**
 * Routing strategies for different scenarios
 */
export enum RoutingStrategy {
  DIRECT_DBC = 'DIRECT_DBC',           // Direct swap on Meteora DBC pool
  JUPITER = 'JUPITER',                 // Route through Jupiter aggregator
  HYBRID = 'HYBRID',                   // Split order across both
  USER_PREFERENCE = 'USER_PREFERENCE', // User-selected routing
}

/**
 * Execution priority levels
 */
export enum ExecutionPriority {
  LOW = 'LOW',         // Standard tip, slower execution
  NORMAL = 'NORMAL',   // Default tip, normal execution
  HIGH = 'HIGH',       // Higher tip, faster execution
  URGENT = 'URGENT',   // Max tip, fastest execution (for sniping)
}

/**
 * Bundle status tracking
 */
export enum BundleStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  LANDED = 'LANDED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

/**
 * Validate configuration on startup
 */
export function validateExecutionConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check RPC configuration
  if (!EXECUTION_CONFIG.rpc.helius.mainnet && EXECUTION_CONFIG.rpc.network === 'mainnet-beta') {
    errors.push('Missing Helius mainnet RPC URL');
  }

  // Check Jito configuration
  if (EXECUTION_CONFIG.jito.enabled && !EXECUTION_CONFIG.jito.authKeypair) {
    errors.push('Jito enabled but auth keypair not configured');
  }

  // Check DBC configuration
  if (!EXECUTION_CONFIG.dbc.postPoolConfig) {
    errors.push('POST_POOL_CONFIG_KEY not set');
  }

  // Check platform keypair
  if (!EXECUTION_CONFIG.platform.keypair) {
    errors.push('PLATFORM_KEYPAIR_SECRET not set');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get current RPC URL based on network
 */
export function getCurrentRpcUrl(): string {
  const network = EXECUTION_CONFIG.rpc.network;
  return network === 'mainnet-beta'
    ? EXECUTION_CONFIG.rpc.helius.mainnet!
    : EXECUTION_CONFIG.rpc.helius.devnet;
}

/**
 * Get Jito tip based on priority
 */
export function getJitoTip(priority: ExecutionPriority): number {
  switch (priority) {
    case ExecutionPriority.LOW:
      return EXECUTION_CONFIG.jito.tips.min;
    case ExecutionPriority.NORMAL:
      return EXECUTION_CONFIG.jito.tips.default;
    case ExecutionPriority.HIGH:
      return EXECUTION_CONFIG.jito.tips.aggressive;
    case ExecutionPriority.URGENT:
      return EXECUTION_CONFIG.jito.tips.max;
    default:
      return EXECUTION_CONFIG.jito.tips.default;
  }
}

export default EXECUTION_CONFIG;
