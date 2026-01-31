'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlayIcon,
  PhotoIcon,
} from '@heroicons/react/24/solid';

// Generic post type that works with both FlexPost and Post from usePosts
interface GridPost {
  id: string;
  title?: string;
  media_urls: string[];
  token_mint?: string | null;
  token_symbol?: string | null;
  likes_count?: number;
  comments_count?: number;
}

interface PostGridCardProps {
  post: GridPost;
  showStats?: boolean;
  className?: string;
}

export function PostGridCard({ post, showStats = true, className }: PostGridCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasToken = post.token_mint;
  const hasMedia = post.media_urls && post.media_urls.length > 0;
  const isVideo = hasMedia && post.media_urls[0]?.match(/\.(mp4|webm|mov)$/i);
  const hasMultipleMedia = hasMedia && post.media_urls.length > 1;

  // Mock price data - replace with real data from your hooks
  const priceChange = hasToken ? (Math.random() > 0.3 ? Math.random() * 200 : -Math.random() * 50) : null;
  const isPositive = priceChange !== null && priceChange >= 0;

  const handleClick = () => {
    router.push(`/post/${post.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-xl',
        'bg-[#0A0A0A] border border-white/5',
        'cursor-pointer transition-all duration-300',
        'hover:scale-[1.03] hover:border-white/20',
        'hover:shadow-xl hover:shadow-black/50',
        'focus:outline-none focus:ring-2 focus:ring-neon-lime/50',
        className
      )}
    >
      {/* Media */}
      {hasMedia && !imageError ? (
        <>
          <img
            src={post.media_urls[0]}
            alt={post.title || 'Post'}
            className={cn(
              'w-full h-full object-cover transition-all duration-500',
              'group-hover:scale-110',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-white/5 animate-pulse" />
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
          <PhotoIcon className="w-12 h-12 text-white/20" />
        </div>
      )}

      {/* Video indicator */}
      {isVideo && (
        <div className="absolute top-2 right-2 z-10">
          <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <PlayIcon className="w-4 h-4 text-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Multiple media indicator */}
      {hasMultipleMedia && !isVideo && (
        <div className="absolute top-2 right-2 z-10">
          <div className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-mono">
            +{post.media_urls.length - 1}
          </div>
        </div>
      )}

      {/* Token price badge */}
      {hasToken && priceChange !== null && (
        <div
          className={cn(
            'absolute top-2 left-2 z-10',
            'px-2 py-1 rounded-lg backdrop-blur-md',
            'flex items-center gap-1 text-xs font-bold font-mono',
            'border transition-all duration-300',
            'opacity-90 group-hover:opacity-100',
            isPositive
              ? 'bg-gain/20 border-gain/30 text-gain'
              : 'bg-loss/20 border-loss/30 text-loss'
          )}
        >
          {isPositive ? (
            <ArrowTrendingUpIcon className="w-3 h-3" />
          ) : (
            <ArrowTrendingDownIcon className="w-3 h-3" />
          )}
          {isPositive ? '+' : ''}{priceChange.toFixed(0)}%
        </div>
      )}

      {/* Hot badge for high performers */}
      {hasToken && priceChange !== null && priceChange > 100 && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
          <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold uppercase tracking-wider animate-hot-badge-pulse">
            🔥 HOT
          </div>
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-300',
          'bg-gradient-to-t from-black/80 via-black/20 to-transparent',
          'opacity-0 group-hover:opacity-100'
        )}
      />

      {/* Stats overlay on hover */}
      {showStats && (
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 p-3',
            'flex items-center justify-between',
            'transform translate-y-full group-hover:translate-y-0',
            'transition-transform duration-300 ease-out'
          )}
        >
          <div className="flex items-center gap-3">
            {/* Likes */}
            <div className="flex items-center gap-1 text-white/90">
              <HeartIcon className="w-4 h-4 text-loss" />
              <span className="text-xs font-semibold">{post.likes_count || 0}</span>
            </div>

            {/* Comments */}
            <div className="flex items-center gap-1 text-white/90">
              <ChatBubbleLeftIcon className="w-4 h-4 text-neon-cyan" />
              <span className="text-xs font-semibold">{post.comments_count || 0}</span>
            </div>
          </div>

          {/* Token symbol */}
          {hasToken && post.token_symbol && (
            <div className="px-2 py-0.5 rounded bg-white/10 backdrop-blur-sm">
              <span className="text-[10px] font-mono text-neon-lime font-bold">
                ${post.token_symbol}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Token glow effect for tokenized posts */}
      {hasToken && (
        <div
          className={cn(
            'absolute inset-0 pointer-events-none',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            isPositive
              ? 'shadow-[inset_0_0_30px_rgba(0,255,136,0.15)]'
              : 'shadow-[inset_0_0_30px_rgba(255,51,102,0.15)]'
          )}
        />
      )}
    </button>
  );
}

// Grid wrapper component
interface PostGridProps {
  posts: GridPost[];
  loading?: boolean;
  emptyMessage?: string;
  onEmpty?: () => void;
  className?: string;
}

export function PostGrid({ posts, loading = false, emptyMessage, onEmpty, className }: PostGridProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-3 gap-2', className)}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-white/5 rounded-xl overflow-hidden relative"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="col-span-3 text-center py-16">
        <div className="max-w-sm mx-auto">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
            <PhotoIcon className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Posts Yet</h3>
          <p className="text-white/50 text-sm mb-4">{emptyMessage || 'Posts will appear here'}</p>
          {onEmpty && (
            <button
              onClick={onEmpty}
              className="btn-primary text-sm px-6 py-2"
            >
              Create First Post
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {posts.map((post) => (
        <PostGridCard key={post.id} post={post} />
      ))}
    </div>
  );
}
