'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  PlusIcon, 
  BellIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  HeartIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { SimpleFeed } from '@/components/feed/SimpleFeed';

export default function FeedPage() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  const suggestedUsers = [
    {
      username: 'cryptotrader99',
      displayName: 'Crypto Trader',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      verified: true
    },
    {
      username: 'pumpmaster',
      displayName: 'Pump Master',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      verified: false
    },
    {
      username: 'solanalover',
      displayName: 'Solana Lover',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      verified: true
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 space-y-6">
          {/* Logo/Profile */}
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">F</span>
          </div>

          {/* Navigation Icons */}
          <div className="flex flex-col space-y-6">
            <button
              onClick={() => setActiveTab('home')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'home' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <HomeIcon className="w-6 h-6 text-gray-700" />
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'search' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <MagnifyingGlassIcon className="w-6 h-6 text-gray-700" />
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'create' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <PlusIcon className="w-6 h-6 text-gray-700" />
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'notifications' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <BellIcon className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* User Profile */}
          <div className="mt-auto">
            {userId ? (
              <img
                src={''}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>

          {/* Brand */}
          <div className="text-xs text-gray-500 font-medium">FLEX</div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-2xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Feed Content */}
            <SimpleFeed />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="space-y-6">
            {/* Suggested Follows */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested follows</h3>
              <div className="space-y-4">
                {suggestedUsers.map((suggestedUser) => (
                  <div key={suggestedUser.username} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={suggestedUser.avatar}
                        alt={suggestedUser.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-gray-900">{suggestedUser.username}</span>
                          {suggestedUser.verified && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{suggestedUser.displayName}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Tokens */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending</h3>
              <div className="space-y-3">
                {[
                  { name: 'PEPE', change: '+12.5%', price: '$0.000012' },
                  { name: 'DOGE', change: '+8.2%', price: '$0.082' },
                  { name: 'SHIB', change: '+5.7%', price: '$0.000008' }
                ].map((token) => (
                  <div key={token.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{token.name}</span>
                      <div className="text-sm text-gray-500">{token.price}</div>
                    </div>
                    <span className="text-green-600 font-medium text-sm">{token.change}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
