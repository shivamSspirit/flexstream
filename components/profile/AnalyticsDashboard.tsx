'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  SparklesIcon,
  ShieldCheckIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface AnalyticsDashboardProps {
  userId: string;
  walletAddress?: string;
  isOwnProfile?: boolean;
}

interface AnalyticsData {
  trustScore: number;
  successTier: string;
  socialVerification: {
    twitter: { verified: boolean; username?: string; followers: number };
    youtube: { verified: boolean; channelName?: string; subscribers: number };
    tiktok: { verified: boolean; username?: string; followers: number };
  };
  totalSocialFollowers: number;
  followers: { total: number; following: number; newInPeriod: number };
  content: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    engagementRate: number;
    tokensCreated: number;
  };
  trading: {
    totalTrades: number;
    totalVolumeSol: string;
    buyTrades: number;
    sellTrades: number;
    feesEarned: number;
  };
  chartData: Array<{
    date: string;
    post_views: number;
    token_volume: number;
    new_followers: number;
  }>;
  period: string;
}

export function AnalyticsDashboard({ userId, walletAddress, isOwnProfile }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [userId, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        userId,
        period,
      });
      if (walletAddress) params.set('wallet', walletAddress);

      const response = await fetch(`/api/users/analytics?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getTrustScoreColor = (score: number): string => {
    if (score >= 80) return 'from-accent-green to-accent-cyan';
    if (score >= 60) return 'from-accent-cyan to-accent-blue';
    if (score >= 40) return 'from-accent-blue to-accent-purple';
    if (score >= 20) return 'from-accent-purple to-accent-pink';
    return 'from-gray-500 to-gray-600';
  };

  const getTrustScoreLabel = (score: number): string => {
    if (score >= 80) return 'Highly Trusted';
    if (score >= 60) return 'Trusted';
    if (score >= 40) return 'Building Trust';
    if (score >= 20) return 'New Creator';
    return 'Unverified';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="w-16 h-16 mx-auto text-white/20 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Analytics Yet</h3>
        <p className="text-white/50">Start creating posts and trading to see your stats!</p>
      </div>
    );
  }

  const verifiedPlatforms = [
    analytics.socialVerification.twitter.verified,
    analytics.socialVerification.youtube.verified,
    analytics.socialVerification.tiktok.verified,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6 text-accent-cyan" />
          Analytics Dashboard
        </h2>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(['7d', '30d', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                period === p
                  ? 'bg-accent-green text-black'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              )}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Trust Score Card - Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent-green/20 to-accent-cyan/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Trust Score Circle */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-black/50 flex items-center justify-center">
              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, ${analytics.trustScore >= 80 ? '#CCFF00' : analytics.trustScore >= 60 ? '#00FFFF' : analytics.trustScore >= 40 ? '#6366F1' : '#EC4899'} ${analytics.trustScore * 3.6}deg, transparent 0)`,
                }}
              />
              <div className="w-24 h-24 rounded-full bg-black flex flex-col items-center justify-center z-10">
                <span className={cn('text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent', getTrustScoreColor(analytics.trustScore))}>
                  {analytics.trustScore}
                </span>
                <span className="text-xs text-white/50">Trust Score</span>
              </div>
            </div>
            <ShieldCheckIcon className="absolute -top-1 -right-1 w-8 h-8 text-accent-green" />
          </div>

          {/* Trust Score Details */}
          <div className="flex-1 text-center md:text-left">
            <h3 className={cn('text-2xl font-black bg-gradient-to-r bg-clip-text text-transparent', getTrustScoreColor(analytics.trustScore))}>
              {getTrustScoreLabel(analytics.trustScore)}
            </h3>
            <p className="text-white/60 text-sm mt-1 mb-4">
              Based on social verification, follower count, and activity
            </p>

            {/* Verification badges */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {analytics.socialVerification.twitter.verified && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <CheckBadgeIcon className="w-4 h-4 text-accent-green" />
                  <span className="text-xs font-medium text-white/70">{formatNumber(analytics.socialVerification.twitter.followers)}</span>
                </div>
              )}
              {analytics.socialVerification.youtube.verified && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-950 border border-red-800">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#EF4444">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                  </svg>
                  <CheckBadgeIcon className="w-4 h-4 text-accent-green" />
                  <span className="text-xs font-medium text-white/70">{formatNumber(analytics.socialVerification.youtube.subscribers)}</span>
                </div>
              )}
              {analytics.socialVerification.tiktok.verified && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-950 to-cyan-950 border border-pink-700">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F472B6">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                  <CheckBadgeIcon className="w-4 h-4 text-accent-green" />
                  <span className="text-xs font-medium text-white/70">{formatNumber(analytics.socialVerification.tiktok.followers)}</span>
                </div>
              )}
              {verifiedPlatforms === 0 && (
                <span className="text-sm text-white/40">No verified accounts yet</span>
              )}
            </div>
          </div>

          {/* Total Social Followers */}
          <div className="text-center px-6 py-4 rounded-xl bg-black/30 border border-white/10">
            <UserGroupIcon className="w-8 h-8 mx-auto text-accent-cyan mb-2" />
            <div className="text-2xl font-black text-white">{formatNumber(analytics.totalSocialFollowers)}</div>
            <div className="text-xs text-white/50">Total Followers</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Content Stats */}
        <StatCard
          icon={<SparklesIcon className="w-5 h-5" />}
          label="Posts"
          value={analytics.content.totalPosts}
          gradient="from-accent-purple to-accent-pink"
        />
        <StatCard
          icon={<HeartIcon className="w-5 h-5" />}
          label="Total Likes"
          value={analytics.content.totalLikes}
          gradient="from-red-500 to-pink-500"
        />
        <StatCard
          icon={<ChatBubbleLeftIcon className="w-5 h-5" />}
          label="Comments"
          value={analytics.content.totalComments}
          gradient="from-accent-cyan to-accent-blue"
        />
        <StatCard
          icon={<FireIcon className="w-5 h-5" />}
          label="Engagement Rate"
          value={`${analytics.content.engagementRate}x`}
          gradient="from-orange-500 to-red-500"
          isString
        />
      </div>

      {/* Trading & Followers Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trading Stats */}
        <div className="rounded-xl bg-gradient-to-br from-accent-green/10 to-accent-cyan/10 border border-accent-green/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CurrencyDollarIcon className="w-5 h-5 text-accent-green" />
            <h3 className="font-bold text-white">Trading Activity</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-black text-white">{analytics.trading.totalTrades}</div>
              <div className="text-xs text-white/50">Total Trades</div>
            </div>
            <div>
              <div className="text-2xl font-black text-accent-green">{analytics.trading.totalVolumeSol} SOL</div>
              <div className="text-xs text-white/50">Volume</div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                <span className="text-lg font-bold text-green-400">{analytics.trading.buyTrades}</span>
              </div>
              <div className="text-xs text-white/50">Buys</div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
                <span className="text-lg font-bold text-red-400">{analytics.trading.sellTrades}</span>
              </div>
              <div className="text-xs text-white/50">Sells</div>
            </div>
          </div>
        </div>

        {/* Follower Stats */}
        <div className="rounded-xl bg-gradient-to-br from-accent-purple/10 to-accent-blue/10 border border-accent-purple/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserGroupIcon className="w-5 h-5 text-accent-purple" />
            <h3 className="font-bold text-white">FlexStream Followers</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-black text-white">{formatNumber(analytics.followers.total)}</div>
              <div className="text-xs text-white/50">Followers</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{formatNumber(analytics.followers.following)}</div>
              <div className="text-xs text-white/50">Following</div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <ArrowTrendingUpIcon className="w-4 h-4 text-accent-green" />
                <span className="text-2xl font-black text-accent-green">+{analytics.followers.newInPeriod}</span>
              </div>
              <div className="text-xs text-white/50">New ({period})</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tokens Created */}
      <div className="rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <span className="text-2xl">🪙</span>
            </div>
            <div>
              <h3 className="font-bold text-white">Tokens Created</h3>
              <p className="text-sm text-white/50">Post and creator tokens launched</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {analytics.content.tokensCreated}
            </div>
            <div className="text-xs text-white/50">tokens</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  gradient,
  isString = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  gradient: string;
  isString?: boolean;
}) {
  const formatValue = (val: number | string) => {
    if (isString) return val;
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 hover:border-white/20 transition-colors group">
      <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3 group-hover:scale-110 transition-transform', gradient)}>
        <span className="text-white">{icon}</span>
      </div>
      <div className="text-2xl font-black text-white">{formatValue(value)}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}
