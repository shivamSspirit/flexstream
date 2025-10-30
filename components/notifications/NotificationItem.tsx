'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type NotificationType = 'follow' | 'collect' | 'buy' | 'comment' | 'like' | 'mention';

export interface NotificationItemProps {
  id: string;
  type: NotificationType;
  sender: {
    name: string;
    username: string;
    avatar: string;
  };
  action: string;
  assetThumbnail?: string;
  assetTitle?: string;
  timestamp: string;
  isUnread: boolean;
  href?: string;
  onMarkAsRead?: (id: string) => void;
}

const notificationIcons = {
  follow: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
    </svg>
  ),
  collect: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
      <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  ),
  buy: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
    </svg>
  ),
  comment: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
    </svg>
  ),
  like: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
  ),
  mention: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  ),
};

const notificationColors = {
  follow: 'text-blue-400 bg-blue-500/10',
  collect: 'text-purple-400 bg-purple-500/10',
  buy: 'text-green-400 bg-green-500/10',
  comment: 'text-yellow-400 bg-yellow-500/10',
  like: 'text-pink-400 bg-pink-500/10',
  mention: 'text-orange-400 bg-orange-500/10',
};

export function NotificationItem({
  id,
  type,
  sender,
  action,
  assetThumbnail,
  assetTitle,
  timestamp,
  isUnread,
  href,
  onMarkAsRead,
}: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(id);
    }
    if (href) {
      router.push(href);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      className={cn(
        'flex gap-3 p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group',
        isUnread && 'bg-white/[0.03]'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Notification from ${sender.name}: ${action}`}
    >
      {/* Avatar with Type Icon Badge */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12 ring-2 ring-white/5">
          <AvatarImage src={sender.avatar} alt={sender.name} />
          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold">
            {sender.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Type Icon Badge */}
        <div
          className={cn(
            'absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center',
            notificationColors[type]
          )}
          aria-label={`${type} notification`}
        >
          {notificationIcons[type]}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Text Content */}
        <div className="mb-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/profile/${sender.username}`);
            }}
            className="font-semibold text-white hover:text-white/80 transition-colors text-sm"
          >
            {sender.name}
          </button>
          <span className="text-white/60 text-sm ml-1">{action}</span>
          {assetTitle && (
            <span className="text-white font-medium text-sm ml-1">&quot;{assetTitle}&quot;</span>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-white/40 text-xs">{timestamp}</div>
      </div>

      {/* Asset Thumbnail (Optional) */}
      {assetThumbnail && (
        <div className="flex-shrink-0">
          <img
            src={assetThumbnail}
            alt={assetTitle || 'Asset'}
            className="w-12 h-12 rounded-lg object-cover"
          />
        </div>
      )}

      {/* Unread Indicator */}
      {isUnread && (
        <div className="flex-shrink-0 pt-2">
          <div
            className="w-2 h-2 rounded-full bg-blue-500"
            aria-label="Unread notification"
          />
        </div>
      )}
    </article>
  );
}
