'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  VideoCameraIcon,
  EyeIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

export function LivesTab() {
  const router = useRouter();

  const { data: lives, isLoading } = useQuery({
    queryKey: ['explore-lives'],
    queryFn: async () => {
      // TODO: Implement real lives API
      const response = await fetch('/api/lives');
      if (!response.ok) return [];
      const data = await response.json();
      return data.success ? data.data : [];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-card-bg rounded-xl aspect-video animate-pulse" />
        ))}
      </div>
    );
  }

  // Show coming soon state if no lives API yet
  if (!lives || lives.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
          <VideoCameraIcon className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Live Streaming Coming Soon</h3>
        <p className="text-text-muted mb-6 max-w-md mx-auto">
          Go live with your trading sessions, share your screen, and let your followers buy your tokens in real-time.
        </p>
        <Button className="bg-gradient-to-r from-red-500 to-pink-500 text-white hover:opacity-90">
          <VideoCameraIcon className="w-4 h-4 mr-2" />
          Get Notified When Live Launches
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {lives.map((live: any) => (
        <button
          key={live.id}
          onClick={() => router.push(`/live/${live.id}`)}
          className="group relative bg-card-bg rounded-xl overflow-hidden hover:ring-2 hover:ring-red-500/50 transition-all"
        >
          {/* Thumbnail */}
          <div className="relative aspect-video">
            <img
              src={live.thumbnailUrl || '/placeholder-live.jpg'}
              alt={live.title}
              className="w-full h-full object-cover"
            />

            {/* Live Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-red-500 rounded-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span className="text-xs font-bold text-white uppercase">Live</span>
            </div>

            {/* Viewers */}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-md">
              <EyeIcon className="w-3 h-3 text-white" />
              <span className="text-xs text-white font-medium">{live.viewerCount || 0}</span>
            </div>

            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <PlayIcon className="w-6 h-6 text-white ml-1" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="w-8 h-8 border border-white/10">
                <AvatarImage src={live.creator?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs font-bold">
                  {live.creator?.display_name?.[0] || 'L'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{live.creator?.display_name}</p>
                <p className="text-text-muted text-xs truncate">@{live.creator?.username}</p>
              </div>
            </div>
            <p className="text-white text-sm font-medium truncate">{live.title}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
