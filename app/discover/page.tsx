'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  StarIcon,
  UsersIcon,
  TrophyIcon,
  ChartBarIcon,
  VideoCameraIcon,
  FireIcon,
  SparklesIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

export default function DiscoverPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('featured');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Zora-style filter tabs
  const tabs = [
    { id: 'featured', label: 'Featured', icon: StarIcon },
    { id: 'zora-stars', label: 'Zora Stars', icon: StarIconSolid },
    { id: 'friends-bought', label: 'Friends Bought', icon: UsersIcon },
    { id: 'top-creators', label: 'Top Creators', icon: TrophyIcon },
    { id: 'weekly-traders', label: 'Weekly Top Traders', icon: ChartBarIcon },
    { id: 'videos', label: 'Videos', icon: VideoCameraIcon },
    { id: 'top-posts', label: 'Top Posts', icon: FireIcon },
    { id: 'trending', label: 'Trending Posts', icon: FireIcon },
    { id: 'new', label: 'New', icon: SparklesIcon },
  ];

  // Mock data matching Zora's explore page
  const posts = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1579762715459-5a068c289fda?w=400&h=400&fit=crop',
      title: 'frame',
      username: 'galeano',
      currentPrice: '$26.24',
      floorPrice: '$1.35',
      holders: 4,
      time: '52s'
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
      title: 'work',
      username: 'ohde',
      currentPrice: '$96.47',
      floorPrice: '$1.20',
      holders: 4,
      time: '3m'
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
      title: 'Wickedly Juicy',
      username: 'cryptochef79',
      currentPrice: '$147.59',
      floorPrice: '$1.44',
      holders: 3,
      time: '6m'
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=400&h=400&fit=crop',
      title: 'shitpost 48',
      username: 'china666cabj',
      currentPrice: '$7.75',
      floorPrice: '$1.43',
      holders: 3,
      time: '8m'
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
      title: 'Sadprt x EQ',
      username: 'sadprt',
      currentPrice: '$2k',
      floorPrice: '$143.47',
      holders: 11,
      time: '10m'
    },
    {
      id: '6',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop',
      title: 'Sugar Cookies',
      username: 'baranbakery',
      currentPrice: '$271.75',
      floorPrice: '$5.06',
      holders: 4,
      time: '12m'
    },
    {
      id: '7',
      image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=400&fit=crop',
      title: 'Padel Tournament',
      username: 'lemongab',
      currentPrice: '$144.95',
      floorPrice: '$3.37',
      holders: 3,
      time: '15m'
    },
    {
      id: '8',
      image: 'https://images.unsplash.com/photo-1579762715459-5a068c289fda?w=400&h=400&fit=crop',
      title: 'A Midsummer Night',
      username: 'dreameincarnate',
      currentPrice: '$89.75',
      floorPrice: '$1.89',
      holders: 3,
      time: '32m'
    },
    {
      id: '9',
      image: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=400&h=400&fit=crop',
      title: 'lexluther',
      username: 'pissingonplaid',
      currentPrice: '$174.94',
      floorPrice: '$3.59',
      holders: 3,
      time: '35m'
    },
  ];

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="max-w-[1600px] mx-auto px-6 pb-20 md:pb-0">
        {/* Filter Tabs - Zora Style */}
        <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                  activeTab === tab.id
                    ? "bg-white text-black"
                    : "bg-[#1a1a1a] text-white/70 hover:text-white hover:bg-[#252525] border border-white/10"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}

          {/* View Toggle - Grid/List */}
          <div className="ml-auto flex items-center gap-2 bg-[#1a1a1a] rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Posts Grid - Zora 3-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-transparent cursor-pointer group"
              onClick={() => router.push(`/post/${post.id}`)}
            >
              {/* Image */}
              <div className="relative rounded-2xl overflow-hidden mb-3 bg-black">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full aspect-square object-cover group-hover:opacity-90 transition-opacity"
                />
              </div>

              {/* Content */}
              <div className="px-1">
                {/* Title & Username */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-lg font-semibold mb-1 truncate">
                      {post.title}
                    </h3>
                    <p className="text-white/50 text-sm truncate">{post.username}</p>
                  </div>
                  <span className="text-white/40 text-sm ml-2 flex-shrink-0">{post.time}</span>
                </div>

                {/* Prices & Holders */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {/* Current Price - Green */}
                    <div className="flex items-center gap-1.5 text-green-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="text-base font-semibold">{post.currentPrice}</span>
                    </div>

                    {/* Floor Price */}
                    <div className="flex items-center gap-1.5 text-white/50">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">{post.floorPrice}</span>
                    </div>
                  </div>

                  {/* Holders */}
                  <div className="flex items-center gap-1.5 text-white/50">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span className="text-sm font-medium">{post.holders}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
