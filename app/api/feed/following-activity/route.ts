import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/feed/following-activity
 *
 * Returns trading activity from users the current user follows.
 * Joins: follows → users → user_trading_history (+ tokens for display names)
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'latest';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Step 1: Get the user IDs that this user follows
    const { data: followRows, error: followError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (followError) {
      console.error('[FOLLOWING ACTIVITY] Error fetching follows:', followError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch follows' },
        { status: 500 }
      );
    }

    const followingIds = (followRows || []).map((r: { following_id: string }) => r.following_id);

    if (followingIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { activities: [], count: 0, limit, offset },
      });
    }

    // Step 2: Get wallet addresses for followed users
    const { data: followedUsers, error: usersError } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, wallet_address')
      .in('id', followingIds);

    if (usersError || !followedUsers) {
      console.error('[FOLLOWING ACTIVITY] Error fetching followed users:', usersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    const walletAddresses = followedUsers
      .map((u: { wallet_address: string | null }) => u.wallet_address)
      .filter(Boolean) as string[];

    if (walletAddresses.length === 0) {
      return NextResponse.json({
        success: true,
        data: { activities: [], count: 0, limit, offset },
      });
    }

    // Step 3: Fetch trading history for those wallets
    let query = supabase
      .from('user_trading_history')
      .select('*')
      .in('wallet_address', walletAddresses);

    // Apply time filters
    if (sort === 'top_24h') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', since);
    } else if (sort === 'top_7d') {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', since);
    }

    // Apply ordering
    if (sort === 'hot' || sort === 'top_24h' || sort === 'top_7d' || sort === 'top_all') {
      query = query.order('total_sol_amount', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: trades, error: tradesError } = await query;

    if (tradesError) {
      console.error('[FOLLOWING ACTIVITY] Error fetching trades:', tradesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch trading activity' },
        { status: 500 }
      );
    }

    // Build a wallet → user lookup map
    const walletToUser = new Map<string, {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    }>();
    for (const u of followedUsers) {
      if (u.wallet_address) {
        walletToUser.set(u.wallet_address, {
          id: u.id,
          username: u.username || 'anonymous',
          displayName: u.display_name || u.username || 'Anonymous',
          avatarUrl: u.avatar_url,
        });
      }
    }

    // Format activities
    const activities = (trades || []).map((trade: Record<string, unknown>) => {
      const user = walletToUser.get(trade.wallet_address as string);
      return {
        id: trade.id as string,
        user: user || {
          id: '',
          username: 'unknown',
          displayName: 'Unknown',
          avatarUrl: null,
        },
        tradeType: (trade.trade_type as string) || 'buy',
        tokenMint: (trade.token_mint as string) || '',
        tokenSymbol: (trade.token_symbol as string) || '',
        tokenDisplayName: (trade.token_display_name as string) || (trade.token_symbol as string) || 'Token',
        quantity: Number(trade.quantity) || 0,
        pricePerToken: Number(trade.price_per_token) || 0,
        totalSolAmount: Number(trade.total_sol_amount) || 0,
        totalUsdValue: trade.total_usd_value ? Number(trade.total_usd_value) : null,
        signature: (trade.signature as string) || '',
        createdAt: (trade.created_at as string) || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: { activities, count: activities.length, limit, offset },
    });
  } catch (error) {
    console.error('[FOLLOWING ACTIVITY] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
