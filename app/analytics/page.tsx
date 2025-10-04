'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowTrendingUpIcon, 
  UserGroupIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon,
  ShareIcon,
  CurrencyDollarIcon,
  EyeIcon,
  FireIcon,
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface AnalyticsData {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalEarnings: number;
  followers: number;
  following: number;
  profileViews: number;
  engagementRate: number;
  avgEarningsPerPost: number;
  topPerformingPost: {
    id: string;
    content: string;
    likes: number;
    earnings: number;
  } | null;
  weeklyStats: {
    posts: number;
    likes: number;
    followers: number;
    earnings: number;
  };
  monthlyStats: {
    posts: number;
    likes: number;
    followers: number;
    earnings: number;
  };
}

export default function AnalyticsPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth/signin');
      return;
    }

    if (isSignedIn) {
      fetchAnalytics();
    }
  }, [userId, isLoaded, router, timeRange]);

  const fetchAnalytics = async () => {
    if (!isSignedIn) return;

    try {
      setLoading(true);

      // Fetch user's posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('privy_user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Calculate analytics
      const totalPosts = posts?.length || 0;
      const totalLikes = posts?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;
      const totalComments = posts?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0;
      const totalShares = posts?.reduce((sum, post) => sum + (post.shares_count || 0), 0) || 0;
      const totalEarnings = posts?.reduce((sum, post) => sum + (post.earnings_amount || 0), 0) || 0;
      
      const engagementRate = totalPosts > 0 ? ((totalLikes + totalComments + totalShares) / totalPosts) : 0;
      const avgEarningsPerPost = totalPosts > 0 ? totalEarnings / totalPosts : 0;

      // Find top performing post
      const topPost = posts?.reduce((top, post) => {
        const postScore = (post.likes_count || 0) + (post.earnings_amount || 0);
        const topScore = (top.likes_count || 0) + (top.earnings_amount || 0);
        return postScore > topScore ? post : top;
      }, posts?.[0] || null);

      // Calculate time-based stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weeklyPosts = posts?.filter(post => new Date(post.created_at) >= weekAgo) || [];
      const monthlyPosts = posts?.filter(post => new Date(post.created_at) >= monthAgo) || [];

      const weeklyStats = {
        posts: weeklyPosts.length,
        likes: weeklyPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0),
        followers: 0, // Would need followers table
        earnings: weeklyPosts.reduce((sum, post) => sum + (post.earnings_amount || 0), 0),
      };

      const monthlyStats = {
        posts: monthlyPosts.length,
        likes: monthlyPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0),
        followers: 0, // Would need followers table
        earnings: monthlyPosts.reduce((sum, post) => sum + (post.earnings_amount || 0), 0),
      };

      setAnalytics({
        totalPosts,
        totalLikes,
        totalComments,
        totalShares,
        totalEarnings,
        followers: 0, // Would need followers table
        following: 0, // Would need followers table
        profileViews: 0, // Would need analytics table
        engagementRate,
        avgEarningsPerPost,
        topPerformingPost: topPost ? {
          id: topPost.id,
          content: topPost.content,
          likes: topPost.likes_count || 0,
          earnings: topPost.earnings_amount || 0,
        } : null,
        weeklyStats,
        monthlyStats,
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">No analytics data available</p>
          <Button onClick={fetchAnalytics} className="bg-purple-600 hover:bg-purple-700">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const currentStats = timeRange === 'week' ? analytics.weeklyStats : 
                     timeRange === 'month' ? analytics.monthlyStats : 
                     {
                       posts: analytics.totalPosts,
                       likes: analytics.totalLikes,
                       followers: analytics.followers,
                       earnings: analytics.totalEarnings,
                     };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">Track your performance and growth</p>
          </div>
          
          <div className="flex space-x-2">
            {(['week', 'month', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className={timeRange === range ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
              >
                {range === 'week' ? '7D' : range === 'month' ? '30D' : 'All'}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Posts</CardTitle>
              <ArrowTrendingUpIcon className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{currentStats.posts}</div>
              <p className="text-xs text-gray-400">
                {timeRange === 'week' && 'This week'}
                {timeRange === 'month' && 'This month'}
                {timeRange === 'all' && 'All time'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Likes</CardTitle>
              <HeartIcon className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{currentStats.likes.toLocaleString()}</div>
              <p className="text-xs text-gray-400">
                {analytics.totalPosts > 0 && `${Math.round(currentStats.likes / currentStats.posts)} per post`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Earnings</CardTitle>
              <CurrencyDollarIcon className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${currentStats.earnings.toLocaleString()}</div>
              <p className="text-xs text-gray-400">
                {analytics.totalPosts > 0 && `$${Math.round(currentStats.earnings / currentStats.posts)} avg`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Engagement Rate</CardTitle>
              <FireIcon className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{analytics.engagementRate.toFixed(1)}</div>
              <p className="text-xs text-gray-400">Avg per post</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">Performance Overview</CardTitle>
              <CardDescription className="text-gray-400">
                Your content performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ChatBubbleLeftIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-gray-300">Comments</span>
                </div>
                <span className="text-white font-semibold">{analytics.totalComments}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShareIcon className="h-5 w-5 text-green-400" />
                  <span className="text-gray-300">Shares</span>
                </div>
                <span className="text-white font-semibold">{analytics.totalShares}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-300">Followers</span>
                </div>
                <span className="text-white font-semibold">{analytics.followers}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">Profile Views</span>
                </div>
                <span className="text-white font-semibold">{analytics.profileViews}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">Top Performing Post</CardTitle>
              <CardDescription className="text-gray-400">
                Your best performing content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topPerformingPost ? (
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {analytics.topPerformingPost.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <HeartIcon className="h-4 w-4 text-red-400" />
                        <span className="text-sm text-gray-300">{analytics.topPerformingPost.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CurrencyDollarIcon className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-gray-300">${analytics.topPerformingPost.earnings}</span>
                      </div>
                    </div>
                    <Badge className="bg-purple-600 text-white">Top Post</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No posts yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Growth Trends */}
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Growth Trends</CardTitle>
            <CardDescription className="text-gray-400">
              Compare your performance across different time periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-2">{analytics.weeklyStats.posts}</div>
                <div className="text-sm text-gray-400 mb-1">Posts (7 days)</div>
                <div className="flex items-center justify-center space-x-1">
                  <ArrowUpIcon className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-green-400">+12%</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-2">{analytics.weeklyStats.likes}</div>
                <div className="text-sm text-gray-400 mb-1">Likes (7 days)</div>
                <div className="flex items-center justify-center space-x-1">
                  <ArrowUpIcon className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-green-400">+8%</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-2">${analytics.weeklyStats.earnings}</div>
                <div className="text-sm text-gray-400 mb-1">Earnings (7 days)</div>
                <div className="flex items-center justify-center space-x-1">
                  <ArrowUpIcon className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-green-400">+15%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
