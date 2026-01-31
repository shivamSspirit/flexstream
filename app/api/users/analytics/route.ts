import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/analytics
 *
 * Fetches real-time analytics for a user's profile dashboard
 * Includes post stats, token metrics, trading data, and social verification status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('wallet');
    const period = searchParams.get('period') || '7d'; // 7d, 30d, all

    if (!userId && !walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'userId or wallet address is required',
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user by ID or wallet
    let userQuery = supabase.from('users').select('*');
    if (userId) {
      userQuery = userQuery.eq('id', userId);
    } else if (walletAddress) {
      userQuery = userQuery.eq('wallet_address', walletAddress);
    }

    const { data: user, error: userError } = await userQuery.single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Calculate date range
    let startDate: Date;
    switch (period) {
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default: // 7d
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Fetch posts stats
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, likes_count, comments_count, shares_count, token_mint, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    const totalPosts = posts?.length || 0;
    const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
    const totalComments = posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;
    const totalShares = posts?.reduce((sum, p) => sum + (p.shares_count || 0), 0) || 0;
    const tokensCreated = posts?.filter(p => p.token_mint).length || 0;

    // Fetch followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', user.id);

    // Fetch following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    // Fetch new followers in period
    const { count: newFollowers } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Fetch trading history
    const { data: trades } = await supabase
      .from('trading_history')
      .select('trade_type, amount_sol, amount_usd, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    const totalTrades = trades?.length || 0;
    const totalVolume = trades?.reduce((sum, t) => sum + (parseFloat(t.amount_sol) || 0), 0) || 0;
    const buyTrades = trades?.filter(t => t.trade_type === 'buy').length || 0;
    const sellTrades = trades?.filter(t => t.trade_type === 'sell').length || 0;

    // Fetch daily analytics for charts
    const { data: dailyAnalytics } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Social verification summary
    const socialVerification = {
      twitter: {
        verified: user.twitter_verified || false,
        username: user.twitter || null,
        followers: user.twitter_followers || 0,
        verifiedAt: user.twitter_verified_at,
      },
      youtube: {
        verified: user.youtube_verified || false,
        channelName: user.youtube_channel_name || null,
        subscribers: user.youtube_subscribers || 0,
        verifiedAt: user.youtube_verified_at,
      },
      tiktok: {
        verified: user.tiktok_verified || false,
        username: user.tiktok || null,
        followers: user.tiktok_followers || 0,
        verifiedAt: user.tiktok_verified_at,
      },
    };

    // Calculate trust score
    const trustScore = user.trust_score || calculateTrustScore(user, totalPosts > 0);

    // Calculate engagement rate
    const engagementRate = totalPosts > 0
      ? ((totalLikes + totalComments + totalShares) / totalPosts).toFixed(2)
      : '0';

    const analytics = {
      // Overview
      trustScore,
      successTier: user.success_tier || 'bronze',

      // Social
      socialVerification,
      totalSocialFollowers:
        (user.twitter_followers || 0) +
        (user.youtube_subscribers || 0) +
        (user.tiktok_followers || 0),

      // Followers
      followers: {
        total: followersCount || 0,
        following: followingCount || 0,
        newInPeriod: newFollowers || 0,
      },

      // Content
      content: {
        totalPosts,
        totalLikes,
        totalComments,
        totalShares,
        engagementRate: parseFloat(engagementRate),
        tokensCreated,
      },

      // Trading
      trading: {
        totalTrades,
        totalVolumeSol: totalVolume.toFixed(4),
        buyTrades,
        sellTrades,
        feesEarned: user.total_trading_fees_earned || 0,
      },

      // Charts data
      chartData: dailyAnalytics || [],

      // Period info
      period,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('[USER ANALYTICS] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics',
    }, { status: 500 });
  }
}

/**
 * Calculate trust score client-side fallback
 */
function calculateTrustScore(user: any, hasRecentActivity: boolean): number {
  let score = 0;

  // Social verification (20 points each)
  if (user.twitter_verified) score += 20;
  if (user.youtube_verified) score += 20;
  if (user.tiktok_verified) score += 20;

  // Follower bonuses (up to 15 points each)
  score += getFollowerBonus(user.twitter_followers || 0);
  score += getFollowerBonus(user.youtube_subscribers || 0);
  score += getFollowerBonus(user.tiktok_followers || 0);

  // Account age (10 points for 6+ months)
  const createdAt = new Date(user.created_at);
  const monthsOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsOld >= 6) score += 10;

  // Recent activity (10 points)
  if (hasRecentActivity) score += 10;

  // Trading volume (5 points)
  if (user.total_token_volume > 0) score += 5;

  return Math.min(score, 100);
}

function getFollowerBonus(count: number): number {
  if (count >= 100000) return 15;
  if (count >= 10000) return 10;
  if (count >= 1000) return 5;
  return 0;
}
