import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from './redis';

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════════
// Prevents spam, bot trading, and API abuse using sliding window algorithm
// Part of DB-FLEX-ARC-RECOMMENDED.md Phase 1 implementation
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiter Instances (different limits for different endpoints)
// ─────────────────────────────────────────────────────────────────────────────

let tradingRateLimiter: Ratelimit | null = null;
let postingRateLimiter: Ratelimit | null = null;
let apiGeneralRateLimiter: Ratelimit | null = null;
let authRateLimiter: Ratelimit | null = null;

/**
 * Get or create trading rate limiter
 * Limits: 10 trades per minute per wallet (prevents rapid bot trading)
 */
export function getTradingRateLimiter(): Ratelimit | null {
  if (tradingRateLimiter) return tradingRateLimiter;

  const redis = getRedis();
  if (!redis) return null;

  tradingRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
    prefix: 'ratelimit:trading',
  });

  return tradingRateLimiter;
}

/**
 * Get or create posting rate limiter
 * Limits: 5 posts per hour per user (prevents spam)
 */
export function getPostingRateLimiter(): Ratelimit | null {
  if (postingRateLimiter) return postingRateLimiter;

  const redis = getRedis();
  if (!redis) return null;

  postingRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 requests per hour
    analytics: true,
    prefix: 'ratelimit:posting',
  });

  return postingRateLimiter;
}

/**
 * Get or create general API rate limiter
 * Limits: 100 requests per minute per IP/wallet (general API protection)
 */
export function getApiRateLimiter(): Ratelimit | null {
  if (apiGeneralRateLimiter) return apiGeneralRateLimiter;

  const redis = getRedis();
  if (!redis) return null;

  apiGeneralRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
    prefix: 'ratelimit:api',
  });

  return apiGeneralRateLimiter;
}

/**
 * Get or create auth rate limiter
 * Limits: 10 auth attempts per minute per IP (prevents brute force)
 */
export function getAuthRateLimiter(): Ratelimit | null {
  if (authRateLimiter) return authRateLimiter;

  const redis = getRedis();
  if (!redis) return null;

  authRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
    prefix: 'ratelimit:auth',
  });

  return authRateLimiter;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limit Check Functions
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the rate limit resets
  retryAfter?: number; // Seconds until can retry (only if blocked)
}

/**
 * Check trading rate limit for a wallet
 */
export async function checkTradingRateLimit(
  walletAddress: string
): Promise<RateLimitResult> {
  const limiter = getTradingRateLimiter();

  if (!limiter) {
    // If Redis not available, allow the request
    return { success: true, limit: 10, remaining: 10, reset: Date.now() + 60000 };
  }

  try {
    const result = await limiter.limit(walletAddress);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.warn('[RATE LIMIT] Trading check error:', error);
    return { success: true, limit: 10, remaining: 10, reset: Date.now() + 60000 };
  }
}

/**
 * Check posting rate limit for a user
 */
export async function checkPostingRateLimit(
  userId: string
): Promise<RateLimitResult> {
  const limiter = getPostingRateLimiter();

  if (!limiter) {
    return { success: true, limit: 5, remaining: 5, reset: Date.now() + 3600000 };
  }

  try {
    const result = await limiter.limit(userId);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.warn('[RATE LIMIT] Posting check error:', error);
    return { success: true, limit: 5, remaining: 5, reset: Date.now() + 3600000 };
  }
}

/**
 * Check general API rate limit
 */
export async function checkApiRateLimit(
  identifier: string // IP address or wallet
): Promise<RateLimitResult> {
  const limiter = getApiRateLimiter();

  if (!limiter) {
    return { success: true, limit: 100, remaining: 100, reset: Date.now() + 60000 };
  }

  try {
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.warn('[RATE LIMIT] API check error:', error);
    return { success: true, limit: 100, remaining: 100, reset: Date.now() + 60000 };
  }
}

/**
 * Check auth rate limit
 */
export async function checkAuthRateLimit(
  ip: string
): Promise<RateLimitResult> {
  const limiter = getAuthRateLimiter();

  if (!limiter) {
    return { success: true, limit: 10, remaining: 10, reset: Date.now() + 60000 };
  }

  try {
    const result = await limiter.limit(ip);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.warn('[RATE LIMIT] Auth check error:', error);
    return { success: true, limit: 10, remaining: 10, reset: Date.now() + 60000 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
  };
}

/**
 * Create rate limited response (429 Too Many Requests)
 */
export function rateLimitedResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitHeaders(result),
      },
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rate limit middleware for API routes
 * Usage:
 *
 * const rateLimit = await withRateLimit(request, 'api');
 * if (!rateLimit.success) {
 *   return rateLimitedResponse(rateLimit);
 * }
 */
export async function withRateLimit(
  request: Request,
  type: 'trading' | 'posting' | 'api' | 'auth',
  identifier?: string
): Promise<RateLimitResult> {
  // Get identifier from request if not provided
  const id = identifier ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  switch (type) {
    case 'trading':
      return checkTradingRateLimit(id);
    case 'posting':
      return checkPostingRateLimit(id);
    case 'auth':
      return checkAuthRateLimit(id);
    case 'api':
    default:
      return checkApiRateLimit(id);
  }
}
