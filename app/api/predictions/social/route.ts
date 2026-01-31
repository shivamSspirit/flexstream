/**
 * Social Proof API
 *
 * Real-time social signals for prediction markets
 *
 * Features:
 * - Friends betting on markets
 * - Recent activity feed
 * - Prediction follows
 * - Friend activity notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET - Get social proof for a market or user's activity feed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketTicker = searchParams.get('marketTicker');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'market' | 'feed' | 'friends'

    // Get friends betting on a specific market
    if (type === 'market' && marketTicker) {
      // First get user's friends (following/followers)
      let friendIds: string[] = [];

      if (userId) {
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);

        friendIds = following?.map(f => f.following_id) || [];
      }

      // Get predictions on this market
      const { data: predictions, error } = await supabase
        .from('predictions')
        .select(`
          user_id,
          position,
          amount_usdc,
          created_at,
          user:users(id, username, avatar_url)
        `)
        .eq('market_ticker', marketTicker)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Social proof error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch social proof' },
          { status: 500 }
        );
      }

      // Helper to extract user info from Supabase join (returns array)
      const getUserInfo = (p: { user?: { username?: string; avatar_url?: string } | { username?: string; avatar_url?: string }[] }) => {
        const user = Array.isArray(p.user) ? p.user[0] : p.user;
        return user;
      };

      // Separate friends from others
      const friendsBettingYes = predictions
        ?.filter(p => p.position === 'yes' && friendIds.includes(p.user_id))
        .map(p => {
          const user = getUserInfo(p);
          return {
            userId: p.user_id,
            username: user?.username || 'Anonymous',
            avatarUrl: user?.avatar_url,
            amount: p.amount_usdc,
          };
        }) || [];

      const friendsBettingNo = predictions
        ?.filter(p => p.position === 'no' && friendIds.includes(p.user_id))
        .map(p => {
          const user = getUserInfo(p);
          return {
            userId: p.user_id,
            username: user?.username || 'Anonymous',
            avatarUrl: user?.avatar_url,
            amount: p.amount_usdc,
          };
        }) || [];

      const totalYes = predictions?.filter(p => p.position === 'yes').length || 0;
      const totalNo = predictions?.filter(p => p.position === 'no').length || 0;

      return NextResponse.json({
        friends: {
          yes: friendsBettingYes,
          no: friendsBettingNo,
        },
        totals: {
          yes: totalYes,
          no: totalNo,
          total: predictions?.length || 0,
        },
        hasActivity: (predictions?.length || 0) > 0,
      });
    }

    // Get user's activity feed (friends' predictions)
    if (type === 'feed' && userId) {
      // Get user's friends
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const friendIds = following?.map(f => f.following_id) || [];

      if (!friendIds.length) {
        return NextResponse.json({ activity: [], hasMore: false });
      }

      // Get recent activity from friends
      const { data: activity, error } = await supabase
        .from('prediction_activity')
        .select(`
          *,
          user:users(id, username, avatar_url)
        `)
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Activity feed error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch activity feed' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        activity: activity?.map(a => ({
          id: a.id,
          type: a.activity_type,
          userId: a.user_id,
          username: a.user?.username || 'Anonymous',
          avatarUrl: a.user?.avatar_url,
          marketTicker: a.market_ticker,
          metadata: a.metadata,
          createdAt: a.created_at,
        })) || [],
        hasMore: (activity?.length || 0) >= 50,
      });
    }

    // Get friends who are active predictors
    if (type === 'friends' && userId) {
      // Get user's friends
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const friendIds = following?.map(f => f.following_id) || [];

      if (!friendIds.length) {
        return NextResponse.json({ friends: [] });
      }

      // Get friends with prediction activity
      const { data: friends, error } = await supabase
        .from('flex_scores')
        .select(`
          *,
          user:users(id, username, avatar_url)
        `)
        .in('user_id', friendIds)
        .gt('total_predictions', 0)
        .order('flex_score', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Friends fetch error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch friends' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        friends: friends?.map(f => ({
          userId: f.user_id,
          username: f.user?.username || 'Anonymous',
          avatarUrl: f.user?.avatar_url,
          flexScore: f.flex_score,
          tier: f.tier,
          totalPredictions: f.total_predictions,
          winRate: f.total_predictions > 0
            ? Math.round((f.correct_predictions / f.total_predictions) * 100)
            : 0,
          currentStreak: f.current_streak,
        })) || [],
      });
    }

    return NextResponse.json(
      { error: 'Invalid request. Specify type and required parameters.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Social API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social data' },
      { status: 500 }
    );
  }
}

/**
 * POST - Follow/unfollow a user's predictions or log activity
 */
export async function POST(request: NextRequest) {
  try {
    const { action, userId, targetUserId, marketTicker, activityType, metadata } = await request.json();

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'action and userId required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'follow': {
        if (!targetUserId) {
          return NextResponse.json(
            { error: 'targetUserId required' },
            { status: 400 }
          );
        }

        // Check if already following
        const { data: existing } = await supabase
          .from('prediction_follows')
          .select('id')
          .eq('follower_id', userId)
          .eq('following_id', targetUserId)
          .single();

        if (existing) {
          return NextResponse.json(
            { error: 'Already following' },
            { status: 400 }
          );
        }

        await supabase.from('prediction_follows').insert({
          follower_id: userId,
          following_id: targetUserId,
        });

        // Notify the user
        const { data: follower } = await supabase
          .from('users')
          .select('username')
          .eq('id', userId)
          .single();

        await supabase.from('notifications').insert({
          user_id: targetUserId,
          type: 'prediction_follow',
          title: 'New Prediction Follower',
          message: `@${follower?.username || 'Someone'} is now following your predictions`,
          data: { followerId: userId },
        });

        return NextResponse.json({ success: true });
      }

      case 'unfollow': {
        if (!targetUserId) {
          return NextResponse.json(
            { error: 'targetUserId required' },
            { status: 400 }
          );
        }

        await supabase
          .from('prediction_follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', targetUserId);

        return NextResponse.json({ success: true });
      }

      case 'log_activity': {
        if (!activityType) {
          return NextResponse.json(
            { error: 'activityType required' },
            { status: 400 }
          );
        }

        await supabase.from('prediction_activity').insert({
          user_id: userId,
          activity_type: activityType,
          market_ticker: marketTicker,
          metadata,
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Social POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
