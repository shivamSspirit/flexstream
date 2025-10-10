'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  MagnifyingGlassIcon,
  FireIcon,
  SparklesIcon,
  TrophyIcon,
  ClockIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

export default function DiscoverPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('trending');

  const tabs = [
    { id: 'trending', label: 'Trending', icon: FireIcon },
    { id: 'new', label: 'New', icon: SparklesIcon },
    { id: 'top', label: 'Top', icon: TrophyIcon },
    { id: 'recent', label: 'Recent', icon: ClockIcon },
  ];

  const featuredCollections = [
    {
      id: '1',
      name: 'Digital Dreams',
      creator: 'Alex Morrison',
      creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
      image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&h=600&fit=crop',
      floor: '2.5 SOL',
      volume: '45.2K',
      items: 100,
      verified: true
    },
    {
      id: '2',
      name: 'Neon Nights',
      creator: 'Sarah Chen',
      creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop',
      floor: '1.8 SOL',
      volume: '32.1K',
      items: 50,
      verified: true
    },
    {
      id: '3',
      name: 'Abstract Flow',
      creator: 'Marcus J',
      creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop',
      floor: '3.2 SOL',
      volume: '58.7K',
      items: 75,
      verified: true
    },
    {
      id: '4',
      name: 'Cosmic Visions',
      creator: 'Emma W',
      creatorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
      image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&h=600&fit=crop',
      floor: '1.5 SOL',
      volume: '28.3K',
      items: 120,
      verified: false
    },
  ];

  const topCreators = [
    {
      id: '1',
      name: 'Alex Morrison',
      username: 'alexm',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
      followers: '125K',
      verified: true,
      sales: '450 SOL'
    },
    {
      id: '2',
      name: 'Sarah Chen',
      username: 'sarahc',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      followers: '98K',
      verified: true,
      sales: '320 SOL'
    },
    {
      id: '3',
      name: 'Marcus Johnson',
      username: 'marcusj',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
      followers: '87K',
      verified: true,
      sales: '275 SOL'
    },
  ];

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <div className="pb-20 md:pb-6 -mx-4 sm:mx-0">
        {/* Search Header */}
        <div className="px-4 sm:px-0 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-4">Discover</h1>
          
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collections, creators, artworks..."
              className="w-full pl-12 pr-4 h-12 bg-card-bg border-white/10 rounded-2xl text-primary placeholder:text-secondary focus:border-white/20 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap transition-all',
                  activeTab === tab.id
                    ? 'flexstream-gradient text-white border-0'
                    : 'bg-card-bg border-white/20 text-secondary hover:text-primary hover:bg-card-bg/80'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Collections */}
        <div className="mb-8">
          <div className="px-4 sm:px-0 mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Featured Collections</h2>
            <Button variant="ghost" className="text-purple-400 text-sm hover:text-purple-300">
              View All →
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 sm:px-0">
            {featuredCollections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => router.push(`/collection/${collection.id}`)}
                className="bg-card-bg rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all cursor-pointer group text-left w-full"
              >
                {/* Collection Image */}
                <div className="relative aspect-square overflow-hidden bg-black">
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Collection Info */}
                <div className="p-4">
                  <h3 className="text-primary font-bold text-lg mb-2 group-hover:text-purple-400 transition-colors">
                    {collection.name}
                  </h3>
                  
                  {/* Creator */}
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={collection.creatorAvatar} />
                      <AvatarFallback>{collection.creator[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-secondary text-sm">by {collection.creator}</span>
                    {collection.verified && (
                      <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-secondary text-xs">Floor</p>
                      <p className="text-primary font-semibold">{collection.floor}</p>
                    </div>
                    <div>
                      <p className="text-secondary text-xs">Volume</p>
                      <p className="text-primary font-semibold">{collection.volume}</p>
                    </div>
                    <div>
                      <p className="text-secondary text-xs">Items</p>
                      <p className="text-primary font-semibold">{collection.items}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Top Creators */}
        <div className="mb-8">
          <div className="px-4 sm:px-0 mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Top Creators</h2>
            <Button 
              variant="ghost" 
              className="text-purple-400 text-sm hover:text-purple-300"
              onClick={() => router.push('/leaderboard')}
            >
              View All →
            </Button>
          </div>

          <div className="space-y-3 px-4 sm:px-0">
            {topCreators.map((creator, index) => (
              <button
                key={creator.id}
                onClick={() => router.push(`/profile/${creator.username}`)}
                className="bg-card-bg rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all cursor-pointer group flex items-center gap-4 w-full text-left"
              >
                {/* Rank */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0",
                  index === 0 && "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white",
                  index === 1 && "bg-gradient-to-br from-gray-400 to-gray-500 text-white",
                  index === 2 && "bg-gradient-to-br from-orange-600 to-orange-700 text-white"
                )}>
                  #{index + 1}
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12 ring-2 ring-white/10 group-hover:ring-white/20 transition-all">
                  <AvatarImage src={creator.avatar} />
                  <AvatarFallback>{creator.name[0]}</AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-primary font-semibold truncate group-hover:text-purple-400 transition-colors">
                      {creator.name}
                    </h3>
                    {creator.verified && (
                      <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-secondary text-sm">{creator.followers} followers</p>
                </div>

                {/* Sales */}
                <div className="text-right">
                  <p className="text-secondary text-xs">Total Sales</p>
                  <p className="text-primary font-bold">{creator.sales}</p>
                </div>

                {/* Follow Button */}
                <Button 
                  size="sm" 
                  className="flexstream-gradient text-white px-6 hover:scale-105 transition-transform flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Follow clicked for:', creator.username);
                  }}
                >
                  Follow
                </Button>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
