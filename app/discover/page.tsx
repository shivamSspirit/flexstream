'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MagnifyingGlassIcon,
  FireIcon,
  TrophyIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface TopPerformer {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  total_posts: number;
  total_likes: number;
  total_earnings: number;
  followers_count: number;
  verified: boolean;
  success_tier: string;
}

interface TrendingPost {
  id: string;
  content: string;
  type: string;
  earnings_amount?: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  verified: boolean;
  user: {
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
    verified: boolean;
  };
  media_urls?: string[];
}

export default function DiscoverPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'performers' | 'trending' | 'leaderboard'>('performers');

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth/signin');
      return;
    }

    if (isSignedIn) {
      fetchDiscoverData();
    }
  }, [userId, isLoaded, router]);

  const fetchDiscoverData = async () => {
    try {
      setLoading(true);

      // Fetch top performers (users with most earnings and engagement)
      const { data: performersData, error: performersError } = await supabase
        .from('users')
        .select(`
          id,
          display_name,
          username,
          avatar_url,
          bio,
          verified,
          success_tier
        `)
        .limit(20);

      if (performersError) {
        console.error('Error fetching performers:', performersError);
        return;
      }

      // Get post stats for each user
      const performersWithStats = await Promise.all(
        (performersData || []).map(async (performer) => {
          const { data: posts } = await supabase
            .from('posts')
            .select('likes_count, earnings_amount')
            .eq('user_id', performer.id);

          const totalLikes = posts?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;
          const totalEarnings = posts?.reduce((sum, post) => sum + (post.earnings_amount || 0), 0) || 0;
          const totalPosts = posts?.length || 0;

          return {
            ...performer,
            total_posts: totalPosts,
            total_likes: totalLikes,
            total_earnings: totalEarnings,
            followers_count: Math.floor(Math.random() * 1000) + 100, // Mock data
          };
        })
      );

      // Sort by total earnings and engagement
      const sortedPerformers = performersWithStats
        .sort((a, b) => (b.total_earnings + b.total_likes) - (a.total_earnings + a.total_likes))
        .slice(0, 10);

      setTopPerformers(sortedPerformers);

      // Fetch trending posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(id, display_name, username, avatar_url, verified)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }

      // Sort by engagement (likes + comments + shares)
      const sortedPosts = (postsData || [])
        .map(post => ({
          ...post,
          engagement_score: (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0)
        }))
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, 10);

      setTrendingPosts(sortedPosts);

    } catch (error) {
      console.error('Error fetching discover data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPerformers = topPerformers.filter(performer =>
    performer.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    performer.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = trendingPosts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-white mb-2">Discover</h1>
          <p className="text-gray-400">Find top performers and trending content</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search traders, posts, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800/50 p-1 rounded-lg">
          {[
            { id: 'performers', label: 'Top Performers', icon: TrophyIcon },
            { id: 'trending', label: 'Trending Posts', icon: FireIcon },
            { id: 'leaderboard', label: 'Leaderboard', icon: ArrowTrendingUpIcon },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 ${
                activeTab === tab.id 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Top Performers */}
            {activeTab === 'performers' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <TrophyIcon className="h-6 w-6 text-yellow-400" />
                  <h2 className="text-xl font-semibold text-white">Top Performers</h2>
                </div>
                
                {filteredPerformers.length === 0 ? (
                  <Card className="bg-gray-800/50 border-gray-700/50">
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-400">No performers found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPerformers.map((performer, index) => (
                      <Card key={performer.id} className="bg-gray-800/50 border-gray-700/50 hover:border-purple-500/50 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {performer.display_name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              {index < 3 && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-black">{index + 1}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-white">{performer.display_name}</h3>
                                {performer.verified && (
                                  <Badge className="bg-blue-600 text-white text-xs">Verified</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">@{performer.username}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">${performer.total_earnings.toLocaleString()}</div>
                              <div className="text-xs text-gray-400">Earnings</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">{performer.total_likes.toLocaleString()}</div>
                              <div className="text-xs text-gray-400">Likes</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-1">
                              <UserGroupIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-400">{performer.followers_count}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ArrowTrendingUpIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-400">{performer.total_posts} posts</span>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                            onClick={() => router.push(`/profile/${performer.username}`)}
                          >
                            View Profile
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trending Posts */}
            {activeTab === 'trending' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <FireIcon className="h-6 w-6 text-orange-400" />
                  <h2 className="text-xl font-semibold text-white">Trending Posts</h2>
                </div>
                
                {filteredPosts.length === 0 ? (
                  <Card className="bg-gray-800/50 border-gray-700/50">
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-400">No trending posts found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map((post) => (
                      <Card key={post.id} className="bg-gray-800/50 border-gray-700/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {post.user.display_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-white">{post.user.display_name}</h3>
                                {post.user.verified && (
                                  <Badge className="bg-blue-600 text-white text-xs">Verified</Badge>
                                )}
                                <Badge className="bg-orange-600 text-white text-xs">Trending</Badge>
                              </div>
                              <p className="text-sm text-gray-400">@{post.user.username}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-gray-200 mb-4 line-clamp-3">{post.content}</p>
                          
                          {post.media_urls && post.media_urls.length > 0 && (
                            <div className="mb-4">
                              {post.media_urls.slice(0, 1).map((url, index) => (
                                <div key={index}>
                                  {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                    <img 
                                      src={url} 
                                      alt={`Post media ${index + 1}`}
                                      className="w-full h-48 object-cover rounded-lg"
                                    />
                                  ) : url.match(/\.(mp4|webm|ogg|avi|mov)$/i) ? (
                                    <video 
                                      src={url} 
                                      controls
                                      className="w-full h-48 object-cover rounded-lg"
                                    />
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          )}

                          {post.earnings_amount && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
                                <span className="text-green-400 font-semibold">
                                  ${post.earnings_amount.toLocaleString()} earned
                                </span>
                                {post.verified && (
                                  <Badge className="bg-green-500/20 text-green-300 text-xs">Verified</Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6 text-gray-400">
                              <div className="flex items-center space-x-1">
                                <HeartIcon className="h-4 w-4" />
                                <span className="text-sm">{post.likes_count}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ChatBubbleLeftIcon className="h-4 w-4" />
                                <span className="text-sm">{post.comments_count}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ShareIcon className="h-4 w-4" />
                                <span className="text-sm">{post.shares_count}</span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
                  <h2 className="text-xl font-semibold text-white">Weekly Leaderboard</h2>
                </div>
                
                <Card className="bg-gray-800/50 border-gray-700/50">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {filteredPerformers.slice(0, 10).map((performer, index) => (
                        <div key={performer.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {performer.display_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-white">{performer.display_name}</h3>
                              {performer.verified && (
                                <Badge className="bg-blue-600 text-white text-xs">Verified</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">@{performer.username}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">${performer.total_earnings.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">Total Earnings</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
