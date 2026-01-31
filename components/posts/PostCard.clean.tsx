'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import { useLike } from '@/hooks/useLike';
import { useWallet } from '@/hooks/useWalletCompat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCarousel } from './ImageCarousel';
import { ShareModal } from './ShareModal';
import { CommentsModal } from './CommentsModal';
import { SwapModal } from '@/components/swap/SwapModal';
import { formatTimeAgo } from '@/lib/utils';
import { FlexPost } from '@/types';

interface PostCardProps {
  post: FlexPost;
}

/**
 * Clean PostCard - Nikita Bier Strategy
 *
 * Design Principles:
 * 1. Image First - Hero visual
 * 2. Social Proof - FOMO indicators
 * 3. One Clear CTA - BUY button
 * 4. Minimal Clutter - Only essentials
 * 5. Easy Engagement - Simple like/comment/share
 */
export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58();

  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);

  // Like with optimistic updates
  const { liked, toggleLike } = useLike(post.id, userId);

  // Mock live stats (TODO: Replace with real data)
  const liveStats = {
    viewers: Math.floor(Math.random() * 50) + 10,
    priceChange: (Math.random() * 100 - 20).toFixed(1),
  };

  const isPriceUp = parseFloat(liveStats.priceChange) > 0;
  const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/post/${post.id}`;

  return (
    <>
      {/* CARD - Minimal padding, maximum content */}
      <div className="bg-card-bg rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all">

        {/* HEADER - User info (compact) */}
        <div className="flex items-center justify-between p-3">
          <div
            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
            onClick={() => router.push(`/profile/${post.user?.wallet_address}`)}
          >
            <Avatar className="h-9 w-9 ring-2 ring-white/5">
              <AvatarImage src={post.user?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-accent-purple to-accent-pink text-white text-sm font-bold">
                {post.user?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {post.user?.display_name}
              </p>
              <p className="text-text-muted text-xs">
                {formatTimeAgo(post.created_at)}
              </p>
            </div>
          </div>

          {/* FOMO Badge - Live Activity */}
          {liveStats.viewers > 20 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-[10px] font-bold">
                {liveStats.viewers} LIVE
              </span>
            </div>
          )}
        </div>

        {/* MEDIA - Hero section (no padding) */}
        <div
          className="relative cursor-pointer bg-black/20"
          onClick={() => router.push(`/post/${post.id}`)}
        >
          {post.media_urls && post.media_urls.length > 0 && (
            <ImageCarousel
              images={post.media_urls.filter(url => !url.match(/\.(mp4|webm|ogg|avi|mov)$/i))}
              videos={post.media_urls.filter(url => url.match(/\.(mp4|webm|ogg|avi|mov)$/i))}
            />
          )}

          {/* Price Overlay - Top right */}
          {post.token_mint && (
            <div className="absolute top-3 right-3 backdrop-blur-xl bg-black/60 rounded-xl px-3 py-2 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-lg">
                  ${(Math.random() * 100 + 10).toFixed(2)}
                </span>
                <div className={`flex items-center gap-1 ${isPriceUp ? 'text-green-400' : 'text-red-400'}`}>
                  <TrendingUp className={`h-3.5 w-3.5 ${!isPriceUp && 'rotate-90'}`} />
                  <span className="text-xs font-bold">
                    {isPriceUp ? '+' : ''}{liveStats.priceChange}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Token Badge - Bottom left overlay */}
          {post.token_display_name && (
            <div className="absolute bottom-3 left-3 backdrop-blur-xl bg-black/60 rounded-lg px-3 py-1.5 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">
                  ${post.token_display_name}
                </span>
                {post.token_is_verified && (
                  <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CONTENT - Title (if exists) */}
        {post.title && (
          <div className="px-3 pt-3">
            <p className="text-white font-semibold text-base line-clamp-2">
              {post.title}
            </p>
          </div>
        )}

        {/* ACTIONS - Engagement + CTA */}
        <div className="px-3 py-3 flex items-center justify-between gap-3">
          {/* Left: Social engagement (minimal) */}
          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              disabled={!userId}
              className="group flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 rounded-lg transition-all active:scale-95"
            >
              <Heart
                className={`h-4 w-4 transition-all ${
                  liked
                    ? 'fill-red-500 text-red-500'
                    : 'text-text-secondary group-hover:text-red-400'
                }`}
              />
              <span className={`text-xs font-medium ${liked ? 'text-red-500' : 'text-text-muted'}`}>
                {post.likes_count || 0}
              </span>
            </button>

            {/* Comment */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCommentsModal(true);
              }}
              className="group flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 rounded-lg transition-all active:scale-95"
            >
              <MessageCircle className="h-4 w-4 text-text-secondary group-hover:text-blue-400 transition-colors" />
              <span className="text-xs font-medium text-text-muted">
                {post.comments_count || 0}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShareModal(true);
              }}
              className="group flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 rounded-lg transition-all active:scale-95"
            >
              <Share2 className="h-4 w-4 text-text-secondary group-hover:text-green-400 transition-colors" />
            </button>
          </div>

          {/* Right: CTA - THE MONEY BUTTON */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (post.token_mint) {
                setShowSwapModal(true);
              }
            }}
            className="group relative px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-full font-black text-sm text-black shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all active:scale-95 hover:scale-105"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shine" />
            <span className="relative">BUY</span>
          </button>
        </div>
      </div>

      {/* MODALS */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postUrl={postUrl}
        postId={post.id}
        postTitle={post.title}
      />

      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        postId={post.id}
        commentsCount={post.comments_count || 0}
      />

      {post.token_mint && (
        <SwapModal
          isOpen={showSwapModal}
          onClose={() => setShowSwapModal(false)}
          tokenMint={post.token_mint}
          tokenSymbol={post.token_display_name || post.token_symbol || 'TOKEN'}
        />
      )}
    </>
  );
}

// Add shine animation to globals.css
// @keyframes shine {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shine { animation: shine 0.6s; }
