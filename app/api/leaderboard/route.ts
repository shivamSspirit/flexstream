import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/leaderboard
 * Fetch ranked traders with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const timeframe = searchParams.get('timeframe') || '7d'; // 24h, 7d, 30d, all_time
    const metric = searchParams.get('metric') || 'volume'; // volume, profit, roi
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('[Leaderboard API] Fetching leaderboard:', {
      timeframe,
      metric,
      limit,
      offset
    });

    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build column names based on timeframe and metric
    const columnMap: Record<string, string> = {
      '24h_volume': 'volume_24h',
      '24h_profit': 'total_pnl_24h',
      '24h_roi': 'roi_24h',
      '7d_volume': 'volume_7d',
      '7d_profit': 'total_pnl_7d',
      '7d_roi': 'roi_7d',
      '30d_volume': 'volume_30d',
      '30d_profit': 'total_pnl_30d',
      '30d_roi': 'roi_30d',
      'all_time_volume': 'volume_all_time',
      'all_time_profit': 'total_pnl_all_time',
      'all_time_roi': 'roi_all_time',
    };

    const key = `${timeframe}_${metric}`;
    const orderColumn = columnMap[key] || 'volume_7d';
    const rankColumn = `rank_${metric}_${timeframe}`;
    const tradesColumn = `trades_count_${timeframe}`;
    const winRateColumn = `win_rate_${timeframe}`;

    // Fetch leaderboard data with user info
    const { data, error } = await supabase
      .from('leaderboard_metrics')
      .select(`
        wallet_address,
        ${orderColumn},
        ${rankColumn},
        ${tradesColumn},
        ${winRateColumn},
        average_trade_size,
        current_streak,
        last_calculated_at,
        users:user_id (
          username,
          display_name,
          avatar_url,
          verified_earnings,
          success_tier
        )
      `)
      .order(orderColumn as any, { ascending: false })
      .gt(orderColumn as any, 0) // Only show traders with activity
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Leaderboard API] Database error:', error);
      throw error;
    }

    // Format response
    const leaderboard = data?.map((trader: any, index: number) => ({
      rank: offset + index + 1,
      walletAddress: trader.wallet_address || '',
      username: trader.users?.username || 'Anonymous',
      displayName: trader.users?.display_name || 'Trader',
      avatarUrl: trader.users?.avatar_url,
      verifiedEarnings: trader.users?.verified_earnings || 0,
      successTier: trader.users?.success_tier || 'bronze',

      // Metrics
      metricValue: trader[orderColumn] || 0,
      tradesCount: trader[tradesColumn] || 0,
      winRate: trader[winRateColumn] || 0,
      averageTradeSize: trader.average_trade_size || 0,
      currentStreak: trader.current_streak || 0,
      lastUpdated: trader.last_calculated_at,
    })) || [];

    console.log(`[Leaderboard API] Returning ${leaderboard.length} traders`);

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        metric,
        leaderboard,
        pagination: {
          limit,
          offset,
          hasMore: leaderboard.length === limit,
        }
      }
    });

  } catch (error) {
    console.error('[Leaderboard API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboard'
      },
      { status: 500 }
    );
  }
}
