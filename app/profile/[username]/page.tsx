'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  UserPlusIcon,
  UserMinusIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  FireIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { FlexPost } from '@/types';

interface UserProfile {
  id: string;
  display_name: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  verified: boolean;
  success_tier: string;
  created_at: string;
  wallet_address?: string;
}

interface UserStats {
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_earnings: number;
  followers_count: number;
  following_count: number;
  profile_views: number;
}

export default function UserProfileViewPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<FlexPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');

  // Fetch current user ID from wallet
  useEffect(() => {
    async function fetchCurrentUser() {
      if (!connected || !publicKey || !supabase) {
        setCurrentUserId(null);
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', publicKey.toBase58())
        .single();

      if (data) {
        setCurrentUserId(data.id);
      }
    }
    fetchCurrentUser();
  }, [connected, publicKey]);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      if (!supabase) {
        console.error('Supabase not configured');
        setLoading(false);
        router.push('/discover');
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        router.push('/discover');
        return;
      }

      if (!profileData) {
        router.push('/discover');
        return;
      }

      setProfile(profileData);

      // Fetch user's posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*)
        `)
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }

      setPosts(postsData || []);

      // Calculate stats
      const totalLikes = (postsData || []).reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalComments = (postsData || []).reduce((sum, post) => sum + (post.comments_count || 0), 0);
      const totalShares = (postsData || []).reduce((sum, post) => sum + (post.shares_count || 0), 0);
      const totalEarnings = (postsData || []).reduce((sum, post) => sum + (post.earnings_amount || 0), 0);

      setStats({
        total_posts: postsData?.length || 0,
        total_likes: totalLikes,
        total_comments: totalComments,
        total_shares: totalShares,
        total_earnings: totalEarnings,
        followers_count: Math.floor(Math.random() * 1000) + 100, // Mock data
        following_count: Math.floor(Math.random() * 500) + 50, // Mock data
        profile_views: Math.floor(Math.random() * 5000) + 1000, // Mock data
      });

      // Check if current user is following this user
      if (currentUserId) {
        // Mock following status - in real app, check followers table
        setFollowing(Math.random() > 0.5);
      }

    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId || !profile) return;

    try {
      // In real app, update followers table
      setFollowing(!following);
      
      if (stats) {
        setStats({
          ...stats,
          followers_count: following ? stats.followers_count - 1 : stats.followers_count + 1
        });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  const copyWalletAddress = async () => {
    if (!profile?.wallet_address) return;

    try {
      await navigator.clipboard.writeText(profile.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying wallet address:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-700 rounded-lg"></div>
            <div className="h-32 bg-gray-700 rounded-lg"></div>
            <div className="h-48 bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">User not found</p>
          <Button onClick={() => router.push('/discover')} className="bg-purple-600 hover:bg-purple-700">
            Back to Discover
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="bg-gray-800/50 border-gray-700/50 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {profile.display_name?.charAt(0) || 'U'}
                  </span>
                </div>
                {profile.verified && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-2xl font-bold text-white">{profile.display_name}</h1>
                      {profile.verified && (
                        <Badge className="bg-blue-600 text-white">Verified</Badge>
                      )}
                      <Badge className="bg-purple-600 text-white">
                        {profile.success_tier.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-gray-400 mb-2">@{profile.username}</p>
                    {profile.bio && (
                      <p className="text-gray-300 mb-4">{profile.bio}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    {!isOwnProfile && (
                      <Button
                        onClick={handleFollow}
                        variant={following ? 'outline' : 'default'}
                        className={following 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                          : 'bg-purple-600 hover:bg-purple-700'
                        }
                      >
                        {following ? (
                          <>
                            <UserMinusIcon className="h-4 w-4 mr-2" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <ShareIcon className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{stats.total_posts}</div>
                    <div className="text-sm text-gray-400">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{stats.followers_count.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{stats.following_count.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">${stats.total_earnings.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Earnings</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Address */}
        {profile.wallet_address && (
          <Card className="bg-gray-800/50 border-gray-700/50 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <CurrencyDollarIcon className="h-5 w-5" />
                <span>Wallet Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-900/50 p-3 rounded text-sm text-gray-300 font-mono">
                  {profile.wallet_address}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyWalletAddress}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-green-400" />
                  ) : (
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800/50 p-1 rounded-lg">
          <Button
            variant={activeTab === 'posts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('posts')}
            className={`flex-1 ${
              activeTab === 'posts' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Posts ({stats.total_posts})
          </Button>
          <Button
            variant={activeTab === 'about' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('about')}
            className={`flex-1 ${
              activeTab === 'about' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            About
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-400">No posts yet</p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="bg-gray-800/50 border-gray-700/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {profile.display_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-white">{profile.display_name}</h3>
                          {profile.verified && (
                            <Badge className="bg-blue-600 text-white text-xs">Verified</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          @{profile.username} • {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-200 mb-4">{post.content}</p>
                    
                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className="mb-4">
                        {post.media_urls.map((url, index) => (
                          <div key={index} className="mb-2">
                            {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img 
                                src={url} 
                                alt={`Post media ${index + 1}`}
                                className="w-full h-64 object-cover rounded-lg"
                              />
                            ) : url.match(/\.(mp4|webm|ogg|avi|mov)$/i) ? (
                              <video 
                                src={url} 
                                controls
                                className="w-full h-64 object-cover rounded-lg"
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}

                    {post.social_link && (
                      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <a 
                          href={post.social_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-2"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          <span>{post.social_link}</span>
                        </a>
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
                        <button className="flex items-center space-x-1 hover:text-red-400 transition-colors">
                          <HeartIcon className="h-4 w-4" />
                          <span className="text-sm">{post.likes_count}</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
                          <ChatBubbleLeftIcon className="h-4 w-4" />
                          <span className="text-sm">{post.comments_count}</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-green-400 transition-colors">
                          <ShareIcon className="h-4 w-4" />
                          <span className="text-sm">{post.shares_count}</span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white">About {profile.display_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Performance Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{stats.total_likes.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Total Likes</div>
                  </div>
                  <div className="p-3 bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{stats.total_comments.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Total Comments</div>
                  </div>
                  <div className="p-3 bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{stats.total_shares.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Total Shares</div>
                  </div>
                  <div className="p-3 bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{stats.profile_views.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Profile Views</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Member Since</h3>
                <p className="text-gray-300">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {profile.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Bio</h3>
                  <p className="text-gray-300">{profile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
