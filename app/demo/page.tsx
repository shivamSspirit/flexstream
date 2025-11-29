'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WalletMultiButton } from '@/lib/wallet';
import { SimpleFeed } from '@/components/feed/SimpleFeed';
import { 
  ArrowTrendingUpIcon, 
  FireIcon, 
  CurrencyDollarIcon,
  UserGroupIcon,
  PlayIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

export default function DemoPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'feed' | 'creators' | 'live'>('feed');

  const mockPosts = [
    {
      id: '1',
      user: {
        username: 'cryptotrader99',
        displayName: 'Crypto Trader',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        verified: true,
        successTier: 'diamond' as const,
      },
      type: 'earnings_flex' as const,
      content: 'Just made $50K on this pump! 🚀 The community was right about this one. Always DYOR but sometimes the crowd knows best!',
      earningsAmount: 50000,
      tokenAddress: 'So11111111111111111111111111111111111111112',
      verified: true,
      likesCount: 1247,
      commentsCount: 89,
      sharesCount: 156,
      createdAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      user: {
        username: 'pumpmaster',
        displayName: 'Pump Master',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        verified: true,
        successTier: 'gold' as const,
      },
      type: 'stream_highlight' as const,
      content: 'Check out this insane call from my stream yesterday! Called the top within 2% accuracy 📈',
      mediaUrls: ['https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop'],
      earningsAmount: 25000,
      verified: true,
      likesCount: 892,
      commentsCount: 67,
      sharesCount: 134,
      createdAt: '2024-01-15T08:15:00Z',
    },
    {
      id: '3',
      user: {
        username: 'solanalife',
        displayName: 'Solana Life',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        verified: false,
        successTier: 'silver' as const,
      },
      type: 'lifestyle' as const,
      content: 'Living the dream! From 9-5 to full-time trader. This community changed my life 💜',
      mediaUrls: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop'],
      likesCount: 456,
      commentsCount: 23,
      sharesCount: 78,
      createdAt: '2024-01-15T06:45:00Z',
    },
  ];

  const mockCreators = [
    {
      id: '1',
      username: 'cryptotrader99',
      displayName: 'Crypto Trader',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      bio: 'Professional trader with 5+ years experience. Sharing my journey and insights.',
      verifiedEarnings: 250000,
      successTier: 'diamond' as const,
      totalFollowers: 15420,
      totalFollowing: 892,
      tokenAddress: 'So11111111111111111111111111111111111111112',
    },
    {
      id: '2',
      username: 'pumpmaster',
      displayName: 'Pump Master',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      bio: 'Pump.fun specialist. Live streaming daily calls and analysis.',
      verifiedEarnings: 180000,
      successTier: 'gold' as const,
      totalFollowers: 12350,
      totalFollowing: 456,
      tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'bg-gradient-to-r from-cyan-400 to-blue-500';
      case 'gold': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'silver': return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 'bronze': return 'bg-gradient-to-r from-orange-600 to-red-600';
      default: return 'bg-gray-500';
    }
  };

  const formatEarnings = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/')}
            >
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                FlexStream
              </div>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                Demo Mode
              </Badge>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => router.push('/demo-flow')}
              >
                Creator Journey
              </Button>
              <WalletMultiButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <ArrowTrendingUpIcon className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">$2.4M</p>
                <p className="text-sm text-gray-400">Total Earnings</p>
              </div>
            </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">12.5K</p>
                  <p className="text-sm text-gray-400">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <FireIcon className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-2xl font-bold text-white">847</p>
                  <p className="text-sm text-gray-400">Posts Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CurrencyDollarIcon className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">156</p>
                  <p className="text-sm text-gray-400">Verified Trades</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'feed'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <ArrowTrendingUpIcon className="w-5 h-5" />
            <span>Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'creators'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <UserGroupIcon className="w-5 h-5" />
            <span>Creators</span>
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'live'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <PlayIcon className="w-5 h-5" />
            <span>Live</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* Real Feed Component */}
            <SimpleFeed />
            
            {/* Demo Posts (for demonstration) */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">Demo Posts (Sample Content)</h3>
              {mockPosts.map((post) => (
              <Card key={post.id} className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.user.avatar}
                      alt={post.user.displayName}
                      className="w-12 h-12 rounded-full border-2 border-purple-500/50"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white">{post.user.displayName}</h3>
                        <Badge className={`${getTierColor(post.user.successTier)} text-white text-xs`}>
                          {post.user.successTier}
                        </Badge>
                        {post.user.verified && (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">@{post.user.username} • {formatTimeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-200 mb-4">{post.content}</p>
                  
                  {post.earningsAmount && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-semibold">
                          {formatEarnings(post.earningsAmount)} earned
                        </span>
                        {post.verified && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-300 text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="mb-4">
                      <img
                        src={post.mediaUrls[0]}
                        alt="Post media"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-6 text-gray-400">
                    <button className="flex items-center space-x-2 hover:text-red-400 transition-colors">
                      <FireIcon className="w-5 h-5" />
                      <span>{post.likesCount}</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      <span>{post.commentsCount}</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-green-400 transition-colors">
                      <ArrowTrendingUpIcon className="w-5 h-5" />
                      <span>{post.sharesCount}</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        )}

        {activeTab === 'creators' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCreators.map((creator) => (
              <Card key={creator.id} className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <img
                    src={creator.avatar}
                    alt={creator.displayName}
                    className="w-20 h-20 rounded-full border-4 border-purple-500/50 mx-auto mb-4"
                  />
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <h3 className="font-semibold text-white">{creator.displayName}</h3>
                    <Badge className={`${getTierColor(creator.successTier)} text-white text-xs`}>
                      {creator.successTier}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400">@{creator.username}</p>
                  <p className="text-sm text-gray-300 mt-2">{creator.bio}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Verified Earnings</span>
                      <span className="text-green-400 font-semibold">
                        {formatEarnings(creator.verifiedEarnings)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Followers</span>
                      <span className="text-white font-semibold">
                        {creator.totalFollowers.toLocaleString()}
                      </span>
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Follow
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'live' && (
          <div className="text-center py-12">
            <PlayIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Live Streams</h3>
            <p className="text-gray-400 mb-6">
              Connect your wallet to see live trading streams and real-time earnings
            </p>
            <WalletMultiButton />
          </div>
        )}
      </div>
    </div>
  );
}
