import { NextRequest } from 'next/server';
import { createHandler } from '@/lib/api/createHandler';
import { db } from '@/lib/database/client';
import { ValidationError } from '@/lib/errors/AppError';

export const dynamic = 'force-dynamic';

/**
 * POST /api/posts/like
 * Like or unlike a post
 */
export const POST = createHandler(async (request: NextRequest) => {
  const { postId, userId } = await request.json();

  if (!postId || !userId) {
    throw new ValidationError('Missing required fields: postId, userId');
  }

  // Check if already liked
  const { data: existingLike } = await db
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existingLike) {
    // Unlike - remove the like
    const { error } = await db
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;

    // Get updated like count
    const { count } = await db
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return {
      liked: false,
      likeCount: count || 0,
      message: 'Post unliked'
    };
  } else {
    // Like - add new like
    const { error } = await db
      .from('likes')
      .insert({
        post_id: postId,
        user_id: userId,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    // Get post owner for notification
    const { data: post } = await db
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    // Create notification if not liking own post
    if (post && post.user_id !== userId) {
      await db.from('notifications').insert({
        user_id: post.user_id,
        type: 'like',
        from_user_id: userId,
        post_id: postId,
        read: false,
        created_at: new Date().toISOString()
      });
    }

    // Get updated like count
    const { count } = await db
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return {
      liked: true,
      likeCount: count || 0,
      message: 'Post liked'
    };
  }
});

/**
 * GET /api/posts/like?postId=xxx&userId=xxx
 * Check if user has liked a post
 */
export const GET = createHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');
  const userId = searchParams.get('userId');

  if (!postId || !userId) {
    throw new ValidationError('Missing required params: postId, userId');
  }

  const { data } = await db
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  return { liked: !!data };
});
