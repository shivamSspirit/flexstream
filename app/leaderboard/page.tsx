'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrophyIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  FireIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
    verified: boolean;
    success_tier: string;
  };
  stats: {
    total_earnings: number;
    total_posts: number;
    total_likes: number;
    followers_count: number;
    win_rate: number;
  };
  change: 'up' | 'down' | 'same';
  change_amount: number;
}

export default function LeaderboardPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [category, setCategory] = useState<'earnings' | 'followers' | 'engagement'>('earnings');

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth/signin');
      return;
    }

    if (isSignedIn) {
      fetchLeaderboard();
    }
  }, [userId, isLoaded, router, timeRange, category]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      // Mock leaderboard data - in real app, fetch from database
      const mockData: LeaderboardEntry[] = [
        {
          rank: 1,
          user: {
            id: '1',
            display_name: 'Crypto King',
            username: 'cryptoking',
            verified: true,
            success_tier: 'legendary'
          },
          stats: {
            total_earnings: 125000,
            total_posts: 45,
            total_likes: 12500,
            followers_count: 2500,
            win_rate: 87
          },
          change: 'up',
          change_amount: 2
        },
        {
          rank: 2,
          user: {
            id: '2',
            display_name: 'Pump Master',
            username: 'pumpmaster',
            verified: true,
            success_tier: 'expert'
          },
          stats: {
            total_earnings: 98000,
            total_posts: 38,
            total_likes: 9800,
            followers_count: 2100,
            win_rate: 82
          },
          change: 'down',
          change_amount: 1
        },
        {
          rank: 3,
          user: {
            id: '3',
            display_name: 'Moon Trader',
            username: 'moontrader',
            verified: true,
            success_tier: 'expert'
          },
          stats: {
            total_earnings: 75000,
            total_posts: 32,
            total_likes: 7500,
            followers_count: 1800,
            win_rate: 79
          },
          change: 'up',
          change_amount: 3
        },
        {
          rank: 4,
          user: {
            id: '4',
            display_name: 'Diamond Hands',
            username: 'diamondhands',
            verified: true,
            success_tier: 'advanced'
          },
          stats: {
            total_earnings: 62000,
            total_posts: 28,
            total_likes: 6200,
            followers_count: 1500,
            win_rate: 75
          },
          change: 'same',
          change_amount: 0
        },
        {
          rank: 5,
          user: {
            id: '5',
            display_name: 'Rocket Fuel',
            username: 'rocketfuel',
            verified: true,
            success_tier: 'advanced'
          },
          stats: {
            total_earnings: 48000,
            total_posts: 25,
            total_likes: 4800,
            followers_count: 1200,
            win_rate: 72
          },
          change: 'down',
          change_amount: 2
        }
      ];

      // Add more entries to fill top 20
      for (let i = 6; i <= 20; i++) {
        mockData.push({
          rank: i,
          user: {
            id: i.toString(),
            display_name: `Trader ${i}`,
            username: `trader${i}`,
            verified: Math.random() > 0.5,
            success_tier: ['beginner', 'intermediate', 'advanced', 'expert'][Math.floor(Math.random() * 4)]
          },
          stats: {
            total_earnings: Math.floor(Math.random() * 30000) + 10000,
            total_posts: Math.floor(Math.random() * 20) + 10,
            total_likes: Math.floor(Math.random() * 3000) + 1000,
            followers_count: Math.floor(Math.random() * 800) + 200,
            win_rate: Math.floor(Math.random() * 30) + 50
          },
          change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as any,
          change_amount: Math.floor(Math.random() * 5)
        });
      }

      setLeaderboard(mockData);

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophyIcon className="h-6 w-6 text-yellow-400" />;
      case 2:
        return <StarIcon className="h-6 w-6 text-gray-400" />;
      case 3:
        return <StarIcon className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-400/30';
      case 2:
        return 'bg-gradient-to-r from-gray-300/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-400/20 to-amber-600/20 border-amber-400/30';
      default:
        return 'bg-gray-800/50 border-gray-700/50';
    }
  };

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />;
      case 'down':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-red-400 rotate-180" />;
      default:
        return <span className="text-gray-400">—</span>;
    }
  };

  const getCategoryValue = (entry: LeaderboardEntry) => {
    switch (category) {
      case 'earnings':
        return entry.stats.total_earnings;
      case 'followers':
        return entry.stats.followers_count;
      case 'engagement':
        return entry.stats.total_likes;
      default:
        return entry.stats.total_earnings;
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'earnings':
        return 'Total Earnings';
      case 'followers':
        return 'Followers';
      case 'engagement':
        return 'Total Likes';
      default:
        return 'Total Earnings';
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'earnings':
        return <CurrencyDollarIcon className="h-5 w-5 text-green-400" />;
      case 'followers':
        return <UserGroupIcon className="h-5 w-5 text-blue-400" />;
      case 'engagement':
        return <HeartIcon className="h-5 w-5 text-red-400" />;
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-green-400" />;
    }
  };

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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-gray-400">Top performers in the FlexStream community</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Time Range */}
          <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
            {(['week', 'month', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className={timeRange === range ? 'bg-purple-600 hover:bg-purple-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'}
              >
                {range === 'week' ? '7D' : range === 'month' ? '30D' : 'All'}
              </Button>
            ))}
          </div>

          {/* Category */}
          <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
            {[
              { id: 'earnings', label: 'Earnings', icon: CurrencyDollarIcon },
              { id: 'followers', label: 'Followers', icon: UserGroupIcon },
              { id: 'engagement', label: 'Engagement', icon: HeartIcon },
            ].map((cat) => (
              <Button
                key={cat.id}
                variant={category === cat.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCategory(cat.id as any)}
                className={`flex items-center space-x-2 ${
                  category === cat.id 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <cat.icon className="h-4 w-4" />
                <span>{cat.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        {!loading && leaderboard.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            {leaderboard[1] && (
              <Card className={`${getRankColor(2)} border-2`}>
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    {getRankIcon(2)}
                  </div>
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-lg">
                      {leaderboard[1].user.display_name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1">{leaderboard[1].user.display_name}</h3>
                  <p className="text-gray-400 text-sm mb-3">@{leaderboard[1].user.username}</p>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    {getCategoryIcon()}
                    <span className="text-white font-semibold">
                      {category === 'earnings' ? `$${getCategoryValue(leaderboard[1]).toLocaleString()}` :
                       category === 'followers' ? getCategoryValue(leaderboard[1]).toLocaleString() :
                       getCategoryValue(leaderboard[1]).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    {getChangeIcon(leaderboard[1].change)}
                    <span className="text-xs text-gray-400">
                      {leaderboard[1].change_amount > 0 ? `+${leaderboard[1].change_amount}` : leaderboard[1].change_amount}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 1st Place */}
            {leaderboard[0] && (
              <Card className={`${getRankColor(1)} border-2`}>
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    {getRankIcon(1)}
                  </div>
                  <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-xl">
                      {leaderboard[0].user.display_name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-xl mb-1">{leaderboard[0].user.display_name}</h3>
                  <p className="text-gray-400 text-sm mb-3">@{leaderboard[0].user.username}</p>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    {getCategoryIcon()}
                    <span className="text-white font-semibold text-lg">
                      {category === 'earnings' ? `$${getCategoryValue(leaderboard[0]).toLocaleString()}` :
                       category === 'followers' ? getCategoryValue(leaderboard[0]).toLocaleString() :
                       getCategoryValue(leaderboard[0]).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    {getChangeIcon(leaderboard[0].change)}
                    <span className="text-xs text-gray-400">
                      {leaderboard[0].change_amount > 0 ? `+${leaderboard[0].change_amount}` : leaderboard[0].change_amount}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3rd Place */}
            {leaderboard[2] && (
              <Card className={`${getRankColor(3)} border-2`}>
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    {getRankIcon(3)}
                  </div>
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-lg">
                      {leaderboard[2].user.display_name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1">{leaderboard[2].user.display_name}</h3>
                  <p className="text-gray-400 text-sm mb-3">@{leaderboard[2].user.username}</p>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    {getCategoryIcon()}
                    <span className="text-white font-semibold">
                      {category === 'earnings' ? `$${getCategoryValue(leaderboard[2]).toLocaleString()}` :
                       category === 'followers' ? getCategoryValue(leaderboard[2]).toLocaleString() :
                       getCategoryValue(leaderboard[2]).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    {getChangeIcon(leaderboard[2].change)}
                    <span className="text-xs text-gray-400">
                      {leaderboard[2].change_amount > 0 ? `+${leaderboard[2].change_amount}` : leaderboard[2].change_amount}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <TrophyIcon className="h-5 w-5" />
              <span>Full Leaderboard - {getCategoryLabel()}</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Rankings based on {timeRange === 'week' ? '7-day' : timeRange === 'month' ? '30-day' : 'all-time'} performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.user.id}
                    className={`flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-700/30 transition-colors ${
                      entry.rank <= 3 ? getRankColor(entry.rank) : 'bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(entry.rank)}
                    </div>

                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {entry.user.display_name.charAt(0)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white truncate">
                          {entry.user.display_name}
                        </h3>
                        {entry.user.verified && (
                          <Badge className="bg-blue-600 text-white text-xs">Verified</Badge>
                        )}
                        <Badge className="bg-purple-600 text-white text-xs">
                          {entry.user.success_tier.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">@{entry.user.username}</p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon()}
                        <span className="text-white font-semibold">
                          {category === 'earnings' ? `$${getCategoryValue(entry).toLocaleString()}` :
                           category === 'followers' ? getCategoryValue(entry).toLocaleString() :
                           getCategoryValue(entry).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-end space-x-1 mt-1">
                        {getChangeIcon(entry.change)}
                        <span className="text-xs text-gray-400">
                          {entry.change_amount > 0 ? `+${entry.change_amount}` : entry.change_amount}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/profile/${entry.user.username}`)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
