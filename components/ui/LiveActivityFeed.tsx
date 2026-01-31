'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Zap, Users, MessageCircle, Heart, Repeat2 } from 'lucide-react';

type ActivityType = 'buy' | 'sell' | 'trade' | 'follow' | 'like' | 'comment' | 'repost' | 'mint';

interface ActivityItem {
  id: string;
  type: ActivityType;
  user: {
    name: string;
    avatar?: string;
    username: string;
  };
  target?: {
    name: string;
    symbol?: string;
  };
  amount?: number;
  timestamp: Date;
}

interface LiveActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  showTimestamp?: boolean;
  animated?: boolean;
  className?: string;
}

const activityConfig: Record<ActivityType, {
  icon: typeof TrendingUp;
  color: string;
  bgColor: string;
  verb: string;
}> = {
  buy: {
    icon: TrendingUp,
    color: 'text-gain',
    bgColor: 'bg-gain/10',
    verb: 'bought',
  },
  sell: {
    icon: TrendingDown,
    color: 'text-loss',
    bgColor: 'bg-loss/10',
    verb: 'sold',
  },
  trade: {
    icon: Repeat2,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    verb: 'traded',
  },
  follow: {
    icon: Users,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    verb: 'followed',
  },
  like: {
    icon: Heart,
    color: 'text-coral-400',
    bgColor: 'bg-coral-400/10',
    verb: 'liked',
  },
  comment: {
    icon: MessageCircle,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    verb: 'commented on',
  },
  repost: {
    icon: Repeat2,
    color: 'text-neon-lime',
    bgColor: 'bg-neon-lime/10',
    verb: 'reposted',
  },
  mint: {
    icon: Zap,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
    verb: 'minted',
  },
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function formatAmount(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`;
  return `$${amount.toFixed(2)}`;
}

export function LiveActivityFeed({
  activities,
  maxItems = 10,
  showTimestamp = true,
  animated = true,
  className,
}: LiveActivityFeedProps) {
  const [visibleActivities, setVisibleActivities] = useState<ActivityItem[]>([]);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const displayActivities = activities.slice(0, maxItems);

    // Track new items for animation
    setVisibleActivities(prev => {
      const newIds = new Set(
        displayActivities
          .filter(a => !prev.find(v => v.id === a.id))
          .map(a => a.id)
      );

      if (newIds.size > 0) {
        setNewItemIds(newIds);
        setTimeout(() => setNewItemIds(new Set()), 500);
      }

      return displayActivities;
    });
  }, [activities, maxItems]);

  return (
    <div className={cn('space-y-1', className)}>
      {visibleActivities.map((activity) => {
        const config = activityConfig[activity.type];
        const Icon = config.icon;
        const isNew = newItemIds.has(activity.id);

        return (
          <div
            key={activity.id}
            className={cn(
              'activity-item group',
              animated && isNew && 'animate-slide-in-bounce'
            )}
          >
            {/* Icon */}
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon size={14} className={config.color} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 truncate">
                <span className="font-semibold text-white">
                  {activity.user.name}
                </span>
                {' '}
                <span className={config.color}>{config.verb}</span>
                {' '}
                {activity.target && (
                  <span className="font-semibold text-white">
                    {activity.target.symbol || activity.target.name}
                  </span>
                )}
                {activity.amount && (
                  <span className="font-mono text-white/60 ml-1">
                    {formatAmount(activity.amount)}
                  </span>
                )}
              </p>
            </div>

            {/* Timestamp */}
            {showTimestamp && (
              <span className="text-xs text-white/30 font-mono">
                {formatTimeAgo(activity.timestamp)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Single activity notification (for toasts)
interface ActivityNotificationProps {
  activity: ActivityItem;
  onDismiss?: () => void;
  className?: string;
}

export function ActivityNotification({ activity, onDismiss, className }: ActivityNotificationProps) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  useEffect(() => {
    if (onDismiss) {
      const timeout = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timeout);
    }
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'notification-toast flex items-center gap-3',
        activity.type === 'buy' && 'gain',
        activity.type === 'sell' && 'loss',
        className
      )}
    >
      <div className={cn('p-2 rounded-lg', config.bgColor)}>
        <Icon size={16} className={config.color} />
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium text-white">
          {activity.user.name} {config.verb} {activity.target?.name || activity.target?.symbol}
        </p>
        {activity.amount && (
          <p className={cn('text-xs font-mono mt-0.5', config.color)}>
            {formatAmount(activity.amount)}
          </p>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-white/40 hover:text-white transition-colors"
        >
          ×
        </button>
      )}
    </div>
  );
}

// Live counter for "X people trading right now"
interface LiveCounterProps {
  count: number;
  label?: string;
  className?: string;
}

export function LiveCounter({ count, label = 'trading now', className }: LiveCounterProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setDisplayCount(prev => {
      if (count !== prev) {
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 300);
      }
      return count;
    });
  }, [count]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="live-indicator" />
      <span
        className={cn(
          'font-mono font-bold text-white transition-all duration-300',
          isUpdating && 'animate-price-up'
        )}
      >
        {displayCount.toLocaleString()}
      </span>
      <span className="text-white/60 text-sm">{label}</span>
    </div>
  );
}

// Trending indicator
interface TrendingIndicatorProps {
  rank: number;
  change?: number;
  className?: string;
}

export function TrendingIndicator({ rank, change, className }: TrendingIndicatorProps) {
  const isHot = rank <= 3;
  const isTrending = rank <= 10;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold',
        isHot && 'bg-coral-400/20 text-coral-400 border border-coral-400/30 animate-hot-badge-pulse',
        isTrending && !isHot && 'bg-gold/20 text-gold border border-gold/30',
        !isTrending && 'bg-white/10 text-white/60 border border-white/20',
        className
      )}
    >
      {isHot && <span>🔥</span>}
      <span>#{rank}</span>
      {change !== undefined && change !== 0 && (
        <span className={cn(change > 0 ? 'text-gain' : 'text-loss')}>
          {change > 0 ? '↑' : '↓'}{Math.abs(change)}
        </span>
      )}
    </div>
  );
}
