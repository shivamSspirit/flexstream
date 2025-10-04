'use client';

import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaConnectButton } from '@/components/solana/SolanaProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@clerk/nextjs';
import { LiveStreamsGrid } from '@/components/pump-fun/LiveStreamsGrid';
import { 
  PlayIcon, 
  CurrencyDollarIcon, 
  FireIcon, 
  UserGroupIcon,
  RocketLaunchIcon,
  ArrowTrendingUpIcon,
  SignalIcon,
  MagnifyingGlassIcon,
  UserIcon,
  HomeIcon,
  MapIcon,
  PlusIcon,
  BellIcon,
  CogIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const router = useRouter();
  const { connected } = useWallet();
  const { isLoaded, isSignedIn } = useAuth();
  const walletConnected = connected;
  const emailAuthenticated = isLoaded && isSignedIn;

  // If wallet is not connected, show landing page
  if (!walletConnected) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Top Header */}
        <div className="bg-black border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h1 className="text-white text-lg font-semibold">FlexStream - Landing Page</h1>
          <div className="flex items-center space-x-4">
            <SolanaConnectButton />
            {!emailAuthenticated && (
              <Button onClick={() => router.push('/auth/signin')} className="bg-purple-600 hover:bg-purple-700 text-white">
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Left Sidebar */}
          <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">★</span>
                </div>
                <span className="text-white font-bold text-xl">FlexStream</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-4 space-y-2">
              <button 
                onClick={() => router.push('/')}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <HomeIcon className="w-5 h-5" />
                <span>Home</span>
              </button>
              <button 
                onClick={() => router.push('/explore')}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <MapIcon className="w-5 h-5" />
                <span>Explore</span>
              </button>
              <button 
                onClick={() => router.push('/create')}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Post</span>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  9
                </div>
              </button>
              <button 
                onClick={() => router.push('/notifications')}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                <span>Notifications</span>
              </button>
              <button 
                onClick={() => router.push('/profile')}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <UserIcon className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <button 
                onClick={() => router.push('/settings')}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <CogIcon className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button 
                onClick={() => router.push('/saved')}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <BookmarkIcon className="w-5 h-5" />
                <span>Saved</span>
              </button>
            </div>
          </div>

          {/* Feed Content */}
          <div className="flex-1 bg-black p-6">
            <div className="max-w-2xl mx-auto">
              {/* Featured Post */}
              <div className="bg-gray-900 rounded-lg p-6 mb-6">
                {/* Post Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                    alt="User"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="text-white font-medium">droven</div>
                    <div className="text-gray-400 text-sm">4m ago</div>
                  </div>
                  <Badge className="bg-green-500 text-white text-xs px-2 py-1">NEW</Badge>
                </div>

                {/* Post Image */}
                <div className="mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
                    alt="Scribbled Eye and Monster"
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>

                {/* Post Title and Description */}
                <div className="mb-4">
                  <h2 className="text-white font-bold text-xl mb-2">Scribbled Eye and Monster</h2>
                  <p className="text-gray-300">
                    An experiment in combining delicate anatomical details with raw, energetic scribbles. 
                    Capturing the essence of observation and abstract chaos.
                  </p>
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button className="flex items-center space-x-2 text-gray-400 hover:text-white">
                      <span>❤️</span>
                      <span>124</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-400 hover:text-white">
                      <span>💬</span>
                      <span>32</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-400 hover:text-white">
                      <span>📤</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                  <SolanaConnectButton />
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => router.push('/explore')}>
                    Explore
                  </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 bg-gray-900 border-l border-gray-800 p-6">
            <div className="space-y-8">
              {/* Suggested Follow */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-6">Suggested Follow</h3>
                <div className="space-y-4">
                  {[
                    { name: 'm4zin', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face', followers: '12.5K', verified: true },
                    { name: 'artchick', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=48&h=48&fit=crop&crop=face', followers: '8.2K', verified: false },
                    { name: 'suede', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop&crop=face', followers: '15.7K', verified: true }
                  ].map((user) => (
                    <div key={user.name} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                          {user.verified && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1">
                            <span className="text-white font-medium text-sm">{user.name}</span>
                          </div>
                          <span className="text-gray-400 text-xs">{user.followers} followers</span>
                        </div>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1">
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Assets */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-6">Trending Assets</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Quant', price: '0.5 ETH', change: '+12.5%', image: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200&h=200&fit=crop', volume: '2.4K', rank: 1 },
                    { name: 'Cyber', price: '1.2 ETH', change: '+8.2%', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=200&fit=crop', volume: '1.8K', rank: 2 },
                    { name: 'Pixel S', price: '0.8 ETH', change: '+15.7%', image: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=200&h=200&fit=crop', volume: '3.2K', rank: 3 }
                  ].map((asset) => (
                    <div key={asset.name} className="bg-gray-800/30 rounded-xl p-4 hover:bg-gray-800/50 transition-all duration-200 border border-gray-700/30 hover:border-gray-600/50">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{asset.rank}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <img src={asset.image} alt={asset.name} className="w-14 h-14 rounded-xl object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-semibold text-sm truncate">{asset.name}</h4>
                              <p className="text-gray-400 text-xs">{asset.volume} vol</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-semibold text-sm">{asset.price}</p>
                              <p className="text-green-400 text-xs font-medium">{asset.change}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-6">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <div className="text-green-400 font-bold text-lg">$2.3M</div>
                    <div className="text-gray-400 text-xs">Total Volume</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <div className="text-blue-400 font-bold text-lg">15K</div>
                    <div className="text-gray-400 text-xs">Active Users</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <div className="text-purple-400 font-bold text-lg">500+</div>
                    <div className="text-gray-400 text-xs">Collections</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <div className="text-orange-400 font-bold text-lg">98%</div>
                    <div className="text-gray-400 text-xs">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If wallet connected but not signed in, prompt to sign in
  if (walletConnected && !emailAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h2 className="text-white text-2xl font-semibold">Sign in required</h2>
          <p className="text-gray-400">Please sign in with your email/social account to continue.</p>
          <Button onClick={() => router.push('/auth/signin')} className="bg-purple-600 hover:bg-purple-700 text-white">
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  // If both connected and authenticated, show dashboard/home content
  return (
    <AppLayout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">Live Streams</h2>
          <div className="text-gray-400 text-sm">Welcome back</div>
        </div>
        <LiveStreamsGrid />
      </div>
    </AppLayout>
  );
}
