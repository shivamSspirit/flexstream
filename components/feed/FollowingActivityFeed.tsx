'use client';

import { useFollowingActivity } from '@/hooks/useFollowingActivity';
import { FollowingActivityCard } from '@/components/feed/FollowingActivityCard';
import { FollowingActivitySkeleton } from '@/components/feed/FollowingActivitySkeleton';
import type { SubFilter } from '@/components/feed/FeedTabs';

interface FollowingActivityFeedProps {
  userId?: string;
  isAuthenticated: boolean;
  onLogin: () => void;
  onTrade?: (tokenMint: string) => void;
  subFilter: SubFilter;
}

export function FollowingActivityFeed({
  userId,
  isAuthenticated,
  onLogin,
  onTrade,
  subFilter,
}: FollowingActivityFeedProps) {
  const { data, isLoading } = useFollowingActivity({
    userId,
    limit: 20,
    sort: subFilter,
    enabled: isAuthenticated && !!userId,
  });

  const activities = data?.data?.activities || [];

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <div
          className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(255, 45, 146, 0.1)' }}
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="#FF2D92"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <p className="text-[14px] font-medium mb-1" style={{ color: '#FAFAFA' }}>
          Connect to see activity
        </p>
        <p className="text-[12px] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Sign in to see what people you follow are trading
        </p>
        <button
          onClick={onLogin}
          className="px-6 py-2.5 rounded-lg text-[12px] font-semibold transition-all duration-150 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #FF2D92 0%, #e0267f 100%)',
            color: '#fff',
          }}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <FollowingActivitySkeleton />;
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div className="p-8 text-center">
        <div
          className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
          style={{ background: 'rgba(255, 45, 146, 0.08)' }}
        >
          {'\u{1F465}'}
        </div>
        <p className="text-[14px] font-medium mb-1" style={{ color: '#FAFAFA' }}>
          No activity yet
        </p>
        <p className="text-[12px] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Follow creators to see their trades here
        </p>
        <a
          href="/explore"
          className="inline-block px-6 py-2.5 rounded-lg text-[12px] font-semibold transition-all duration-150 active:scale-95"
          style={{
            background: 'rgba(255, 45, 146, 0.15)',
            border: '0.5px solid rgba(255, 45, 146, 0.3)',
            color: '#FF2D92',
          }}
        >
          Explore Creators
        </a>
      </div>
    );
  }

  // Activity list
  return (
    <div>
      {activities.map((activity, idx) => (
        <FollowingActivityCard
          key={activity.id}
          activity={activity}
          index={idx}
          onTrade={onTrade}
        />
      ))}
    </div>
  );
}
