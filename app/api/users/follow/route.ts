import { NextRequest } from 'next/server';
import { createHandler } from '@/lib/api/createHandler';
import { db } from '@/lib/database/client';
import { ValidationError } from '@/lib/errors/AppError';

export const dynamic = 'force-dynamic';

/**
 * POST /api/users/follow
 * Follow or unfollow a user
 */
export const POST = createHandler(async (request: NextRequest) => {
  const { followerId, followingId } = await request.json();

  if (!followerId || !followingId) {
    throw new ValidationError('Missing required fields: followerId, followingId');
  }

  if (followerId === followingId) {
    throw new ValidationError('Cannot follow yourself');
  }

  // Check if already following
  const { data: existingFollow } = await db
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (existingFollow) {
    // Unfollow - remove the follow
    const { error } = await db
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;

    // Get updated follower count
    const { count } = await db
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', followingId);

    return {
      following: false,
      followerCount: count || 0,
      message: 'Unfollowed successfully'
    };
  } else {
    // Follow - add new follow
    const { error } = await db
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    // Create notification
    await db.from('notifications').insert({
      user_id: followingId,
      type: 'follow',
      from_user_id: followerId,
      read: false,
      created_at: new Date().toISOString()
    });

    // Get updated follower count
    const { count } = await db
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', followingId);

    return {
      following: true,
      followerCount: count || 0,
      message: 'Followed successfully'
    };
  }
});

/**
 * GET /api/users/follow?followerId=xxx&followingId=xxx
 * Check if follower is following followingId
 */
export const GET = createHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const followerId = searchParams.get('followerId');
  const followingId = searchParams.get('followingId');

  if (!followerId || !followingId) {
    throw new ValidationError('Missing required params: followerId, followingId');
  }

  const { data } = await db
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  return { following: !!data };
});
