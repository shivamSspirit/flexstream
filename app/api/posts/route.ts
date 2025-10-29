import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
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
        token_name,
        pool_address,
        bonding_curve_address,
        token_metadata_uri,
        token_signature,
        is_token_tradable,
        verified,
        created_at,
        users!inner (
          id,
          username,
          display_name,
          avatar_url,
          wallet_address
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by user if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching posts:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch posts',
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        posts: posts || [],
        count: count || 0,
        limit,
        offset,
      },
    });

  } catch (error) {
    console.error('❌ [GET POSTS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
