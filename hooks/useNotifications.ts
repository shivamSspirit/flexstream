import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'reply' | 'trade';
  from_user_id: string | null;
  post_id: string | null;
  read: boolean;
  created_at: string;
  from_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    verified: boolean;
  } | null;
  post: {
    id: string;
    title: string;
    content: string;
    media_urls: string[];
  } | null;
}

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return { notifications: [], unreadCount: 0 };

      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json() as Promise<{ notifications: Notification[]; unreadCount: number }>;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time feel
  });

  // Mark notifications as read
  const markReadMutation = useMutation({
    mutationFn: async (notificationIds?: string[]) => {
      if (!userId) throw new Error('Must be logged in');

      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationIds }),
      });

      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      // Refetch notifications to update UI
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark notifications as read');
    },
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    error,
    markAsRead: markReadMutation.mutate,
    markAllAsRead: () => markReadMutation.mutate(undefined),
  };
}
