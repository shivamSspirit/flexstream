'use client';

import { useState, useEffect } from 'react';
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

interface Post {
  id: string;
  image: string;
  title: string;
  username: string;
  currentPrice: string;
  floorPrice: string;
  holders: number;
  time: string;
}

export default function DiscoverPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('featured');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch real posts from API
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);

      try {
        const response = await fetch(`/api/posts?tab=${activeTab}&limit=50`);
        const data = await response.json();

        if (data.success && data.data.posts) {
          const realPosts: Post[] = data.data.posts.map((post: any) => ({
            id: post.id,
            image: post.media_urls?.[0] || 'https://images.unsplash.com/photo-1579762715459-5a068c289fda?w=400&h=400&fit=crop',
            title: post.title || post.content?.substring(0, 30) || 'Untitled',
            username: post.users?.username || 'anonymous',
            // TODO: Fetch real token prices from API
            currentPrice: post.token_price ? `$${post.token_price.toFixed(2)}` : '$0.00',
            floorPrice: post.token_floor_price ? `$${post.token_floor_price.toFixed(2)}` : '$0.00',
            holders: post.token_holders || 0,
            time: formatTimeAgo(post.created_at),
          }));

          setPosts(realPosts);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      }

      setLoading(false);
    }

    fetchPosts();
  }, [activeTab]);

  function formatTimeAgo(date: string) {
    const now = new Date();
    const postDate = new Date(date);
    const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }

  if (loading) {
    return (
      <AppLayout showWallet={true} showSearch={true}>
        <div className="max-w-[1600px] mx-auto px-6 pb-20 md:pb-0">
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Loading...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

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
