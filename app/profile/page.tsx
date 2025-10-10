'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Cog6ToothIcon,
  ShareIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('created');

  const stats = [
    { label: 'Created', value: '24' },
    { label: 'Collected', value: '156' },
    { label: 'Followers', value: '2.4K' },
    { label: 'Following', value: '892' },
  ];

  const myNFTs = [
    {
      id: '1',
      title: 'Cosmic Dreams #127',
      image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=400&fit=crop',
      price: '2.5 SOL',
      likes: 342
    },
    {
      id: '2',
      title: 'Digital Sunset',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
      price: '1.8 SOL',
      likes: 891
    },
    {
      id: '3',
      title: 'Abstract Flow #42',
      image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=400&fit=crop',
      price: '3.2 SOL',
      likes: 523
    },
    {
      id: '4',
      title: 'Neon Dreams',
      image: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=400&fit=crop',
      price: '1.5 SOL',
      likes: 2156
    },
  ];

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="pb-20 md:pb-6 -mx-4 sm:mx-0">
        {/* Cover Image */}
        <div className="h-32 sm:h-48 bg-gradient-to-br from-purple-900/30 to-pink-900/30 relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=400&fit=crop')] bg-cover bg-center opacity-20" />
        </div>

        {/* Profile Info */}
        <div className="px-4 sm:px-0 -mt-16 sm:-mt-20 relative z-10 mb-6">
          <div className="flex items-end justify-between mb-4">
            {/* Avatar */}
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-app-bg">
              <AvatarImage src={user?.imageUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop'} />
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-3xl">
                {user?.firstName?.[0] || 'A'}
              </AvatarFallback>
            </Avatar>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 hover:bg-card-bg/80"
              >
                <ShareIcon className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                onClick={() => router.push('/settings')}
                variant="outline"
                size="sm"
                className="border-white/20 hover:bg-card-bg/80"
              >
                <Cog6ToothIcon className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </div>
          </div>

          {/* Name & Bio */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                {user?.fullName || 'Alex Morrison'}
              </h1>
              <CheckBadgeIcon className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-secondary mb-3">
              @{user?.username || 'alexmorrison'} · Digital Artist & NFT Creator
            </p>
            <p className="text-primary max-w-2xl">
              Creating unique digital art pieces exploring the intersection of technology, nature, and human emotion. 
              Passionate about Web3 and decentralized creativity. 🎨✨
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-card-bg rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5 text-center"
              >
                <p className="text-lg sm:text-2xl font-bold text-primary mb-1">{stat.value}</p>
                <p className="text-xs sm:text-sm text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-card-bg border border-white/10 p-1">
              <TabsTrigger value="created" className="flex-1">Created</TabsTrigger>
              <TabsTrigger value="collected" className="flex-1">Collected</TabsTrigger>
              <TabsTrigger value="liked" className="flex-1">Liked</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {/* NFT Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {myNFTs.map((nft) => (
                  <button
                    key={nft.id}
                    onClick={() => router.push(`/post/${nft.id}`)}
                    className="group bg-card-bg rounded-xl sm:rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all cursor-pointer text-left w-full"
                  >
                    <div className="relative aspect-square overflow-hidden bg-black">
                      <img
                        src={nft.image}
                        alt={nft.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-primary font-semibold text-sm mb-1 truncate group-hover:text-purple-400 transition-colors">
                        {nft.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-secondary">{nft.price}</p>
                        <p className="text-xs text-secondary">❤️ {nft.likes}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
