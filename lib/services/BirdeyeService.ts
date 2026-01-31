/**
 * Token Price Service
 * Fetches token prices from DexScreener
 * Uses rate limiting and caching for optimal performance
 */

import { dexscreenerRateLimiter } from './RateLimiter';
import { priceCache, CachedPrice } from './PriceCache';

const DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest/dex';

interface DexScreenerPair {
  priceUsd: string;
  liquidity?: {
    usd: number;
  };
  volume?: {
    h24: number;
  };
  priceChange?: {
    h24: number;
  };
}

export class BirdeyeService {
  constructor() {
    // No API key needed for DexScreener
  }

  /**
   * Get price for a single token
   */
  async getPrice(mint: string): Promise<CachedPrice | null> {
    // Check cache first
    const cached = await priceCache.get(mint);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const prices = await this.getPrices([mint]);
    return prices.get(mint) || null;
  }

  /**
   * Get prices for multiple tokens
   * Automatically batches requests and uses cache
   */
  async getPrices(mints: string[]): Promise<Map<string, CachedPrice>> {
    if (mints.length === 0) {
      return new Map();
    }

    // Check cache for all tokens
    const cached = await priceCache.getMany(mints);
    const uncachedMints = mints.filter(mint => !cached.has(mint));

    // If all cached, return immediately
    if (uncachedMints.length === 0) {
      return cached;
    }

    // Fetch uncached prices
    try {
      const freshPricesWithoutTimestamp = await this.fetchPrices(uncachedMints);

      // Add timestamp to fresh prices
      const freshPrices = new Map<string, CachedPrice>();
      const now = Date.now();
      freshPricesWithoutTimestamp.forEach((value, key) => {
        freshPrices.set(key, { ...value, timestamp: now } as CachedPrice);
      });

      // Store in cache
      await priceCache.setMany(freshPrices);

      // Merge cached and fresh
      const allPrices = new Map<string, CachedPrice>();
      cached.forEach((value, key) => allPrices.set(key, value));
      freshPrices.forEach((value, key) => allPrices.set(key, value));
      return allPrices;
    } catch (error) {
      console.error('Failed to fetch prices:', error);

      // Return whatever we have from cache
      return cached;
    }
  }

  /**
   * Fetch prices from DexScreener API (rate-limited)
   */
  private async fetchPrices(mints: string[]): Promise<Map<string, Omit<CachedPrice, 'timestamp'>>> {
    const prices = new Map<string, Omit<CachedPrice, 'timestamp'>>();

    // DexScreener supports batching
    const batchSize = 30;
    const batches = this.chunkArray(mints, batchSize);

    for (const batch of batches) {
      try {
        const dexPrices = await this.fetchFromDexScreener(batch);
        dexPrices.forEach((price, mint) => prices.set(mint, price));
      } catch (error) {
        console.warn(`Failed to fetch batch from DexScreener:`, error);
      }
    }

    return prices;
  }

  /**
   * Fetch from DexScreener API (fallback)
   */
  private async fetchFromDexScreener(mints: string[]): Promise<Map<string, Omit<CachedPrice, 'timestamp'>>> {
    const prices = new Map<string, Omit<CachedPrice, 'timestamp'>>();

    // DexScreener has 5 RPS limit, so we can be more aggressive
    await dexscreenerRateLimiter.schedule(async () => {
      // DexScreener requires individual token lookups or searching by address
      const addresses = mints.join(',');
      const url = `${DEXSCREENER_API_URL}/tokens/${addresses}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.pairs && Array.isArray(data.pairs)) {
        // Group pairs by token address
        const pairsByToken = new Map<string, DexScreenerPair[]>();

        data.pairs.forEach((pair: any) => {
          const baseToken = pair.baseToken?.address;
          if (baseToken && mints.includes(baseToken)) {
            if (!pairsByToken.has(baseToken)) {
              pairsByToken.set(baseToken, []);
            }
            pairsByToken.get(baseToken)!.push(pair);
          }
        });

        // Use the pair with highest liquidity for each token
        pairsByToken.forEach((pairs, mint) => {
          const bestPair = pairs.sort((a, b) =>
            (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
          )[0];

          prices.set(mint, {
            mint,
            value: parseFloat(bestPair.priceUsd) || 0,
            priceChange24h: bestPair.priceChange?.h24 || 0,
            liquidity: bestPair.liquidity?.usd || 0,
            updateUnixTime: Math.floor(Date.now() / 1000),
            source: 'dexscreener'
          });
        });
      }
    });

    return prices;
  }

  /**
   * Chunk array into smaller batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Prefetch prices for common tokens
   */
  async prefetchCommonTokens(): Promise<void> {
    const commonTokens = [
      'So11111111111111111111111111111111111111112', // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'  // USDT
    ];

    try {
      await this.getPrices(commonTokens);
    } catch (error) {
      console.warn('Failed to prefetch common tokens:', error);
    }
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    dexscreener: 'ok' | 'error';
    cache: 'ok' | 'error';
  }> {
    const status: {
      dexscreener: 'ok' | 'error';
      cache: 'ok' | 'error';
    } = {
      dexscreener: 'error',
      cache: 'ok'
    };

    // Test DexScreener
    try {
      await this.fetchFromDexScreener(['So11111111111111111111111111111111111111112']);
      status.dexscreener = 'ok';
    } catch {
      status.dexscreener = 'error';
    }

    // Test cache
    try {
      await priceCache.getStats();
      status.cache = 'ok';
    } catch {
      status.cache = 'error';
    }

    return status;
  }
}

// Singleton instance
export const birdeyeService = new BirdeyeService();
