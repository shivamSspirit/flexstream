'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { NotificationItem, NotificationItemProps } from '@/components/notifications/NotificationItem';
import { cn } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState<NotificationItemProps[]>([
    {
      id: '1',
      type: 'like',
      sender: {
        name: 'Sarah Chen',
        username: 'sarahc',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
      },
      action: 'liked your post',
      assetTitle: 'Cosmic Dreams #127',
      assetThumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=100&h=100&fit=crop',
      timestamp: '2m ago',
      isUnread: true,
      href: '/post/1',
    },
    {
      id: '2',
      type: 'comment',
      sender: {
        name: 'Marcus Johnson',
        username: 'marcusj',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
      },
      action: 'commented on your post',
      assetTitle: 'Digital Sunset Series',
      assetThumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      timestamp: '15m ago',
      isUnread: true,
      href: '/post/2',
    },
    {
      id: '3',
      type: 'follow',
      sender: {
        name: 'Emma Williams',
        username: 'emmaw',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      },
      action: 'started following you',
      timestamp: '1h ago',
      isUnread: true,
      href: '/profile/emmaw',
    },
    {
      id: '4',
      type: 'buy',
      sender: {
        name: 'David Park',
        username: 'davidp',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      },
      action: 'bought your post for 2.5 SOL',
      assetTitle: 'Abstract Flow #42',
      assetThumbnail: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=100&h=100&fit=crop',
      timestamp: '2h ago',
      isUnread: false,
      href: '/post/4',
    },
    {
      id: '5',
      type: 'collect',
      sender: {
        name: 'Alex Morrison',
        username: 'alexm',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
      },
      action: 'collected your post',
      assetTitle: 'Neon Dreams Collection',
      assetThumbnail: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=100&h=100&fit=crop',
      timestamp: '3h ago',
      isUnread: false,
      href: '/post/5',
    },
    {
      id: '6',
      type: 'mention',
      sender: {
        name: 'Lisa Anderson',
        username: 'lisaa',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      },
      action: 'mentioned you in a comment',
      assetTitle: 'Summer Vibes',
      assetThumbnail: 'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=100&h=100&fit=crop',
      timestamp: '5h ago',
      isUnread: false,
      href: '/post/6',
    },
    {
      id: '7',
      type: 'follow',
      sender: {
        name: 'James Wilson',
        username: 'jameswilson',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      },
      action: 'started following you',
      timestamp: 'Yesterday',
      isUnread: false,
      href: '/profile/jameswilson',
    },
  ]);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'likes', label: 'Likes' },
    { id: 'comments', label: 'Comments' },
    { id: 'follows', label: 'Follows' },
    { id: 'buys', label: 'Purchases' },
  ];

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isUnread: false } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isUnread: false }))
    );
  };

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="max-w-4xl mx-auto pb-20 md:pb-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-white/50 text-sm mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                onClick={handleMarkAllAsRead}
                className="text-white/70 text-sm hover:text-white hover:bg-white/5"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  filter === f.id
                    ? 'bg-white text-black'
                    : 'bg-[#1a1a1a] text-white/70 hover:text-white hover:bg-[#252525] border border-white/10'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                {...notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              You're all caught up!
            </h3>
            <p className="text-white/50 text-sm">
              No new notifications at the moment.
            </p>
          </div>
        )}

        {/* Load More */}
        {notifications.length > 0 && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              Load More Notifications
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
