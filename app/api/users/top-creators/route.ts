import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/users/top-creators
 *
 * Returns top creators based on post count
 * Nikita Bier Strategy: Show real, active users to create social proof and FOMO
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
    const limit = parseInt(searchParams.get('limit') || '5');

    console.log('🔥 [TOP CREATORS] Fetching top creators, limit:', limit);

    // Get users with their post counts
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        display_name,
        wallet_address,
        avatar_url,
        bio,
        posts!inner(id)
      `)
      .order('created_at', { ascending: false })
      .limit(100); // Get more users to count their posts

    if (error) {
      console.error('❌ [TOP CREATORS] Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch creators',
      }, { status: 500 });
    }

    // Count posts for each user and sort
    const creatorsWithCounts = users
      .map(user => ({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        wallet_address: user.wallet_address,
        avatar_url: user.avatar_url,
        bio: user.bio,
        post_count: Array.isArray(user.posts) ? user.posts.length : 0,
      }))
      .filter(creator => creator.post_count > 0) // Only include users with posts
      .sort((a, b) => b.post_count - a.post_count) // Sort by post count descending
      .slice(0, limit); // Take top N

    console.log('✅ [TOP CREATORS] Found creators:', {
      total: creatorsWithCounts.length,
      creators: creatorsWithCounts.map(c => ({
        username: c.username,
        posts: c.post_count
      }))
    });

    return NextResponse.json({
      success: true,
      data: {
        creators: creatorsWithCounts,
      },
    });

  } catch (error) {
    console.error('❌ [TOP CREATORS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
