'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  StarIcon,
  FireIcon,
  SparklesIcon,
  UserGroupIcon,
  TrophyIcon,
  VideoCameraIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  HeartIcon,
  ShoppingCartIcon,
  EllipsisHorizontalIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

export default function ExplorePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('featured');

  const tabs = [
    { id: 'featured', label: 'Featured', icon: StarIcon },
    { id: 'stars', label: 'Zora Stars', icon: StarIcon },
    { id: 'friends', label: 'Friends Bought', icon: UserGroupIcon },
    { id: 'creators', label: 'Top Creators', icon: UserGroupIcon },
    { id: 'traders', label: 'Weekly Top Traders', icon: TrophyIcon },
    { id: 'videos', label: 'Videos', icon: VideoCameraIcon },
    { id: 'top', label: 'Top Posts', icon: ArrowTrendingUpIcon },
    { id: 'trending', label: 'Trending Posts', icon: FireIcon },
    { id: 'new-creators', label: 'New Creators', icon: SparklesIcon },
    { id: 'last-traded', label: 'Last Traded', icon: ClockIcon },
    { id: 'new', label: 'New Posts', icon: SparklesIcon },
  ];

  const exploreItems = [
    {
      id: '1',
      title: 'Tormenta',
      creator: {
        name: 'Alex Morrison',
        username: 'alexm',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
        verified: true
      },
      media: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&h=600&fit=crop',
      mediaType: 'image',
      price: '2.5 SOL',
      lastPrice: '2.2 SOL',
      holders: 127,
      time: '44m',
      isNew: true,
      hasVideo: false
    },
    {
      id: '2',
      title: 'life lately',
      creator: {
        name: 'Sarah Chen',
        username: 'sarahc',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
        verified: true
      },
      media: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop',
      mediaType: 'image',
      price: '1.8 SOL',
      lastPrice: '1.5 SOL',
      holders: 284,
      time: '1h',
      isNew: false,
      hasVideo: false
    },
    {
      id: '3',
      title: 'Motion Study',
      creator: {
        name: 'Marcus Johnson',
        username: 'marcusj',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
        verified: true
      },
      media: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=600&fit=crop',
      mediaType: 'video',
      price: 'Free Mint',
      lastPrice: '',
      holders: 1847,
      time: '2h',
      isNew: false,
      hasVideo: true
    },
    {
      id: '4',
      title: 'Abstract Dreams',
      creator: {
        name: 'Emma Williams',
        username: 'emmaw',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
        verified: false
      },
      media: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600&h=600&fit=crop',
      mediaType: 'image',
      price: '3.2 SOL',
      lastPrice: '3.0 SOL',
      holders: 456,
      time: '3h',
      isNew: false,
      hasVideo: false
    },
    {
      id: '5',
      title: 'Neon Nights',
      creator: {
        name: 'David Park',
        username: 'davidp',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        verified: true
      },
      media: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=600&h=600&fit=crop',
      mediaType: 'image',
      price: '1.2 SOL',
      lastPrice: '1.0 SOL',
      holders: 892,
      time: '5h',
      isNew: true,
      hasVideo: false
    },
    {
      id: '6',
      title: 'Digital Sunset',
      creator: {
        name: 'Lisa Anderson',
        username: 'lisaa',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        verified: true
      },
      media: 'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=600&h=600&fit=crop',
      mediaType: 'image',
      price: '0.8 SOL',
      lastPrice: '0.7 SOL',
      holders: 234,
      time: '6h',
      isNew: false,
      hasVideo: false
    },
  ];

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="pb-20 md:pb-0">
        {/* Navigation Tabs - Zora Style */}
        <div className="mb-6 -mx-4 sm:mx-0">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 sm:px-0 pb-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap transition-all h-9 px-4 rounded-lg text-sm font-medium',
                  activeTab === tab.id
                    ? 'bg-white/10 text-primary'
                    : 'text-secondary hover:text-primary hover:bg-white/5'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Main Container - Zora Layout */}
        <div className="max-w-[1400px] mx-auto flex justify-center gap-8 px-4">
          {/* Feed Grid - Centered */}
          <div className="w-full max-w-[900px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exploreItems.map((item) => (
                <article
                  key={item.id}
                  onClick={() => router.push(`/post/${item.id}`)}
                  className="bg-card-bg rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer group"
                >
                  {/* Media Thumbnail */}
                  <div className="relative aspect-square overflow-hidden bg-black">
                    <img
                      src={item.media}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Small Video Play Button - Bottom Left */}
                    {item.hasVideo && (
                      <div className="absolute bottom-2 left-2 w-6 h-6 bg-black/70 rounded flex items-center justify-center">
                        <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="text-white font-semibold text-sm leading-tight mb-2">
                      {item.title}
                    </h3>
                    
                    {/* Creator */}
                    <p className="text-gray-400 text-xs mb-3">{item.creator.username}</p>

                    {/* Price Section */}
                    <div className="space-y-1">
                      {/* Main Price with Green Arrow */}
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69L5.22 13.72a.75.75 0 000 1.06z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-400 font-medium text-sm">{item.price}</span>
                      </div>
                      
                      {/* Secondary Price */}
                      <p className="text-gray-400 text-xs">{item.lastPrice}</p>
                    </div>

                    {/* Bottom Row - Comments Count and Time */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-xs">{item.holders || 0}</span>
                      </div>
                      
                      {/* Time Badge - Top Right of content area */}
                      <div className="text-gray-400 text-xs">
                        {item.time}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More */}
            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                className="bg-card-bg border-white/20 text-primary hover:bg-card-bg/80 px-8"
                onClick={() => console.log('Load more')}
              >
                Load More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
