'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BellIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  UserPlusIcon,
  CurrencyDollarIcon,
  FireIcon,
  TrophyIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'earnings' | 'trending' | 'achievement';
  title: string;
  message: string;
  user_id?: string;
  post_id?: string;
  read: boolean;
  created_at: string;
  user?: {
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    content: string;
    earnings_amount?: number;
  };
}

export default function NotificationsPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'earnings' | 'social'>('all');

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth/signin');
      return;
    }

    if (isSignedIn) {
      fetchNotifications();
    }
  }, [userId, isLoaded, router]);

  const fetchNotifications = async () => {
    if (!isSignedIn) return;

    try {
      setLoading(true);

      // Mock notifications - in real app, fetch from notifications table
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'earnings',
          title: 'New Earnings Verified!',
          message: 'Your pump.fun trade has been verified and added to your profile',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          post: {
            id: 'post1',
            content: 'Just made $2,500 on PEPE! 🚀',
            earnings_amount: 2500
          }
        },
        {
          id: '2',
          type: 'like',
          title: 'New Like',
          message: 'cryptotrader99 liked your post',
          user_id: 'user1',
          post_id: 'post1',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          user: {
            id: 'user1',
            display_name: 'Crypto Trader',
            username: 'cryptotrader99',
            avatar_url: undefined
          }
        },
        {
          id: '3',
          type: 'follow',
          title: 'New Follower',
          message: 'pumpking420 started following you',
          user_id: 'user2',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          user: {
            id: 'user2',
            display_name: 'Pump King',
            username: 'pumpking420',
            avatar_url: undefined
          }
        },
        {
          id: '4',
          type: 'trending',
          title: 'Post is Trending!',
          message: 'Your post about DOGE is now trending in the community',
          post_id: 'post2',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          post: {
            id: 'post2',
            content: 'DOGE to the moon! 🐕',
            earnings_amount: 1200
          }
        },
        {
          id: '5',
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: 'You\'ve earned the "First $1K" badge',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
        },
        {
          id: '6',
          type: 'comment',
          title: 'New Comment',
          message: 'moonboy123 commented on your post',
          user_id: 'user3',
          post_id: 'post1',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          user: {
            id: 'user3',
            display_name: 'Moon Boy',
            username: 'moonboy123',
            avatar_url: undefined
          }
        }
      ];

      setNotifications(mockNotifications);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <HeartIcon className="h-5 w-5 text-red-400" />;
      case 'comment':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-blue-400" />;
      case 'follow':
        return <UserPlusIcon className="h-5 w-5 text-green-400" />;
      case 'earnings':
        return <CurrencyDollarIcon className="h-5 w-5 text-green-400" />;
      case 'trending':
        return <FireIcon className="h-5 w-5 text-orange-400" />;
      case 'achievement':
        return <TrophyIcon className="h-5 w-5 text-yellow-400" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'border-red-500/20 bg-red-500/5';
      case 'comment':
        return 'border-blue-500/20 bg-blue-500/5';
      case 'follow':
        return 'border-green-500/20 bg-green-500/5';
      case 'earnings':
        return 'border-green-500/20 bg-green-500/5';
      case 'trending':
        return 'border-orange-500/20 bg-orange-500/5';
      case 'achievement':
        return 'border-yellow-500/20 bg-yellow-500/5';
      default:
        return 'border-gray-500/20 bg-gray-500/5';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (activeFilter) {
      case 'unread':
        return !notification.read;
      case 'earnings':
        return notification.type === 'earnings' || notification.type === 'achievement';
      case 'social':
        return ['like', 'comment', 'follow'].includes(notification.type);
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
            <p className="text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex space-x-1 mb-6 bg-gray-800/50 p-1 rounded-lg">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'earnings', label: 'Earnings', count: notifications.filter(n => n.type === 'earnings' || n.type === 'achievement').length },
            { id: 'social', label: 'Social', count: notifications.filter(n => ['like', 'comment', 'follow'].includes(n.type)).length },
          ].map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter(filter.id as any)}
              className={`flex items-center space-x-2 ${
                activeFilter === filter.id 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>{filter.label}</span>
              {filter.count > 0 && (
                <Badge className="bg-gray-600 text-white text-xs">
                  {filter.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardContent className="p-8 text-center">
              <BellIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No notifications</h3>
              <p className="text-gray-400">
                {activeFilter === 'all' 
                  ? "You're all caught up! Check back later for updates."
                  : `No ${activeFilter} notifications found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`bg-gray-800/50 border-gray-700/50 transition-all hover:border-purple-500/50 ${
                  !notification.read ? 'border-l-4 border-l-purple-500' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{notification.title}</h3>
                          <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                          
                          {/* User info */}
                          {notification.user && (
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">
                                  {notification.user.display_name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <span className="text-sm text-gray-400">
                                @{notification.user.username}
                              </span>
                            </div>
                          )}

                          {/* Post preview */}
                          {notification.post && (
                            <div className="p-3 bg-gray-900/50 rounded-lg mb-2">
                              <p className="text-sm text-gray-300 line-clamp-2">
                                {notification.post.content}
                              </p>
                              {notification.post.earnings_amount && (
                                <div className="flex items-center space-x-1 mt-2">
                                  <CurrencyDollarIcon className="h-4 w-4 text-green-400" />
                                  <span className="text-sm text-green-400 font-semibold">
                                    ${notification.post.earnings_amount.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                            {!notification.read && (
                              <Badge className="bg-purple-600 text-white text-xs">New</Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="text-gray-400 hover:text-white"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
