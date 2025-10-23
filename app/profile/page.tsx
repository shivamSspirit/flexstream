'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Squares2X2Icon,
  FolderIcon,
  SparklesIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'grid' | 'collected' | 'activity'>('grid');

  // Mock data matching Zora
  const posts = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=400&fit=crop',
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=400&fit=crop',
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=400&fit=crop',
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
    },
    {
      id: '6',
      image: 'https://images.unsplash.com/photo-1579762715459-5a068c289fda?w=400&h=400&fit=crop',
    },
  ];

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="w-full max-w-[980px] mx-auto pb-20 md:pb-6 px-4">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center pt-8 pb-6">
          {/* Avatar */}
          <Avatar className="h-24 w-24 mb-4 ring-2 ring-white/10">
            <AvatarImage src={user?.imageUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop'} />
            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-2xl">
              {user?.firstName?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Username */}
          <h1 className="text-2xl font-bold text-white mb-1">
            ${user?.username || 'shivamsspirit'}
          </h1>

          {/* Name with dropdown */}
          <button className="flex items-center gap-1 text-white/60 text-sm mb-4 hover:text-white/80 transition-colors">
            <span>{user?.firstName || 'shivam'}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-60">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mb-6 text-sm">
            <div>
              <span className="font-bold text-white">99</span>
              <span className="text-white/60 ml-1">Posts</span>
            </div>
            <div>
              <span className="font-bold text-white">1</span>
              <span className="text-white/60 ml-1">Holder</span>
            </div>
            <div>
              <span className="font-bold text-white">2</span>
              <span className="text-white/60 ml-1">Holding</span>
            </div>
          </div>

          {/* Followers/Following */}
          <div className="flex items-center gap-4 text-sm text-white/60 mb-6">
            <button className="hover:text-white transition-colors">
              <span className="font-semibold">441</span> Followers
            </button>
            <button className="hover:text-white transition-colors">
              <span className="font-semibold">339</span> Following
            </button>
          </div>

          {/* Market Cap and Top Holders */}
          <div className="flex items-center gap-8 mb-6 w-full max-w-md justify-center py-4 border-y border-white/10">
            <div className="text-center">
              <div className="text-xs text-white/60 mb-1">Market cap</div>
              <div className="text-2xl font-bold text-white">$3,879</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <div className="text-xs text-white/60 mb-2">Top holders</div>
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-black"></div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 ring-2 ring-black"></div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-500 ring-2 ring-black"></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full max-w-md">
            <Button
              className="flex-1 bg-[#00ff00] hover:bg-[#00dd00] text-black font-semibold h-11"
            >
              Trade
            </Button>
            <Button
              onClick={() => router.push('/profile/edit')}
              variant="outline"
              className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/5 h-11"
            >
              Edit profile
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-transparent border-white/20 text-white hover:bg-white/5 h-11 w-11"
            >
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* X/Twitter Icon */}
          <div className="mt-4">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="opacity-80">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center gap-8 border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('grid')}
            className={`pb-3 px-2 border-b-2 transition-colors ${
              activeTab === 'grid'
                ? 'border-white text-white'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            <Squares2X2Icon className="h-6 w-6" />
          </button>
          <button
            onClick={() => setActiveTab('collected')}
            className={`pb-3 px-2 border-b-2 transition-colors ${
              activeTab === 'collected'
                ? 'border-white text-white'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            <FolderIcon className="h-6 w-6" />
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-2 border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-white text-white'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            <SparklesIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => router.push(`/post/${post.id}`)}
              className="group aspect-square overflow-hidden bg-black cursor-pointer"
            >
              <img
                src={post.image}
                alt="Post"
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
