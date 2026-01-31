/**
 * Prediction Betting API
 *
 * POST /api/predictions/bet - Place a bet on a prediction market
 *
 * Flow:
 * 1. Get quote from DFlow
 * 2. Return unsigned transaction
 * 3. Client signs and sends
 * 4. Record prediction in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buyYes, buyNo, getMarket, deserializeTransaction } from '@/lib/services/dflow-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BetRequest {
  userId: string;
  marketTicker: string;
  position: 'yes' | 'no';
  amountUsdc: number;
  userPublicKey: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BetRequest = await request.json();
    const { userId, marketTicker, position, amountUsdc, userPublicKey } = body;

    // Validate input
    if (!userId || !marketTicker || !position || !amountUsdc || !userPublicKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amountUsdc < 1 || amountUsdc > 10000) {
      return NextResponse.json(
        { error: 'Amount must be between $1 and $10,000' },
        { status: 400 }
      );
    }

    // Get market details
    const { market } = await getMarket(marketTicker);

    if (!market || market.status !== 'active') {
      return NextResponse.json(
        { error: 'Market not available for trading' },
        { status: 400 }
      );
    }

    // Get trade quote from DFlow
    const tradeResponse = position === 'yes'
      ? await buyYes({
          marketTicker,
          yesMint: market.yesMint,
          amountUsdc,
          userPublicKey,
          slippageBps: 150, // 1.5% slippage
        })
      : await buyNo({
          marketTicker,
          noMint: market.noMint,
          amountUsdc,
          userPublicKey,
          slippageBps: 150,
        });

    // Calculate probability at time of bet
    const probability = position === 'yes'
      ? market.yesPrice || 50
      : market.noPrice || 50;

    // Create prediction record (pending until tx confirms)
    const { data: prediction, error: dbError } = await supabase
      .from('predictions')
      .insert({
        user_id: userId,
        market_ticker: marketTicker,
        market_title: market.title,
        position,
        amount_usdc: amountUsdc,
        probability_at_bet: probability,
        potential_payout: parseFloat(tradeResponse.outputAmount) / 1_000_000,
        status: 'pending',
        token_mint: position === 'yes' ? market.yesMint : market.noMint,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error creating prediction:', dbError);
      return NextResponse.json(
        { error: 'Failed to record prediction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      prediction,
      transaction: tradeResponse.transaction,
      inputAmount: tradeResponse.inputAmount,
      outputAmount: tradeResponse.outputAmount,
      priceImpact: tradeResponse.priceImpact,
    });

  } catch (error) {
    console.error('Bet API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to place bet' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/predictions/bet - Confirm a bet after transaction
 */
export async function PATCH(request: NextRequest) {
  try {
    const { predictionId, signature, status } = await request.json();

    if (!predictionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (signature) {
      updateData.tx_signature = signature;
    }

    if (status === 'active') {
      updateData.placed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('predictions')
      .update(updateData)
      .eq('id', predictionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating prediction:', error);
      return NextResponse.json(
        { error: 'Failed to update prediction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, prediction: data });

  } catch (error) {
    console.error('Bet confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm bet' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/predictions/bet - Get user's predictions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching predictions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch predictions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ predictions: data });

  } catch (error) {
    console.error('Get predictions error:', error);
    return NextResponse.json(
      { error: 'Failed to get predictions' },
      { status: 500 }
    );
  }
}
