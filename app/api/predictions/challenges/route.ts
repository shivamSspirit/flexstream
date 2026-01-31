/**
 * Challenge System API
 *
 * The "Call-Out" Mechanic - stake against friends on predictions
 *
 * Flow:
 * 1. User A creates challenge, selects position (YES/NO)
 * 2. User B accepts with opposite position
 * 3. Both stakes go into escrow
 * 4. When market settles, winner takes all
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMarket } from '@/lib/services/dflow-service';
import { updateScoreForChallenge } from '@/lib/services/flex-score-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CreateChallengeRequest {
  challengerId: string;
  challengedId: string;
  marketTicker: string;
  challengerPosition: 'yes' | 'no';
  stakeAmount: number;
  message?: string;
}

/**
 * POST - Create a new challenge
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateChallengeRequest = await request.json();
    const {
      challengerId,
      challengedId,
      marketTicker,
      challengerPosition,
      stakeAmount,
      message,
    } = body;

    // Validate
    if (!challengerId || !challengedId || !marketTicker || !challengerPosition || !stakeAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (challengerId === challengedId) {
      return NextResponse.json(
        { error: 'Cannot challenge yourself' },
        { status: 400 }
      );
    }

    if (stakeAmount < 5 || stakeAmount > 500) {
      return NextResponse.json(
        { error: 'Stake must be between $5 and $500' },
        { status: 400 }
      );
    }

    // Get market details
    const { market } = await getMarket(marketTicker);

    if (!market || market.status !== 'active') {
      return NextResponse.json(
        { error: 'Market not available for challenges' },
        { status: 400 }
      );
    }

    // Check for existing pending challenge between these users on this market
    const { data: existingChallenge } = await supabase
      .from('challenges')
      .select('id')
      .eq('market_ticker', marketTicker)
      .or(`challenger_id.eq.${challengerId},challenged_id.eq.${challengerId}`)
      .or(`challenger_id.eq.${challengedId},challenged_id.eq.${challengedId}`)
      .in('status', ['pending', 'active'])
      .single();

    if (existingChallenge) {
      return NextResponse.json(
        { error: 'Challenge already exists on this market' },
        { status: 400 }
      );
    }

    // Get user details for notification
    const { data: challenger } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', challengerId)
      .single();

    const { data: challenged } = await supabase
      .from('users')
      .select('username')
      .eq('id', challengedId)
      .single();

    // Create challenge
    const { data: challenge, error: dbError } = await supabase
      .from('challenges')
      .insert({
        challenger_id: challengerId,
        challenged_id: challengedId,
        market_ticker: marketTicker,
        market_title: market.title,
        challenger_position: challengerPosition,
        stake_amount: stakeAmount,
        message,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h to accept
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error creating challenge:', dbError);
      return NextResponse.json(
        { error: 'Failed to create challenge' },
        { status: 500 }
      );
    }

    // Create notification for challenged user
    await supabase.from('notifications').insert({
      user_id: challengedId,
      type: 'challenge_received',
      title: 'New Challenge!',
      message: `@${challenger?.username || 'Someone'} challenged you: "${market.title}"`,
      data: {
        challengeId: challenge.id,
        challengerId,
        marketTicker,
        stakeAmount,
        position: challengerPosition,
      },
    });

    // Record activity
    await supabase.from('prediction_activity').insert({
      user_id: challengerId,
      activity_type: 'challenge_created',
      market_ticker: marketTicker,
      reference_id: challenge.id,
      metadata: {
        challengedUsername: challenged?.username,
        stakeAmount,
        position: challengerPosition,
      },
    });

    return NextResponse.json({
      success: true,
      challenge,
    });

  } catch (error) {
    console.error('Create challenge error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create challenge' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Accept, decline, or resolve a challenge
 */
export async function PATCH(request: NextRequest) {
  try {
    const { challengeId, action, userId } = await request.json();

    if (!challengeId || !action || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get challenge
    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (fetchError || !challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'accept': {
        // Only challenged user can accept
        if (challenge.challenged_id !== userId) {
          return NextResponse.json(
            { error: 'Only the challenged user can accept' },
            { status: 403 }
          );
        }

        if (challenge.status !== 'pending') {
          return NextResponse.json(
            { error: 'Challenge is no longer pending' },
            { status: 400 }
          );
        }

        const { data: updated, error: updateError } = await supabase
          .from('challenges')
          .update({
            status: 'active',
            accepted_at: new Date().toISOString(),
          })
          .eq('id', challengeId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        // Notify challenger
        await supabase.from('notifications').insert({
          user_id: challenge.challenger_id,
          type: 'challenge_accepted',
          title: 'Challenge Accepted!',
          message: `Your challenge on "${challenge.market_title}" was accepted`,
          data: { challengeId },
        });

        // Record activity
        await supabase.from('prediction_activity').insert({
          user_id: userId,
          activity_type: 'challenge_accepted',
          market_ticker: challenge.market_ticker,
          reference_id: challengeId,
        });

        return NextResponse.json({ success: true, challenge: updated });
      }

      case 'decline': {
        // Only challenged user can decline
        if (challenge.challenged_id !== userId) {
          return NextResponse.json(
            { error: 'Only the challenged user can decline' },
            { status: 403 }
          );
        }

        const { data: updated, error: updateError } = await supabase
          .from('challenges')
          .update({ status: 'declined' })
          .eq('id', challengeId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        // Notify challenger
        await supabase.from('notifications').insert({
          user_id: challenge.challenger_id,
          type: 'challenge_declined',
          title: 'Challenge Declined',
          message: `Your challenge on "${challenge.market_title}" was declined`,
          data: { challengeId },
        });

        return NextResponse.json({ success: true, challenge: updated });
      }

      case 'cancel': {
        // Only challenger can cancel (before acceptance)
        if (challenge.challenger_id !== userId) {
          return NextResponse.json(
            { error: 'Only the challenger can cancel' },
            { status: 403 }
          );
        }

        if (challenge.status !== 'pending') {
          return NextResponse.json(
            { error: 'Can only cancel pending challenges' },
            { status: 400 }
          );
        }

        const { data: updated, error: updateError } = await supabase
          .from('challenges')
          .update({ status: 'cancelled' })
          .eq('id', challengeId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return NextResponse.json({ success: true, challenge: updated });
      }

      case 'resolve': {
        // This would be called by a cron job or admin when market settles
        // For now, we'll allow either party to resolve with the outcome
        if (challenge.status !== 'active') {
          return NextResponse.json(
            { error: 'Challenge is not active' },
            { status: 400 }
          );
        }

        const { outcome } = await request.json();

        if (!outcome || !['yes', 'no'].includes(outcome)) {
          return NextResponse.json(
            { error: 'Valid outcome required (yes/no)' },
            { status: 400 }
          );
        }

        // Determine winner
        const winnerId = outcome === challenge.challenger_position
          ? challenge.challenger_id
          : challenge.challenged_id;

        const loserId = winnerId === challenge.challenger_id
          ? challenge.challenged_id
          : challenge.challenger_id;

        const { data: updated, error: updateError } = await supabase
          .from('challenges')
          .update({
            status: 'settled',
            winner_id: winnerId,
            outcome,
            settled_at: new Date().toISOString(),
          })
          .eq('id', challengeId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        // Update Flex Scores
        await updateScoreForChallenge({
          winnerId,
          loserId,
          challengeId,
          stakeAmount: challenge.stake_amount,
        });

        // Notify both users
        await supabase.from('notifications').insert([
          {
            user_id: winnerId,
            type: 'challenge_won',
            title: 'You Won! 🎉',
            message: `You won $${challenge.stake_amount * 2} on "${challenge.market_title}"`,
            data: { challengeId, amount: challenge.stake_amount * 2 },
          },
          {
            user_id: loserId,
            type: 'challenge_lost',
            title: 'Challenge Lost',
            message: `You lost the challenge on "${challenge.market_title}"`,
            data: { challengeId },
          },
        ]);

        return NextResponse.json({ success: true, challenge: updated });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Update challenge error:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get challenges for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const type = searchParams.get('type'); // 'sent', 'received', 'all'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('challenges')
      .select(`
        *,
        challenger:users!challenges_challenger_id_fkey(id, username, avatar_url),
        challenged:users!challenges_challenged_id_fkey(id, username, avatar_url)
      `)
      .order('created_at', { ascending: false });

    // Filter by type
    if (type === 'sent') {
      query = query.eq('challenger_id', userId);
    } else if (type === 'received') {
      query = query.eq('challenged_id', userId);
    } else {
      query = query.or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching challenges:', error);
      return NextResponse.json(
        { error: 'Failed to fetch challenges' },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenges: data });

  } catch (error) {
    console.error('Get challenges error:', error);
    return NextResponse.json(
      { error: 'Failed to get challenges' },
      { status: 500 }
    );
  }
}
