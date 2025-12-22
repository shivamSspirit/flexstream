import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/users/portfolio
 *
 * Returns all tokens created by a user (for "Wallet" tab)
 * Shows creator's perspective: tokens they've launched
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

    console.log('[PORTFOLIO] Fetching created tokens for:', { userId, walletAddress });

    // If userId provided, get wallet address first
    let creatorWallet = walletAddress;
    if (userId && !walletAddress) {
      const { data: userData } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', userId)
        .single();

      creatorWallet = userData?.wallet_address;
    }

    if (!creatorWallet) {
      return NextResponse.json({
        success: false,
        error: 'User wallet not found',
      }, { status: 404 });
    }

    // Fetch all tokens created by this user using the view
    const { data: createdTokens, error } = await supabase
      .from('user_created_tokens')
      .select('*')
      .eq('creator_wallet', creatorWallet)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PORTFOLIO] Error fetching created tokens:', error);
      throw error;
    }

    console.log('[PORTFOLIO] Found created tokens:', {
      wallet: creatorWallet.substring(0, 8) + '...',
      count: createdTokens?.length || 0
    });

    // Calculate summary stats
    const summary = {
      total_tokens_created: createdTokens?.length || 0,
      total_market_cap: createdTokens?.reduce((sum, token) => sum + (Number(token.market_cap) || 0), 0) || 0,
      total_volume: createdTokens?.reduce((sum, token) => sum + (Number(token.volume_total) || 0), 0) || 0,
      total_holders: createdTokens?.reduce((sum, token) => sum + (Number(token.holders_count) || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        tokens: createdTokens || [],
        summary,
      },
    });

  } catch (error) {
    console.error('[PORTFOLIO] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
