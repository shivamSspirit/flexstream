'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ExploreCard, ExploreCardProps } from '@/components/explore/ExploreCard';
import { ExploreListCard } from '@/components/explore/ExploreListCard';
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

export default function ExplorePage() {
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
  const posts: ExploreCardProps[] = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1579762715459-5a068c289fda?w=400&h=400&fit=crop',
      title: 'frame',
      creator: 'galeano',
      stats: {
        currentPrice: '$26.24',
        floorPrice: '$1.35',
        holders: 4,
      },
      timeAgo: '52s',
      href: '/post/1',
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
      title: 'work',
      creator: 'ohde',
      stats: { currentPrice: '$96.47', floorPrice: '$1.20', holders: 4 },
      timeAgo: '3m',
      badge: { label: 'HOT', variant: 'hot' },
      href: '/post/2',
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
      title: 'Wickedly Juicy',
      creator: 'cryptochef79',
      stats: { currentPrice: '$147.59', floorPrice: '$1.44', holders: 3 },
      timeAgo: '6m',
      href: '/post/3',
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=400&h=400&fit=crop',
      title: 'shitpost 48',
      creator: 'china666cabj',
      stats: { currentPrice: '$7.75', floorPrice: '$1.43', holders: 3 },
      timeAgo: '8m',
      href: '/post/4',
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
      title: 'Sadprt x EQ',
      creator: 'sadprt',
      stats: { currentPrice: '$2k', floorPrice: '$143.47', holders: 11 },
      timeAgo: '10m',
      badge: { label: 'TRENDING', variant: 'trending' },
      href: '/post/5',
    },
    {
      id: '6',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop',
      title: 'Sugar Cookies',
      creator: 'baranbakery',
      stats: { currentPrice: '$271.75', floorPrice: '$5.06', holders: 4 },
      timeAgo: '12m',
      href: '/post/6',
    },
    {
      id: '7',
      image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=400&fit=crop',
      title: 'Padel Tournament',
      creator: 'lemongab',
      stats: { currentPrice: '$144.95', floorPrice: '$3.37', holders: 3 },
      timeAgo: '15m',
      href: '/post/7',
    },
    {
      id: '8',
      image: 'https://images.unsplash.com/photo-1579762715459-5a068c289fda?w=400&h=400&fit=crop',
      title: 'A Midsummer Night',
      creator: 'dreameincarnate',
      stats: { currentPrice: '$89.75', floorPrice: '$1.89', holders: 3 },
      timeAgo: '32m',
      badge: { label: 'NEW', variant: 'new' },
      href: '/post/8',
    },
    {
      id: '9',
      image: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=400&h=400&fit=crop',
      title: 'lexluther',
      creator: 'pissingonplaid',
      stats: { currentPrice: '$174.94', floorPrice: '$3.59', holders: 3 },
      timeAgo: '35m',
      href: '/post/9',
    },
    {
      id: '10',
      image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=400&fit=crop',
      title: 'Dice of Misfortune',
      creator: 'peppers_kitchen',
      stats: { currentPrice: '$248.03', floorPrice: '$4.12', holders: 7 },
      timeAgo: '35m',
      href: '/post/10',
    },
    {
      id: '11',
      image: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=400&fit=crop',
      title: 'danseurs',
      creator: 'elbi',
      stats: { currentPrice: '$167.19', floorPrice: '$2.89', holders: 5 },
      timeAgo: '36m',
      href: '/post/11',
    },
    {
      id: '12',
      image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop',
      title: 'Trawling',
      creator: 'huskymom',
      stats: { currentPrice: '$440.83', floorPrice: '$8.21', holders: 12 },
      timeAgo: '38m',
      href: '/post/12',
    },
  ];

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="max-w-[1600px] mx-auto pb-20 md:pb-8 lg:pb-10">
        {/* Filter Tabs - Mobile-First Responsive */}
        <div className="mb-6 sm:mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                  activeTab === tab.id
                    ? "bg-white text-black"
                    : "bg-transparent text-white/70 hover:text-white border border-white/20 hover:border-white/40"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* View Toggle - Grid/List */}
          <div className="flex ml-auto items-center gap-1 bg-transparent rounded-xl border border-white/20 shrink-0 p-1">
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

        {/* Posts Display - Grid or List View */}
        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map((post) => (
              <ExploreCard key={post.id} {...post} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {posts.map((post) => (
              <ExploreListCard key={post.id} {...post} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
