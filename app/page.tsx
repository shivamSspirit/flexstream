'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SimpleFeed } from '@/components/feed/SimpleFeed';
import { AppLayout } from '@/components/layout/AppLayout';
import { FloatingWalletCTA } from '@/components/layout/FloatingWalletCTA';
import { MobileNav } from '@/components/layout/MobileNav';
import { useTopCreators } from '@/hooks/useTopCreators';
import { useWallet } from '@jup-ag/wallet-adapter';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, Suspense, useState, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// FLEXSTREAM — MOBILE-FIRST LANDING + AUTHENTICATED FEED
// The Obsidian Vault meets Moonshot-style trading social
// ═══════════════════════════════════════════════════════════════════════════════

// Fake activity data for the live ticker
const MOCK_ACTIVITIES = [
  { user: 'cryptowhale', action: 'bought', amount: '$5.2K', token: 'CLAWNCH', gain: '+223%', time: '2m' },
  { user: 'degen_king', action: 'is up', amount: '+$45,892', token: 'MOLT', gain: null, time: '3m' },
  { user: 'alpha_hunter', action: 'sold', amount: '$12K', token: 'BUTTCOIN', gain: '+891%', time: '5m' },
  { user: 'ser_pumps', action: 'bought', amount: '$2.1K', token: 'PEPE2', gain: '+156%', time: '6m' },
  { user: 'whale_watcher', action: 'closed', amount: '+$22,450', token: 'COPPERINU', gain: '+127%', time: '8m' },
  { user: 'moonboy', action: 'bought', amount: '$8.5K', token: 'ASTER', gain: '+445%', time: '10m' },
  { user: 'diamondhands', action: 'is up', amount: '+$67,230', token: 'SOL', gain: null, time: '12m' },
  { user: 'tradoor', action: 'sold', amount: '$3.3K', token: 'TRUMP', gain: '+312%', time: '15m' },
];

// Top creators with gains for the horizontal scroll
const TOP_CREATORS_MOCK = [
  { name: 'Binkieee', handle: '@Binkieee', gain: '+$65,870', avatar: '🔥', badges: ['🪙', '📈'] },
  { name: 'wrld', handle: '@wrld_sol', gain: '+$58,220', avatar: '🎭', badges: ['💎', '🚀'] },
  { name: 'KJS16', handle: '@KJS16', gain: '+$55,794', avatar: '👑', badges: ['🏆', '⚡'] },
  { name: 'Merlin', handle: '@MerlinTh3Great', gain: '+$52,865', avatar: '🧙', badges: ['🔮', '💰'] },
  { name: 'Scrooge', handle: '@Scrooge', gain: '+$46,223', avatar: '💵', badges: ['🦆', '🪙'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE (Non-authenticated users)
// ─────────────────────────────────────────────────────────────────────────────
function LandingPage() {
  const { login } = usePrivy();
  const [mounted, setMounted] = useState(false);
  const [activityIndex, setActivityIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Rotate through activities every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActivityIndex((prev) => (prev + 1) % MOCK_ACTIVITIES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const currentActivities = useMemo(() => {
    const items = [];
    for (let i = 0; i < 4; i++) {
      items.push(MOCK_ACTIVITIES[(activityIndex + i) % MOCK_ACTIVITIES.length]);
    }
    return items;
  }, [activityIndex]);

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background: '#050505',
      }}
    >
      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(45, 27, 78, 0.2) 0%, transparent 50%)',
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER — Minimal, Floating
          ═══════════════════════════════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-40 px-4 py-4"
        style={{
          background: 'linear-gradient(to bottom, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.8) 70%, transparent 100%)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #E0FF62 0%, #14b8a6 100%)',
              }}
            >
              <span className="text-black font-bold text-sm">F</span>
            </div>
            <span
              className="text-lg font-semibold"
              style={{
                color: '#FAFAFA',
                fontFamily: '"Cormorant Garamond", serif',
                letterSpacing: '-0.02em',
              }}
            >
              FlexStream
            </span>
          </div>

          {/* Connect Button */}
          <button
            onClick={() => login()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 active:scale-95"
            style={{
              background: 'rgba(224, 255, 98, 0.1)',
              border: '1px solid rgba(224, 255, 98, 0.3)',
              color: '#E0FF62',
            }}
          >
            Connect
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION — Trade Every Post
          ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="pt-24 pb-6 px-4"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 600ms ease-out',
        }}
      >
        <div className="max-w-lg mx-auto text-center">
          {/* Tagline */}
          <p
            className="text-[11px] uppercase tracking-[0.25em] mb-3"
            style={{
              color: '#E0FF62',
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            Social Trading on Solana
          </p>

          {/* Main Headline */}
          <h1
            className="text-[42px] leading-[1.05] mb-4"
            style={{
              color: '#FAFAFA',
              fontFamily: '"Cormorant Garamond", serif',
              fontWeight: 400,
              letterSpacing: '-0.03em',
            }}
          >
            Trade Every
            <br />
            <span style={{ color: '#E0FF62' }}>Post</span>
          </h1>

          {/* Subtext */}
          <p
            className="text-[15px] leading-relaxed mb-6 max-w-[280px] mx-auto"
            style={{
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Every creator post becomes a tradeable token. Buy momentum. Sell the hype.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          LIVE ACTIVITY FEED — Animated Ticker
          ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="px-4 pb-8"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 600ms ease-out 150ms',
        }}
      >
        <div className="max-w-lg mx-auto">
          {/* Feed Container */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(18, 18, 18, 0.8)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* Feed Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderBottom: '0.5px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: '#14b8a6' }}
                />
                <span
                  className="text-[11px] uppercase tracking-wider"
                  style={{
                    color: '#14b8a6',
                    fontFamily: '"IBM Plex Mono", monospace',
                  }}
                >
                  Live Feed
                </span>
              </div>
              <span
                className="text-[10px]"
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontFamily: '"IBM Plex Mono", monospace',
                }}
              >
                Real-time
              </span>
            </div>

            {/* Activity Items */}
            <div className="divide-y divide-white/[0.04]">
              {currentActivities.map((activity, idx) => (
                <div
                  key={`${activity.user}-${idx}-${activityIndex}`}
                  className="px-4 py-3 flex items-center gap-3"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateX(0)' : 'translateX(-10px)',
                    transition: `all 400ms ease-out ${idx * 100}ms`,
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(224, 255, 98, 0.15) 0%, rgba(20, 184, 166, 0.15) 100%)',
                      border: '0.5px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <span className="text-[10px] font-medium" style={{ color: '#E0FF62' }}>
                      {activity.user.slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-medium" style={{ color: '#FAFAFA' }}>
                        {activity.user}
                      </span>
                      <span
                        className="text-[12px]"
                        style={{
                          color: activity.action === 'bought' ? '#14b8a6' : activity.action === 'sold' ? '#f87171' : '#E0FF62',
                        }}
                      >
                        {activity.action}
                      </span>
                      <span className="text-[13px] font-semibold" style={{ color: '#FAFAFA' }}>
                        {activity.amount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[11px] px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.6)',
                        }}
                      >
                        {activity.token}
                      </span>
                      {activity.gain && (
                        <span
                          className="text-[11px]"
                          style={{
                            color: '#14b8a6',
                            fontFamily: '"IBM Plex Mono", monospace',
                          }}
                        >
                          {activity.gain}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <span
                    className="text-[10px] flex-shrink-0"
                    style={{
                      color: 'rgba(255,255,255,0.25)',
                      fontFamily: '"IBM Plex Mono", monospace',
                    }}
                  >
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TOP CREATORS — Horizontal Scroll Cards
          ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="pb-8"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 600ms ease-out 300ms',
        }}
      >
        {/* Section Header */}
        <div className="px-4 mb-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h2
                className="text-[15px] font-medium"
                style={{ color: '#FAFAFA' }}
              >
                Top Traders This Week
              </h2>
            </div>
            <span
              className="text-[11px]"
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontFamily: '"IBM Plex Mono", monospace',
              }}
            >
              24h
            </span>
          </div>
        </div>

        {/* Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-4 pb-2" style={{ width: 'max-content' }}>
            {TOP_CREATORS_MOCK.map((creator, idx) => (
              <div
                key={creator.handle}
                className="flex-shrink-0 w-[160px] p-4 rounded-xl"
                style={{
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  transition: 'all 300ms ease-out',
                }}
              >
                {/* Rank Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: idx === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                                 idx === 1 ? 'linear-gradient(135deg, #C0C0C0, #A8A8A8)' :
                                 idx === 2 ? 'linear-gradient(135deg, #CD7F32, #8B4513)' :
                                 'rgba(255,255,255,0.1)',
                      color: idx < 3 ? '#000' : '#fff',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex gap-1">
                    {creator.badges.map((badge, i) => (
                      <span key={i} className="text-[10px]">{badge}</span>
                    ))}
                  </div>
                </div>

                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full mb-3 flex items-center justify-center text-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(224, 255, 98, 0.2) 0%, rgba(20, 184, 166, 0.2) 100%)',
                    border: '0.5px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {creator.avatar}
                </div>

                {/* Info */}
                <p
                  className="text-[14px] font-medium truncate"
                  style={{ color: '#FAFAFA' }}
                >
                  {creator.name}
                </p>
                <p
                  className="text-[11px] truncate mb-2"
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: '"IBM Plex Mono", monospace',
                  }}
                >
                  {creator.handle}
                </p>

                {/* Gain */}
                <p
                  className="text-[15px] font-semibold"
                  style={{
                    color: '#14b8a6',
                    fontFamily: '"IBM Plex Mono", monospace',
                  }}
                >
                  {creator.gain}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          VALUE PROPS — Why FlexStream
          ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="px-4 pb-8"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 600ms ease-out 450ms',
        }}
      >
        <div className="max-w-lg mx-auto">
          <div
            className="p-5 rounded-xl"
            style={{
              background: 'rgba(18, 18, 18, 0.6)',
              border: '0.5px solid rgba(255,255,255,0.06)',
            }}
          >
            <h3
              className="text-[13px] uppercase tracking-[0.15em] mb-4"
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontFamily: '"IBM Plex Mono", monospace',
              }}
            >
              How It Works
            </h3>

            <div className="space-y-4">
              {[
                { icon: '📝', title: 'Post = Token', desc: 'Every post automatically creates a tradeable token' },
                { icon: '📈', title: 'Trade Momentum', desc: 'Buy early on viral content, sell the hype' },
                { icon: '💰', title: 'Creators Earn', desc: 'Creators get fees from every trade on their posts' },
                { icon: '⚡', title: '$0 Gas Fees', desc: 'Platform covers all Solana transaction costs' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                    style={{
                      background: 'rgba(224, 255, 98, 0.08)',
                      border: '0.5px solid rgba(224, 255, 98, 0.15)',
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium mb-0.5" style={{ color: '#FAFAFA' }}>
                      {item.title}
                    </p>
                    <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CTA SECTION — Get Early Access
          ═══════════════════════════════════════════════════════════════════════ */}
      <section
        className="px-4 pb-10"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 600ms ease-out 600ms',
        }}
      >
        <div className="max-w-lg mx-auto text-center">
          {/* Main CTA Button */}
          <button
            onClick={() => login()}
            className="w-full py-4 rounded-xl text-[15px] font-semibold transition-all duration-300 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #E0FF62 0%, #c8e85a 100%)',
              color: '#050505',
              boxShadow: '0 0 40px rgba(224, 255, 98, 0.2)',
            }}
          >
            Get Early Access
          </button>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-3 mt-5">
            {/* Stacked Avatars */}
            <div className="flex -space-x-2">
              {['🔥', '💎', '🚀', '👑'].map((emoji, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{
                    background: 'rgba(26, 26, 26, 0.9)',
                    border: '2px solid #050505',
                    zIndex: 4 - idx,
                  }}
                >
                  {emoji}
                </div>
              ))}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium"
                style={{
                  background: 'rgba(224, 255, 98, 0.15)',
                  border: '2px solid #050505',
                  color: '#E0FF62',
                  fontFamily: '"IBM Plex Mono", monospace',
                }}
              >
                +2K
              </div>
            </div>

            <p
              className="text-[12px]"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Join <span style={{ color: '#E0FF62' }}>2,400+</span> traders
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER — Minimal
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="px-4 pb-24 md:pb-8">
        <div className="max-w-lg mx-auto text-center">
          <p
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{
              color: 'rgba(255,255,255,0.2)',
              fontFamily: '"IBM Plex Mono", monospace',
            }}
          >
            FlexStream © 2024 · Solana Devnet
          </p>
        </div>
      </footer>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED FEED PAGE
// ─────────────────────────────────────────────────────────────────────────────
function AuthenticatedFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const { data: creatorsData, isLoading: creatorsLoading } = useTopCreators(5);

  const newPostId = searchParams.get('newPost');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (newPostId) {
      const timer = setTimeout(() => {
        router.replace('/', { scroll: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newPostId, router]);

  // Vault metrics - curated data points
  const vaultMetrics = [
    { label: 'Active Vaults', value: '2.4K', trend: '+12%' },
    { label: 'Volume 24h', value: '$847K', trend: '+8.3%' },
    { label: 'New Members', value: '156', trend: '+24%' },
  ];

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <FloatingWalletCTA />

      <div
        className="min-h-screen"
        style={{
          background: '#050505',
        }}
      >
        {/* Subtle gradient atmosphere */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(45, 27, 78, 0.15) 0%, transparent 50%)',
          }}
        />

        {/* Main content area */}
        <div className="sm:ml-0 min-h-screen flex justify-center">
          <div className="flex w-full max-w-[1100px] mx-auto px-0 sm:px-4 lg:px-8">

            {/* CENTER: Editorial Feed Column */}
            <main className="flex-1 min-h-screen max-w-[620px] mx-auto">

              {/* Vault Header — Mobile Optimized */}
              <header
                className="sticky top-0 z-40 pt-4 sm:pt-6 pb-3 sm:pb-4 px-4 sm:px-0"
                style={{
                  background: 'linear-gradient(to bottom, #050505 0%, #050505 70%, transparent 100%)',
                }}
              >
                <div className="flex items-end justify-between">
                  <div>
                    <p
                      className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] mb-1"
                      style={{
                        color: '#6B6B70',
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontWeight: 400,
                      }}
                    >
                      The Vault
                    </p>
                    <h1
                      className="text-[24px] sm:text-[28px] leading-none"
                      style={{
                        color: '#FAFAFA',
                        fontFamily: '"Cormorant Garamond", serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Curated Feed
                    </h1>
                  </div>

                  {/* Live indicator */}
                  <div
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5"
                    style={{
                      background: 'rgba(224, 255, 98, 0.06)',
                      border: '0.5px solid rgba(224, 255, 98, 0.15)',
                      borderRadius: '4px',
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: '#E0FF62' }}
                    />
                    <span
                      className="text-[10px] sm:text-[11px] uppercase tracking-wider"
                      style={{
                        color: '#E0FF62',
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontWeight: 400,
                      }}
                    >
                      Live
                    </span>
                  </div>
                </div>

                {/* Hairline separator */}
                <div
                  className="mt-3 sm:mt-4"
                  style={{
                    height: '0.5px',
                    background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)',
                  }}
                />
              </header>

              {/* Feed Content */}
              <div
                className="pb-24 sm:pb-20 px-2 sm:px-0"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 600ms ease-out, transform 600ms ease-out',
                }}
              >
                <SimpleFeed />
              </div>
            </main>

            {/* RIGHT: Obsidian Sidebar — Desktop Only */}
            <aside className="hidden lg:block w-[320px] flex-shrink-0 pl-8">
              <div className="sticky top-6 space-y-6">

                {/* Vault Metrics Panel */}
                <div
                  className="p-5"
                  style={{
                    background: 'rgba(13, 13, 14, 0.8)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '0.5px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '6px',
                  }}
                >
                  <h2
                    className="text-[11px] uppercase tracking-[0.15em] mb-4"
                    style={{
                      color: '#6B6B70',
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontWeight: 400,
                    }}
                  >
                    Vault Status
                  </h2>

                  <div className="space-y-4">
                    {vaultMetrics.map((metric, idx) => (
                      <div
                        key={idx}
                        className="flex items-baseline justify-between"
                      >
                        <span
                          className="text-[13px]"
                          style={{ color: '#A1A1AA' }}
                        >
                          {metric.label}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span
                            className="text-[15px] font-medium"
                            style={{
                              color: '#FAFAFA',
                              fontFamily: '"IBM Plex Mono", monospace',
                            }}
                          >
                            {metric.value}
                          </span>
                          <span
                            className="text-[11px]"
                            style={{
                              color: '#E0FF62',
                              fontFamily: '"IBM Plex Mono", monospace',
                            }}
                          >
                            {metric.trend}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inner Circle — Top Creators */}
                <div
                  className="overflow-hidden"
                  style={{
                    background: 'rgba(13, 13, 14, 0.6)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '0.5px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '6px',
                  }}
                >
                  <div className="p-5 pb-3">
                    <h2
                      className="text-[18px] mb-1"
                      style={{
                        color: '#FAFAFA',
                        fontFamily: '"Cormorant Garamond", serif',
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Inner Circle
                    </h2>
                    <p
                      className="text-[11px] uppercase tracking-[0.1em]"
                      style={{
                        color: '#6B6B70',
                        fontFamily: '"IBM Plex Mono", monospace',
                      }}
                    >
                      Top Creators
                    </p>
                  </div>

                  {/* Loading State */}
                  {creatorsLoading && (
                    <div className="px-5 pb-5 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3"
                          style={{
                            opacity: 0.4,
                            animation: `pulse 2s ease-in-out infinite`,
                            animationDelay: `${i * 150}ms`,
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.05)' }}
                          />
                          <div className="flex-1 space-y-2">
                            <div
                              className="h-2.5 w-20 rounded"
                              style={{ background: 'rgba(255,255,255,0.05)' }}
                            />
                            <div
                              className="h-2 w-14 rounded"
                              style={{ background: 'rgba(255,255,255,0.03)' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Creator List */}
                  {!creatorsLoading && (creatorsData?.data?.creators?.length ?? 0) > 0 && (
                    <>
                      {creatorsData?.data?.creators?.slice(0, 4).map((creator, idx) => (
                        <div
                          key={creator.id}
                          className="group flex items-center gap-3 px-5 py-3 cursor-pointer"
                          style={{
                            opacity: 0.7,
                            transition: 'all 400ms ease-out',
                          }}
                          onClick={() => router.push(`/profile/${creator.username}`)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0.7';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {/* Rank indicator */}
                          <span
                            className="w-5 text-[11px] text-right"
                            style={{
                              color: '#4A4A4F',
                              fontFamily: '"IBM Plex Mono", monospace',
                            }}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>

                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                            style={{
                              background: creator.avatar_url
                                ? 'transparent'
                                : 'linear-gradient(135deg, rgba(224, 255, 98, 0.2) 0%, #0D0D0E 100%)',
                              border: '0.5px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            {creator.avatar_url ? (
                              <img
                                src={creator.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span
                                className="text-[12px] font-medium"
                                style={{ color: '#A1A1AA' }}
                              >
                                {creator.display_name?.[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[13px] font-medium truncate"
                              style={{ color: '#FAFAFA' }}
                            >
                              {creator.display_name}
                            </p>
                            <p
                              className="text-[11px] truncate"
                              style={{
                                color: '#6B6B70',
                                fontFamily: '"IBM Plex Mono", monospace',
                              }}
                            >
                              @{creator.username}
                            </p>
                          </div>

                          {/* View button — appears on hover */}
                          <span
                            className="text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              color: '#E0FF62',
                              fontFamily: '"IBM Plex Mono", monospace',
                            }}
                          >
                            View
                          </span>
                        </div>
                      ))}

                      {/* Show more link */}
                      <button
                        className="w-full px-5 py-3 text-left group"
                        style={{
                          borderTop: '0.5px solid rgba(255,255,255,0.04)',
                          transition: 'all 400ms ease-out',
                        }}
                        onClick={() => router.push('/explore')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span
                          className="text-[12px]"
                          style={{
                            color: '#E0FF62',
                            opacity: 0.8,
                            transition: 'opacity 400ms ease-out',
                          }}
                        >
                          Explore all creators →
                        </span>
                      </button>
                    </>
                  )}

                  {/* Empty State */}
                  {!creatorsLoading && (!creatorsData?.data?.creators || creatorsData.data.creators.length === 0) && (
                    <p
                      className="px-5 pb-5 text-[13px]"
                      style={{ color: '#6B6B70' }}
                    >
                      No members in the inner circle yet
                    </p>
                  )}
                </div>

                {/* Minimal Footer */}
                <div className="pt-2 pb-8">
                  <p
                    className="text-[10px] uppercase tracking-[0.15em] text-center"
                    style={{
                      color: '#3A3A3F',
                      fontFamily: '"IBM Plex Mono", monospace',
                    }}
                  >
                    FlexStream © 2024
                  </p>
                </div>

              </div>
            </aside>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT — Conditional Rendering
// ─────────────────────────────────────────────────────────────────────────────
function HomePageContent() {
  const { authenticated, ready } = usePrivy();
  const { publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state while Privy initializes
  if (!ready || !mounted) {
    return <LoadingState />;
  }

  // Show landing page for unauthenticated users
  if (!authenticated && !publicKey) {
    return <LandingPage />;
  }

  // Show authenticated feed
  return <AuthenticatedFeed />;
}

// Loading State — Minimal, Luxurious
function LoadingState() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#050505' }}
    >
      <div className="text-center">
        {/* Geometric loading indicator */}
        <div
          className="relative w-12 h-12 mx-auto"
          style={{
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: '4px',
          }}
        >
          <div
            className="absolute inset-0 m-3"
            style={{
              border: '0.5px solid rgba(224, 255, 98, 0.4)',
              borderRadius: '2px',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        </div>
        <p
          className="mt-4 text-[10px] uppercase tracking-[0.2em]"
          style={{
            color: '#6B6B70',
            fontFamily: '"IBM Plex Mono", monospace',
          }}
        >
          Opening Vault
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HomePageContent />
    </Suspense>
  );
}
