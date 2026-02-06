import { Redis } from '@upstash/redis';

// ═══════════════════════════════════════════════════════════════════════════════
// UPSTASH REDIS CLIENT
// ═══════════════════════════════════════════════════════════════════════════════
// Serverless Redis for caching, rate limiting, and real-time counters
// Part of DB-FLEX-ARC-RECOMMENDED.md Phase 1 implementation
//
// Expected performance gains:
// - Token price lookup: 300ms → <5ms (60x faster)
// - Leaderboard: 200ms → <10ms (20x faster)
// - User profile: 50ms → <2ms (25x faster)
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Redis Client Singleton
// ─────────────────────────────────────────────────────────────────────────────

let redisInstance: Redis | null = null;

/**
 * Get Redis client instance (singleton pattern)
 * Uses environment variables: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */
export function getRedis(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[REDIS] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
    return null;
  }

  try {
    redisInstance = new Redis({
      url,
      token,
    });
    console.log('[REDIS] Client initialized');
    return redisInstance;
  } catch (error) {
    console.error('[REDIS] Failed to initialize:', error);
    return null;
  }
}

/**
 * Redis client - use this for direct access
 * Falls back to null if not configured (app works without Redis)
 */
export const redis = getRedis();

// ─────────────────────────────────────────────────────────────────────────────
// Key Prefixes (for organization)
// ─────────────────────────────────────────────────────────────────────────────

export const REDIS_KEYS = {
  // Token prices (most critical for trading)
  tokenPrice: (mint: string) => `price:${mint}`,
  tokenPrices: 'prices:all',

  // User data
  user: (walletOrId: string) => `user:${walletOrId}`,
  userByWallet: (wallet: string) => `user:wallet:${wallet}`,

  // Leaderboard (Redis Sorted Sets)
  leaderboard: (timeframe: string, metric: string) => `leaderboard:${timeframe}:${metric}`,

  // Trending
  trendingTokens: 'trending:tokens',
  hotTokens: 'hot:tokens',
  newTokens: 'new:tokens',

  // FOMO counters
  onlineCount: 'fomo:online',
  watchingToken: (mint: string) => `fomo:watching:${mint}`,
  tradingCount: 'fomo:trading',

  // API response cache
  apiCache: (endpoint: string, hash: string) => `api:${endpoint}:${hash}`,

  // Feed cache
  feedGlobal: (page: number) => `feed:global:${page}`,
  feedUser: (userId: string, page: number) => `feed:user:${userId}:${page}`,

  // Rate limiting
  rateLimit: (wallet: string, endpoint: string) => `ratelimit:${wallet}:${endpoint}`,

  // Session cache
  session: (sessionId: string) => `session:${sessionId}`,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// TTL Constants (in seconds)
// ─────────────────────────────────────────────────────────────────────────────

export const CACHE_TTL = {
  // Token prices - short TTL for accuracy
  tokenPriceActive: 5,      // 5 seconds for actively traded tokens
  tokenPriceInactive: 60,   // 60 seconds for inactive tokens
  tokenPriceBatch: 30,      // 30 seconds for batch price lookups

  // User data - moderate TTL
  userProfile: 300,         // 5 minutes
  userSession: 3600,        // 1 hour

  // Leaderboard - moderate TTL (refreshed by pg_cron)
  leaderboard: 300,         // 5 minutes

  // Trending - short TTL for freshness
  trending: 60,             // 1 minute
  hot: 120,                 // 2 minutes
  newTokens: 300,           // 5 minutes

  // Feed - short TTL
  feed: 30,                 // 30 seconds

  // API responses - varies by endpoint
  apiSearch: 60,            // 1 minute for search
  apiExplore: 30,           // 30 seconds for explore
  apiStats: 15,             // 15 seconds for platform stats

  // FOMO counters - very short TTL (auto-expire)
  fomoCounter: 60,          // 1 minute
  fomoPresence: 30,         // 30 seconds
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface CachedTokenPrice {
  mint: string;
  priceSol: number;
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  updatedAt: number;
}

export interface CachedUser {
  id: string;
  walletAddress: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  successTier: string;
  twitterVerified: boolean;
  creatorCoinEnabled: boolean;
  updatedAt: number;
}

export interface LeaderboardEntry {
  wallet: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  rank: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if Redis is available and working
 */
export async function isRedisHealthy(): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

/**
 * Get Redis stats for monitoring
 */
export async function getRedisStats(): Promise<{
  connected: boolean;
  latencyMs: number;
} | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const start = Date.now();
    await client.ping();
    const latencyMs = Date.now() - start;

    return {
      connected: true,
      latencyMs,
    };
  } catch {
    return {
      connected: false,
      latencyMs: -1,
    };
  }
}
