import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'x-cache-bust': Date.now().toString(),
        },
      },
    });
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const walletParam = searchParams.get('wallet');

    if (!userId && !walletParam) {
      return NextResponse.json({
        success: false,
        error: 'userId or wallet is required',
      }, { status: 400 });
    }

    console.log('[USER STATS] Fetching stats for:', userId || walletParam);

    // Get user data (by id or wallet)
    let userData;
    if (userId) {
      const { data } = await supabase
        .from('users')
        .select('id, wallet_address, post_launch_count')
        .eq('id', userId)
        .single();
      userData = data;
    } else if (walletParam) {
      const { data } = await supabase
        .from('users')
        .select('id, wallet_address, post_launch_count')
        .eq('wallet_address', walletParam)
        .single();
      userData = data;
    }

    // If user not found and wallet provided, return default stats
    if (!userData && walletParam) {
      console.log('[USER STATS] User not found for wallet, returning defaults');
      return NextResponse.json({
        success: true,
        post_launch_count: 0,
        data: {
          posts_count: 0,
          tokens_created: 0,
          total_holders: 0,
          tokens_holding: 0,
          post_launch_count: 0,
        },
      });
    }

    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    const actualUserId = userData.id;
    const walletAddress = userData.wallet_address;
    const postLaunchCount = userData.post_launch_count || 0;

    // Get all posts by this user - use count for accurate totals
    const { count: postsCount, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', actualUserId);

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
      post_launch_count: postLaunchCount, // Track gasless launches
    };

    console.log('[USER STATS] Stats for user:', {
      userId: actualUserId,
      wallet: walletAddress?.substring(0, 8) + '...',
      postsCount: totalPosts,
      postLaunchCount,
      ...stats
    });

    const response = NextResponse.json({
      success: true,
      post_launch_count: postLaunchCount, // Top-level for easy access
      data: stats,
    });

    // Add explicit no-cache headers to the response
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('[USER STATS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
