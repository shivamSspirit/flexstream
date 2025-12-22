import { NextRequest } from 'next/server';
import { createHandler } from '@/lib/api/createHandler';
import { db } from '@/lib/database/client';
import { ValidationError } from '@/lib/errors/AppError';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications?userId=xxx
 * Get all notifications for a user
 */
export const GET = createHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!userId) {
    throw new ValidationError('Missing required param: userId');
  }

  const { data: notifications, error } = await db
    .from('notifications')
    .select(`
      *,
      from_user:users!notifications_from_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        verified
      ),
      post:posts (
        id,
        title,
        content,
        media_urls
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Get unread count
  const { count: unreadCount } = await db
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  return {
    notifications: notifications || [],
    unreadCount: unreadCount || 0
  };
});

/**
 * POST /api/notifications/mark-read
 * Mark notifications as read
 */
export const POST = createHandler(async (request: NextRequest) => {
  const { userId, notificationIds } = await request.json();

  if (!userId) {
    throw new ValidationError('Missing required field: userId');
  }

  if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
    // Mark specific notifications as read
    const { error } = await db
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .in('id', notificationIds);

    if (error) throw error;

    return { message: `Marked ${notificationIds.length} notifications as read` };
  } else {
    // Mark all notifications as read
    const { error } = await db
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;

    return { message: 'All notifications marked as read' };
  }
});
