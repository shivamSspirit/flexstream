import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/users/holdings
 *
 * Returns all tokens held/collected by a user (for "Collected" tab)
 * Shows investor's perspective: tokens they've bought from others
 * Includes real-time P&L calculations
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

    if (!userId && !walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'userId or walletAddress is required',
      }, { status: 400 });
    }

    console.log('[HOLDINGS] Fetching holdings for:', { userId, walletAddress });

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

    // Fetch all holdings using the portfolio summary view
    const { data: holdings, error } = await supabase
      .from('user_portfolio_summary')
      .select('*')
      .eq('wallet_address', userWallet)
      .order('current_value_sol', { ascending: false });

    if (error) {
      console.error('[HOLDINGS] Error fetching holdings:', error);
      throw error;
    }

    console.log('[HOLDINGS] Found holdings:', {
      wallet: userWallet.substring(0, 8) + '...',
      count: holdings?.length || 0
    });

    // Calculate portfolio summary stats
    const total_unrealized_pnl = holdings?.reduce((sum, h) => sum + (Number(h.unrealized_pnl_sol) || 0), 0) || 0;
    const total_realized_pnl = holdings?.reduce((sum, h) => sum + (Number(h.realized_pnl) || 0), 0) || 0;
    const total_invested = holdings?.reduce((sum, h) => sum + (Number(h.total_invested) || 0), 0) || 0;
    const total_pnl = total_unrealized_pnl + total_realized_pnl;

    const summary = {
      total_holdings: holdings?.length || 0,
      total_value_sol: holdings?.reduce((sum, h) => sum + (Number(h.current_value_sol) || 0), 0) || 0,
      total_value_usd: holdings?.reduce((sum, h) => sum + (Number(h.current_value_usd) || 0), 0) || 0,
      total_invested,
      total_unrealized_pnl,
      total_realized_pnl,
      total_pnl,
      total_pnl_percentage: total_invested > 0 ? (total_pnl / total_invested) * 100 : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        holdings: holdings || [],
        summary,
      },
    });

  } catch (error) {
    console.error('[HOLDINGS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
