'use client';

import Link from 'next/link';
import type { FollowingActivity } from '@/hooks/useFollowingActivity';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatSol(amount: number): string {
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  if (amount >= 1) return amount.toFixed(2);
  return amount.toFixed(4);
}

interface FollowingActivityCardProps {
  activity: FollowingActivity;
  index: number;
  onTrade?: (tokenMint: string) => void;
}

export function FollowingActivityCard({ activity, index, onTrade }: FollowingActivityCardProps) {
  const isBuy = activity.tradeType === 'buy';
  const accentColor = isBuy ? '#00F0FF' : '#FF2D92';
  const actionLabel = isBuy ? 'bought' : activity.tradeType === 'sell' ? 'sold' : 'swapped';

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-all duration-150 hover:bg-white/[0.015]"
      style={{
        borderBottom: '0.5px solid rgba(255,255,255,0.04)',
        borderLeft: `2px solid ${accentColor}`,
        animation: `slideUp 300ms ease-out ${index * 50}ms both`,
      }}
    >
      {/* Avatar */}
      <Link
        href={`/profile/${activity.user.username}`}
        className="flex-shrink-0"
      >
        <div
          className="w-9 h-9 rounded-full overflow-hidden transition-transform duration-150 hover:scale-105"
          style={{ border: '1.5px solid rgba(255,255,255,0.1)' }}
        >
          {activity.user.avatarUrl ? (
            <img
              src={activity.user.avatarUrl}
              alt={activity.user.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-xs font-semibold"
              style={{
                background: isBuy
                  ? 'linear-gradient(135deg, #00F0FF 0%, #14b8a6 100%)'
                  : 'linear-gradient(135deg, #FF2D92 0%, #f87171 100%)',
                color: '#050505',
              }}
            >
              {activity.user.displayName[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] leading-snug" style={{ color: '#FAFAFA' }}>
          <Link
            href={`/profile/${activity.user.username}`}
            className="font-semibold hover:underline"
          >
            @{activity.user.username}
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}> {actionLabel} </span>
          <span className="font-semibold" style={{ color: accentColor }}>
            ${activity.tokenDisplayName || activity.tokenSymbol || 'TOKEN'}
          </span>
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {formatSol(activity.totalSolAmount)} SOL
          </span>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {formatTimeAgo(activity.createdAt)}
          </span>
        </div>
      </div>

      {/* Trade CTA */}
      <button
        onClick={() => onTrade?.(activity.tokenMint)}
        className="flex-shrink-0 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all duration-150 active:scale-95"
        style={{
          background: isBuy ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 45, 146, 0.12)',
          border: `0.5px solid ${isBuy ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 45, 146, 0.25)'}`,
          color: accentColor,
        }}
      >
        Trade
      </button>
    </div>
  );
}
