'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  TrophyIcon,
  FireIcon,
  CheckBadgeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { FireIcon as FireIconSolid } from '@heroicons/react/24/solid';

export function LeaderboardTab() {
  const router = useRouter();
  const {
    leaderboard,
    isLoading,
    error,
    timeframe,
    setTimeframe,
    loadMore,
    hasMore,
  } = useLeaderboard(true);

  const timeframes = [
    { id: '24h' as const, label: '24H' },
    { id: '7d' as const, label: '7D' },
    { id: '30d' as const, label: '30D' },
    { id: 'all_time' as const, label: 'All' },
  ];

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  if (isLoading && leaderboard.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-card-bg rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-white/10 rounded-full" />
              <div className="w-12 h-12 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/10 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-metric-red mb-2">Failed to load leaderboard</p>
        <p className="text-text-muted text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Timeframe Tabs */}
      <div className="flex gap-2 mb-6">
        {timeframes.map((tf) => (
          <button
            key={tf.id}
            onClick={() => setTimeframe(tf.id)}
            className={cn(
              'px-4 py-2 rounded-xl font-semibold text-sm transition-all',
              timeframe === tf.id
                ? 'bg-white text-black'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mb-6 items-end">
          {/* 2nd Place */}
          <div
            onClick={() => router.push(`/profile/${leaderboard[1].walletAddress}`)}
            className="bg-gradient-to-br from-gray-400/20 to-gray-600/20 rounded-xl p-4 text-center cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="text-3xl mb-2">🥈</div>
            <Avatar className="w-12 h-12 mx-auto mb-2 border-2 border-gray-400">
              <AvatarImage src={leaderboard[1].avatarUrl} />
              <AvatarFallback className="bg-gray-500 text-white font-bold">
                {leaderboard[1].displayName[0]}
              </AvatarFallback>
            </Avatar>
            <p className="font-bold text-white text-sm truncate">{leaderboard[1].displayName}</p>
            <p className="text-accent-green font-mono text-sm">{formatVolume(leaderboard[1].metricValue)}</p>
          </div>

          {/* 1st Place */}
          <div
            onClick={() => router.push(`/profile/${leaderboard[0].walletAddress}`)}
            className="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-xl p-4 text-center cursor-pointer hover:scale-105 transition-transform -mt-4"
          >
            <div className="text-4xl mb-2">👑</div>
            <Avatar className="w-14 h-14 mx-auto mb-2 border-2 border-yellow-400">
              <AvatarImage src={leaderboard[0].avatarUrl} />
              <AvatarFallback className="bg-yellow-500 text-black font-bold">
                {leaderboard[0].displayName[0]}
              </AvatarFallback>
            </Avatar>
            <p className="font-bold text-white truncate">{leaderboard[0].displayName}</p>
            <p className="text-accent-green font-mono">{formatVolume(leaderboard[0].metricValue)}</p>
          </div>

          {/* 3rd Place */}
          <div
            onClick={() => router.push(`/profile/${leaderboard[2].walletAddress}`)}
            className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 rounded-xl p-4 text-center cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="text-3xl mb-2">🥉</div>
            <Avatar className="w-12 h-12 mx-auto mb-2 border-2 border-orange-600">
              <AvatarImage src={leaderboard[2].avatarUrl} />
              <AvatarFallback className="bg-orange-600 text-white font-bold">
                {leaderboard[2].displayName[0]}
              </AvatarFallback>
            </Avatar>
            <p className="font-bold text-white text-sm truncate">{leaderboard[2].displayName}</p>
            <p className="text-accent-green font-mono text-sm">{formatVolume(leaderboard[2].metricValue)}</p>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-2">
        {leaderboard.slice(3).map((trader, index) => (
          <button
            key={trader.walletAddress}
            onClick={() => router.push(`/profile/${trader.walletAddress}`)}
            className="w-full bg-card-bg hover:bg-card-hover border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
                index + 4 <= 10 ? 'bg-accent-purple text-white' : 'bg-white/10 text-text-secondary'
              )}>
                {index + 4}
              </div>

              {/* Avatar */}
              <Avatar className="w-10 h-10 shrink-0 border border-white/10">
                <AvatarImage src={trader.avatarUrl} />
                <AvatarFallback className="bg-gray-700 text-white text-sm font-bold">
                  {trader.displayName[0]}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-white text-sm truncate">
                    {trader.displayName}
                  </span>
                  {trader.verifiedEarnings > 10000 && (
                    <CheckBadgeIcon className="w-4 h-4 text-accent-blue shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span>{trader.tradesCount} trades</span>
                  <span>•</span>
                  <span className={cn(
                    trader.winRate >= 60 ? 'text-accent-green' : 'text-text-muted'
                  )}>
                    {trader.winRate.toFixed(0)}% win
                  </span>
                  {trader.currentStreak > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-orange-400">
                        <FireIconSolid className="w-3 h-3" />
                        {trader.currentStreak}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Volume */}
              <div className="text-right shrink-0">
                <p className="font-mono font-bold text-white">
                  {formatVolume(trader.metricValue)}
                </p>
                <p className="text-xs text-text-muted">volume</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Empty State */}
      {leaderboard.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <TrophyIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">No traders on the leaderboard yet</p>
          <p className="text-text-muted text-sm mt-1">Start trading to climb the ranks!</p>
        </div>
      )}
    </div>
  );
}
