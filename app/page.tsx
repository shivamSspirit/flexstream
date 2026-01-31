'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SimpleFeed } from '@/components/feed/SimpleFeed';
import { AppLayout } from '@/components/layout/AppLayout';
import { FloatingWalletCTA } from '@/components/layout/FloatingWalletCTA';
import { useTopCreators } from '@/hooks/useTopCreators';
import { useWallet } from '@jup-ag/wallet-adapter';
import { useEffect, Suspense, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// FLEXSTREAM HOME — THE OBSIDIAN VAULT
// A private gallery for crypto creators. Quiet luxury meets digital exclusivity.
// ═══════════════════════════════════════════════════════════════════════════════

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useWallet();
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

      {/* ═══════════════════════════════════════════════════════════════════
          THE OBSIDIAN VAULT — Editorial Layout
          ═══════════════════════════════════════════════════════════════════ */}

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

        {/* Main content area with sidebar offset */}
        <div className="ml-16 md:ml-20 min-h-screen flex justify-center">
          <div className="flex w-full max-w-[1100px] mx-auto px-4 lg:px-8">

            {/* ─────────────────────────────────────────────────────────────────
                CENTER: Editorial Feed Column
                ───────────────────────────────────────────────────────────────── */}
            <main className="flex-1 min-h-screen max-w-[620px]">

              {/* Vault Header — Luxury Editorial */}
              <header
                className="sticky top-0 z-40 pt-6 pb-4"
                style={{
                  background: 'linear-gradient(to bottom, #050505 0%, #050505 70%, transparent 100%)',
                }}
              >
                <div className="flex items-end justify-between">
                  <div>
                    <p
                      className="text-[11px] uppercase tracking-[0.2em] mb-1"
                      style={{
                        color: '#6B6B70',
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontWeight: 400,
                      }}
                    >
                      The Vault
                    </p>
                    <h1
                      className="text-[28px] leading-none"
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

                  {/* Minimal status indicator */}
                  <div
                    className="flex items-center gap-2 px-3 py-1.5"
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
                      className="text-[11px] uppercase tracking-wider"
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
                  className="mt-4"
                  style={{
                    height: '0.5px',
                    background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)',
                  }}
                />
              </header>

              {/* Feed Content with staggered reveal */}
              <div
                className="pb-20"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 600ms ease-out, transform 600ms ease-out',
                }}
              >
                <SimpleFeed />
              </div>
            </main>

            {/* ─────────────────────────────────────────────────────────────────
                RIGHT: Obsidian Sidebar — Glassmorphism Panel
                ───────────────────────────────────────────────────────────────── */}
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
