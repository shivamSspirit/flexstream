import { getRedis, REDIS_KEYS, CACHE_TTL } from './redis';
import type { CachedTokenPrice, CachedUser, LeaderboardEntry } from './redis';

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
// High-level caching functions with cache-aside pattern
// Falls back to fetcher function if Redis unavailable or cache miss
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Generic Cache-Aside Pattern
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generic cache-aside: Get from cache or fetch and cache
 */
export async function cacheAside<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const redis = getRedis();

  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    } catch (error) {
      console.warn(`[CACHE] Read error for ${key}:`, error);
    }
  }

  // Cache miss - fetch from source
  const data = await fetcher();

  // Store in cache (fire and forget)
  if (redis && data !== null && data !== undefined) {
    redis.set(key, data, { ex: ttlSeconds }).catch((error) => {
      console.warn(`[CACHE] Write error for ${key}:`, error);
    });
  }

  return data;
}

/**
 * Invalidate cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.warn(`[CACHE] Delete error for ${key}:`, error);
  }
}

/**
 * Invalidate multiple cache keys by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn(`[CACHE] Pattern delete error for ${pattern}:`, error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN PRICE CACHE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get cached token price
 */
export async function getCachedTokenPrice(
  mint: string
): Promise<CachedTokenPrice | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    return await redis.get<CachedTokenPrice>(REDIS_KEYS.tokenPrice(mint));
  } catch {
    return null;
  }
}

/**
 * Set token price in cache
 */
export async function setCachedTokenPrice(
  price: CachedTokenPrice,
  isActive = true
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const ttl = isActive ? CACHE_TTL.tokenPriceActive : CACHE_TTL.tokenPriceInactive;

  try {
    await redis.set(REDIS_KEYS.tokenPrice(price.mint), price, { ex: ttl });
  } catch (error) {
    console.warn(`[CACHE] Token price write error:`, error);
  }
}

/**
 * Get multiple token prices at once (batch)
 */
export async function getCachedTokenPrices(
  mints: string[]
): Promise<Map<string, CachedTokenPrice>> {
  const redis = getRedis();
  const result = new Map<string, CachedTokenPrice>();

  if (!redis || mints.length === 0) return result;

  try {
    const keys = mints.map((mint) => REDIS_KEYS.tokenPrice(mint));
    const values = await redis.mget<CachedTokenPrice[]>(...keys);

    values.forEach((value, index) => {
      if (value) {
        result.set(mints[index], value);
      }
    });
  } catch (error) {
    console.warn('[CACHE] Batch token price read error:', error);
  }

  return result;
}

/**
 * Set multiple token prices at once (batch)
 */
export async function setCachedTokenPrices(
  prices: CachedTokenPrice[]
): Promise<void> {
  const redis = getRedis();
  if (!redis || prices.length === 0) return;

  try {
    const pipeline = redis.pipeline();

    for (const price of prices) {
      pipeline.set(
        REDIS_KEYS.tokenPrice(price.mint),
        price,
        { ex: CACHE_TTL.tokenPriceBatch }
      );
    }

    await pipeline.exec();
  } catch (error) {
    console.warn('[CACHE] Batch token price write error:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER PROFILE CACHE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get cached user profile
 * Checks both user:id and user:wallet:address keys
 */
export async function getCachedUser(
  walletOrId: string
): Promise<CachedUser | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    // Try user:id first (for ID lookups)
    let cached = await redis.get<CachedUser>(REDIS_KEYS.user(walletOrId));
    if (cached) return cached;

    // Try user:wallet:address (for wallet lookups)
    cached = await redis.get<CachedUser>(REDIS_KEYS.userByWallet(walletOrId));
    return cached;
  } catch {
    return null;
  }
}

/**
 * Set user profile in cache (indexed by both id and wallet)
 */
export async function setCachedUser(user: CachedUser): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const pipeline = redis.pipeline();

    // Cache by ID
    pipeline.set(REDIS_KEYS.user(user.id), user, { ex: CACHE_TTL.userProfile });

    // Cache by wallet address
    pipeline.set(
      REDIS_KEYS.userByWallet(user.walletAddress),
      user,
      { ex: CACHE_TTL.userProfile }
    );

    await pipeline.exec();
  } catch (error) {
    console.warn('[CACHE] User profile write error:', error);
  }
}

/**
 * Invalidate user cache (call after profile update)
 */
export async function invalidateUserCache(
  userId: string,
  walletAddress: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(
      REDIS_KEYS.user(userId),
      REDIS_KEYS.userByWallet(walletAddress)
    );
  } catch (error) {
    console.warn('[CACHE] User cache invalidation error:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD CACHE (Redis Sorted Sets)
// ─────────────────────────────────────────────────────────────────────────────

type TimeFrame = '24h' | '7d' | '30d' | 'all';
type LeaderboardMetric = 'volume' | 'profit' | 'roi' | 'trades';

/**
 * Get leaderboard from cache
 */
export async function getCachedLeaderboard(
  timeframe: TimeFrame,
  metric: LeaderboardMetric,
  limit = 100
): Promise<LeaderboardEntry[]> {
  const redis = getRedis();
  if (!redis) return [];

  const key = REDIS_KEYS.leaderboard(timeframe, metric);

  try {
    // Get top N from sorted set (descending order)
    const results = await redis.zrange<string[]>(key, 0, limit - 1, {
      rev: true,
      withScores: true,
    });

    // Parse results (alternating: member, score, member, score...)
    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < results.length; i += 2) {
      const data = JSON.parse(results[i]) as Omit<LeaderboardEntry, 'rank' | 'score'>;
      const score = parseFloat(results[i + 1]);
      entries.push({
        ...data,
        score,
        rank: Math.floor(i / 2) + 1,
      });
    }

    return entries;
  } catch (error) {
    console.warn('[CACHE] Leaderboard read error:', error);
    return [];
  }
}

/**
 * Update leaderboard cache (called by pg_cron or API)
 */
export async function updateLeaderboardCache(
  timeframe: TimeFrame,
  metric: LeaderboardMetric,
  entries: Array<{
    wallet: string;
    username: string;
    avatarUrl: string | null;
    score: number;
  }>
): Promise<void> {
  const redis = getRedis();
  if (!redis || entries.length === 0) return;

  const key = REDIS_KEYS.leaderboard(timeframe, metric);

  try {
    // Clear existing leaderboard
    await redis.del(key);

    // Add all entries to sorted set
    const pipeline = redis.pipeline();

    for (const entry of entries) {
      const member = JSON.stringify({
        wallet: entry.wallet,
        username: entry.username,
        avatarUrl: entry.avatarUrl,
      });
      pipeline.zadd(key, { score: entry.score, member });
    }

    // Set expiry on the sorted set
    pipeline.expire(key, CACHE_TTL.leaderboard);

    await pipeline.exec();
  } catch (error) {
    console.warn('[CACHE] Leaderboard write error:', error);
  }
}

/**
 * Get user's rank on leaderboard
 */
export async function getUserLeaderboardRank(
  timeframe: TimeFrame,
  metric: LeaderboardMetric,
  wallet: string
): Promise<{ rank: number; score: number } | null> {
  const redis = getRedis();
  if (!redis) return null;

  const key = REDIS_KEYS.leaderboard(timeframe, metric);

  try {
    // Find the user's entry and get rank
    const entries = await getCachedLeaderboard(timeframe, metric, 1000);
    const entry = entries.find((e) => e.wallet === wallet);

    if (entry) {
      return { rank: entry.rank, score: entry.score };
    }

    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRENDING CACHE
// ─────────────────────────────────────────────────────────────────────────────

interface TrendingToken {
  id: string;
  mintAddress: string;
  symbol: string;
  displayName: string;
  imageUri: string | null;
  isVerified: boolean;
  marketCap: number;
  priceSol: number;
  priceUsd: number;
  creatorUsername: string | null;
  creatorAvatar: string | null;
  trendingScore: number;
  trades1h: number;
  volume1hSol: number;
}

/**
 * Get cached trending tokens
 */
export async function getCachedTrending(): Promise<TrendingToken[]> {
  const redis = getRedis();
  if (!redis) return [];

  try {
    const cached = await redis.get<TrendingToken[]>(REDIS_KEYS.trendingTokens);
    return cached || [];
  } catch {
    return [];
  }
}

/**
 * Set trending tokens cache
 */
export async function setCachedTrending(tokens: TrendingToken[]): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(REDIS_KEYS.trendingTokens, tokens, { ex: CACHE_TTL.trending });
  } catch (error) {
    console.warn('[CACHE] Trending write error:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FOMO COUNTERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Increment online user count
 */
export async function incrementOnlineCount(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const count = await redis.incr(REDIS_KEYS.onlineCount);
    await redis.expire(REDIS_KEYS.onlineCount, CACHE_TTL.fomoCounter);
    return count;
  } catch {
    return 0;
  }
}

/**
 * Decrement online user count
 */
export async function decrementOnlineCount(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const count = await redis.decr(REDIS_KEYS.onlineCount);
    return Math.max(0, count);
  } catch {
    return 0;
  }
}

/**
 * Get online user count
 */
export async function getOnlineCount(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const count = await redis.get<number>(REDIS_KEYS.onlineCount);
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Increment token watchers count
 */
export async function incrementWatchingCount(mint: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const key = REDIS_KEYS.watchingToken(mint);
    const count = await redis.incr(key);
    await redis.expire(key, CACHE_TTL.fomoPresence);
    return count;
  } catch {
    return 0;
  }
}

/**
 * Decrement token watchers count
 */
export async function decrementWatchingCount(mint: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const key = REDIS_KEYS.watchingToken(mint);
    const count = await redis.decr(key);
    return Math.max(0, count);
  } catch {
    return 0;
  }
}

/**
 * Get token watchers count
 */
export async function getWatchingCount(mint: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const count = await redis.get<number>(REDIS_KEYS.watchingToken(mint));
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Increment active traders count
 */
export async function incrementTradingCount(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const count = await redis.incr(REDIS_KEYS.tradingCount);
    await redis.expire(REDIS_KEYS.tradingCount, CACHE_TTL.fomoCounter);
    return count;
  } catch {
    return 0;
  }
}

/**
 * Decrement active traders count
 */
export async function decrementTradingCount(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const count = await redis.decr(REDIS_KEYS.tradingCount);
    return Math.max(0, count);
  } catch {
    return 0;
  }
}

/**
 * Get active traders count
 */
export async function getTradingCount(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const count = await redis.get<number>(REDIS_KEYS.tradingCount);
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Get all FOMO counts at once
 */
export async function getAllFOMOCounts(): Promise<{
  online: number;
  trading: number;
}> {
  const redis = getRedis();
  if (!redis) return { online: 0, trading: 0 };

  try {
    const [online, trading] = await redis.mget<[number, number]>(
      REDIS_KEYS.onlineCount,
      REDIS_KEYS.tradingCount
    );

    return {
      online: online || 0,
      trading: trading || 0,
    };
  } catch {
    return { online: 0, trading: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE CACHE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cache API response
 */
export async function cacheApiResponse<T>(
  endpoint: string,
  params: Record<string, unknown>,
  data: T,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  // Create hash of params for cache key
  const hash = Buffer.from(JSON.stringify(params)).toString('base64').slice(0, 20);
  const key = REDIS_KEYS.apiCache(endpoint, hash);

  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch (error) {
    console.warn('[CACHE] API response write error:', error);
  }
}

/**
 * Get cached API response
 */
export async function getCachedApiResponse<T>(
  endpoint: string,
  params: Record<string, unknown>
): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  const hash = Buffer.from(JSON.stringify(params)).toString('base64').slice(0, 20);
  const key = REDIS_KEYS.apiCache(endpoint, hash);

  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}
