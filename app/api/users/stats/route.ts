import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/users/stats
 *
 * Returns real user statistics
 * Nikita Bier Strategy: Show real numbers to build trust and authenticity
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

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required',
      }, { status: 400 });
    }

    console.log('[USER STATS] Fetching stats for user:', userId);

    // Get user's wallet address (single query, reused for tokens count)
    const { data: userData } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', userId)
      .single();

    const walletAddress = userData?.wallet_address;

    // Get all posts by this user - use count for accurate totals
    const { count: postsCount, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (postsError) {
      console.error('[USER STATS] Error fetching posts count:', postsError);
    }

    // Count posts and tokens from the fetched data
    // Since every post has a token, both counts are the same
    const totalPosts = postsCount || 0;
    const tokensCreated = totalPosts; // Every post = 1 token

    // For now, return 0 for holders and holding
    // TODO: Implement token holder tracking when we have on-chain data
    const stats = {
      posts_count: totalPosts,
      tokens_created: tokensCreated,
      total_holders: 0, // Will implement with on-chain data
      tokens_holding: 0, // Will implement with on-chain data
    };

    console.log('[USER STATS] Stats for user:', {
      userId,
      wallet: walletAddress?.substring(0, 8) + '...',
      postsCount: totalPosts,
      ...stats
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('[USER STATS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
