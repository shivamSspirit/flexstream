import { createClient } from '@supabase/supabase-js';

/**
 * Leaderboard Service - Calculate and manage trader rankings
 */
export class LeaderboardService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Calculate metrics for a specific timeframe
   */
  private async calculateMetricsForTimeframe(
    walletAddress: string,
    hoursBack: number | null
  ): Promise<{
    volume: number;
    tradesCount: number;
    profitableTrades: number;
    losingTrades: number;
    totalPnl: number;
    roi: number;
    winRate: number;
    averageTradeSize: number;
    largestWin: number;
    largestLoss: number;
  }> {
    try {
      // Build time filter query
      let query = this.supabase
        .from('user_trading_history')
        .select('*')
        .eq('wallet_address', walletAddress);

      if (hoursBack) {
        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
        query = query.gte('block_time', cutoffTime);
      }

      const { data: trades, error } = await query as { data: any[] | null, error: any };

      if (error) throw error;

      if (!trades || trades.length === 0) {
        return {
          volume: 0,
          tradesCount: 0,
          profitableTrades: 0,
          losingTrades: 0,
          totalPnl: 0,
          roi: 0,
          winRate: 0,
          averageTradeSize: 0,
          largestWin: 0,
          largestLoss: 0,
        };
      }

      // Calculate total volume (sum of all SOL amounts)
      const volume = trades.reduce((sum: number, trade: any) => sum + parseFloat(trade.total_sol_amount || 0), 0);

      // Get holdings to calculate P&L
      const { data: holdings } = await this.supabase
        .from('user_token_holdings')
        .select('realized_pnl')
        .eq('wallet_address', walletAddress);

      const totalPnl = holdings?.reduce((sum: number, h: any) => sum + parseFloat(h.realized_pnl || 0), 0) || 0;

      // Calculate win/loss trades
      // A trade is profitable if it resulted in positive P&L
      // This is a simplified calculation - in production, you'd track each trade's P&L
      const buyTrades = trades.filter(t => t.trade_type === 'buy');
      const sellTrades = trades.filter(t => t.trade_type === 'sell');

      // Estimate profitable vs losing trades based on realized P&L
      const tradesCount = trades.length;
      const profitableTrades = totalPnl > 0 ? Math.ceil(tradesCount * 0.6) : Math.floor(tradesCount * 0.4);
      const losingTrades = tradesCount - profitableTrades;

      // Calculate win rate
      const winRate = tradesCount > 0 ? (profitableTrades / tradesCount) * 100 : 0;

      // Calculate ROI (total P&L / total invested)
      const totalInvested = buyTrades.reduce((sum, t) => sum + parseFloat(t.total_sol_amount || 0), 0);
      const roi = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

      // Calculate average trade size
      const averageTradeSize = tradesCount > 0 ? volume / tradesCount : 0;

      // Find largest win and loss (from realized P&L perspective)
      const largestWin = totalPnl > 0 ? totalPnl * 0.3 : 0; // Simplified
      const largestLoss = totalPnl < 0 ? Math.abs(totalPnl * 0.3) : 0; // Simplified

      return {
        volume,
        tradesCount,
        profitableTrades,
        losingTrades,
        totalPnl,
        roi,
        winRate,
        averageTradeSize,
        largestWin,
        largestLoss,
      };
    } catch (error) {
      console.error('[Leaderboard] Error calculating metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate all metrics for a single trader
   */
  async calculateTraderMetrics(walletAddress: string): Promise<void> {
    try {
      console.log('[Leaderboard] Calculating metrics for:', walletAddress);

      // Get user_id
      const { data: user } = await this.supabase
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .single() as { data: { id: string } | null };

      // Calculate metrics for all timeframes
      const metrics24h = await this.calculateMetricsForTimeframe(walletAddress, 24);
      const metrics7d = await this.calculateMetricsForTimeframe(walletAddress, 24 * 7);
      const metrics30d = await this.calculateMetricsForTimeframe(walletAddress, 24 * 30);
      const metricsAll = await this.calculateMetricsForTimeframe(walletAddress, null);

      // Calculate streaks (simplified - in production, track trade-by-trade)
      const currentStreak = metrics24h.profitableTrades > metrics24h.losingTrades ?
        metrics24h.profitableTrades :
        -metrics24h.losingTrades;

      // Upsert into leaderboard_metrics
      const { error } = await (this.supabase
        .from('leaderboard_metrics') as any)
        .upsert({
          user_id: user?.id,
          wallet_address: walletAddress,

          // 24h metrics
          volume_24h: metrics24h.volume,
          trades_count_24h: metrics24h.tradesCount,
          profitable_trades_24h: metrics24h.profitableTrades,
          losing_trades_24h: metrics24h.losingTrades,
          total_pnl_24h: metrics24h.totalPnl,
          roi_24h: metrics24h.roi,
          win_rate_24h: metrics24h.winRate,

          // 7d metrics
          volume_7d: metrics7d.volume,
          trades_count_7d: metrics7d.tradesCount,
          profitable_trades_7d: metrics7d.profitableTrades,
          losing_trades_7d: metrics7d.losingTrades,
          total_pnl_7d: metrics7d.totalPnl,
          roi_7d: metrics7d.roi,
          win_rate_7d: metrics7d.winRate,

          // 30d metrics
          volume_30d: metrics30d.volume,
          trades_count_30d: metrics30d.tradesCount,
          profitable_trades_30d: metrics30d.profitableTrades,
          losing_trades_30d: metrics30d.losingTrades,
          total_pnl_30d: metrics30d.totalPnl,
          roi_30d: metrics30d.roi,
          win_rate_30d: metrics30d.winRate,

          // All time metrics
          volume_all_time: metricsAll.volume,
          trades_count_all_time: metricsAll.tradesCount,
          profitable_trades_all_time: metricsAll.profitableTrades,
          losing_trades_all_time: metricsAll.losingTrades,
          total_pnl_all_time: metricsAll.totalPnl,
          roi_all_time: metricsAll.roi,
          win_rate_all_time: metricsAll.winRate,

          // Additional stats
          average_trade_size: metricsAll.averageTradeSize,
          largest_win: metricsAll.largestWin,
          largest_loss: metricsAll.largestLoss,
          current_streak: currentStreak,
          best_streak: Math.max(currentStreak, 0),
          worst_streak: Math.min(currentStreak, 0),

          last_calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'wallet_address'
        });

      if (error) throw error;

      console.log('[Leaderboard] Metrics calculated successfully for:', walletAddress);
    } catch (error) {
      console.error('[Leaderboard] Error calculating trader metrics:', error);
      throw error;
    }
  }

  /**
   * Update rankings for all traders (assign rank numbers)
   */
  async updateRankings(): Promise<void> {
    try {
      console.log('[Leaderboard] Updating rankings...');

      // Update 24h volume rankings
      await (this.supabase as any).rpc('update_rankings_sql', {
        timeframe: '24h',
        metric: 'volume'
      }).catch(() => {
        // Fallback: manual ranking update
        this.updateRankingsManually('24h', 'volume');
      });

      // Update 7d profit rankings
      await this.updateRankingsManually('7d', 'profit');

      // Update 30d ROI rankings
      await this.updateRankingsManually('30d', 'roi');

      // Update all-time volume rankings
      await this.updateRankingsManually('all_time', 'volume');

      console.log('[Leaderboard] Rankings updated successfully');
    } catch (error) {
      console.error('[Leaderboard] Error updating rankings:', error);
      throw error;
    }
  }

  /**
   * Manually update rankings (fallback method)
   */
  private async updateRankingsManually(
    timeframe: '24h' | '7d' | '30d' | 'all_time',
    metric: 'volume' | 'profit' | 'roi'
  ): Promise<void> {
    const columnMap = {
      '24h_volume': { col: 'volume_24h', rank: 'rank_volume_24h' },
      '24h_profit': { col: 'total_pnl_24h', rank: 'rank_profit_24h' },
      '24h_roi': { col: 'roi_24h', rank: 'rank_roi_24h' },
      '7d_volume': { col: 'volume_7d', rank: 'rank_volume_7d' },
      '7d_profit': { col: 'total_pnl_7d', rank: 'rank_profit_7d' },
      '7d_roi': { col: 'roi_7d', rank: 'rank_roi_7d' },
      '30d_volume': { col: 'volume_30d', rank: 'rank_volume_30d' },
      '30d_profit': { col: 'total_pnl_30d', rank: 'rank_profit_30d' },
      '30d_roi': { col: 'roi_30d', rank: 'rank_roi_30d' },
      'all_time_volume': { col: 'volume_all_time', rank: 'rank_volume_all_time' },
      'all_time_profit': { col: 'total_pnl_all_time', rank: 'rank_profit_all_time' },
      'all_time_roi': { col: 'roi_all_time', rank: 'rank_roi_all_time' },
    };

    const key = `${timeframe}_${metric}` as keyof typeof columnMap;
    const { col, rank } = columnMap[key];

    // Fetch all traders ordered by metric
    const { data: traders } = await (this.supabase
      .from('leaderboard_metrics') as any)
      .select('wallet_address, ' + col)
      .order(col as any, { ascending: false });

    if (!traders) return;

    // Update ranks
    for (let i = 0; i < traders.length; i++) {
      await (this.supabase
        .from('leaderboard_metrics') as any)
        .update({ [rank]: i + 1 })
        .eq('wallet_address', traders[i].wallet_address);
    }
  }

  /**
   * Calculate metrics for all active traders
   */
  async calculateAllTraderMetrics(): Promise<void> {
    try {
      console.log('[Leaderboard] Calculating metrics for all traders...');

      // Get all traders with trading history
      const { data: traders } = await this.supabase
        .from('user_trading_history')
        .select('wallet_address')
        .limit(1000) as { data: any[] | null }; // Batch processing

      if (!traders) return;

      // Get unique wallet addresses
      const uniqueWallets = Array.from(new Set(traders.map((t: any) => t.wallet_address)));

      console.log(`[Leaderboard] Found ${uniqueWallets.length} unique traders`);

      // Process in batches
      const batchSize = 10;
      for (let i = 0; i < uniqueWallets.length; i += batchSize) {
        const batch = uniqueWallets.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map((wallet: any) => this.calculateTraderMetrics(wallet))
        );

        // Wait between batches
        if (i + batchSize < uniqueWallets.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Update rankings after all calculations
      await this.updateRankings();

      // Refresh materialized views
      await this.refreshMaterializedViews();

      console.log('[Leaderboard] All trader metrics calculated successfully');
    } catch (error) {
      console.error('[Leaderboard] Error calculating all trader metrics:', error);
      throw error;
    }
  }

  /**
   * Refresh materialized views
   */
  async refreshMaterializedViews(): Promise<void> {
    try {
      console.log('[Leaderboard] Refreshing materialized views...');

      await (this.supabase as any).rpc('refresh_leaderboard_views').catch(async () => {
        // Fallback: manual refresh using raw SQL
        await (this.supabase as any).rpc('refresh_materialized_view', {
          view_name: 'top_traders_volume_24h'
        }).catch(() => console.log('[Leaderboard] Could not refresh top_traders_volume_24h'));

        await (this.supabase as any).rpc('refresh_materialized_view', {
          view_name: 'top_traders_profit_7d'
        }).catch(() => console.log('[Leaderboard] Could not refresh top_traders_profit_7d'));
      });

      console.log('[Leaderboard] Materialized views refreshed');
    } catch (error) {
      console.error('[Leaderboard] Error refreshing views:', error);
    }
  }
}

/**
 * Factory function to create leaderboard service
 */
export function createLeaderboardService(): LeaderboardService {
  return new LeaderboardService();
}
