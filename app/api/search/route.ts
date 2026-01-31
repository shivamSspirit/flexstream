import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/search
 * Universal search across users, posts, and tokens
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const type = searchParams.get('type') || 'all'; // all, users, posts, tokens
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Search query must be at least 2 characters'
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const searchPattern = `%${query}%`;
    const results: any = {
      users: [],
      posts: [],
      tokens: [],
    };

    // Search users (creators)
    if (type === 'all' || type === 'users') {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, verified_earnings, success_tier, wallet_address')
        .or(`username.ilike.${searchPattern},display_name.ilike.${searchPattern}`)
        .order('verified_earnings', { ascending: false })
        .limit(limit);

      if (!usersError && users) {
        results.users = users.map(user => ({
          type: 'user',
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          verifiedEarnings: user.verified_earnings,
          successTier: user.success_tier,
          walletAddress: user.wallet_address,
        }));
      }
    }

    // Search posts by title/content
    if (type === 'all' || type === 'posts') {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          type,
          created_at,
          token_mint,
          token_symbol,
          token_display_name,
          media_urls,
          users:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!postsError && posts) {
        results.posts = posts.map(post => ({
          type: 'post',
          id: post.id,
          title: post.title,
          content: post.content?.slice(0, 100),
          postType: post.type,
          createdAt: post.created_at,
          tokenMint: post.token_mint,
          tokenSymbol: post.token_symbol,
          mediaUrl: post.media_urls?.[0],
          user: post.users,
        }));
      }
    }

    // Search tokens by symbol/name
    if (type === 'all' || type === 'tokens') {
      const { data: tokens, error: tokensError } = await supabase
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
            username,
            display_name,
            avatar_url
          )
        `)
        .not('token_mint', 'is', null)
        .or(`token_symbol.ilike.${searchPattern},token_display_name.ilike.${searchPattern}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!tokensError && tokens) {
        results.tokens = tokens.map(token => ({
          type: 'token',
          id: token.id,
          mint: token.token_mint,
          symbol: token.token_symbol,
          displayName: token.token_display_name,
          isVerified: token.token_is_verified,
          poolAddress: token.pool_address,
          createdAt: token.created_at,
          imageUrl: token.media_urls?.[0],
          creator: token.users,
        }));
      }
    }

    const totalResults = results.users.length + results.posts.length + results.tokens.length;

    return NextResponse.json({
      success: true,
      data: {
        query,
        totalResults,
        results,
      }
    });

  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    }, { status: 500 });
  }
}
