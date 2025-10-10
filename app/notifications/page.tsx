'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  HeartIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  ShoppingCartIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'likes', label: 'Likes' },
    { id: 'comments', label: 'Comments' },
    { id: 'follows', label: 'Follows' },
    { id: 'sales', label: 'Sales' },
  ];

  const notifications = [
    {
      id: '1',
      type: 'like',
      user: {
        name: 'Sarah Chen',
        username: 'sarahc',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        verified: true
      },
      action: 'liked your post',
      target: 'Cosmic Dreams #127',
      targetImage: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=100&h=100&fit=crop',
      time: '2m ago',
      read: false
    },
    {
      id: '2',
      type: 'comment',
      user: {
        name: 'Marcus Johnson',
        username: 'marcusj',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
        verified: true
      },
      action: 'commented on your post',
      comment: 'This is absolutely stunning! 🔥',
      target: 'Digital Sunset Series',
      targetImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      time: '15m ago',
      read: false
    },
    {
      id: '3',
      type: 'follow',
      user: {
        name: 'Emma Williams',
        username: 'emmaw',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
        verified: false
      },
      action: 'started following you',
      time: '1h ago',
      read: false
    },
    {
      id: '4',
      type: 'sale',
      user: {
        name: 'David Park',
        username: 'davidp',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        verified: true
      },
      action: 'bought your NFT',
      target: 'Abstract Flow #42',
      targetImage: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=100&h=100&fit=crop',
      price: '2.5 SOL',
      time: '2h ago',
      read: true
    },
    {
      id: '5',
      type: 'like',
      user: {
        name: 'Alex Morrison',
        username: 'alexm',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
        verified: true
      },
      action: 'liked your post',
      target: 'Neon Dreams Collection',
      targetImage: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=100&h=100&fit=crop',
      time: '3h ago',
      read: true
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <HeartIcon className="w-5 h-5 text-pink-500" />;
      case 'comment':
        return <ChatBubbleLeftIcon className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlusIcon className="w-5 h-5 text-purple-500" />;
      case 'sale':
        return <ShoppingCartIcon className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="pb-20 md:pb-6 -mx-4 sm:mx-0">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Notifications</h1>
            <Button 
              variant="ghost" 
              className="text-purple-400 text-sm hover:text-purple-300"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            {filters.map((f) => (
              <Button
                key={f.id}
                onClick={() => setFilter(f.id)}
                variant={filter === f.id ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'whitespace-nowrap transition-all',
                  filter === f.id
                    ? 'flexstream-gradient text-white border-0'
                    : 'bg-card-bg border-white/20 text-secondary hover:text-primary hover:bg-card-bg/80'
                )}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-0 md:space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => notification.targetImage && router.push('/post/1')}
              className={cn(
                "px-4 py-4 md:rounded-2xl transition-all cursor-pointer group border-b md:border border-white/5 hover:border-white/10",
                !notification.read && "bg-purple-500/5 md:bg-card-bg/50",
                notification.read && "md:bg-card-bg"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon Badge */}
                <div className="w-10 h-10 bg-card-bg rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white/10">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10 ring-2 ring-white/10 group-hover:ring-white/20 transition-all flex-shrink-0">
                  <AvatarImage src={notification.user.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold text-sm">
                    {notification.user.name[0]}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm leading-relaxed">
                      <span className="text-primary font-semibold group-hover:text-purple-400 transition-colors">
                        {notification.user.name}
                      </span>
                      {notification.user.verified && (
                        <span className="inline-flex items-center ml-1">
                          <span className="w-3.5 h-3.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full inline-flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold">✓</span>
                          </span>
                        </span>
                      )}
                      <span className="text-secondary"> {notification.action}</span>
                      {notification.target && (
                        <span className="text-primary font-medium"> {notification.target}</span>
                      )}
                    </p>
                    <span className="text-secondary text-xs whitespace-nowrap">{notification.time}</span>
                  </div>

                  {notification.comment && (
                    <p className="text-secondary text-sm mb-2 italic">"{notification.comment}"</p>
                  )}

                  {notification.price && (
                    <p className="text-metric-green font-semibold text-sm">{notification.price}</p>
                  )}
                </div>

                {/* Target Image */}
                {notification.targetImage && (
                  <img
                    src={notification.targetImage}
                    alt={notification.target}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0 ring-2 ring-white/10 group-hover:ring-white/20 transition-all"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-6 text-center px-4 sm:px-0">
          <Button variant="outline" className="bg-card-bg border-white/20 text-primary hover:bg-card-bg/80 w-full sm:w-auto">
            Load More Notifications
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
