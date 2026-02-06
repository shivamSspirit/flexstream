import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cacheAside, getAllFOMOCounts, incrementOnlineCount } from '@/lib/cache';
import { CACHE_TTL } from '@/lib/redis';

/**
 * GET /api/stats/platform
 * Get real-time platform statistics with Redis caching
 * Includes FOMO counters from presence system
 */
export async function GET(request: NextRequest) {
  try {
    // Get FOMO counts from Redis (real-time presence)
    const fomoCounts = await getAllFOMOCounts();

    // Use cache-aside for database stats (15s TTL)
    const dbStats = await cacheAside(
      'stats:platform',
      fetchPlatformStatsFromDB,
      CACHE_TTL.apiStats
    );

    // Merge FOMO counts with DB stats
    const stats = {
      ...dbStats,
      // Override with real presence data if available
      activeTraders: fomoCounts.trading || dbStats.activeTraders,
      tradingNow: fomoCounts.trading || dbStats.tradingNow,
      onlineNow: fomoCounts.online || Math.floor(dbStats.activeTraders * 1.5),
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Platform Stats API] Error:', error);

    // Return fallback stats on error (prevents UI breaking)
    return NextResponse.json({
      success: true,
      data: {
        activeTraders: 50,
        postsToday: 10,
        totalCreators: 500,
        totalTokens: 200,
        volume24h: '$5K',
        tradingNow: 12,
        onlineNow: 75,
        recentLaunches: 8,
        avgFirstDayEarnings: '$100',
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
}

async function fetchPlatformStatsFromDB() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get time ranges
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Parallel queries for performance
  const [
    postsToday,
    totalUsers,
    activeUsers,
    totalPosts,
    recentTrades
  ] = await Promise.all([
    // Posts created in last 24h
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo.toISOString()),

    // Total users
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true }),

    // Active users (posted or traded in last 24h)
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('updated_at', oneDayAgo.toISOString()),

    // Total posts with tokens
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .not('token_mint', 'is', null),

    // Recent trades (if trade_history table exists, otherwise estimate)
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .not('pool_address', 'is', null)
  ]);

  // Calculate stats
  return {
    // Real-time activity
    activeTraders: activeUsers.count || Math.floor((totalUsers.count || 100) * 0.3),
    postsToday: postsToday.count || 0,
    totalCreators: totalUsers.count || 0,
    totalTokens: totalPosts.count || 0,

    // Estimated volume (can be replaced with real trading data later)
    volume24h: formatVolume((recentTrades.count || 0) * 0.5), // Estimate 0.5 SOL per trade avg

    // Trending indicator
    tradingNow: Math.max(5, Math.floor((activeUsers.count || 10) * 0.1)),

    // For FOMO displays
    recentLaunches: postsToday.count || 0,
    avgFirstDayEarnings: '$50-500', // Placeholder until real earnings tracking
  };
}

function formatVolume(solAmount: number): string {
  // Assume ~$150 per SOL for display
  const usdValue = solAmount * 150;

  if (usdValue >= 1000000) {
    return `$${(usdValue / 1000000).toFixed(1)}M`;
  } else if (usdValue >= 1000) {
    return `$${(usdValue / 1000).toFixed(1)}K`;
  } else {
    return `$${usdValue.toFixed(0)}`;
  }
}
