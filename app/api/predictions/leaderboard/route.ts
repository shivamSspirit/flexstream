/**
 * Prediction Leaderboard API
 *
 * Top predictors ranking with time-based filters
 *
 * Features:
 * - Global rankings by Flex Score
 * - Daily/Weekly/Monthly/All-time filters
 * - Win streak highlights
 * - Category-specific rankings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTierFromScore } from '@/lib/services/flex-score-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeFrame = searchParams.get('timeFrame') || 'all-time';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('userId'); // To find user's position
    const category = searchParams.get('category');

    // For all-time, use flex_scores directly
    if (timeFrame === 'all-time' && !category) {
      const { data, error } = await supabase
        .from('flex_scores')
        .select(`
          *,
          user:users!flex_scores_user_id_fkey(
            id,
            username,
            avatar_url
          )
        `)
        .order('flex_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Leaderboard error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch leaderboard' },
          { status: 500 }
        );
      }

      const leaderboard = data.map((row, index) => ({
        rank: offset + index + 1,
        userId: row.user_id,
        username: row.user?.username || 'Anonymous',
        avatarUrl: row.user?.avatar_url,
        flexScore: row.flex_score,
        tier: getTierFromScore(row.flex_score),
        totalPredictions: row.total_predictions,
        correctPredictions: row.correct_predictions,
        winRate: row.total_predictions > 0
          ? Math.round((row.correct_predictions / row.total_predictions) * 1000) / 10
          : 0,
        currentStreak: row.current_streak,
        longestStreak: row.longest_streak,
        totalProfit: parseFloat(row.total_profit) || 0,
        // Rank change (would need historical data to calculate properly)
        rankChange: 0,
      }));

      // Get total count for pagination
      const { count } = await supabase
        .from('flex_scores')
        .select('*', { count: 'exact', head: true });

      // Get user's position if requested
      let userPosition = null;
      if (userId) {
        const { data: allScores } = await supabase
          .from('flex_scores')
          .select('user_id, flex_score')
          .order('flex_score', { ascending: false });

        if (allScores) {
          const position = allScores.findIndex(s => s.user_id === userId);
          if (position >= 0) {
            const userScore = allScores[position];
            const { data: userDetails } = await supabase
              .from('flex_scores')
              .select(`
                *,
                user:users!flex_scores_user_id_fkey(username, avatar_url)
              `)
              .eq('user_id', userId)
              .single();

            userPosition = {
              rank: position + 1,
              userId,
              username: userDetails?.user?.username || 'Anonymous',
              avatarUrl: userDetails?.user?.avatar_url,
              flexScore: userScore.flex_score,
              tier: getTierFromScore(userScore.flex_score),
              totalPredictions: userDetails?.total_predictions || 0,
              winRate: userDetails?.total_predictions > 0
                ? Math.round((userDetails.correct_predictions / userDetails.total_predictions) * 1000) / 10
                : 0,
              currentStreak: userDetails?.current_streak || 0,
            };
          }
        }
      }

      return NextResponse.json({
        leaderboard,
        pagination: {
          total: count || 0,
          offset,
          limit,
          hasMore: offset + limit < (count || 0),
        },
        userPosition,
        timeFrame,
      });
    }

    // For time-based filters, we need to aggregate from prediction_activity
    const timeFilters: Record<string, string> = {
      daily: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      weekly: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      monthly: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const sinceDate = timeFilters[timeFrame] || null;

    if (!sinceDate) {
      // Fall back to all-time for invalid timeframes
      return NextResponse.redirect(new URL(`${request.url}?timeFrame=all-time`, request.url));
    }

    // Get activity-based rankings
    // This counts score changes in the time period
    const { data: activityData, error: activityError } = await supabase
      .from('flex_score_history')
      .select(`
        user_id,
        change_amount
      `)
      .gte('created_at', sinceDate);

    if (activityError) {
      console.error('Activity fetch error:', activityError);
      return NextResponse.json(
        { error: 'Failed to fetch activity data' },
        { status: 500 }
      );
    }

    // Aggregate by user
    const userScoreChanges: Record<string, number> = {};
    for (const activity of activityData || []) {
      if (!userScoreChanges[activity.user_id]) {
        userScoreChanges[activity.user_id] = 0;
      }
      userScoreChanges[activity.user_id] += activity.change_amount;
    }

    // Sort by score change
    const sortedUsers = Object.entries(userScoreChanges)
      .sort(([, a], [, b]) => b - a)
      .slice(offset, offset + limit);

    // Get user details
    const userIds = sortedUsers.map(([id]) => id);

    const { data: userDetails } = await supabase
      .from('flex_scores')
      .select(`
        *,
        user:users!flex_scores_user_id_fkey(id, username, avatar_url)
      `)
      .in('user_id', userIds);

    const userDetailsMap = new Map(
      userDetails?.map(u => [u.user_id, u]) || []
    );

    const leaderboard = sortedUsers.map(([userId, scoreChange], index) => {
      const details = userDetailsMap.get(userId);
      return {
        rank: offset + index + 1,
        userId,
        username: details?.user?.username || 'Anonymous',
        avatarUrl: details?.user?.avatar_url,
        flexScore: details?.flex_score || 0,
        tier: getTierFromScore(details?.flex_score || 0),
        scoreChange,
        totalPredictions: details?.total_predictions || 0,
        winRate: details?.total_predictions > 0
          ? Math.round((details.correct_predictions / details.total_predictions) * 1000) / 10
          : 0,
        currentStreak: details?.current_streak || 0,
      };
    });

    return NextResponse.json({
      leaderboard,
      pagination: {
        total: Object.keys(userScoreChanges).length,
        offset,
        limit,
        hasMore: offset + limit < Object.keys(userScoreChanges).length,
      },
      timeFrame,
    });

  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

/**
 * POST - Get top predictors for a specific market
 */
export async function POST(request: NextRequest) {
  try {
    const { marketTicker, limit = 10 } = await request.json();

    if (!marketTicker) {
      return NextResponse.json(
        { error: 'marketTicker required' },
        { status: 400 }
      );
    }

    // Get top predictors who bet on this market
    const { data: predictions, error } = await supabase
      .from('predictions')
      .select(`
        user_id,
        position,
        amount_usdc,
        status,
        user:users(id, username, avatar_url),
        flex_score:flex_scores(flex_score, tier)
      `)
      .eq('market_ticker', marketTicker)
      .order('amount_usdc', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Market predictors error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch predictors' },
        { status: 500 }
      );
    }

    const topPredictors = predictions?.map(p => {
      // Supabase returns joins as arrays
      const userInfo = Array.isArray(p.user) ? p.user[0] : p.user;
      const flexInfo = Array.isArray(p.flex_score) ? p.flex_score[0] : p.flex_score;
      return {
        userId: p.user_id,
        username: userInfo?.username || 'Anonymous',
        avatarUrl: userInfo?.avatar_url,
        position: p.position,
        amount: p.amount_usdc,
        flexScore: flexInfo?.flex_score || 0,
        tier: flexInfo?.tier || 'initiate',
      };
    }) || [];

    // Count positions
    const yesCount = predictions?.filter(p => p.position === 'yes').length || 0;
    const noCount = predictions?.filter(p => p.position === 'no').length || 0;

    return NextResponse.json({
      topPredictors,
      summary: {
        total: predictions?.length || 0,
        yesCount,
        noCount,
        yesPercentage: predictions?.length ? Math.round((yesCount / predictions.length) * 100) : 50,
      },
    });

  } catch (error) {
    console.error('Market predictors API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market predictors' },
      { status: 500 }
    );
  }
}
