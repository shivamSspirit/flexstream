'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { MobileNav } from '@/components/layout/MobileNav';
import { MainHeader } from '@/components/layout/MainHeader';
import { useWallet } from '@/hooks/useWalletCompat';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, Suspense, useState, useMemo, useCallback } from 'react';
import { usePosts, Post } from '@/hooks/usePosts';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { useLeaderboard, LeaderboardTrader } from '@/hooks/useLeaderboard';
import { ViralPostCard as NewViralPostCard, ViralPostData } from '@/components/feed/ViralPostCard';

// ═══════════════════════════════════════════════════════════════════════════════
// FLEXIT — VIRAL LANDING PAGE (SAME FOR ALL USERS)
// Nikita Bier: 3-sec aha, FOMO, dopamine loops, speed, one-tap
// Trader-First Post Cards with Multimedia
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT LIVE STATS — Fallback values, will be replaced with real data
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_LIVE_STATS = {
  totalVolume: 0,
  tradesToday: 0,
  onlineNow: 0,
  trending: '+0%',
};

// User data shape from Supabase joins
interface UserData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  wallet_address: string;
}

// Helper to extract user info from Supabase joins (which may return arrays)
const getUserFromJoin = (users: UserData | UserData[] | undefined | null): UserData | undefined => {
  if (!users) return undefined;
  return Array.isArray(users) ? users[0] : users;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONVERTER: Post → ViralPostData
// Transforms Supabase Post into the new viral card format
// ─────────────────────────────────────────────────────────────────────────────
const convertPostToViralData = (post: Post): ViralPostData => {
  const user = getUserFromJoin(post.users);

  // Generate mock sparkline data (in real app, fetch from price history)
  const generateSparkline = (isPositive: boolean): number[] => {
    const basePrice = 1;
    const trend = isPositive ? 1.015 : 0.985;
    return Array.from({ length: 24 }, (_, i) => {
      const noise = 1 + (Math.random() - 0.5) * 0.08;
      return basePrice * Math.pow(trend, i) * noise;
    });
  };

  // Random price change for demo (in real app, fetch from token data)
  const priceChange = post.token_mint
    ? (Math.random() - 0.3) * 200 // Slightly biased positive
    : 0;

  // Random market cap for demo
  const marketCap = post.token_mint
    ? Math.floor(Math.random() * 500000) + 10000
    : 0;

  return {
    id: post.id,
    creator: {
      username: user?.username || 'anonymous',
      displayName: user?.display_name || user?.username || 'Anonymous',
      avatar: user?.avatar_url || null,
      isVerified: post.verified || false,
      isWhale: false, // Could be determined by holdings
    },
    title: post.title || null,
    content: post.content || null,
    mediaUrl: post.media_urls?.[0] || null,
    mediaType: post.media_urls?.[0]?.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image',
    content_category: post.content_category || undefined,
    content_link: post.content_link || undefined,
    token: post.token_mint ? {
      // Use post title as ticker (cleaned up - first word, uppercase, max 8 chars)
      symbol: (post.title || 'TOKEN').split(' ')[0].toUpperCase().slice(0, 8),
      displayName: post.title || 'Token',
      mint: post.token_mint,
      price: 0.001, // Would come from real price feed
      priceChange24h: priceChange,
      marketCap: marketCap,
      holders: Math.floor(Math.random() * 500) + 10, // Would come from real holder data
      launchedAt: post.created_at,
      sparkline: generateSparkline(priceChange >= 0),
    } : null,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    viewersCount: Math.floor(Math.random() * 200) + 10, // Mock viewers count
    createdAt: post.created_at,
    isLiked: false,
  };
};

// Helper to format time ago
const formatTimeAgo = (dateString: string): string => {
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
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY POST TYPE — For ViralPostCard (mock/demo data)
// ─────────────────────────────────────────────────────────────────────────────
interface LegacyPost {
  id: string;
  creator: {
    name: string;
    handle: string;
    avatar: string;
    isVerified: boolean;
    isWhale: boolean;
  };
  content: string;
  media: {
    type: 'image' | 'video';
    url: string;
    aspectRatio: string;
    thumbnail?: string;
  } | null;
  token: {
    symbol: string;
    icon: string;
    price: string;
    change: string;
    marketCap: string;
    holders: number;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    trades: number;
  };
  time: string;
  tradingVolume: string;
  isTrending: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PREDICTION MARKETS — Kalshi-style
// ─────────────────────────────────────────────────────────────────────────────
const PREDICTION_MARKETS = [
  {
    id: 1,
    question: 'Will BTC exceed $150K in 2026?',
    category: 'Crypto',
    icon: '₿',
    yesPrice: 67,
    noPrice: 33,
    volume: '$12.5M',
    traders: 2847,
    closesIn: '14d 8h',
    trending: true,
  },
  {
    id: 2,
    question: 'Will ETH flip BTC market cap?',
    category: 'Crypto',
    icon: '⟠',
    yesPrice: 12,
    noPrice: 88,
    volume: '$8.2M',
    traders: 1923,
    closesIn: '45d',
    trending: false,
  },
  {
    id: 3,
    question: 'Will SOL reach $500 this year?',
    category: 'Crypto',
    icon: '◎',
    yesPrice: 45,
    noPrice: 55,
    volume: '$5.1M',
    traders: 1456,
    closesIn: '89d',
    trending: true,
  },
  {
    id: 4,
    question: 'Will Trump win 2028 election?',
    category: 'Politics',
    icon: '🏛️',
    yesPrice: 34,
    noPrice: 66,
    volume: '$24.8M',
    traders: 8921,
    closesIn: '1,024d',
    trending: false,
  },
  {
    id: 5,
    question: 'Will Fed cut rates in Q1 2026?',
    category: 'Economics',
    icon: '📊',
    yesPrice: 78,
    noPrice: 22,
    volume: '$3.2M',
    traders: 892,
    closesIn: '58d',
    trending: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LIVE MONEY FLOW
// ─────────────────────────────────────────────────────────────────────────────
const MONEY_FLOW = [
  { user: '0x7f...2a', action: 'bought', amount: '$2,500', token: 'PEPE', time: 'now', isBuy: true },
  { user: '0x3d...8c', action: 'sold', amount: '$890', token: 'MOLT', time: '3s', isBuy: false },
  { user: '0x9a...1f', action: 'bought', amount: '$12,400', token: 'SOL', time: '8s', isBuy: true },
  { user: '0x2b...7e', action: 'bought', amount: '$450', token: 'TRUMP', time: '12s', isBuy: true },
  { user: '0x5c...4d', action: 'sold', amount: '$3,200', token: 'BONK', time: '18s', isBuy: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK TOP CREATORS — Will be replaced with real leaderboard data
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_TOP_CREATORS = [
  { rank: 1, name: 'Loading...', handle: '@...', gain: '+$0', winRate: '0%', avatar: '👤', isWhale: false, followers: '0' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return count;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function LivePulse({ color = '#14b8a6', size = 8 }: { color?: string; size?: number }) {
  return (
    <span className="relative flex items-center justify-center">
      <span
        className="absolute animate-ping rounded-full opacity-75"
        style={{ width: size * 1.5, height: size * 1.5, background: color }}
      />
      <span
        className="relative rounded-full"
        style={{ width: size, height: size, background: color }}
      />
    </span>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEFT NAVIGATION SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    id: 'explore',
    label: 'Explore',
    href: '/explore',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
    badge: 3,
  },
  {
    id: 'create',
    label: 'Create',
    href: '/create',
    icon: (_active?: boolean) => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    isSpecial: true,
  },
  {
    id: 'predictions',
    label: 'Predictions',
    href: '/predictions',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

function LeftNavSidebar({
  isAuthenticated,
  onLogin,
  publicKey,
}: {
  isAuthenticated: boolean;
  onLogin: () => void;
  publicKey: string | null;
}) {
  const pathname = usePathname();

  const handleNavClick = (item: typeof NAV_ITEMS[0], e: React.MouseEvent) => {
    // Allow home, explore, and predictions without auth
    if (!isAuthenticated && item.id !== 'home' && item.id !== 'explore' && item.id !== 'predictions') {
      e.preventDefault();
      onLogin();
      return;
    }
  };

  return (
    <aside
      className="hidden md:flex flex-col items-center py-4 fixed left-0 top-14 h-[calc(100vh-56px)] z-40"
      style={{
        width: '60px',
        background: 'rgba(10, 10, 10, 0.95)',
        borderRight: '0.5px solid rgba(255,255,255,0.04)',
      }}
    >
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === 'home' ? pathname === '/' : pathname.startsWith(item.href);
          const href = item.href;

          if (item.isSpecial) {
            return (
              <Link
                key={item.id}
                href={href}
                onClick={(e) => handleNavClick(item, e)}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center my-2 transition-all duration-150 active:scale-90"
                style={{
                  background: 'linear-gradient(135deg, #E0FF62 0%, #c8e85a 100%)',
                  boxShadow: '0 0 20px rgba(224, 255, 98, 0.25)',
                }}
                title={item.label}
              >
                <span style={{ color: '#050505' }}>{item.icon(false)}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.id}
              href={href}
              onClick={(e) => handleNavClick(item, e)}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 group"
              style={{
                background: isActive ? 'rgba(224, 255, 98, 0.1)' : 'transparent',
                color: isActive ? '#E0FF62' : 'rgba(255,255,255,0.4)',
              }}
              title={item.label}
            >
              {item.icon(isActive)}

              {/* Hover tooltip */}
              <span
                className="absolute left-full ml-3 px-2 py-1 rounded-md text-[11px] font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap"
                style={{
                  background: 'rgba(26, 26, 26, 0.95)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  color: '#FAFAFA',
                }}
              >
                {item.label}
              </span>

              {/* Notification badge */}
              {item.badge && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: '#f87171',
                    color: '#fff',
                  }}
                >
                  {item.badge}
                </span>
              )}

              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: '#E0FF62' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section - Settings + Profile Avatar */}
      <div className="mt-auto flex flex-col items-center gap-3 pb-6">
        {/* Settings */}
        <Link
          href="/settings"
          className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 group"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>

          {/* Hover tooltip */}
          <span
            className="absolute left-full ml-3 px-2 py-1 rounded-md text-[11px] font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50"
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              color: '#FAFAFA',
            }}
          >
            Settings
          </span>
        </Link>

        {/* Connected Profile Avatar */}
        {isAuthenticated ? (
          <Link
            href={publicKey ? `/profile/${publicKey}` : '/profile'}
            className="relative group"
            title="Your Profile"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-150 active:scale-90"
              style={{
                background: 'linear-gradient(135deg, #E0FF62 0%, #14b8a6 100%)',
                border: '2px solid rgba(224, 255, 98, 0.4)',
                boxShadow: '0 0 15px rgba(224, 255, 98, 0.2)',
                color: '#050505',
              }}
            >
              {publicKey ? publicKey.slice(0, 2).toUpperCase() : 'U'}
            </div>

            {/* Online indicator */}
            <span
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
              style={{
                background: '#10b981',
                border: '2px solid #0a0a0a',
              }}
            />

            {/* Hover tooltip */}
            <span
              className="absolute left-full ml-3 px-2 py-1 rounded-md text-[11px] font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50"
              style={{
                background: 'rgba(26, 26, 26, 0.95)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                color: '#FAFAFA',
              }}
            >
              Your Profile
            </span>
          </Link>
        ) : (
          <button
            onClick={onLogin}
            className="relative group"
            title="Connect Wallet"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1.5px dashed rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>

            {/* Hover tooltip */}
            <span
              className="absolute left-full ml-3 px-2 py-1 rounded-md text-[11px] font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50"
              style={{
                background: 'rgba(26, 26, 26, 0.95)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                color: '#FAFAFA',
              }}
            >
              Connect Wallet
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIRAL POST CARD — Trader-First Design with Multimedia
// ═══════════════════════════════════════════════════════════════════════════════

function ViralPostCard({
  post,
  index,
  onTrade,
  isAuthenticated,
}: {
  post: LegacyPost;
  index: number;
  onTrade: () => void;
  isAuthenticated: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.engagement.likes);
  const isPositiveChange = post.token.change.startsWith('+');

  const handleLike = () => {
    if (!isAuthenticated) {
      onTrade();
      return;
    }
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <article
      className="relative transition-all duration-200 hover:bg-white/[0.015]"
      style={{
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        animation: `slideUp 350ms ease-out ${index * 60}ms both`,
      }}
    >
      <div className="p-4">
        {/* ═══ HEADER: Creator + Time ═══ */}
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/profile/${post.creator.handle.slice(1)}`} className="relative flex-shrink-0">
            <div
              className="w-10 h-10 rounded-full overflow-hidden transition-transform duration-150 hover:scale-105"
              style={{
                border: post.creator.isWhale
                  ? '2px solid #14b8a6'
                  : '1.5px solid rgba(255,255,255,0.12)',
              }}
            >
              {post.creator.avatar ? (
                <img
                  src={post.creator.avatar}
                  alt={post.creator.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #E0FF62 0%, #14b8a6 100%)', color: '#050505' }}
                >
                  {post.creator.name[0]}
                </div>
              )}
            </div>
            {post.creator.isWhale && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
                style={{
                  background: '#14b8a6',
                  border: '2px solid #121212',
                }}
              >
                🐋
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/profile/${post.creator.handle.slice(1)}`}
                className="text-[14px] font-semibold hover:underline truncate"
                style={{ color: '#FAFAFA' }}
              >
                {post.creator.name}
              </Link>
              {post.creator.isVerified && (
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#E0FF62">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {post.creator.handle}
              </span>
            </div>
            <span
              className="text-[11px]"
              style={{ color: post.time === 'just now' ? '#14b8a6' : 'rgba(255,255,255,0.35)' }}
            >
              {post.time}
            </span>
          </div>

          {/* Token Pill - Minimal */}
          <button
            onClick={onTrade}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-150 active:scale-95 hover:scale-105"
            style={{
              background: 'rgba(224, 255, 98, 0.1)',
              border: '1px solid rgba(224, 255, 98, 0.2)',
            }}
          >
            <span className="text-sm">{post.token.icon}</span>
            <span className="text-[11px] font-bold" style={{ color: '#E0FF62' }}>
              ${post.token.symbol}
            </span>
            <span
              className="text-[10px] font-semibold"
              style={{ color: isPositiveChange ? '#14b8a6' : '#f87171' }}
            >
              {post.token.change}
            </span>
          </button>
        </div>

        {/* ═══ CONTENT ═══ */}
        <p className="text-[14px] leading-relaxed mb-3" style={{ color: '#FAFAFA' }}>
          {post.content}
        </p>

        {/* ═══ MEDIA — Clickable with Viral Hover Overlay ═══ */}
        {post.media && (
          <div
            onClick={onTrade}
            className="block mb-3 group cursor-pointer"
          >
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ aspectRatio: post.media.aspectRatio }}
            >
              {/* Image */}
              <img
                src={post.media.url}
                alt="Post media"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />

              {/* Video Play Icon (always visible for videos) */}
              {post.media.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }}
                  >
                    <svg className="w-6 h-6 ml-1" fill="#050505" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* ═══ VIRAL HOVER OVERLAY ═══ */}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                }}
              >
                {/* Floating Trade Button */}
                <div
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                  style={{
                    background: 'linear-gradient(135deg, #E0FF62 0%, #c8e85a 100%)',
                    boxShadow: '0 8px 32px rgba(224, 255, 98, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="#050505" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-[13px] font-bold" style={{ color: '#050505' }}>
                    Trade ${post.token.symbol}
                  </span>
                </div>

                {/* Bottom Stats Bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3"
                  style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[11px] text-white/80">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {formatNumber(post.engagement.likes)}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-white/80">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {formatNumber(post.engagement.comments)}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(20, 184, 166, 0.3)', color: '#14b8a6' }}
                  >
                    {post.token.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ENGAGEMENT BAR — Clean & Social ═══ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Like */}
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 transition-all duration-150 active:scale-90 group"
            >
              <svg
                className="w-[18px] h-[18px] transition-all duration-150 group-hover:scale-110"
                fill={liked ? '#f87171' : 'none'}
                stroke={liked ? '#f87171' : 'rgba(255,255,255,0.45)'}
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span
                className="text-[12px]"
                style={{ color: liked ? '#f87171' : 'rgba(255,255,255,0.45)' }}
              >
                {formatNumber(likeCount)}
              </span>
            </button>

            {/* Comment */}
            <button onClick={onTrade} className="flex items-center gap-1.5 transition-all duration-150 active:scale-90 group">
              <svg
                className="w-[18px] h-[18px] group-hover:scale-110 transition-transform"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {formatNumber(post.engagement.comments)}
              </span>
            </button>

            {/* Share */}
            <button className="flex items-center gap-1.5 transition-all duration-150 active:scale-90 group">
              <svg
                className="w-[18px] h-[18px] group-hover:scale-110 transition-transform"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {formatNumber(post.engagement.shares)}
              </span>
            </button>

            {/* Trades - subtle indicator */}
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="rgba(20, 184, 166, 0.7)" viewBox="0 0 24 24">
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span className="text-[11px]" style={{ color: 'rgba(20, 184, 166, 0.7)' }}>
                {formatNumber(post.engagement.trades)}
              </span>
            </div>
          </div>

          {/* Trade CTA */}
          <button
            onClick={onTrade}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold transition-all duration-150 active:scale-95 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #E0FF62 0%, #c8e85a 100%)',
              color: '#050505',
            }}
          >
            Trade
          </button>
        </div>
      </div>
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REAL POST CARD — For Supabase posts with real data
// ═══════════════════════════════════════════════════════════════════════════════

function RealPostCard({
  post,
  index,
  onTrade,
  isAuthenticated,
}: {
  post: Post;
  index: number;
  onTrade: () => void;
  isAuthenticated: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const router = useRouter();

  // Extract user from join
  const user = getUserFromJoin(post.users);
  const displayName = user?.display_name || user?.username || 'Anonymous';
  const username = user?.username || 'anonymous';
  const avatarUrl = user?.avatar_url;

  // Check if post has media
  const hasMedia = post.media_urls && post.media_urls.length > 0;
  const firstMedia = hasMedia ? post.media_urls[0] : null;
  const isVideo = firstMedia?.match(/\.(mp4|webm|mov|avi)$/i) || firstMedia?.includes('video');

  // Check if post has token
  const hasToken = !!post.token_mint;

  const handleLike = () => {
    if (!isAuthenticated) {
      onTrade();
      return;
    }
    setLiked(!liked);
    setLikeCount((prev: number) => liked ? prev - 1 : prev + 1);
  };

  const handlePostClick = () => {
    router.push(`/post/${post.id}`);
  };

  return (
    <article
      className="relative transition-all duration-200 hover:bg-white/[0.015]"
      style={{
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        animation: `slideUp 350ms ease-out ${index * 60}ms both`,
      }}
    >
      <div className="p-4">
        {/* ═══ HEADER: Creator + Time ═══ */}
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/profile/${username}`} className="relative flex-shrink-0">
            <div
              className="w-10 h-10 rounded-full overflow-hidden transition-transform duration-150 hover:scale-105"
              style={{ border: '1.5px solid rgba(255,255,255,0.12)' }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #E0FF62 0%, #14b8a6 100%)', color: '#050505' }}
                >
                  {displayName[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/profile/${username}`}
                className="text-[14px] font-semibold hover:underline truncate"
                style={{ color: '#FAFAFA' }}
              >
                {displayName}
              </Link>
              {post.verified && (
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="#E0FF62">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                @{username}
              </span>
            </div>
            <span
              className="text-[11px]"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              {formatTimeAgo(post.created_at)}
            </span>
          </div>

          {/* Token Pill */}
          {hasToken && (
            <button
              onClick={onTrade}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-150 active:scale-95 hover:scale-105"
              style={{
                background: 'rgba(224, 255, 98, 0.1)',
                border: '1px solid rgba(224, 255, 98, 0.2)',
              }}
            >
              <span className="text-sm">🪙</span>
              <span className="text-[11px] font-bold" style={{ color: '#E0FF62' }}>
                ${post.token_display_name || post.token_symbol || 'TOKEN'}
              </span>
            </button>
          )}
        </div>

        {/* ═══ TITLE ═══ */}
        {post.title && (
          <h3
            className="text-[15px] font-semibold mb-2 cursor-pointer hover:text-[#E0FF62] transition-colors"
            style={{ color: '#FAFAFA' }}
            onClick={handlePostClick}
          >
            {post.title}
          </h3>
        )}

        {/* ═══ CONTENT ═══ */}
        {post.content && (
          <p
            className="text-[14px] leading-relaxed mb-3 cursor-pointer"
            style={{ color: '#FAFAFA' }}
            onClick={handlePostClick}
          >
            {post.content}
          </p>
        )}

        {/* ═══ MEDIA ═══ */}
        {hasMedia && firstMedia && (
          <div
            onClick={handlePostClick}
            className="block mb-3 group cursor-pointer"
          >
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {isVideo ? (
                <video
                  src={firstMedia}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={firstMedia}
                  alt="Post media"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              )}

              {/* Video Play Icon */}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }}
                  >
                    <svg className="w-6 h-6 ml-1" fill="#050505" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* View Coin overlay on hover */}
              {hasToken && (
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <div
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #E0FF62 0%, #c8e85a 100%)',
                      boxShadow: '0 8px 32px rgba(224, 255, 98, 0.4)',
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="#050505" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[13px] font-bold" style={{ color: '#050505' }}>
                      View ${post.token_display_name || post.token_symbol || 'TOKEN'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ ENGAGEMENT BAR ═══ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Like */}
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 transition-all duration-150 active:scale-90 group"
            >
              <svg
                className="w-[18px] h-[18px] transition-all duration-150 group-hover:scale-110"
                fill={liked ? '#f87171' : 'none'}
                stroke={liked ? '#f87171' : 'rgba(255,255,255,0.45)'}
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span
                className="text-[12px]"
                style={{ color: liked ? '#f87171' : 'rgba(255,255,255,0.45)' }}
              >
                {formatNumber(likeCount)}
              </span>
            </button>

            {/* Comment */}
            <button onClick={handlePostClick} className="flex items-center gap-1.5 transition-all duration-150 active:scale-90 group">
              <svg
                className="w-[18px] h-[18px] group-hover:scale-110 transition-transform"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                0
              </span>
            </button>

            {/* Share */}
            <button className="flex items-center gap-1.5 transition-all duration-150 active:scale-90 group">
              <svg
                className="w-[18px] h-[18px] group-hover:scale-110 transition-transform"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
            </button>
          </div>

          {/* Trade CTA */}
          {hasToken && (
            <button
              onClick={onTrade}
              className="px-4 py-2 rounded-lg text-[12px] font-semibold transition-all duration-150 active:scale-95 hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #E0FF62 0%, #c8e85a 100%)',
                color: '#050505',
              }}
            >
              Trade
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTION CARD
// ═══════════════════════════════════════════════════════════════════════════════

function PredictionCard({
  market,
  index,
  onBet,
}: {
  market: typeof PREDICTION_MARKETS[0];
  index: number;
  onBet: () => void;
}) {
  const [hoveredSide, setHoveredSide] = useState<'yes' | 'no' | null>(null);
  const yesPayout = Math.round(100 / (market.yesPrice / 100));
  const noPayout = Math.round(100 / (market.noPrice / 100));

  return (
    <div
      className="p-4 transition-all duration-150"
      style={{
        background: 'rgba(26, 26, 26, 0.6)',
        borderBottom: '0.5px solid rgba(255,255,255,0.04)',
        animation: `slideUp 300ms ease-out ${index * 50}ms both`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{
              background: market.category === 'Crypto'
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : market.category === 'Politics'
                ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            {market.icon}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {market.category}
          </span>
        </div>
        {market.trending && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(20, 184, 166, 0.15)' }}>
            <span className="text-[10px]">🔥</span>
            <span className="text-[9px] font-semibold" style={{ color: '#14b8a6' }}>TRENDING</span>
          </div>
        )}
      </div>

      <h3 className="text-[15px] font-semibold mb-3 leading-snug" style={{ color: '#FAFAFA' }}>
        {market.question}
      </h3>

      <div className="flex gap-2 mb-2">
        <button
          onClick={onBet}
          onMouseEnter={() => setHoveredSide('yes')}
          onMouseLeave={() => setHoveredSide(null)}
          className="flex-1 py-2.5 rounded-lg text-center transition-all duration-150 active:scale-[0.98]"
          style={{
            background: hoveredSide === 'yes' ? 'rgba(20, 184, 166, 1)' : 'rgba(20, 184, 166, 0.9)',
            color: '#fff',
            boxShadow: hoveredSide === 'yes' ? '0 0 20px rgba(20, 184, 166, 0.4)' : 'none',
          }}
        >
          <span className="text-[14px] font-bold">Yes {market.yesPrice}¢</span>
        </button>
        <button
          onClick={onBet}
          onMouseEnter={() => setHoveredSide('no')}
          onMouseLeave={() => setHoveredSide(null)}
          className="flex-1 py-2.5 rounded-lg text-center transition-all duration-150 active:scale-[0.98]"
          style={{
            background: hoveredSide === 'no' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
            border: '0.5px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          <span className="text-[14px] font-bold">No {market.noPrice}¢</span>
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1 text-center">
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>$100 → </span>
          <span className="text-[11px] font-semibold" style={{ color: '#14b8a6' }}>${yesPayout}</span>
        </div>
        <div className="flex-1 text-center">
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>$100 → </span>
          <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>${noPayout}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2" style={{ borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <LivePulse color="#10b981" size={6} />
            <span className="text-[10px] font-semibold" style={{ color: '#10b981' }}>LIVE</span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{market.volume}</span>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{market.traders.toLocaleString()} traders</span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{market.closesIn}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONEY FLOW ITEM
// ═══════════════════════════════════════════════════════════════════════════════

function MoneyFlowItem({ item, index }: { item: typeof MONEY_FLOW[0]; index: number }) {
  return (
    <div
      className="flex items-center gap-2 py-2 px-3"
      style={{
        animation: `slideIn 200ms ease-out ${index * 30}ms both`,
        borderBottom: '0.5px solid rgba(255,255,255,0.03)',
      }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono"
        style={{
          background: item.isBuy ? 'rgba(20, 184, 166, 0.2)' : 'rgba(248, 113, 113, 0.2)',
          color: item.isBuy ? '#14b8a6' : '#f87171',
        }}
      >
        {item.isBuy ? '↑' : '↓'}
      </div>
      <div className="flex-1 min-w-0 text-[11px]">
        <span className="font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.user}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}> {item.action} </span>
        <span className="font-semibold" style={{ color: item.isBuy ? '#14b8a6' : '#f87171' }}>{item.amount}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}> of </span>
        <span className="font-semibold" style={{ color: '#FAFAFA' }}>${item.token}</span>
      </div>
      <span className="text-[9px] font-mono" style={{ color: item.time === 'now' ? '#14b8a6' : 'rgba(255,255,255,0.25)' }}>
        {item.time}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD ITEM
// ═══════════════════════════════════════════════════════════════════════════════

function LeaderboardItem({ creator, onTrade }: { creator: typeof FALLBACK_TOP_CREATORS[0]; onTrade: () => void }) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000', glow: 'rgba(255, 215, 0, 0.3)' };
    if (rank === 2) return { bg: 'linear-gradient(135deg, #C0C0C0, #888)', color: '#000', glow: 'rgba(192, 192, 192, 0.2)' };
    if (rank === 3) return { bg: 'linear-gradient(135deg, #CD7F32, #8B4513)', color: '#fff', glow: 'rgba(205, 127, 50, 0.2)' };
    return { bg: 'rgba(255,255,255,0.08)', color: '#fff', glow: 'none' };
  };

  const rankStyle = getRankStyle(creator.rank);

  return (
    <div
      className="flex items-center gap-3 p-2.5 rounded-lg transition-all duration-150 cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.02)' }}
      onClick={onTrade}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
        style={{ background: rankStyle.bg, color: rankStyle.color, boxShadow: `0 0 15px ${rankStyle.glow}` }}
      >
        {creator.rank}
      </div>
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(224, 255, 98, 0.15) 0%, rgba(20, 184, 166, 0.1) 100%)',
          border: creator.isWhale ? '1.5px solid rgba(20, 184, 166, 0.4)' : '0.5px solid rgba(255,255,255,0.1)',
        }}
      >
        {creator.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold truncate" style={{ color: '#FAFAFA' }}>{creator.name}</span>
          {creator.isWhale && <span className="text-[8px]">🐋</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{creator.winRate} win</span>
        </div>
      </div>
      <span className="text-[12px] font-bold font-mono flex-shrink-0" style={{ color: '#14b8a6' }}>{creator.gain}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE — UNIFIED FOR ALL USERS
// ═══════════════════════════════════════════════════════════════════════════════

function MainFeed() {
  const router = useRouter();
  const { login, authenticated } = usePrivy();
  const { publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'predictions'>('general');
  const [moneyFlowIndex, setMoneyFlowIndex] = useState(0);

  const isAuthenticated = authenticated || !!publicKey;

  // ═══ REAL DATA HOOKS ═══
  const { data: postsData, isLoading: postsLoading } = usePosts({ limit: 10 });
  const { data: platformStats } = usePlatformStats();
  const { leaderboard: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard(true);

  // Extract real posts
  const realPosts = postsData?.data?.posts || [];

  // Use real platform stats or defaults
  const liveStats = useMemo(() => ({
    totalVolume: platformStats?.volume24h ? parseFloat(platformStats.volume24h.replace(/[^0-9.-]+/g, '')) : DEFAULT_LIVE_STATS.totalVolume,
    tradesToday: platformStats?.postsToday || DEFAULT_LIVE_STATS.tradesToday,
    onlineNow: platformStats?.tradingNow || DEFAULT_LIVE_STATS.onlineNow,
    trending: '+23.4%', // Could be calculated from real data
  }), [platformStats]);

  // Map leaderboard data to TOP_CREATORS format
  const topCreators = useMemo(() => {
    if (leaderboardData && leaderboardData.length > 0) {
      return leaderboardData.slice(0, 5).map((trader: LeaderboardTrader) => ({
        rank: trader.rank,
        name: trader.displayName || trader.username || 'Trader',
        handle: `@${trader.username || 'anonymous'}`,
        gain: `+$${trader.metricValue.toLocaleString()}`,
        winRate: `${(trader.winRate * 100).toFixed(0)}%`,
        avatar: trader.avatarUrl || '👤',
        isWhale: trader.verifiedEarnings > 10000,
        followers: '0',
      }));
    }
    return FALLBACK_TOP_CREATORS;
  }, [leaderboardData]);

  const volumeCount = useAnimatedCounter(liveStats.totalVolume, 2500);
  const onlineCount = useAnimatedCounter(liveStats.onlineNow, 1500);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMoneyFlowIndex((prev) => (prev + 1) % MONEY_FLOW.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const currentMoneyFlow = useMemo(() => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      items.push(MONEY_FLOW[(moneyFlowIndex + i) % MONEY_FLOW.length]);
    }
    return items;
  }, [moneyFlowIndex]);

  const handleAction = useCallback(() => {
    if (!isAuthenticated) {
      login();
    }
  }, [isAuthenticated, login]);

  const handleCreatePost = useCallback(() => {
    if (!isAuthenticated) {
      login();
    } else {
      router.push('/create');
    }
  }, [isAuthenticated, login, router]);

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#050505' }}>
      {/* CSS Keyframes */}
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(224, 255, 98, 0.2); }
          50% { box-shadow: 0 0 40px rgba(224, 255, 98, 0.4); }
        }
      `}</style>

      {/* Grain */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% -10%, rgba(20, 184, 166, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 80% 20%, rgba(224, 255, 98, 0.04) 0%, transparent 40%),
            radial-gradient(ellipse 50% 40% at 20% 80%, rgba(45, 27, 78, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* ═══ HEADER — Reusable MainHeader Component ═══ */}
      <MainHeader onlineCount={onlineCount} />

      {/* ═══ MAIN LAYOUT ═══ */}
      <main className="pt-14 min-h-screen">
        {/* LEFT NAV SIDEBAR — Fixed */}
        <LeftNavSidebar
          isAuthenticated={isAuthenticated}
          onLogin={() => login()}
          publicKey={publicKey?.toBase58() || null}
        />

        {/* CONTENT AREA — Cohesive layout with tighter spacing */}
        <div className="md:ml-[60px] lg:mr-[320px]">
          <div className="max-w-2xl mx-auto px-4">
            {/* CENTER FEED */}
            <div className="w-full">
            {/* Hero */}
            <section
              className="px-4 pt-6 pb-4 text-center"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(16px)',
                transition: 'all 500ms ease-out',
              }}
            >
              <h1
                className="text-[32px] sm:text-[40px] leading-[1.05] mb-2"
                style={{ color: '#FAFAFA', fontFamily: '"Cormorant Garamond", serif', fontWeight: 400, letterSpacing: '-0.03em' }}
              >
                Trade Every <span style={{ color: '#E0FF62' }}>Post</span>
              </h1>
              <p className="text-[14px] mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Follow creators. Trade their tokens. Catch momentum.
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex -space-x-2">
                  {['🔥', '💎', '🚀', '👑', '🐋'].map((emoji, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ background: 'rgba(26, 26, 26, 0.9)', border: '2px solid #050505', zIndex: 5 - idx }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span className="font-semibold" style={{ color: '#14b8a6' }}>{onlineCount.toLocaleString()}</span> trading now
                </p>
              </div>
            </section>

            {/* Tabs */}
            <div
              className="sticky top-16 z-30 px-4 pt-3 pb-4"
              style={{
                background: 'rgba(5, 5, 5, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <button
                  onClick={() => setActiveTab('general')}
                  className="flex-1 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150"
                  style={{
                    background: activeTab === 'general' ? 'rgba(224, 255, 98, 0.15)' : 'transparent',
                    color: activeTab === 'general' ? '#E0FF62' : 'rgba(255,255,255,0.5)',
                    border: activeTab === 'general' ? '0.5px solid rgba(224, 255, 98, 0.3)' : '0.5px solid transparent',
                  }}
                >
                  📈 Posts
                </button>
                <button
                  onClick={() => setActiveTab('predictions')}
                  className="flex-1 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150"
                  style={{
                    background: activeTab === 'predictions' ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
                    color: activeTab === 'predictions' ? '#14b8a6' : 'rgba(255,255,255,0.5)',
                    border: activeTab === 'predictions' ? '0.5px solid rgba(20, 184, 166, 0.3)' : '0.5px solid transparent',
                  }}
                >
                  🎯 Predictions
                </button>
              </div>
            </div>

            {/* Feed */}
            <div
              className="mx-4 mb-4 rounded-xl overflow-hidden"
              style={{ background: 'rgba(18, 18, 18, 0.5)', border: '0.5px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-2">
                  <LivePulse color="#14b8a6" size={8} />
                  <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#14b8a6' }}>
                    {activeTab === 'general' ? 'Live Feed' : 'Live Markets'}
                  </span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>Real-time</span>
              </div>

              {activeTab === 'general' && (
                <div>
                  {postsLoading ? (
                    // Loading skeleton
                    <div className="p-6 text-center">
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-32 bg-white/[0.05] rounded-lg" />
                        ))}
                      </div>
                    </div>
                  ) : realPosts.length === 0 ? (
                    // Empty state
                    <div className="p-8 text-center">
                      <p className="text-[14px] text-white/50 mb-4">No posts yet. Be the first to create!</p>
                      <button
                        onClick={handleCreatePost}
                        className="px-6 py-3 rounded-lg text-[13px] font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #E0FF62 0%, #c8e85a 100%)',
                          color: '#050505',
                        }}
                      >
                        Create Post
                      </button>
                    </div>
                  ) : (
                    // Real posts with new Viral design
                    realPosts.map((post: Post, idx: number) => (
                      <NewViralPostCard
                        key={post.id}
                        post={convertPostToViralData(post)}
                        index={idx}
                        onTrade={handleAction}
                        onLike={() => {}}
                        onComment={() => router.push(`/post/${post.id}`)}
                        onShare={() => {}}
                        isAuthenticated={isAuthenticated}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'predictions' && (
                <div>
                  {PREDICTION_MARKETS.map((market, idx) => (
                    <PredictionCard key={market.id} market={market} index={idx} onBet={handleAction} />
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            {!isAuthenticated && (
              <div className="px-4 pb-6 text-center">
                <button
                  onClick={() => login()}
                  className="w-full py-4 rounded-xl text-[15px] font-semibold transition-all duration-150 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #E0FF62 0%, #c8e85a 100%)',
                    color: '#050505',
                    boxShadow: '0 0 40px rgba(224, 255, 98, 0.25)',
                    animation: 'pulse-glow 3s ease-in-out infinite',
                  }}
                >
                  Start Trading Now
                </button>
                <p className="text-[11px] mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  No fees · Instant setup · Solana powered
                </p>
              </div>
            )}

            <footer className="px-4 pb-24 md:pb-8 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: '"IBM Plex Mono", monospace' }}>
                Flexit © 2024 · Solana Devnet
              </p>
            </footer>
            </div>

            {/* RIGHT SIDEBAR — Fixed, positioned closer to content */}
            <aside className="hidden lg:block w-[300px] fixed right-[max(16px,calc((100vw-1200px)/2))] top-20 h-[calc(100vh-96px)] overflow-y-auto scrollbar-hide">
              <div className="py-4 space-y-4">
                {/* Section 1: Live Trading Stats */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(18, 18, 18, 0.6)', border: '0.5px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <LivePulse color="#f87171" size={8} />
                    <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#f87171' }}>Live Trading</span>
                  </div>
                  <div className="mb-3">
                    <p className="text-[26px] font-bold font-mono" style={{ color: '#FAFAFA', textShadow: '0 0 30px rgba(20, 184, 166, 0.3)' }}>
                      ${volumeCount.toLocaleString()}
                    </p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Total Volume Today</p>
                  </div>
                  <div className="flex justify-between items-center pt-2" style={{ borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>24h Change</span>
                    <span className="text-[12px] font-semibold font-mono" style={{ color: '#14b8a6' }}>{liveStats.trending}</span>
                  </div>
                </div>

                {/* Section 2: Live Trades / Money Flow */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'rgba(18, 18, 18, 0.6)', border: '0.5px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-[11px] font-semibold" style={{ color: '#FAFAFA' }}>Live Trades</span>
                    <LivePulse color="#14b8a6" size={6} />
                  </div>
                  <div className="max-h-48 overflow-hidden">
                    {currentMoneyFlow.map((item, idx) => (
                      <MoneyFlowItem key={`${item.user}-${moneyFlowIndex}-${idx}`} item={item} index={idx} />
                    ))}
                  </div>
                </div>

                {/* Section 3: Top Creators Leaderboard */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'rgba(18, 18, 18, 0.6)', border: '0.5px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-sm">🏆</span>
                    <span className="text-[11px] font-semibold" style={{ color: '#FAFAFA' }}>Top Gains Today</span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    {topCreators.map((creator: typeof FALLBACK_TOP_CREATORS[0]) => (
                      <LeaderboardItem key={creator.rank} creator={creator} onTrade={handleAction} />
                    ))}
                  </div>
                  <button
                    className="w-full py-2.5 text-[11px] font-medium transition-colors hover:bg-white/[0.02]"
                    style={{ color: '#E0FF62', borderTop: '0.5px solid rgba(255,255,255,0.04)' }}
                    onClick={handleAction}
                  >
                    View All Creators →
                  </button>
                </div>

                {/* Section 4: FOMO Card - "You could have made" */}
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.08) 0%, rgba(224, 255, 98, 0.04) 100%)',
                    border: '0.5px solid rgba(248, 113, 113, 0.15)',
                  }}
                >
                  <p className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>You could have made</p>
                  <p className="text-[22px] font-bold font-mono mb-1" style={{ color: '#14b8a6' }}>+$12,450</p>
                  <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>@alpha_trader bought CLAWNCH 3 days ago</p>
                  <button
                    onClick={handleAction}
                    className="mt-3 w-full px-4 py-2 rounded-lg text-[10px] font-medium transition-all duration-150 active:scale-95"
                    style={{ background: 'rgba(20, 184, 166, 0.2)', border: '0.5px solid rgba(20, 184, 166, 0.4)', color: '#14b8a6' }}
                  >
                    See What They&apos;re Buying Now
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto" style={{ border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
          <div className="absolute inset-0 m-3" style={{ border: '0.5px solid rgba(224, 255, 98, 0.4)', borderRadius: '2px', animation: 'pulse 2s ease-in-out infinite' }} />
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.2em]" style={{ color: '#6B6B70', fontFamily: '"IBM Plex Mono", monospace' }}>
          Opening Vault
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MainFeed />
    </Suspense>
  );
}
