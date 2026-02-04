'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { SwapModal } from '@/components/swap/SwapModal';
import { ShareModal } from '@/components/posts/ShareModal';
import { CommentsModal } from '@/components/posts/CommentsModal';
import { PostOptionsMenu } from '@/components/posts/PostOptionsMenu';

// ═══════════════════════════════════════════════════════════════════════════════
// VIRAL POST CARD — The Dopamine Machine
// Nikita Bier Philosophy: 3-sec aha, FOMO, one-tap actions
// Trading terminal density meets social media dopamine
// ═══════════════════════════════════════════════════════════════════════════════

// Mock comment type
interface MockComment {
  id: string;
  username: string;
  avatar: string | null;
  text: string;
  isVerified?: boolean;
}

export interface ViralPostData {
  id: string;
  // Creator
  creator: {
    username: string;
    displayName: string;
    avatar: string | null;
    isVerified: boolean;
    isWhale?: boolean;
  };
  // Post content
  title: string | null;
  content: string | null;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  // Token data
  token: {
    symbol: string;
    displayName: string;
    mint: string;
    price: number;
    priceChange24h: number; // percentage
    marketCap: number;
    holders: number; // Number of token holders
    launchedAt: string; // ISO date
    // Sparkline data (last 24 price points)
    sparkline: number[];
  } | null;
  // Engagement
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewersCount?: number; // People currently viewing this post
  // Meta
  createdAt: string;
  isLiked?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOKABLE COMMENTS — FOMO-inducing mock comments
// ─────────────────────────────────────────────────────────────────────────────
const HOOKABLE_COMMENTS: MockComment[] = [
  { id: '1', username: 'whale_alert', avatar: null, text: 'just aped in 🚀', isVerified: true },
  { id: '2', username: 'degen_trader', avatar: null, text: 'this is going to 10x easy' },
  { id: '3', username: 'alpha_calls', avatar: null, text: 'early af, NFA', isVerified: true },
  { id: '4', username: 'crypto_mike', avatar: null, text: 'bought the dip 💎' },
  { id: '5', username: 'sol_maxi', avatar: null, text: 'chart looking bullish' },
  { id: '6', username: 'anon_buyer', avatar: null, text: 'loaded my bags' },
  { id: '7', username: 'trade_master', avatar: null, text: 'this one\'s different', isVerified: true },
  { id: '8', username: 'moon_hunter', avatar: null, text: 'not selling till 100x' },
  { id: '9', username: 'gem_finder', avatar: null, text: 'found this early 👀', isVerified: true },
  { id: '10', username: 'fomo_king', avatar: null, text: 'had to get in' },
  { id: '11', username: 'diamond_hands', avatar: null, text: 'holding forever 💎🙌' },
  { id: '12', username: 'quick_flip', avatar: null, text: 'easy 2x from here' },
];

// Get random comments for a post
function getRandomComments(postId: string, count: number = 2): MockComment[] {
  // Use postId as seed for consistent comments per post
  const seed = postId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const shuffled = [...HOOKABLE_COMMENTS].sort(() => 0.5 - Math.sin(seed));
  return shuffled.slice(0, count);
}

interface ViralPostCardProps {
  post: ViralPostData;
  index?: number;
  onTrade?: (tokenMint: string) => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  isAuthenticated?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function formatMarketCap(num: number): string {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

function isRecentLaunch(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffHours < 24; // Live indicator for tokens < 24h old
}

// ─────────────────────────────────────────────────────────────────────────────
// SPARKLINE COMPONENT — Mini price chart
// ─────────────────────────────────────────────────────────────────────────────

function Sparkline({
  data,
  width = 80,
  height = 32,
  isPositive = true
}: {
  data: number[];
  width?: number;
  height?: number;
  isPositive?: boolean;
}) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return `M${points.join(' L')}`;
  }, [data, width, height]);

  const gradientId = useMemo(() => `sparkline-${Math.random().toString(36).substr(2, 9)}`, []);
  const color = isPositive ? '#E0FF62' : '#FF6B6B';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Glow effect */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
      />

      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot */}
      {data.length > 0 && (
        <circle
          cx={width}
          cy={height - ((data[data.length - 1] - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * height}
          r="2.5"
          fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE PULSE — Urgency indicator
// ─────────────────────────────────────────────────────────────────────────────

function LivePulse({ size = 6 }: { size?: number }) {
  return (
    <span className="relative flex items-center justify-center">
      <span
        className="absolute animate-ping rounded-full opacity-75"
        style={{
          width: size * 1.8,
          height: size * 1.8,
          background: '#10b981'
        }}
      />
      <span
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: '#10b981',
          boxShadow: '0 0 8px #10b981'
        }}
      />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIRAL POST CARD — Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function ViralPostCard({
  post,
  index = 0,
  onTrade,
  onLike,
  onComment,
  onShare,
  isAuthenticated = false,
}: ViralPostCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likesCount);
  const [isHovered, setIsHovered] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const hasToken = !!post.token;
  const isPositiveChange = (post.token?.priceChange24h ?? 0) >= 0;
  const isLive = hasToken && isRecentLaunch(post.token!.launchedAt);

  // Generate mock sparkline if not provided
  const sparklineData = useMemo(() => {
    if (post.token?.sparkline && post.token.sparkline.length > 0) {
      return post.token.sparkline;
    }
    // Generate realistic-looking mock data
    const basePrice = post.token?.price || 1;
    const trend = isPositiveChange ? 1.02 : 0.98;
    return Array.from({ length: 24 }, (_, i) => {
      const noise = 1 + (Math.random() - 0.5) * 0.1;
      return basePrice * Math.pow(trend, i) * noise;
    });
  }, [post.token, isPositiveChange]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onTrade?.(post.token?.mint || '');
      return;
    }
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    onLike?.(post.id);
  };

  // Open swap modal for trading
  const handleTrade = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (post.token?.mint) {
      setIsSwapModalOpen(true);
    }
  };

  // Navigate to post detail page
  const handlePostClick = () => {
    router.push(`/post/${post.id}`);
  };

  // View token (from hover button) - navigates to post page
  const handleViewToken = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/post/${post.id}`);
  };

  return (
    <article
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animation: `viralSlideUp 400ms ease-out ${index * 50}ms both`,
      }}
    >
      <div
        className="relative overflow-hidden transition-all duration-300"
        style={{
          background: 'rgba(18, 18, 18, 0.8)',
          borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER — Viral Mobile-First Layout
            Row 1: Avatar + Name/Handle | Options Menu
            Row 2 (mobile only): Token + Viewers + Time
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="px-3 sm:px-4 pt-3 pb-2 sm:pt-4 sm:pb-3">
          {/* Main row: Avatar + Info + Desktop badges + Options */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Avatar */}
            <Link
              href={`/profile/${post.creator.username}`}
              className="relative flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden transition-transform duration-150 hover:scale-105"
                style={{
                  border: post.creator.isWhale
                    ? '2px solid #00F0FF'
                    : '1.5px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: post.creator.isWhale
                    ? '0 0 12px rgba(0, 240, 255, 0.3)'
                    : 'none',
                }}
              >
                {post.creator.avatar ? (
                  <img
                    src={post.creator.avatar}
                    alt={post.creator.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #00F0FF 0%, #FF2D92 100%)',
                      color: '#050505',
                    }}
                  >
                    {post.creator.displayName[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              {/* Whale Badge */}
              {post.creator.isWhale && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
                  style={{
                    background: '#00F0FF',
                    border: '2px solid #121212',
                  }}
                >
                  🐋
                </div>
              )}
            </Link>

            {/* Name + Handle — Desktop shows time inline */}
            <Link
              href={`/profile/${post.creator.username}`}
              className="min-w-0 flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] sm:text-[15px] font-semibold truncate hover:text-[#00F0FF] transition-colors duration-150" style={{ color: '#FAFAFA' }}>
                  {post.creator.displayName}
                </span>
                {post.creator.isVerified && (
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#00F0FF">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {/* Desktop: Time inline */}
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </span>
              </div>
              <span className="text-[11px] sm:text-[12px] truncate block mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                @{post.creator.username}
              </span>
            </Link>

            {/* Right side: Desktop badges + Options */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Desktop: Viewers */}
              {hasToken && (
                <div
                  className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md"
                  style={{ background: 'rgba(255, 255, 255, 0.04)' }}
                  title="People viewing"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[10px] font-mono" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {formatNumber(post.viewersCount || Math.floor(Math.random() * 200) + 10)}
                  </span>
                </div>
              )}

              {/* Desktop: Live Indicator */}
              {hasToken && isLive && (
                <div
                  className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full"
                  style={{ background: 'rgba(16, 185, 129, 0.15)' }}
                >
                  <LivePulse size={5} />
                  <span className="text-[9px] font-bold tracking-wider" style={{ color: '#10b981' }}>
                    LIVE
                  </span>
                </div>
              )}

              {/* Desktop: Token Pill */}
              {hasToken && (
                <button
                  onClick={handleTrade}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    background: 'rgba(0, 240, 255, 0.1)',
                    border: '0.5px solid rgba(0, 240, 255, 0.2)',
                  }}
                >
                  <span className="text-[10px] font-bold" style={{ color: '#00F0FF', textShadow: '0 0 10px rgba(0, 240, 255, 0.4)' }}>
                    ${post.token!.symbol}
                  </span>
                </button>
              )}

              {/* Options Menu — Always visible */}
              {hasToken && (
                <PostOptionsMenu tokenAddress={post.token!.mint} postId={post.id}>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg transition-all duration-150 hover:bg-white/[0.06] active:scale-95"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                  >
                    <MoreHorizontal className="w-5 h-5" strokeWidth={2} />
                  </button>
                </PostOptionsMenu>
              )}
            </div>
          </div>

          {/* ═══ Mobile-only: Metadata Row ═══
              Clean horizontal strip — left aligned for clean look
              Token | Viewers | Time
          */}
          {hasToken && (
            <div className="flex sm:hidden items-center mt-2 ml-3">
              {/* Token Pill — Primary action feel */}
              <button
                onClick={handleTrade}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-150 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 240, 255, 0.08) 100%)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  boxShadow: '0 0 12px rgba(0, 240, 255, 0.1)',
                }}
              >
                <span className="text-[11px] font-bold tracking-tight" style={{ color: '#00F0FF' }}>
                  ${post.token!.symbol}
                </span>
              </button>

              {/* Separator dot */}
              <span className="mx-2 text-[8px]" style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>

              {/* Viewers — Subtle pill */}
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[11px] font-medium tabular-nums" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                  {formatNumber(post.viewersCount || Math.floor(Math.random() * 200) + 10)}
                </span>
              </div>

              {/* Separator dot */}
              <span className="mx-2 text-[8px]" style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>

              {/* Time — Clean, readable */}
              <span
                className="text-[11px] font-medium"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                {formatTimeAgo(post.createdAt)}
              </span>

              {/* Live indicator (if applicable) — at the end */}
              {isLive && (
                <>
                  <span className="mx-2 text-[8px]" style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
                  <div className="flex items-center gap-1">
                    <LivePulse size={5} />
                    <span className="text-[9px] font-bold tracking-wider" style={{ color: '#10b981' }}>
                      LIVE
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MEDIA SECTION — "Glass Float" Design
            Media is the HERO. Stats float as glass pills at edges.
            ═══════════════════════════════════════════════════════════════════ */}
        {post.mediaUrl && (
          <div
            className="relative mx-3 sm:mx-4 mt-3 mb-3 rounded-xl overflow-hidden cursor-pointer group/media"
            onClick={handlePostClick}
            style={{ aspectRatio: '3/4' }}
          >
            {/* ═══ THE MEDIA — Full, Rich, Unobstructed ═══ */}
            {post.mediaType === 'video' ? (
              <video
                src={post.mediaUrl}
                className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-[1.03]"
                muted
                playsInline
                loop
              />
            ) : (
              <img
                src={post.mediaUrl}
                alt={post.title || 'Post media'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-[1.03]"
              />
            )}

            {/* ═══ SUBTLE VIGNETTE — Edges only, not covering media ═══ */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
              }}
            />

            {/* ═══ TOP LEFT: Growth % Pill ═══ */}
            {hasToken && (
              <div
                className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                style={{
                  background: isPositiveChange
                    ? 'rgba(224, 255, 98, 0.15)'
                    : 'rgba(255, 107, 107, 0.15)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: isPositiveChange
                    ? '1px solid rgba(224, 255, 98, 0.3)'
                    : '1px solid rgba(255, 107, 107, 0.3)',
                }}
              >
                {isPositiveChange ? (
                  <svg className="w-3 h-3" fill="#E0FF62" viewBox="0 0 24 24">
                    <path d="M7 14l5-5 5 5H7z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="#FF6B6B" viewBox="0 0 24 24">
                    <path d="M7 10l5 5 5-5H7z" />
                  </svg>
                )}
                <span
                  className="text-[13px] font-black tracking-tight"
                  style={{
                    color: isPositiveChange ? '#E0FF62' : '#FF6B6B',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {isPositiveChange ? '+' : ''}{post.token!.priceChange24h.toFixed(1)}%
                </span>
              </div>
            )}

            {/* ═══ TOP RIGHT: Sparkline Mini ═══ */}
            {hasToken && (
              <div
                className="absolute top-3 right-3 p-2 rounded-xl"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Sparkline
                  data={sparklineData}
                  width={50}
                  height={24}
                  isPositive={isPositiveChange}
                />
              </div>
            )}

            {/* ═══ BOTTOM LEFT: MCap + Holders Pills ═══ */}
            {hasToken && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                {/* MCap Pill */}
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-full"
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span className="text-[9px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    MC
                  </span>
                  <span className="text-[11px] font-bold font-mono" style={{ color: '#fff' }}>
                    {formatMarketCap(post.token!.marketCap)}
                  </span>
                </div>

                {/* Holders Pill */}
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-full"
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <svg className="w-3 h-3" fill="rgba(255,255,255,0.6)" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span className="text-[11px] font-mono" style={{ color: '#fff' }}>
                    {formatNumber(post.token!.holders)}
                  </span>
                </div>
              </div>
            )}

            {/* ═══ Video Play Button ═══ */}
            {post.mediaType === 'video' && !isHovered && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 group-hover/media:scale-110"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <svg className="w-7 h-7 ml-1" fill="#050505" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}

            {/* ═══ HOVER STATE — Glass Overlay with CTA ═══ */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-all duration-400"
              style={{
                background: isHovered
                  ? 'rgba(5, 5, 5, 0.6)'
                  : 'transparent',
                backdropFilter: isHovered ? 'blur(8px)' : 'none',
                WebkitBackdropFilter: isHovered ? 'blur(8px)' : 'none',
                opacity: isHovered ? 1 : 0,
                pointerEvents: isHovered ? 'auto' : 'none',
              }}
            >
              {hasToken && (
                <button
                  onClick={handleViewToken}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-300 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #E0FF62 0%, #c8e85a 100%)',
                    boxShadow: '0 12px 40px rgba(224, 255, 98, 0.4)',
                    transform: isHovered ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="#050505" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[16px] font-bold" style={{ color: '#050505' }}>
                    View ${post.token!.symbol}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            NO MEDIA — Show token stats inline
            ═══════════════════════════════════════════════════════════════════ */}
        {!post.mediaUrl && hasToken && (
          <div
            className="mx-4 mb-3 p-4 rounded-xl cursor-pointer"
            onClick={handleTrade}
            style={{
              background: 'linear-gradient(135deg, rgba(224, 255, 98, 0.05) 0%, rgba(20, 184, 166, 0.05) 100%)',
              border: '1px solid rgba(224, 255, 98, 0.15)',
            }}
          >
            <div className="flex items-center justify-between">
              {/* Left: Token Info + Growth */}
              <div className="flex items-center gap-4">
                {/* Token Icon */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #E0FF62 0%, #14b8a6 100%)',
                    color: '#050505',
                    boxShadow: '0 0 20px rgba(224, 255, 98, 0.3)',
                  }}
                >
                  {post.token!.symbol.slice(0, 2)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold" style={{ color: '#FAFAFA' }}>
                      ${post.token!.symbol}
                    </span>
                    <span
                      className="text-[14px] font-bold"
                      style={{ color: isPositiveChange ? '#E0FF62' : '#FF6B6B' }}
                    >
                      {isPositiveChange ? '+' : ''}{post.token!.priceChange24h.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      MCap {formatMarketCap(post.token!.marketCap)}
                    </span>
                    <span className="text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                      •
                    </span>
                    <span className="text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                      Launched {formatTimeAgo(post.token!.launchedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Sparkline + Trade */}
              <div className="flex items-center gap-4">
                <Sparkline
                  data={sparklineData}
                  width={70}
                  height={28}
                  isPositive={isPositiveChange}
                />
                <button
                  className="px-4 py-2 rounded-lg text-[12px] font-bold transition-all duration-150 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #E0FF62 0%, #c8e85a 100%)',
                    color: '#050505',
                  }}
                >
                  Trade
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            FOOTER — Engagement Actions
            ═══════════════════════════════════════════════════════════════════ */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: '0.5px solid rgba(255, 255, 255, 0.04)' }}
        >
          {/* Left: Social Actions */}
          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-150 active:scale-90 hover:bg-white/[0.04]"
            >
              <svg
                className="w-[18px] h-[18px] transition-all duration-200"
                fill={liked ? '#FF6B6B' : 'none'}
                stroke={liked ? '#FF6B6B' : 'rgba(255, 255, 255, 0.45)'}
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span
                className="text-[12px] font-medium tabular-nums"
                style={{ color: liked ? '#FF6B6B' : 'rgba(255, 255, 255, 0.45)' }}
              >
                {formatNumber(likeCount)}
              </span>
            </button>

            {/* Comment */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowCommentsModal(true); onComment?.(post.id); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-150 active:scale-90 hover:bg-white/[0.04]"
            >
              <svg
                className="w-[18px] h-[18px]"
                fill="none"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-[12px] font-medium tabular-nums" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                {formatNumber(post.commentsCount)}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowShareModal(true); onShare?.(post.id); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-150 active:scale-90 hover:bg-white/[0.04]"
            >
              <svg
                className="w-[18px] h-[18px]"
                fill="none"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
            </button>

          </div>

          {/* Right: Trade Button — Cute & compact on mobile */}
          {hasToken && (
            <button
              onClick={handleTrade}
              className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full sm:rounded-lg text-[11px] sm:text-[13px] font-bold transition-all duration-200 active:scale-95 hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #E0FF62 0%, #c8e85a 100%)',
                color: '#050505',
                boxShadow: '0 0 16px rgba(224, 255, 98, 0.2)',
              }}
            >
              Trade
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CONTENT — Title + Description (moved to bottom for mobile-first)
            ═══════════════════════════════════════════════════════════════════ */}
        {(post.title || post.content) && (
          <div className="px-3 sm:px-4 pb-2 cursor-pointer" onClick={handlePostClick}>
            {post.title && (
              <h3
                className="text-[14px] sm:text-[15px] font-semibold mb-1 leading-snug"
                style={{ color: '#FAFAFA' }}
              >
                {post.title}
              </h3>
            )}
            {post.content && (
              <p
                className="text-[13px] sm:text-[14px] leading-relaxed line-clamp-2"
                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                {post.content}
              </p>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            COMMENTS PREVIEW — Below engagement, hookable
            ═══════════════════════════════════════════════════════════════════ */}
        {hasToken && (
          <div className="px-4 pb-3">
            {getRandomComments(post.id, 2).map((comment, idx) => (
              <div
                key={comment.id}
                className="flex items-center gap-2 py-1.5"
                style={{
                  animation: `viralSlideUp 300ms ease-out ${idx * 80}ms both`,
                }}
              >
                {/* Mini Avatar */}
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold"
                  style={{
                    background: comment.isVerified
                      ? 'linear-gradient(135deg, #E0FF62 0%, #14b8a6 100%)'
                      : 'rgba(255, 255, 255, 0.1)',
                    color: comment.isVerified ? '#050505' : 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  {comment.username[0].toUpperCase()}
                </div>

                {/* Username + Comment */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span
                    className="text-[11px] font-semibold flex-shrink-0"
                    style={{ color: comment.isVerified ? '#E0FF62' : 'rgba(255, 255, 255, 0.6)' }}
                  >
                    @{comment.username}
                  </span>
                  {comment.isVerified && (
                    <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="#E0FF62">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span
                    className="text-[11px] truncate"
                    style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    {comment.text}
                  </span>
                </div>

                {/* Like Comment Button */}
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 p-1 rounded transition-all duration-150 hover:bg-white/[0.05] active:scale-90"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            ))}

            {/* View all comments link */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowCommentsModal(true); onComment?.(post.id); }}
              className="text-[10px] mt-1 transition-colors hover:underline"
              style={{ color: 'rgba(255, 255, 255, 0.35)' }}
            >
              View all {post.commentsCount || Math.floor(Math.random() * 20) + 5} comments
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CSS KEYFRAMES
          ═══════════════════════════════════════════════════════════════════ */}
      <style jsx>{`
        @keyframes viralSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════
          SWAP MODAL — Opens when Trade button is clicked
          ═══════════════════════════════════════════════════════════════════ */}
      {hasToken && (
        <SwapModal
          isOpen={isSwapModalOpen}
          onClose={() => setIsSwapModalOpen(false)}
          tokenMint={post.token!.mint}
          tokenSymbol={post.token!.symbol}
          tokenName={post.token!.displayName}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          COMMENTS MODAL — Opens when comment button is clicked
          ═══════════════════════════════════════════════════════════════════ */}
      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        postId={post.id}
        commentsCount={post.commentsCount}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          SHARE MODAL — Opens when share button is clicked
          ═══════════════════════════════════════════════════════════════════ */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post.id}
        postUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/post/${post.id}`}
        postTitle={post.title || post.content?.slice(0, 50) || 'Check out this post'}
      />
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════════════════════

export default ViralPostCard;
