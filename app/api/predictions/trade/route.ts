/**
 * Prediction Trade API
 *
 * POST /api/predictions/trade - Get a trade quote from DFlow
 * POST /api/predictions/trade/confirm - Confirm a trade after signing
 *
 * Body (POST):
 *   - marketTicker: string
 *   - side: 'yes' | 'no'
 *   - amountUsdc: number
 *   - userPublicKey: string
 *   - slippageBps?: number
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getTradeQuote,
  getMarket,
  checkOrderStatus,
} from '@/lib/services/unified-predictions-service';
import type { PredictionTradeRequest, PredictionSide } from '@/types';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST - Get a trade quote
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { marketTicker, side, amountUsdc, userPublicKey, slippageBps } = body;

    if (!marketTicker || typeof marketTicker !== 'string') {
      return NextResponse.json(
        { success: false, error: 'marketTicker is required' },
        { status: 400 }
      );
    }

    if (!side || (side !== 'yes' && side !== 'no')) {
      return NextResponse.json(
        { success: false, error: 'side must be "yes" or "no"' },
        { status: 400 }
      );
    }

    if (!amountUsdc || typeof amountUsdc !== 'number' || amountUsdc <= 0) {
      return NextResponse.json(
        { success: false, error: 'amountUsdc must be a positive number' },
        { status: 400 }
      );
    }

    if (!userPublicKey || typeof userPublicKey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'userPublicKey is required' },
        { status: 400 }
      );
    }

    // Minimum bet amount
    if (amountUsdc < 1) {
      return NextResponse.json(
        { success: false, error: 'Minimum bet is $1 USDC' },
        { status: 400 }
      );
    }

    // Maximum bet amount (for safety)
    if (amountUsdc > 10000) {
      return NextResponse.json(
        { success: false, error: 'Maximum bet is $10,000 USDC' },
        { status: 400 }
      );
    }

    // Get trade quote
    const tradeRequest: PredictionTradeRequest = {
      marketTicker,
      side: side as PredictionSide,
      amountUsdc,
      userPublicKey,
      slippageBps: slippageBps || 100, // 1% default slippage
    };

    const quote = await getTradeQuote(tradeRequest);

    if (!quote.success || !quote.trade) {
      return NextResponse.json(
        { success: false, error: quote.error || 'Failed to get trade quote' },
        { status: 400 }
      );
    }

    // Get market details for response
    const market = await getMarket(marketTicker);

    return NextResponse.json({
      success: true,
      data: {
        trade: quote.trade,
        market: market ? {
          ticker: market.ticker,
          title: market.title,
          yesPrice: market.yesPrice,
          noPrice: market.noPrice,
        } : null,
      },
    });
  } catch (error) {
    console.error('Trade quote error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get trade quote' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Confirm a trade after the user signs the transaction
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      marketTicker,
      side,
      amountUsdc,
      userPublicKey,
      txSignature,
      outputAmount,
      pricePerToken,
    } = body;

    // Validate required fields
    if (!marketTicker || !side || !amountUsdc || !userPublicKey || !txSignature) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', userPublicKey)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get market details
    const market = await getMarket(marketTicker);

    // Check transaction status
    const orderStatus = await checkOrderStatus(txSignature);

    // Record the prediction in database
    const { data: prediction, error: predictionError } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        market_ticker: marketTicker,
        market_title: market?.title || marketTicker,
        market_source: market?.source || 'dflow',
        side: side,
        shares: outputAmount ? parseFloat(outputAmount) / 1_000_000 : 0,
        entry_price: pricePerToken || (side === 'yes' ? market?.yesPrice : market?.noPrice) || 50,
        stake_amount: amountUsdc,
        stake_currency: 'USDC',
        dflow_yes_mint: market?.dflow?.yesMint,
        dflow_no_mint: market?.dflow?.noMint,
        tx_signature: txSignature,
        status: orderStatus.status === 'confirmed' ? 'active' : 'pending',
      })
      .select()
      .single();

    if (predictionError) {
      console.error('Error recording prediction:', predictionError);
      // Don't fail the request - the trade went through, just logging failed
    }

    // Update flex score for making a prediction
    if (prediction) {
      await supabase.rpc('update_flex_score_on_prediction', {
        p_user_id: user.id,
        p_stake_amount: amountUsdc,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        prediction,
        txSignature,
        status: orderStatus.status,
        message: orderStatus.status === 'confirmed'
          ? 'Trade confirmed! Position recorded.'
          : 'Trade submitted. Waiting for confirmation...',
      },
    });
  } catch (error) {
    console.error('Trade confirmation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to confirm trade' },
      { status: 500 }
    );
  }
}
