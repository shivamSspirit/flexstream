'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeartIcon, PlayIcon } from '@heroicons/react/24/solid';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface LikedPost {
  id: string;
  title: string;
  mediaUrls?: string[];
  mediaType?: string;
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  likedAt: string;
}

interface LikesTabProps {
  userId: string;
}

export function LikesTab({ userId }: LikesTabProps) {
  const router = useRouter();
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLikedPosts() {
      try {
        const response = await fetch(`/api/users/${userId}/likes`);
        const data = await response.json();
        if (data.success) {
          setLikedPosts(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch liked posts:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchLikedPosts();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-white/5 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (likedPosts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-pink/20 to-metric-red/20 flex items-center justify-center">
          <HeartIcon className="w-10 h-10 text-accent-pink" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Likes Yet</h3>
        <p className="text-text-muted text-sm max-w-sm mx-auto">
          Posts liked by this user will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {likedPosts.map((post) => (
        <button
          key={post.id}
          onClick={() => router.push(`/post/${post.id}`)}
          className="group aspect-square overflow-hidden bg-black cursor-pointer relative rounded-lg hover:scale-[1.02] transition-all duration-300"
        >
          {post.mediaUrls && post.mediaUrls.length > 0 ? (
            <>
              <img
                src={post.mediaUrls[0]}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {post.mediaType === 'video' && (
                <div className="absolute top-2 right-2">
                  <PlayIcon className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
              <HeartIcon className="w-8 h-8 text-accent-pink/50" />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6 border border-white/20">
                <AvatarImage src={post.user.avatarUrl} />
                <AvatarFallback className="bg-accent-purple text-white text-xs">
                  {post.user.displayName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-sm font-medium">@{post.user.username}</span>
            </div>
          </div>

          {/* Like indicator */}
          <div className="absolute bottom-2 left-2">
            <HeartIcon className="w-4 h-4 text-accent-pink drop-shadow-lg" />
          </div>
        </button>
      ))}
    </div>
  );
}
