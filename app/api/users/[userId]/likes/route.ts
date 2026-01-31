import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/users/[userId]/likes
 * Get posts liked by a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get liked posts with post and user data
    const { data: likes, error } = await supabase
      .from('post_likes')
      .select(`
        id,
        created_at,
        posts:post_id (
          id,
          title,
          media_urls,
          media_type,
          users:user_id (
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[User Likes API] Database error:', error);
      throw error;
    }

    // Format the response
    const formattedLikes = likes
      ?.filter((like: any) => like.posts) // Filter out deleted posts
      .map((like: any) => ({
        id: like.posts.id,
        title: like.posts.title,
        mediaUrls: like.posts.media_urls,
        mediaType: like.posts.media_type,
        user: {
          username: like.posts.users?.username,
          displayName: like.posts.users?.display_name,
          avatarUrl: like.posts.users?.avatar_url,
        },
        likedAt: like.created_at,
      })) || [];

    return NextResponse.json({
      success: true,
      data: formattedLikes,
      pagination: {
        limit,
        offset,
        hasMore: formattedLikes.length === limit,
      }
    });

  } catch (error) {
    console.error('[User Likes API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch liked posts'
    }, { status: 500 });
  }
}
