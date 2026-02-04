'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeableMarketCards } from '@/components/predictions/SwipeableMarketCard';
import { cn } from '@/lib/utils';

// Hook to detect mobile vs desktop with SSR-safe mounting
function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Simple in-memory cache for markets data
const marketsCache: {
  data: Market[] | null;
  timestamp: number;
} = { data: null, timestamp: 0 };
const CACHE_DURATION = 30000; // 30 seconds

// ═══════════════════════════════════════════════════════════════════════════════
// KALSHI-LEVEL PREDICTION MARKET UI
// Professional, data-rich, scannable - like a trading terminal
// ═══════════════════════════════════════════════════════════════════════════════

interface Market {
  ticker: string;
  event_ticker: string;
  title: string;
  status: 'open' | 'closed' | 'settled';
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  volume_24h?: number;
  open_time: string;
  close_time: string;
  expiration_time: string;
  category?: string;
}

// Category configuration
const CATEGORIES = [
  { id: 'trending', label: 'Trending', icon: '🔥' },
  { id: 'all', label: 'All', icon: null },
  { id: 'politics', label: 'Politics', icon: '🏛️' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
  { id: 'economics', label: 'Economics', icon: '📊' },
  { id: 'tech', label: 'Tech & Science', icon: '🔬' },
  { id: 'climate', label: 'Climate', icon: '🌍' },
  { id: 'companies', label: 'Companies', icon: '🏢' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MARKET ICON - Circular icon based on category
// ═══════════════════════════════════════════════════════════════════════════════
function MarketIcon({ market }: { market: Market }) {
  const ticker = (market.event_ticker || market.ticker || '').toLowerCase();
  const title = (market.title || '').toLowerCase();

  // Determine icon and gradient based on market type
  let icon = '📈';
  let gradient = 'from-gray-600 to-gray-700';

  if (ticker.includes('btc') || title.includes('bitcoin')) {
    icon = '₿';
    gradient = 'from-orange-500 to-amber-600';
  } else if (ticker.includes('eth') || title.includes('ethereum')) {
    icon = 'Ξ';
    gradient = 'from-indigo-500 to-purple-600';
  } else if (ticker.includes('sol') || title.includes('solana')) {
    icon = '◎';
    gradient = 'from-purple-500 to-fuchsia-600';
  } else if (ticker.includes('crypto') || title.includes('crypto')) {
    icon = '🪙';
    gradient = 'from-yellow-500 to-orange-500';
  } else if (ticker.includes('fed') || title.includes('fed') || title.includes('rate')) {
    icon = '🏦';
    gradient = 'from-green-600 to-emerald-700';
  } else if (ticker.includes('trump') || title.includes('trump')) {
    icon = '🇺🇸';
    gradient = 'from-red-500 to-blue-600';
  } else if (ticker.includes('politic') || title.includes('election') || title.includes('biden')) {
    icon = '🏛️';
    gradient = 'from-blue-600 to-indigo-700';
  } else if (ticker.includes('tech') || title.includes('openai') || title.includes('gpt') || title.includes('ai')) {
    icon = '🤖';
    gradient = 'from-cyan-500 to-blue-600';
  } else if (title.includes('tesla') || title.includes('tsla')) {
    icon = '⚡';
    gradient = 'from-red-500 to-rose-600';
  } else if (title.includes('nvidia') || title.includes('nvda')) {
    icon = '🎮';
    gradient = 'from-green-500 to-lime-600';
  } else if (title.includes('apple')) {
    icon = '🍎';
    gradient = 'from-gray-600 to-gray-800';
  } else if (title.includes('spacex') || title.includes('mars')) {
    icon = '🚀';
    gradient = 'from-slate-600 to-zinc-700';
  } else if (title.includes('recession') || title.includes('gdp') || title.includes('s&p') || title.includes('inflation')) {
    icon = '📉';
    gradient = 'from-emerald-600 to-teal-700';
  } else if (title.includes('ukraine') || title.includes('russia') || title.includes('china') || title.includes('taiwan')) {
    icon = '🌐';
    gradient = 'from-slate-500 to-gray-600';
  }

  return (
    <div className={cn(
      "w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0",
      `bg-gradient-to-br ${gradient}`
    )}>
      {icon}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KALSHI-STYLE MARKET CARD
// ═══════════════════════════════════════════════════════════════════════════════
function MarketCard({ market, index }: { market: Market; index: number }) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(false);

  const yesPrice = market.yes_bid || market.last_price || 50;
  const noPrice = 100 - yesPrice;
  const volume = (market.volume || 0) / 100;
  const isLive = market.status === 'open';

  // Calculate payout for $100 bet
  const yesPayout = yesPrice > 0 ? Math.round((100 / yesPrice) * 100) : 0;
  const noPayout = noPrice > 0 ? Math.round((100 / noPrice) * 100) : 0;

  // Format volume
  const formatVolume = (v: number): string => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
    if (v > 0) return `$${v.toFixed(0)}`;
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={() => router.push(`/predictions/${market.ticker}`)}
      className="group cursor-pointer"
    >
      <div className="bg-[#1a1a1a] rounded-lg border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 p-4">
        {/* Top Row: Icon + Title */}
        <div className="flex gap-3 mb-4">
          <MarketIcon market={market} />
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-medium text-white leading-snug line-clamp-2 group-hover:text-white/90">
              {market.title}
            </h3>
          </div>
        </div>

        {/* Binary Outcome Buttons */}
        <div className="flex gap-2 mb-3">
          {/* YES Button */}
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="flex-1 py-2.5 px-3 rounded-md bg-[#E0FF62] hover:bg-[#d4f055] transition-colors text-center"
          >
            <span className="text-black font-semibold text-sm">Yes {yesPrice}¢</span>
          </button>
          {/* NO Button */}
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="flex-1 py-2.5 px-3 rounded-md bg-[#2a2a2a] hover:bg-[#333] border border-white/[0.08] transition-colors text-center"
          >
            <span className="text-white/80 font-semibold text-sm">No {noPrice}¢</span>
          </button>
        </div>

        {/* Payout Row */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 text-center">
            <span className="text-[11px] text-white/40">$100 → </span>
            <span className="text-[11px] text-[#E0FF62] font-medium">${yesPayout}</span>
          </div>
          <div className="flex-1 text-center">
            <span className="text-[11px] text-white/40">$100 → </span>
            <span className="text-[11px] text-white/60 font-medium">${noPayout}</span>
          </div>
        </div>

        {/* Bottom Row: Status + Volume + Bookmark */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            )}
            {volume > 0 && (
              <span className="text-[11px] text-white/30 font-mono">
                {formatVolume(volume)}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setBookmarked(!bookmarked);
            }}
            className="p-1 hover:bg-white/[0.05] rounded transition-colors"
          >
            <svg
              className={cn("w-4 h-4", bookmarked ? "text-yellow-400 fill-yellow-400" : "text-white/30")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT DROPDOWN — Mobile-optimized
// ═══════════════════════════════════════════════════════════════════════════════
function Dropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs text-white/60 bg-white/[0.04] border border-white/[0.08] rounded-md hover:border-white/[0.15] transition-colors"
      >
        <span className="truncate max-w-[70px] sm:max-w-none">{label}</span>
        <svg className="w-2.5 h-2.5 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 py-1 bg-[#1a1a1a] border border-white/[0.1] rounded-md shadow-xl z-50 min-w-[120px]">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={cn(
                  "w-full px-2.5 py-1.5 text-left text-[11px] sm:text-xs transition-colors",
                  value === opt.id ? "text-cyan-400 bg-cyan-400/10" : "text-white/70 hover:bg-white/[0.05]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
// Pagination constants
const ITEMS_PER_PAGE = 12;

export default function PredictionsPage() {
  const router = useRouter();
  const { authenticated, login } = usePrivy();
  const isMobile = useIsMobile();

  // Start with empty state, then populate on client
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('trending');
  const [sortBy, setSortBy] = useState('volume');
  const [marketStatus, setMarketStatus] = useState('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Track if user has started interacting (to prevent data swap mid-swipe)
  const hasInteractedRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchMarkets = async () => {
      try {
        // Check cache first (only for initial load)
        if (marketsCache.data && Date.now() - marketsCache.timestamp < CACHE_DURATION) {
          if (!initialLoadDoneRef.current) {
            setMarkets(marketsCache.data);
            setLoading(false);
            initialLoadDoneRef.current = true;
          }
          return;
        }

        // Show mock data immediately on initial load (fast time-to-content)
        // This ensures users always see something right away
        if (!initialLoadDoneRef.current) {
          const mockData = getMockMarkets();
          setMarkets(mockData);
          setLoading(false);
          initialLoadDoneRef.current = true;

          // Cache mock data as fallback
          if (!marketsCache.data) {
            marketsCache.data = mockData;
            marketsCache.timestamp = Date.now();
          }
        }

        // Now try to fetch real Kalshi data in background
        const response = await fetch('/api/kalshi?endpoint=/markets&status=open&limit=100');
        const result = await response.json();

        if (cancelled) return;

        if (result.success && result.data?.markets) {
          const cleanMarkets = result.data.markets.filter((m: Market) => {
            const title = m.title || '';
            // Filter out sports parlays and garbage data
            const isGarbage = (
              (title.match(/yes /gi) || []).length > 2 ||
              (title.match(/\d+\+/g) || []).length > 1 ||
              (title.match(/:/g) || []).length > 2 ||
              title.toLowerCase().includes('parlay')
            );
            return !isGarbage;
          });

          // Only update if we have good Kalshi data
          if (cleanMarkets.length >= 5) {
            // Update cache
            marketsCache.data = cleanMarkets;
            marketsCache.timestamp = Date.now();

            // Only update state if user hasn't started swiping
            if (!hasInteractedRef.current) {
              setMarkets(cleanMarkets);
            }
          }
          // If less than 5 valid markets, keep the mock data that's already showing
        }
      } catch (err) {
        console.error('Failed to fetch Kalshi markets, using mock data:', err);
        // On error, mock data is already loaded so no action needed
      }
    };

    fetchMarkets();

    // Refresh every 60 seconds (but won't disrupt user if they're interacting)
    const interval = setInterval(fetchMarkets, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Filter & sort markets
  const filteredMarkets = markets
    .filter((m) => {
      // Status filter
      if (marketStatus === 'open' && m.status !== 'open') return false;
      if (marketStatus === 'closed' && m.status !== 'settled') return false;

      // Category filter
      if (activeCategory !== 'all' && activeCategory !== 'trending') {
        const ticker = (m.event_ticker || m.ticker || '').toLowerCase();
        const title = (m.title || '').toLowerCase();
        const cat = activeCategory.toLowerCase();

        const matches = ticker.includes(cat) || title.includes(cat) ||
          (cat === 'crypto' && (title.includes('bitcoin') || title.includes('ethereum') || title.includes('solana') || ticker.includes('btc') || ticker.includes('eth') || ticker.includes('sol'))) ||
          (cat === 'politics' && (title.includes('trump') || title.includes('biden') || title.includes('election') || title.includes('president'))) ||
          (cat === 'economics' && (title.includes('fed') || title.includes('rate') || title.includes('inflation') || title.includes('recession') || title.includes('s&p') || title.includes('gdp'))) ||
          (cat === 'tech' && (title.includes('openai') || title.includes('gpt') || title.includes('ai ') || title.includes('nvidia') || title.includes('tesla') || title.includes('apple') || title.includes('spacex')));

        if (!matches) return false;
      }

      // Search filter
      if (searchQuery) {
        return m.title?.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'volume') return (b.volume || 0) - (a.volume || 0);
      if (sortBy === 'newest') return new Date(b.open_time).getTime() - new Date(a.open_time).getTime();
      if (sortBy === 'closing') return new Date(a.close_time).getTime() - new Date(b.close_time).getTime();
      return 0;
    });

  // Stats
  const totalVolume = markets.reduce((acc, m) => acc + (m.volume || 0), 0) / 100;
  const activeCount = markets.filter(m => m.status === 'open').length;

  // Pagination calculations
  const totalPages = Math.ceil(filteredMarkets.length / ITEMS_PER_PAGE);
  const paginatedMarkets = filteredMarkets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, sortBy, marketStatus, searchQuery]);

  // Handle bet from swipe
  const handleSwipeBet = (market: Market, side: 'yes' | 'no') => {
    // Mark that user has interacted - prevents data refresh from disrupting
    hasInteractedRef.current = true;
    console.log(`Bet ${side.toUpperCase()} on: ${market.title}`);
    // TODO: Integrate with actual betting logic
  };

  return (
    <AppLayout showWallet showSearch={false}>
      <div className="min-h-screen bg-[#0d0d0d]">
        {/* Header */}
        <div className="border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Top bar */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-white">Markets</h1>
                <span className="text-xs text-white/40 bg-white/[0.05] px-2 py-0.5 rounded">
                  {activeCount} live
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden sm:block">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search markets..."
                    className="w-64 px-3 py-1.5 pl-9 text-sm bg-[#1a1a1a] border border-white/[0.08] rounded-md text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.15]"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {/* Create Market */}
                <button
                  onClick={() => authenticated ? router.push('/predictions/create') : login()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0 -mb-px">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    activeCategory === cat.id
                      ? "text-teal-400 border-teal-400"
                      : "text-white/50 border-transparent hover:text-white/70"
                  )}
                >
                  {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Row — Compact inline layout */}
        <div className="border-b border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
            <div className="flex items-center justify-between gap-2">
              {/* Dropdowns */}
              <div className="flex items-center gap-1.5">
                <Dropdown
                  label={sortBy === 'volume' ? 'Hot' : sortBy === 'newest' ? 'New' : 'Ending'}
                  options={[
                    { id: 'volume', label: 'Hot' },
                    { id: 'newest', label: 'New' },
                    { id: 'closing', label: 'Ending' },
                  ]}
                  value={sortBy}
                  onChange={setSortBy}
                />
                <Dropdown
                  label={marketStatus === 'open' ? 'Open' : 'Closed'}
                  options={[
                    { id: 'open', label: 'Open' },
                    { id: 'closed', label: 'Closed' },
                  ]}
                  value={marketStatus}
                  onChange={setMarketStatus}
                />
              </div>
              {/* Stats — Hidden on very small, compact on mobile */}
              <div className="text-[10px] sm:text-xs text-white/30 whitespace-nowrap">
                <span className="hidden sm:inline">{filteredMarkets.length} markets • </span>
                <span className="font-mono">{formatLargeNumber(totalVolume)}</span>
                <span className="hidden sm:inline"> vol</span>
              </div>
            </div>
          </div>
        </div>

        {/* Markets - Mobile Swipe or Desktop Grid */}
        {loading || isMobile === null ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : isMobile ? (
          /* Mobile: Tinder-style swipe interface */
          <SwipeableMarketCards
            key={`${activeCategory}-${sortBy}-${marketStatus}-${searchQuery}`}
            markets={filteredMarkets}
            onBet={handleSwipeBet}
          />
        ) : (
          /* Desktop/Tablet: Paginated grid */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedMarkets.map((market, i) => (
                <MarketCard key={market.ticker} market={market} index={i} />
              ))}
            </div>

            {filteredMarkets.length === 0 && (
              <div className="text-center py-20">
                <div className="text-white/30 text-lg mb-2">No markets found</div>
                <p className="text-white/20 text-sm">Try adjusting your filters or search</p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    currentPage === 1
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : "bg-white/10 text-white hover:bg-white/15"
                  )}
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and neighbors
                      return page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, idx, arr) => {
                      // Add ellipsis if there's a gap
                      const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;

                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsisBefore && (
                            <span className="px-2 text-white/30">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "w-10 h-10 rounded-lg text-sm font-medium transition-all",
                              page === currentPage
                                ? "bg-[#E0FF62] text-black"
                                : "bg-white/5 text-white/70 hover:bg-white/10"
                            )}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    currentPage === totalPages
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : "bg-white/10 text-white hover:bg-white/15"
                  )}
                >
                  Next
                </button>
              </div>
            )}

            {/* Page info */}
            {totalPages > 1 && (
              <div className="text-center mt-4 text-xs text-white/30">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredMarkets.length)} of {filteredMarkets.length} markets
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Format large numbers
function formatLargeNumber(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CURATED PREDICTION MARKETS
// ═══════════════════════════════════════════════════════════════════════════════
function getMockMarkets(): Market[] {
  return [
    // CRYPTO
    {
      ticker: 'BTC-150K-2026',
      event_ticker: 'CRYPTO',
      title: 'Will Bitcoin exceed $150,000 in 2026?',
      status: 'open',
      yes_bid: 67,
      yes_ask: 69,
      no_bid: 31,
      no_ask: 33,
      last_price: 68,
      volume: 12500000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    {
      ticker: 'ETH-10K-2026',
      event_ticker: 'CRYPTO',
      title: 'Will Ethereum reach $10,000 by end of 2026?',
      status: 'open',
      yes_bid: 41,
      yes_ask: 43,
      no_bid: 57,
      no_ask: 59,
      last_price: 42,
      volume: 8750000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    {
      ticker: 'SOL-500-2026',
      event_ticker: 'CRYPTO',
      title: 'Will Solana hit $500 in 2026?',
      status: 'open',
      yes_bid: 38,
      yes_ask: 40,
      no_bid: 60,
      no_ask: 62,
      last_price: 39,
      volume: 6200000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    {
      ticker: 'BTC-ETF-INFLOW',
      event_ticker: 'CRYPTO',
      title: 'Will Bitcoin ETFs see $50B+ inflows in 2026?',
      status: 'open',
      yes_bid: 72,
      yes_ask: 74,
      no_bid: 26,
      no_ask: 28,
      last_price: 73,
      volume: 4500000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    // TECH
    {
      ticker: 'AGI-2026',
      event_ticker: 'TECH',
      title: 'Will a major AI lab claim AGI breakthrough in 2026?',
      status: 'open',
      yes_bid: 23,
      yes_ask: 25,
      no_bid: 75,
      no_ask: 77,
      last_price: 24,
      volume: 9800000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    {
      ticker: 'GPT5-Q1-2026',
      event_ticker: 'TECH',
      title: 'Will OpenAI release GPT-5 before April 2026?',
      status: 'open',
      yes_bid: 81,
      yes_ask: 83,
      no_bid: 17,
      no_ask: 19,
      last_price: 82,
      volume: 7600000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-03-31T23:59:59Z',
      expiration_time: '2026-04-01T00:00:00Z',
    },
    {
      ticker: 'TSLA-1T-2026',
      event_ticker: 'TECH',
      title: 'Will Tesla reach $1 trillion market cap in 2026?',
      status: 'open',
      yes_bid: 55,
      yes_ask: 57,
      no_bid: 43,
      no_ask: 45,
      last_price: 56,
      volume: 5400000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    {
      ticker: 'NVDA-200',
      event_ticker: 'TECH',
      title: 'Will NVIDIA stock exceed $200 per share in 2026?',
      status: 'open',
      yes_bid: 61,
      yes_ask: 63,
      no_bid: 37,
      no_ask: 39,
      last_price: 62,
      volume: 4800000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    // ECONOMICS
    {
      ticker: 'FED-RATE-3PCT',
      event_ticker: 'ECONOMICS',
      title: 'Will the Fed Funds Rate be below 3% by end of 2026?',
      status: 'open',
      yes_bid: 48,
      yes_ask: 50,
      no_bid: 50,
      no_ask: 52,
      last_price: 49,
      volume: 8200000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    {
      ticker: 'SP500-7000',
      event_ticker: 'ECONOMICS',
      title: 'Will S&P 500 close above 7,000 in 2026?',
      status: 'open',
      yes_bid: 58,
      yes_ask: 60,
      no_bid: 40,
      no_ask: 42,
      last_price: 59,
      volume: 6500000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    {
      ticker: 'US-RECESSION-2026',
      event_ticker: 'ECONOMICS',
      title: 'Will the US enter a recession in 2026?',
      status: 'open',
      yes_bid: 22,
      yes_ask: 24,
      no_bid: 76,
      no_ask: 78,
      last_price: 23,
      volume: 5100000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    {
      ticker: 'CPI-2PCT-2026',
      event_ticker: 'ECONOMICS',
      title: 'Will US inflation fall below 2% in 2026?',
      status: 'open',
      yes_bid: 35,
      yes_ask: 37,
      no_bid: 63,
      no_ask: 65,
      last_price: 36,
      volume: 3900000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    // POLITICS
    {
      ticker: 'TRUMP-2028',
      event_ticker: 'POLITICS',
      title: 'Will Trump run for president in 2028?',
      status: 'open',
      yes_bid: 15,
      yes_ask: 17,
      no_bid: 83,
      no_ask: 85,
      last_price: 16,
      volume: 7200000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2028-06-30T23:59:59Z',
      expiration_time: '2028-07-01T00:00:00Z',
    },
    {
      ticker: 'CHINA-TAIWAN-2026',
      event_ticker: 'POLITICS',
      title: 'Will China take military action against Taiwan in 2026?',
      status: 'open',
      yes_bid: 8,
      yes_ask: 10,
      no_bid: 90,
      no_ask: 92,
      last_price: 9,
      volume: 4300000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    {
      ticker: 'UKRAINE-CEASEFIRE',
      event_ticker: 'POLITICS',
      title: 'Will there be a Russia-Ukraine ceasefire by mid-2026?',
      status: 'open',
      yes_bid: 44,
      yes_ask: 46,
      no_bid: 54,
      no_ask: 56,
      last_price: 45,
      volume: 5800000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-06-30T23:59:59Z',
      expiration_time: '2026-07-01T00:00:00Z',
    },
    // MISC
    {
      ticker: 'APPLE-CAR-2027',
      event_ticker: 'TECH',
      title: 'Will Apple launch a car by 2027?',
      status: 'open',
      yes_bid: 12,
      yes_ask: 14,
      no_bid: 86,
      no_ask: 88,
      last_price: 13,
      volume: 3200000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2027-12-31T23:59:59Z',
      expiration_time: '2028-01-01T00:00:00Z',
    },
    {
      ticker: 'SPACEX-MARS-2026',
      event_ticker: 'TECH',
      title: 'Will SpaceX launch a Mars mission in 2026?',
      status: 'open',
      yes_bid: 28,
      yes_ask: 30,
      no_bid: 70,
      no_ask: 72,
      last_price: 29,
      volume: 4100000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    {
      ticker: 'FED-CHAIR-2026',
      event_ticker: 'ECONOMICS',
      title: 'Will Jerome Powell remain Fed Chair through 2026?',
      status: 'open',
      yes_bid: 78,
      yes_ask: 80,
      no_bid: 20,
      no_ask: 22,
      last_price: 79,
      volume: 2800000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
    {
      ticker: 'DOGE-1-2026',
      event_ticker: 'CRYPTO',
      title: 'Will Dogecoin reach $1 in 2026?',
      status: 'open',
      yes_bid: 18,
      yes_ask: 20,
      no_bid: 80,
      no_ask: 82,
      last_price: 19,
      volume: 3500000,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2026-12-31T23:59:59Z',
      expiration_time: '2027-01-01T00:00:00Z',
    },
  ];
}
