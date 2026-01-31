/**
 * Flex Score API
 *
 * The "Proof of Alpha" system - shareable prediction accuracy
 *
 * Endpoints:
 * - GET: Get user's Flex Score
 * - GET with history: Get score change history
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getFlexScore,
  createFlexScore,
  getUserRank,
  getTierFromScore,
} from '@/lib/services/flex-score-service';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const includeHistory = searchParams.get('history') === 'true';
    const includeRank = searchParams.get('rank') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    // Get or create flex score
    let flexScore = await getFlexScore(userId);

    if (!flexScore) {
      flexScore = await createFlexScore(userId);
    }

    if (!flexScore) {
      return NextResponse.json(
        { error: 'Failed to get flex score' },
        { status: 500 }
      );
    }

    // Calculate derived stats
    const winRate = flexScore.totalPredictions > 0
      ? (flexScore.correctPredictions / flexScore.totalPredictions) * 100
      : 0;

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    // Build response
    const response: Record<string, unknown> = {
      flexScore: {
        ...flexScore,
        winRate: Math.round(winRate * 10) / 10,
        tier: getTierFromScore(flexScore.flexScore),
        username: user?.username,
        avatarUrl: user?.avatar_url,
      },
    };

    // Include rank if requested
    if (includeRank) {
      const rank = await getUserRank(userId);
      response.flexScore = { ...response.flexScore as object, globalRank: rank };
    }

    // Include history if requested
    if (includeHistory) {
      const { data: history } = await supabase
        .from('flex_score_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      response.history = history || [];
    }

    // Calculate tier progress
    const tierThresholds = {
      oracle: 900,
      prophet: 750,
      seer: 600,
      acolyte: 400,
      initiate: 0,
    };

    const currentTier = getTierFromScore(flexScore.flexScore);
    const tierOrder = ['initiate', 'acolyte', 'seer', 'prophet', 'oracle'] as const;
    const currentTierIndex = tierOrder.indexOf(currentTier);
    const nextTier = currentTierIndex < 4 ? tierOrder[currentTierIndex + 1] : null;

    if (nextTier) {
      const currentThreshold = tierThresholds[currentTier];
      const nextThreshold = tierThresholds[nextTier];
      const progress = ((flexScore.flexScore - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

      response.tierProgress = {
        current: currentTier,
        next: nextTier,
        progress: Math.min(100, Math.max(0, progress)),
        pointsToNext: nextThreshold - flexScore.flexScore,
      };
    } else {
      response.tierProgress = {
        current: 'oracle',
        next: null,
        progress: 100,
        pointsToNext: 0,
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Flex score API error:', error);
    return NextResponse.json(
      { error: 'Failed to get flex score' },
      { status: 500 }
    );
  }
}

/**
 * Generate shareable Flex Score card data
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, format } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const flexScore = await getFlexScore(userId);

    if (!flexScore) {
      return NextResponse.json(
        { error: 'User has no flex score' },
        { status: 404 }
      );
    }

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    // Get recent wins
    const { data: recentWins } = await supabase
      .from('predictions')
      .select('market_title, payout_amount, probability_at_bet')
      .eq('user_id', userId)
      .eq('status', 'won')
      .order('settled_at', { ascending: false })
      .limit(3);

    // Calculate stats
    const winRate = flexScore.totalPredictions > 0
      ? (flexScore.correctPredictions / flexScore.totalPredictions) * 100
      : 0;

    // Build shareable card data
    const cardData: {
      user: { id: string; username: string; avatarUrl: string | undefined };
      score: { value: number; tier: string; rank: number | null };
      stats: { totalPredictions: number; winRate: number; currentStreak: number; longestStreak: number; totalProfit: number };
      recentWins: typeof recentWins;
      generatedAt: string;
      shareUrl?: string;
    } = {
      user: {
        id: userId,
        username: user?.username || 'Anonymous',
        avatarUrl: user?.avatar_url,
      },
      score: {
        value: flexScore.flexScore,
        tier: getTierFromScore(flexScore.flexScore),
        rank: await getUserRank(userId),
      },
      stats: {
        totalPredictions: flexScore.totalPredictions,
        winRate: Math.round(winRate * 10) / 10,
        currentStreak: flexScore.currentStreak,
        longestStreak: flexScore.longestStreak,
        totalProfit: flexScore.totalProfit,
      },
      recentWins: recentWins || [],
      generatedAt: new Date().toISOString(),
    };

    // If Twitter format requested, generate share URL
    if (format === 'twitter') {
      const tier = getTierFromScore(flexScore.flexScore);
      const tierEmoji = {
        oracle: '👁️',
        prophet: '🔮',
        seer: '✨',
        acolyte: '🌟',
        initiate: '⭐',
      }[tier];

      const tweetText = encodeURIComponent(
        `${tierEmoji} My FlexStream Flex Score: ${flexScore.flexScore}\n\n` +
        `📊 ${flexScore.totalPredictions} predictions\n` +
        `🎯 ${Math.round(winRate)}% win rate\n` +
        `🔥 ${flexScore.currentStreak} win streak\n\n` +
        `Think you can beat me? Challenge me on FlexStream! 💪`
      );

      cardData.shareUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    }

    return NextResponse.json({ card: cardData });

  } catch (error) {
    console.error('Generate card error:', error);
    return NextResponse.json(
      { error: 'Failed to generate card' },
      { status: 500 }
    );
  }
}
