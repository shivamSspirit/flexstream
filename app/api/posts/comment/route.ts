import { NextRequest } from 'next/server';
import { createHandler } from '@/lib/api/createHandler';
import { db } from '@/lib/database/client';
import { ValidationError } from '@/lib/errors/AppError';

export const dynamic = 'force-dynamic';

/**
 * POST /api/posts/comment
 * Add a comment to a post
 */
export const POST = createHandler(async (request: NextRequest) => {
  const { postId, userId, content, parentId } = await request.json();

  if (!postId || !userId || !content) {
    throw new ValidationError('Missing required fields: postId, userId, content');
  }

  if (content.trim().length === 0) {
    throw new ValidationError('Comment cannot be empty');
  }

  if (content.length > 500) {
    throw new ValidationError('Comment cannot exceed 500 characters');
  }

  // Insert comment
  const { data: comment, error } = await db
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content: content.trim(),
      parent_id: parentId || null,
      created_at: new Date().toISOString()
    })
    .select(`
      *,
      users!inner (
        id,
        username,
        display_name,
        avatar_url,
        verified
      )
    `)
    .single();

  if (error) throw error;

  // Get post owner for notification
  const { data: post } = await db
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  // Create notification if not commenting on own post
  if (post && post.user_id !== userId) {
    await db.from('notifications').insert({
      user_id: post.user_id,
      type: 'comment',
      from_user_id: userId,
      post_id: postId,
      read: false,
      created_at: new Date().toISOString()
    });
  }

  // If replying to another comment, notify parent commenter
  if (parentId) {
    const { data: parentComment } = await db
      .from('comments')
      .select('user_id')
      .eq('id', parentId)
      .single();

    if (parentComment && parentComment.user_id !== userId) {
      await db.from('notifications').insert({
        user_id: parentComment.user_id,
        type: 'reply',
        from_user_id: userId,
        post_id: postId,
        read: false,
        created_at: new Date().toISOString()
      });
    }
  }

  // Get updated comment count
  const { count } = await db
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  return {
    comment,
    commentCount: count || 0,
    message: 'Comment added successfully'
  };
});

/**
 * GET /api/posts/comment?postId=xxx
 * Get all comments for a post
 */
export const GET = createHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');

  if (!postId) {
    throw new ValidationError('Missing required param: postId');
  }

  const { data: comments, error } = await db
    .from('comments')
    .select(`
      *,
      users!inner (
        id,
        username,
        display_name,
        avatar_url,
        verified
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return { comments: comments || [] };
});
