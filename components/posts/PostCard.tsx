'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Send, MoreHorizontal, TrendingUp, TrendingDown, Eye, Users } from 'lucide-react';
import { useLike } from '@/hooks/useLike';
import { useWallet } from '@jup-ag/wallet-adapter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCarousel } from './ImageCarousel';
import { ShareModal } from './ShareModal';
import { CommentsModal } from './CommentsModal';
import { SwapModal } from '@/components/swap/SwapModal';
import { PostOptionsMenu } from './PostOptionsMenu';
import { formatTimeAgo } from '@/lib/utils';
import { FlexPost } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// PostCard — The Obsidian Vault
// Premium, content-first with subtle FOMO triggers
// ═══════════════════════════════════════════════════════════════════════════

interface PostCardProps {
  post: FlexPost;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58();

  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { liked, toggleLike, isLoading: isLiking } = useLike(post.id, userId);

  // Live metrics (subtle FOMO)
  const [metrics, setMetrics] = useState({
    viewers: Math.floor(Math.random() * 24) + 3,
    priceChange: ((Math.random() * 50) - 10).toFixed(1),
    marketCap: (Math.random() * 80 + 10).toFixed(0),
    holders: Math.floor(Math.random() * 40) + 8,
  });

  const isPriceUp = parseFloat(metrics.priceChange) > 0;
  const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/post/${post.id}`;

  // Subtle live update (Nikita Bier hook: things feel alive)
  useEffect(() => {
    if (!post.token_mint) return;
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        viewers: Math.max(2, prev.viewers + Math.floor(Math.random() * 3) - 1),
      }));
    }, 12000);
    return () => clearInterval(interval);
  }, [post.token_mint]);

  return (
    <>
      <article
        className="group relative"
        style={{
          background: '#0A0A0B',
          borderRadius: '16px',
          border: '0.5px solid rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: isHovered
            ? '0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            : '0 4px 12px -4px rgba(0, 0, 0, 0.3)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ════════════════════════════════════════════════════════════════
            HEADER — Creator + Live Activity (Mobile-First Design)
            Top-right corner positioning for badges
            ════════════════════════════════════════════════════════════════ */}
        <header className="relative px-3 sm:px-4 pt-2.5 pb-2 sm:pt-3 sm:pb-2.5">
          {/* ═══════════════════════════════════════════════════════════════
              TOP-RIGHT BADGES — "Whisper" micro-indicators
              Luxury watch complication aesthetic: tiny, precise, elegant
              ═══════════════════════════════════════════════════════════════ */}
          <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-3 flex items-center gap-0.5 sm:gap-1">
            {/* Viewers — Ghost badge, almost invisible */}
            {post.token_mint && (
              <div
                className="flex items-center gap-px px-1 py-px rounded-sm backdrop-blur-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '0.5px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <Eye
                  className="w-[7px] h-[7px] sm:w-2.5 sm:h-2.5"
                  style={{ color: '#4A4A50' }}
                  strokeWidth={2.5}
                />
                <span
                  className="text-[7px] sm:text-[10px] tabular-nums"
                  style={{
                    color: '#5A5A60',
                    fontFamily: "'IBM Plex Mono', monospace",
                    letterSpacing: '-0.02em',
                    fontWeight: 500
                  }}
                >
                  {metrics.viewers}
                </span>
              </div>
            )}
            {/* Token Ticker — Mint whisper pill */}
            {post.token_mint && (
              <button
                onClick={() => setShowSwapModal(true)}
                className="px-1 sm:px-2 py-px sm:py-0.5 rounded-sm text-[7px] sm:text-[10px] font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(224, 255, 98, 0.08)',
                  color: '#C4E650',
                  border: '0.5px solid rgba(224, 255, 98, 0.15)',
                  letterSpacing: '-0.01em',
                  textShadow: '0 0 8px rgba(224, 255, 98, 0.3)'
                }}
              >
                ${post.token_display_name || post.token_symbol}
              </button>
            )}
            {/* Options — Three-dot menu with scanner links */}
            <PostOptionsMenu tokenAddress={post.token_mint} postId={post.id}>
              <button
                className="p-1 sm:p-1.5 rounded-md transition-all duration-200 hover:bg-white/[0.08] active:scale-95"
                style={{ color: '#5A5A60' }}
              >
                <MoreHorizontal className="w-4 h-4 sm:w-4 sm:h-4" strokeWidth={2.5} />
              </button>
            </PostOptionsMenu>
          </div>

          {/* Left side: Avatar + Name + Handle */}
          <div className="flex items-center gap-2.5 sm:gap-3 pr-28 sm:pr-36">
            {/* Avatar with online indicator */}
            <div
              className="relative flex-shrink-0 cursor-pointer"
              onClick={() => router.push(`/profile/${post.user?.username}`)}
            >
              <Avatar className="h-10 w-10 sm:h-11 sm:w-11 ring-2 ring-white/[0.06]">
                <AvatarImage src={post.user?.avatar_url} alt={post.user?.display_name} />
                <AvatarFallback
                  style={{
                    background: 'linear-gradient(145deg, #1a1a1c 0%, #0d0d0e 100%)',
                    color: '#5a5a5f',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {post.user?.display_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse"
                style={{
                  background: '#E0FF62',
                  border: '2px solid #0A0A0B',
                }}
              />
            </div>

            {/* Name + Handle + Time - Stacked layout */}
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => router.push(`/profile/${post.user?.username}`)}
            >
              {/* Name row */}
              <span
                className="text-[14px] sm:text-[15px] font-semibold truncate block hover:text-[#E0FF62] transition-colors"
                style={{ color: '#F5F5F5', letterSpacing: '-0.01em', lineHeight: '1.3' }}
              >
                {post.user?.display_name}
              </span>
              {/* Handle + Time row */}
              <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5">
                <span
                  className="text-[10px] sm:text-[12px] truncate"
                  style={{ color: '#6A6A70' }}
                >
                  @{post.user?.username}
                </span>
                <span className="text-[8px] sm:text-[10px]" style={{ color: '#3A3A40' }}>•</span>
                <span
                  className="text-[9px] sm:text-[11px]"
                  style={{ color: '#5A5A60', fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {formatTimeAgo(post.created_at)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════════════
            MEDIA — Full bleed, content is king
            ════════════════════════════════════════════════════════════════ */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div
            className="relative cursor-pointer"
            style={{ background: '#050505' }}
            onClick={() => router.push(`/post/${post.id}`)}
          >
            <ImageCarousel
              images={post.media_urls.filter(url => !url.match(/\.(mp4|webm|ogg|avi|mov)$/i) && !url.includes('video'))}
              videos={post.media_urls.filter(url => url.match(/\.(mp4|webm|ogg|avi|mov)$/i) || url.includes('video'))}
            />

            {/* Token Stats Pill — Bottom left */}
            {post.token_mint && (
              <div
                className="absolute bottom-3 left-3 flex items-center gap-3"
              >
                <div
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                  style={{
                    background: 'rgba(5, 5, 5, 0.8)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '0.5px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Token */}
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: '#E0FF62', letterSpacing: '0.02em' }}
                  >
                    ${post.token_display_name || post.token_symbol}
                  </span>

                  <div className="w-px h-3.5" style={{ background: 'rgba(255,255,255,0.1)' }} />

                  {/* Price Change */}
                  <div className="flex items-center gap-1">
                    {isPriceUp ? (
                      <TrendingUp className="w-3 h-3" style={{ color: '#E0FF62' }} />
                    ) : (
                      <TrendingDown className="w-3 h-3" style={{ color: '#ff6b6b' }} />
                    )}
                    <span
                      className="text-[10px] font-semibold"
                      style={{
                        color: isPriceUp ? '#E0FF62' : '#ff6b6b',
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {isPriceUp ? '+' : ''}{metrics.priceChange}%
                    </span>
                  </div>

                  <div className="w-px h-3.5" style={{ background: 'rgba(255,255,255,0.1)' }} />

                  {/* Market Cap */}
                  <span
                    className="text-[10px]"
                    style={{
                      color: '#6A6A70',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    ${metrics.marketCap}K
                  </span>
                </div>
              </div>
            )}

            {/* Trade Button — Reveals on hover */}
            {post.token_mint && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSwapModal(true);
                }}
                className="absolute bottom-3 right-3 px-4 py-2 rounded-xl text-[11px] font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out"
                style={{
                  background: '#E0FF62',
                  color: '#050505',
                  boxShadow: '0 4px 12px rgba(224, 255, 98, 0.2)',
                }}
              >
                Trade
              </button>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            CONTENT — Clean typography
            ════════════════════════════════════════════════════════════════ */}
        {(post.title || post.content) && (
          <div className="px-4 py-3">
            {post.title && (
              <h3
                className="text-[15px] font-medium cursor-pointer hover:text-[#E0FF62] transition-colors duration-300 line-clamp-2"
                style={{
                  color: '#EAEAEC',
                  lineHeight: 1.45,
                  letterSpacing: '-0.01em',
                }}
                onClick={() => router.push(`/post/${post.id}`)}
              >
                {post.title}
              </h3>
            )}
            {post.content && (
              <p
                className="text-[13px] line-clamp-2 mt-1.5 cursor-pointer"
                style={{ color: '#6B6B72', lineHeight: 1.5 }}
                onClick={() => router.push(`/post/${post.id}`)}
              >
                {post.content}
              </p>
            )}

            {/* Token badge for text-only posts */}
            {post.token_mint && (!post.media_urls || post.media_urls.length === 0) && (
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                    style={{
                      background: 'rgba(224, 255, 98, 0.06)',
                      border: '0.5px solid rgba(224, 255, 98, 0.12)',
                    }}
                  >
                    <span className="text-[11px] font-semibold" style={{ color: '#E0FF62' }}>
                      ${post.token_display_name || post.token_symbol}
                    </span>
                    <div className="w-px h-3.5" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <div className="flex items-center gap-1">
                      {isPriceUp ? (
                        <TrendingUp className="w-3 h-3" style={{ color: '#E0FF62' }} />
                      ) : (
                        <TrendingDown className="w-3 h-3" style={{ color: '#ff6b6b' }} />
                      )}
                      <span
                        className="text-[10px] font-semibold"
                        style={{
                          color: isPriceUp ? '#E0FF62' : '#ff6b6b',
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        {isPriceUp ? '+' : ''}{metrics.priceChange}%
                      </span>
                    </div>
                    <div className="w-px h-3.5" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <span
                      className="text-[10px]"
                      style={{ color: '#6A6A70', fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      ${metrics.marketCap}K
                    </span>
                  </div>

                  {/* Holders (social proof) */}
                  <div className="flex items-center gap-1.5" style={{ color: '#5A5A60' }}>
                    <Users className="w-3 h-3" />
                    <span className="text-[10px]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {metrics.holders}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowSwapModal(true)}
                  className="px-4 py-2 rounded-xl text-[11px] font-semibold transition-all duration-300 hover:shadow-lg"
                  style={{
                    background: '#E0FF62',
                    color: '#050505',
                  }}
                >
                  Trade
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ACTIONS — Minimal, refined
            ════════════════════════════════════════════════════════════════ */}
        <footer
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: '0.5px solid rgba(255, 255, 255, 0.04)' }}
        >
          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              onClick={() => toggleLike()}
              disabled={isLiking || !userId}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-white/[0.03]"
              style={{ color: liked ? '#ff6b6b' : '#4A4A50' }}
            >
              <Heart
                className="w-[18px] h-[18px] transition-transform duration-300"
                style={{
                  fill: liked ? '#ff6b6b' : 'none',
                  transform: liked ? 'scale(1.1)' : 'scale(1)',
                }}
              />
              {(post.likes_count || 0) > 0 && (
                <span className="text-[11px] font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {post.likes_count}
                </span>
              )}
            </button>

            {/* Comment */}
            <button
              onClick={() => setShowCommentsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-white/[0.03]"
              style={{ color: '#4A4A50' }}
            >
              <MessageCircle className="w-[18px] h-[18px]" />
              {(post.comments_count || 0) > 0 && (
                <span className="text-[11px] font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {post.comments_count}
                </span>
              )}
            </button>

            {/* Share */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 hover:bg-white/[0.03]"
              style={{ color: '#4A4A50' }}
            >
              <Send className="w-[17px] h-[17px]" />
            </button>
          </div>

          {/* Trade CTA */}
          {post.token_mint && post.media_urls && post.media_urls.length > 0 && (
            <button
              onClick={() => setShowSwapModal(true)}
              className="px-4 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-300 hover:bg-[#E0FF62] hover:text-[#050505]"
              style={{
                background: 'transparent',
                border: '1px solid rgba(224, 255, 98, 0.25)',
                color: '#E0FF62',
              }}
            >
              Trade
            </button>
          )}
        </footer>
      </article>

      {/* ════════════════════════════════════════════════════════════════
          MODALS
          ════════════════════════════════════════════════════════════════ */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postUrl={postUrl}
        postId={post.id}
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
          tokenName={post.title || 'Post Token'}
          creatorWallet={post.user?.wallet_address}
        />
      )}
    </>
  );
}
