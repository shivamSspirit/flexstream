import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/leaderboard/user/[wallet]
 * Get specific user's rank and stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { wallet: string } }
) {
  try {
    const walletAddress = params.wallet;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';

    console.log('[Leaderboard API] Fetching user rank:', walletAddress);

    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's leaderboard metrics
    const { data: userMetrics, error } = await supabase
      .from('leaderboard_metrics')
      .select(`
        *,
        users:user_id (
          username,
          display_name,
          avatar_url,
          verified_earnings,
          success_tier
        )
      `)
      .eq('wallet_address', walletAddress)
      .single();

    if (error || !userMetrics) {
      return NextResponse.json({
        success: false,
        error: 'User not found on leaderboard. User may not have any trading activity yet.'
      }, { status: 404 });
    }

    // Get rankings for different metrics
    const volumeRank = userMetrics[`rank_volume_${timeframe}` as keyof typeof userMetrics] || null;
    const profitRank = userMetrics[`rank_profit_${timeframe}` as keyof typeof userMetrics] || null;
    const roiRank = userMetrics[`rank_roi_${timeframe}` as keyof typeof userMetrics] || null;

    // Format response
    const response = {
      walletAddress: userMetrics.wallet_address,
      username: (userMetrics.users as any)?.username || 'Anonymous',
      displayName: (userMetrics.users as any)?.display_name || 'Trader',
      avatarUrl: (userMetrics.users as any)?.avatar_url,
      verifiedEarnings: (userMetrics.users as any)?.verified_earnings || 0,
      successTier: (userMetrics.users as any)?.success_tier || 'bronze',

      // Rankings
      rankings: {
        volume: volumeRank,
        profit: profitRank,
        roi: roiRank,
      },

      // Stats by timeframe
      stats: {
        '24h': {
          volume: userMetrics.volume_24h || 0,
          trades: userMetrics.trades_count_24h || 0,
          pnl: userMetrics.total_pnl_24h || 0,
          roi: userMetrics.roi_24h || 0,
          winRate: userMetrics.win_rate_24h || 0,
        },
        '7d': {
          volume: userMetrics.volume_7d || 0,
          trades: userMetrics.trades_count_7d || 0,
          pnl: userMetrics.total_pnl_7d || 0,
          roi: userMetrics.roi_7d || 0,
          winRate: userMetrics.win_rate_7d || 0,
        },
        '30d': {
          volume: userMetrics.volume_30d || 0,
          trades: userMetrics.trades_count_30d || 0,
          pnl: userMetrics.total_pnl_30d || 0,
          roi: userMetrics.roi_30d || 0,
          winRate: userMetrics.win_rate_30d || 0,
        },
        all_time: {
          volume: userMetrics.volume_all_time || 0,
          trades: userMetrics.trades_count_all_time || 0,
          pnl: userMetrics.total_pnl_all_time || 0,
          roi: userMetrics.roi_all_time || 0,
          winRate: userMetrics.win_rate_all_time || 0,
        },
      },

      // Additional stats
      averageTradeSize: userMetrics.average_trade_size || 0,
      largestWin: userMetrics.largest_win || 0,
      largestLoss: userMetrics.largest_loss || 0,
      currentStreak: userMetrics.current_streak || 0,
      bestStreak: userMetrics.best_streak || 0,
      worstStreak: userMetrics.worst_streak || 0,

      lastUpdated: userMetrics.last_calculated_at,
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('[Leaderboard API] Error fetching user rank:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user rank'
      },
      { status: 500 }
    );
  }
}
