import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/tokens
 * Get all tradable tokens with filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'newest';
    const q = searchParams.get('q');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from('posts')
      .select(`
        id,
        token_mint,
        token_symbol,
        token_display_name,
        token_is_verified,
        pool_address,
        created_at,
        media_urls,
        users:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .not('token_mint', 'is', null);

    // Apply user filter
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Apply search filter
    if (q) {
      query = query.or(`token_symbol.ilike.%${q}%,token_display_name.ilike.%${q}%`);
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'volume':
        // TODO: Add volume tracking
        query = query.order('created_at', { ascending: false });
        break;
      case 'price':
        // TODO: Add price tracking
        query = query.order('created_at', { ascending: false });
        break;
      case 'holders':
        // TODO: Add holder tracking
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: tokens, error } = await query;

    if (error) {
      console.error('[Tokens API] Database error:', error);
      throw error;
    }

    // Format response
    const formattedTokens = tokens?.map((token: any) => ({
      id: token.id,
      mint: token.token_mint,
      symbol: token.token_symbol,
      displayName: token.token_display_name,
      isVerified: token.token_is_verified,
      poolAddress: token.pool_address,
      createdAt: token.created_at,
      imageUrl: token.media_urls?.[0],
      creator: {
        id: token.users?.id,
        username: token.users?.username,
        displayName: token.users?.display_name,
        avatarUrl: token.users?.avatar_url,
      },
      // Placeholder values - will be replaced with real on-chain data
      price: 0.01,
      priceChange: 0,
      marketCap: 0,
      volume24h: 0,
      holders: 0,
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedTokens,
      pagination: {
        limit,
        offset,
        hasMore: formattedTokens.length === limit,
      }
    });

  } catch (error) {
    console.error('[Tokens API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tokens'
    }, { status: 500 });
  }
}
