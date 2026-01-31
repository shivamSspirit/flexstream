import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { MeteoraDBCClient } from '../meteora-dbc';
import { DBC_CONFIG } from '../dbc-config';

/**
 * Service for tracking and updating token prices from Meteora DBC pools
 */
export class PriceTrackingService {
  private connection: Connection;
  private dbcClient: MeteoraDBCClient;
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.connection = new Connection(DBC_CONFIG.RPC_URL, 'confirmed');
    this.dbcClient = new MeteoraDBCClient(this.connection);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Update prices for a single token
   */
  async updateTokenPrice(poolAddress: string): Promise<void> {
    try {
      console.log('[Price Tracker] Updating price for pool:', poolAddress);

      const poolPubkey = new PublicKey(poolAddress);
      const poolInfo = await this.dbcClient.getPoolInfo(poolPubkey);

      // Update the tokens table with latest prices
      const { error } = await (this.supabase as any)
        .from('tokens')
        .update({
          price_usd: poolInfo.buyPrice,
          price_sol: poolInfo.buyPrice, // Assuming SOL-based pricing
          market_cap: poolInfo.marketCap,
          liquidity_sol: poolInfo.liquidity,
          updated_at: new Date().toISOString(),
        })
        .eq('pool_address', poolAddress);

      if (error) {
        console.error('[Price Tracker] Error updating token price:', error);
        throw error;
      }

      console.log('[Price Tracker] Price updated successfully:', {
        pool: poolAddress,
        price: poolInfo.buyPrice,
        marketCap: poolInfo.marketCap,
      });
    } catch (error) {
      console.error('[Price Tracker] Failed to update price for pool:', poolAddress, error);
      throw error;
    }
  }

  /**
   * Update prices for all active tokens
   */
  async updateAllTokenPrices(): Promise<void> {
    try {
      console.log('[Price Tracker] Fetching all tokens with pools...');

      // Get all tokens that have pool addresses
      const { data: tokens, error } = await (this.supabase as any)
        .from('tokens')
        .select('pool_address, symbol')
        .not('pool_address', 'is', null)
        .eq('is_tradable', true);

      if (error) {
        console.error('[Price Tracker] Error fetching tokens:', error);
        throw error;
      }

      if (!tokens || tokens.length === 0) {
        console.log('[Price Tracker] No tradable tokens found');
        return;
      }

      console.log(`[Price Tracker] Updating prices for ${tokens.length} tokens...`);

      // Update prices in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map((token: any) => this.updateTokenPrice(token.pool_address))
        );

        // Wait between batches to avoid overwhelming the RPC
        if (i + batchSize < tokens.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log('[Price Tracker] All prices updated successfully');
    } catch (error) {
      console.error('[Price Tracker] Failed to update all prices:', error);
      throw error;
    }
  }

  /**
   * Start continuous price tracking (call this from a cron job or background worker)
   */
  async startTracking(intervalMs: number = 60000): Promise<void> {
    console.log(`[Price Tracker] Starting continuous tracking (interval: ${intervalMs}ms)`);

    // Initial update
    await this.updateAllTokenPrices();

    // Set up interval for continuous updates
    setInterval(async () => {
      try {
        await this.updateAllTokenPrices();
      } catch (error) {
        console.error('[Price Tracker] Error in tracking interval:', error);
      }
    }, intervalMs);
  }
}

/**
 * Factory function to create a price tracking service instance
 */
export function createPriceTrackingService(): PriceTrackingService {
  return new PriceTrackingService();
}
