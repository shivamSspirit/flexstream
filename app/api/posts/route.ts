import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/posts
 *
 * Fetches posts from the database with user information
 * Supports pagination and filtering by user
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const tokenOnly = searchParams.get('tokenOnly') === 'true';
    const sort = searchParams.get('sort') || 'latest';

    console.log('[GET POSTS] Query params:', { userId, limit, offset, tokenOnly, sort });

    // Build query - use INNER JOIN since every post MUST have a valid user (FK constraint)
    // This ensures we never return posts without user data, which SimpleFeed would filter out
    let query = supabase
      .from('posts')
      .select(`
        id,
        user_id,
        type,
        title,
        content,
        media_urls,
        token_mint,
        token_symbol,
        token_display_name,
        token_is_verified,
        creator_is_verified,
        token_name,
        pool_address,
        bonding_curve_address,
        token_metadata_uri,
        token_signature,
        is_token_tradable,
        content_category,
        content_link,
        token_utility_description,
        verified,
        created_at,
        users!inner (
          id,
          username,
          display_name,
          avatar_url,
          wallet_address
        )
      `);

    // Filter by user if provided - MUST come before range()
    if (userId) {
      console.log('[GET POSTS] Filtering by userId:', userId);
      query = query.eq('user_id', userId);
    } else {
      console.log('[GET POSTS] Fetching all posts (no user filter)');
    }

    // Filter to only posts with tokens if requested
    if (tokenOnly) {
      query = query.not('token_mint', 'is', null);
    }

    // Apply time-range filters for "top" sorts
    if (sort === 'top_24h') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', since);
    } else if (sort === 'top_7d') {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', since);
    }

    // Apply ordering based on sort param
    if (sort === 'hot' || sort === 'top_24h' || sort === 'top_7d' || sort === 'top_all') {
      query = query
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: false });
    } else {
      // Default: latest first
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    console.log('[GET POSTS] Raw query result:', {
      postsCount: posts?.length || 0,
      hasError: !!error,
      errorDetails: error?.message || null
    });

    if (error) {
      console.error('[GET POSTS] Error fetching posts:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch posts',
        details: error.message,
      }, { status: 500 });
    }

    console.log('[GET POSTS] Fetched posts:', {
      totalPosts: posts?.length || 0,
      requestedUserId: userId || 'all users',
      posts: posts?.map(p => {
        const user = Array.isArray(p.users) ? p.users[0] : p.users;
        return {
          id: p.id,
          title: p.title,
          user_id: p.user_id,
          user_wallet: user?.wallet_address,
          created_at: p.created_at
        };
      }) || []
    });

    // If filtering by userId and got 0 results, log a warning
    if (userId && posts?.length === 0) {
      console.warn('[GET POSTS] ZERO posts found for userId:', userId);
      console.warn('[GET POSTS] This means:');
      console.warn('   - Either this user has not created any posts');
      console.warn('   - Or posts were created with a different user_id');
      console.warn('   - Check if wallet address matches between post creation and profile');
    }

    // Show sample of all posts to help debug
    if (userId && posts?.length === 0) {
      console.warn('[GET POSTS] Investigating why no posts found...');

      // Get the current user's wallet address
      const { data: currentUser } = await supabase
        .from('users')
        .select('wallet_address, username')
        .eq('id', userId)
        .single();

      console.warn('[GET POSTS] Current User Info:', {
        userId: userId,
        username: currentUser?.username,
        wallet: currentUser?.wallet_address
      });

      // Get sample of all posts with their wallet addresses
      const { data: allPosts } = await supabase
        .from('posts')
        .select('id, user_id, title, created_at, users!inner(wallet_address, username)')
        .order('created_at', { ascending: false })
        .limit(5);

      console.warn('[GET POSTS] Sample of 5 most recent posts in database:');
      allPosts?.forEach((p, idx) => {
        const user = Array.isArray(p.users) ? p.users[0] : p.users;
        console.warn(`   ${idx + 1}. Post "${p.title}":`);
        console.warn(`      - Post ID: ${p.id}`);
        console.warn(`      - Post user_id: ${p.user_id}`);
        console.warn(`      - Post wallet: ${user?.wallet_address}`);
        console.warn(`      - Post username: ${user?.username}`);
        console.warn(`      - Created: ${p.created_at}`);
        console.warn(`      - Matches current user? ${p.user_id === userId ? 'YES' : 'NO'}`);
      });

      console.warn('');
      console.warn('[GET POSTS] DIAGNOSIS:');
      if (currentUser && allPosts && allPosts.length > 0) {
        const matchingWallet = allPosts.find(p => {
          const user = Array.isArray(p.users) ? p.users[0] : p.users;
          return user?.wallet_address === currentUser.wallet_address;
        });
        if (matchingWallet) {
          console.warn('   Found posts with same WALLET but different user_id!');
          console.warn('   This suggests duplicate user profiles were created.');

          // Check for duplicate user profiles
          const { data: duplicateUsers } = await supabase
            .from('users')
            .select('id, username, wallet_address, created_at')
            .eq('wallet_address', currentUser.wallet_address);

          if (duplicateUsers && duplicateUsers.length > 1) {
            console.warn('   FOUND DUPLICATE USER PROFILES for same wallet:');
            duplicateUsers.forEach((user, idx) => {
              console.warn(`      ${idx + 1}. User ID: ${user.id}, Username: ${user.username}, Created: ${user.created_at}`);
            });
          }
        } else {
          console.warn('   No posts found for this wallet address.');
          console.warn('   These posts belong to different wallet(s).');

          // Show which wallets own the posts
          const uniqueWallets = Array.from(new Set(allPosts.map(p => {
            const user = Array.isArray(p.users) ? p.users[0] : p.users;
            return user?.wallet_address;
          })));
          console.warn('   Posts in database belong to these wallet(s):');
          uniqueWallets.forEach((wallet, idx) => {
            const postCount = allPosts.filter(p => {
              const user = Array.isArray(p.users) ? p.users[0] : p.users;
              return user?.wallet_address === wallet;
            }).length;
            console.warn(`      ${idx + 1}. ${wallet} (${postCount} post${postCount > 1 ? 's' : ''})`);
          });
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      data: {
        posts: posts || [],
        count: count || 0,
        limit,
        offset,
      },
    });

    // Add explicit no-cache headers to the response
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('[GET POSTS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
