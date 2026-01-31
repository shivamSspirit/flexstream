/**
 * Squad Markets API
 *
 * Create and bet on private group prediction markets
 *
 * Features:
 * - Custom markets within squads
 * - Pool betting with payout distribution
 * - Market settlement by admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateScoreForPrediction } from '@/lib/services/flex-score-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CreateMarketRequest {
  squadId: string;
  userId: string;
  question: string;
  description?: string;
  expiresAt: string;
  minBet?: number;
  maxBet?: number;
}

/**
 * POST - Create a squad market
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateMarketRequest = await request.json();
    const { squadId, userId, question, description, expiresAt, minBet = 5, maxBet = 100 } = body;

    if (!squadId || !userId || !question || !expiresAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user is squad member
    const { data: membership } = await supabase
      .from('squad_members')
      .select('role')
      .eq('squad_id', squadId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a squad member' },
        { status: 403 }
      );
    }

    // Create market
    const { data: market, error } = await supabase
      .from('squad_markets')
      .insert({
        squad_id: squadId,
        creator_id: userId,
        question,
        description,
        expires_at: expiresAt,
        min_bet: minBet,
        max_bet: maxBet,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating squad market:', error);
      return NextResponse.json(
        { error: 'Failed to create market' },
        { status: 500 }
      );
    }

    // Notify squad members
    const { data: members } = await supabase
      .from('squad_members')
      .select('user_id')
      .eq('squad_id', squadId)
      .neq('user_id', userId);

    if (members?.length) {
      const notifications = members.map(m => ({
        user_id: m.user_id,
        type: 'squad_market_created',
        title: 'New Squad Market!',
        message: question.length > 50 ? question.substring(0, 47) + '...' : question,
        data: { marketId: market.id, squadId },
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({ success: true, market });

  } catch (error) {
    console.error('Create squad market error:', error);
    return NextResponse.json(
      { error: 'Failed to create market' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get squad markets
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const squadId = searchParams.get('squadId');
    const marketId = searchParams.get('marketId');
    const status = searchParams.get('status');

    if (marketId) {
      // Get specific market with bets
      const { data: market, error } = await supabase
        .from('squad_markets')
        .select(`
          *,
          creator:users!squad_markets_creator_id_fkey(id, username, avatar_url),
          bets:squad_bets(
            *,
            user:users(id, username, avatar_url)
          )
        `)
        .eq('id', marketId)
        .single();

      if (error || !market) {
        return NextResponse.json(
          { error: 'Market not found' },
          { status: 404 }
        );
      }

      // Calculate pool totals
      const yesBets = market.bets.filter((b: { position: string }) => b.position === 'yes');
      const noBets = market.bets.filter((b: { position: string }) => b.position === 'no');

      const yesTotal = yesBets.reduce((sum: number, b: { amount: number }) => sum + b.amount, 0);
      const noTotal = noBets.reduce((sum: number, b: { amount: number }) => sum + b.amount, 0);
      const totalPool = yesTotal + noTotal;

      return NextResponse.json({
        market: {
          ...market,
          pool: {
            yes: yesTotal,
            no: noTotal,
            total: totalPool,
            yesOdds: totalPool > 0 ? (noTotal / totalPool) * 100 : 50,
            noOdds: totalPool > 0 ? (yesTotal / totalPool) * 100 : 50,
          },
        },
      });
    }

    if (!squadId) {
      return NextResponse.json(
        { error: 'squadId or marketId required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('squad_markets')
      .select(`
        *,
        creator:users!squad_markets_creator_id_fkey(id, username, avatar_url),
        bets:squad_bets(count)
      `)
      .eq('squad_id', squadId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: markets, error } = await query;

    if (error) {
      console.error('Error fetching squad markets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch markets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ markets });

  } catch (error) {
    console.error('Get squad markets error:', error);
    return NextResponse.json(
      { error: 'Failed to get markets' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Place bet or settle market
 */
export async function PATCH(request: NextRequest) {
  try {
    const { action, marketId, userId, ...data } = await request.json();

    if (!action || !marketId || !userId) {
      return NextResponse.json(
        { error: 'action, marketId, and userId required' },
        { status: 400 }
      );
    }

    // Get market
    const { data: market, error: marketError } = await supabase
      .from('squad_markets')
      .select('*, squad:squads(id)')
      .eq('id', marketId)
      .single();

    if (marketError || !market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    // Verify user is squad member
    const { data: membership } = await supabase
      .from('squad_members')
      .select('role')
      .eq('squad_id', market.squad_id)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a squad member' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'bet': {
        const { position, amount } = data;

        if (!position || !amount) {
          return NextResponse.json(
            { error: 'position and amount required' },
            { status: 400 }
          );
        }

        if (market.status !== 'active') {
          return NextResponse.json(
            { error: 'Market is not active' },
            { status: 400 }
          );
        }

        if (amount < market.min_bet || amount > market.max_bet) {
          return NextResponse.json(
            { error: `Bet must be between $${market.min_bet} and $${market.max_bet}` },
            { status: 400 }
          );
        }

        // Check if user already bet
        const { data: existingBet } = await supabase
          .from('squad_bets')
          .select('id')
          .eq('market_id', marketId)
          .eq('user_id', userId)
          .single();

        if (existingBet) {
          return NextResponse.json(
            { error: 'Already placed a bet on this market' },
            { status: 400 }
          );
        }

        // Place bet
        const { data: bet, error: betError } = await supabase
          .from('squad_bets')
          .insert({
            market_id: marketId,
            user_id: userId,
            position,
            amount,
          })
          .select()
          .single();

        if (betError) {
          throw betError;
        }

        // Update market pool
        await supabase
          .from('squad_markets')
          .update({
            yes_pool: position === 'yes' ? market.yes_pool + amount : market.yes_pool,
            no_pool: position === 'no' ? market.no_pool + amount : market.no_pool,
          })
          .eq('id', marketId);

        return NextResponse.json({ success: true, bet });
      }

      case 'settle': {
        const { outcome } = data;

        if (!outcome || !['yes', 'no'].includes(outcome)) {
          return NextResponse.json(
            { error: 'Valid outcome required (yes/no)' },
            { status: 400 }
          );
        }

        // Only admin or creator can settle
        if (membership.role !== 'admin' && market.creator_id !== userId) {
          return NextResponse.json(
            { error: 'Only admin or creator can settle' },
            { status: 403 }
          );
        }

        if (market.status === 'settled') {
          return NextResponse.json(
            { error: 'Market already settled' },
            { status: 400 }
          );
        }

        // Get all bets
        const { data: bets } = await supabase
          .from('squad_bets')
          .select('*')
          .eq('market_id', marketId);

        if (!bets?.length) {
          // No bets, just close market
          await supabase
            .from('squad_markets')
            .update({ status: 'settled', outcome })
            .eq('id', marketId);

          return NextResponse.json({ success: true, outcome, payouts: [] });
        }

        // Calculate payouts
        const totalPool = market.yes_pool + market.no_pool;
        const winningBets = bets.filter(b => b.position === outcome);
        const losingPool = outcome === 'yes' ? market.no_pool : market.yes_pool;
        const winningPool = outcome === 'yes' ? market.yes_pool : market.no_pool;

        const payouts = winningBets.map(bet => {
          const share = bet.amount / winningPool;
          const winnings = losingPool * share;
          const totalPayout = bet.amount + winnings;

          return {
            userId: bet.user_id,
            betAmount: bet.amount,
            payout: Math.floor(totalPayout * 100) / 100,
            profit: Math.floor(winnings * 100) / 100,
          };
        });

        // Update bets with payout amounts
        for (const payout of payouts) {
          await supabase
            .from('squad_bets')
            .update({
              payout_amount: payout.payout,
              status: 'won',
            })
            .eq('market_id', marketId)
            .eq('user_id', payout.userId);

          // Update flex score
          await updateScoreForPrediction({
            userId: payout.userId,
            predictionId: `squad-${marketId}`,
            won: true,
            probability: outcome === 'yes' ? (market.yes_pool / totalPool) * 100 : (market.no_pool / totalPool) * 100,
            stakeAmount: payout.betAmount,
            payout: payout.payout,
          });
        }

        // Mark losing bets
        const losingBets = bets.filter(b => b.position !== outcome);
        for (const bet of losingBets) {
          await supabase
            .from('squad_bets')
            .update({ status: 'lost', payout_amount: 0 })
            .eq('id', bet.id);

          // Update flex score
          await updateScoreForPrediction({
            userId: bet.user_id,
            predictionId: `squad-${marketId}`,
            won: false,
            probability: bet.position === 'yes' ? (market.yes_pool / totalPool) * 100 : (market.no_pool / totalPool) * 100,
            stakeAmount: bet.amount,
            payout: 0,
          });
        }

        // Settle market
        await supabase
          .from('squad_markets')
          .update({
            status: 'settled',
            outcome,
            settled_at: new Date().toISOString(),
          })
          .eq('id', marketId);

        // Notify participants
        const notifications = bets.map(bet => ({
          user_id: bet.user_id,
          type: bet.position === outcome ? 'squad_bet_won' : 'squad_bet_lost',
          title: bet.position === outcome ? 'You Won! 🎉' : 'Market Settled',
          message: bet.position === outcome
            ? `You won on "${market.question.substring(0, 30)}..."`
            : `Market settled: "${market.question.substring(0, 30)}..."`,
          data: { marketId, outcome },
        }));

        await supabase.from('notifications').insert(notifications);

        return NextResponse.json({ success: true, outcome, payouts });
      }

      case 'cancel': {
        // Only admin or creator can cancel
        if (membership.role !== 'admin' && market.creator_id !== userId) {
          return NextResponse.json(
            { error: 'Only admin or creator can cancel' },
            { status: 403 }
          );
        }

        if (market.status === 'settled') {
          return NextResponse.json(
            { error: 'Cannot cancel settled market' },
            { status: 400 }
          );
        }

        await supabase
          .from('squad_markets')
          .update({ status: 'cancelled' })
          .eq('id', marketId);

        // Refund all bets (mark as refunded)
        await supabase
          .from('squad_bets')
          .update({ status: 'refunded', payout_amount: supabase.rpc('amount') })
          .eq('market_id', marketId);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Update squad market error:', error);
    return NextResponse.json(
      { error: 'Failed to update market' },
      { status: 500 }
    );
  }
}
