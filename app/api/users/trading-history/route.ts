import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/users/trading-history
 *
 * Returns complete trading history for a user (for "Activity" tab)
 * Shows all buys, sells, and swaps with timestamps
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId && !walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'userId or walletAddress is required',
      }, { status: 400 });
    }

    console.log('[TRADING HISTORY] Fetching for:', { userId, walletAddress, limit, offset });

    // If userId provided, get wallet address first
    let userWallet = walletAddress;
    if (userId && !walletAddress) {
      const { data: userData } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', userId)
        .single();

      userWallet = userData?.wallet_address;
    }

    if (!userWallet) {
      return NextResponse.json({
        success: false,
        error: 'User wallet not found',
      }, { status: 404 });
    }

    // Fetch trading history with token details
    const { data: history, error, count } = await supabase
      .from('user_trading_history')
      .select(`
        *,
        tokens:token_id (
          symbol,
          name,
          display_name,
          image_uri,
          is_verified
        )
      `, { count: 'exact' })
      .eq('wallet_address', userWallet)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[TRADING HISTORY] Error fetching history:', error);
      throw error;
    }

    console.log('[TRADING HISTORY] Found trades:', {
      wallet: userWallet.substring(0, 8) + '...',
      count: history?.length || 0,
      totalCount: count
    });

    // Calculate summary stats
    const summary = {
      total_trades: count || 0,
      total_buys: history?.filter(t => t.trade_type === 'buy').length || 0,
      total_sells: history?.filter(t => t.trade_type === 'sell').length || 0,
      total_volume_sol: history?.reduce((sum, t) => sum + (Number(t.total_sol_amount) || 0), 0) || 0,
      total_fees_paid: history?.reduce((sum, t) => sum + (Number(t.fee_amount) || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        history: history || [],
        summary,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });

  } catch (error) {
    console.error('[TRADING HISTORY] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
