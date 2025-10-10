'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  HeartIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('7d');

  const timeframes = [
    { id: '24h', label: '24H' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: 'all', label: 'All Time' },
  ];

  const stats = [
    {
      label: 'Total Earnings',
      value: '$12,345',
      change: '+23.5%',
      positive: true,
      icon: CurrencyDollarIcon,
      color: 'text-metric-green'
    },
    {
      label: 'Total Views',
      value: '45.2K',
      change: '+12.3%',
      positive: true,
      icon: EyeIcon,
      color: 'text-blue-400'
    },
    {
      label: 'Total Likes',
      value: '8.9K',
      change: '+18.7%',
      positive: true,
      icon: HeartIcon,
      color: 'text-pink-400'
    },
    {
      label: 'Followers',
      value: '2.4K',
      change: '+5.2%',
      positive: true,
      icon: UserGroupIcon,
      color: 'text-purple-400'
    },
  ];

  const topPosts = [
    {
      id: '1',
      title: 'Cosmic Dreams #127',
      image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=100&h=100&fit=crop',
      views: '12.5K',
      likes: '2.3K',
      earnings: '$3,450',
      date: '2 days ago'
    },
    {
      id: '2',
      title: 'Digital Sunset Series',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      views: '10.2K',
      likes: '1.9K',
      earnings: '$2,890',
      date: '5 days ago'
    },
    {
      id: '3',
      title: 'Abstract Flow #42',
      image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=100&h=100&fit=crop',
      views: '8.7K',
      likes: '1.6K',
      earnings: '$2,340',
      date: '1 week ago'
    },
  ];

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="pb-20 md:pb-6 -mx-4 sm:mx-0">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 flexstream-gradient rounded-2xl flex items-center justify-center">
              <ChartBarIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Analytics</h1>
              <p className="text-sm text-secondary">Track your performance</p>
            </div>
          </div>

          {/* Timeframe Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            {timeframes.map((tf) => (
              <Button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                variant={timeframe === tf.id ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'whitespace-nowrap transition-all',
                  timeframe === tf.id
                    ? 'flexstream-gradient text-white border-0'
                    : 'bg-card-bg border-white/20 text-secondary hover:text-primary hover:bg-card-bg/80'
                )}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-0 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-card-bg to-card-bg/50 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center", stat.color)}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-primary mb-1">{stat.value}</p>
              <p className="text-secondary text-xs sm:text-sm mb-2">{stat.label}</p>
              <Badge className={cn(
                "text-xs px-2 py-0.5",
                stat.positive 
                  ? "bg-metric-green/20 text-metric-green border-metric-green/30"
                  : "bg-metric-red/20 text-metric-red border-metric-red/30"
              )}>
                {stat.positive ? (
                  <ArrowTrendingUpIcon className="w-3 h-3 inline mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-3 h-3 inline mr-1" />
                )}
                {stat.change}
              </Badge>
            </div>
          ))}
        </div>

        {/* Chart Placeholder */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="bg-gradient-to-br from-card-bg to-card-bg/50 rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-semibold text-primary mb-4">Earnings Over Time</h3>
            <div className="h-64 bg-white/5 rounded-xl flex items-center justify-center">
              <p className="text-secondary">Chart visualization coming soon</p>
            </div>
          </div>
        </div>

        {/* Top Posts */}
        <div className="px-4 sm:px-0">
          <h3 className="text-lg font-semibold text-primary mb-4">Top Performing Posts</h3>
          <div className="space-y-3">
            {topPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => router.push(`/post/${post.id}`)}
                className="bg-card-bg rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all cursor-pointer group w-full text-left"
              >
                <div className="flex items-center gap-4">
                  {/* Post Image */}
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-16 h-16 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-white/20 transition-all flex-shrink-0"
                  />

                  {/* Post Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-primary font-semibold mb-1 truncate group-hover:text-purple-400 transition-colors">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-secondary">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-3.5 h-3.5" />
                        {post.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <HeartIcon className="w-3.5 h-3.5" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {post.date}
                      </span>
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-metric-green">{post.earnings}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
