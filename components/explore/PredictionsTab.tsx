'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClockIcon,
  FireIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  ListBulletIcon,
  TableCellsIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Types for Kalshi data
interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  series_ticker?: string;
  title: string;
  subtitle?: string;
  open_time: string;
  close_time: string;
  expiration_time: string;
  status: 'open' | 'closed' | 'settled';
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  yes_price?: number;
  volume: number;
  volume_24h?: number;
  open_interest?: number;
  result?: 'yes' | 'no' | null;
  category?: string;
}

type ViewMode = 'cards' | 'table';
type SortField = 'volume' | 'probability' | 'time' | 'title';
type SortDirection = 'asc' | 'desc';

// Category configurations
const CATEGORIES = [
  { id: 'all', label: 'All Markets', icon: '🎯', color: 'from-violet-500/20 to-purple-600/10 border-violet-500/30' },
  { id: 'politics', label: 'Politics', icon: '🏛️', color: 'from-blue-500/20 to-indigo-600/10 border-blue-500/30' },
  { id: 'economics', label: 'Economics', icon: '📊', color: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/30' },
  { id: 'crypto', label: 'Crypto', icon: '₿', color: 'from-orange-500/20 to-amber-600/10 border-orange-500/30' },
  { id: 'finance', label: 'Finance', icon: '💹', color: 'from-green-500/20 to-emerald-600/10 border-green-500/30' },
];

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];

// Utility functions
function formatVolume(volume: number): string {
  const dollars = volume / 100;
  if (dollars >= 1000000) return `$${(dollars / 1000000).toFixed(1)}M`;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

function getTimeRemaining(expirationTime: string): { label: string; urgent: boolean } {
  const expiration = new Date(expirationTime);
  const now = new Date();
  const hoursRemaining = Math.max(0, Math.floor((expiration.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const daysRemaining = Math.floor(hoursRemaining / 24);

  if (daysRemaining > 7) return { label: `${Math.floor(daysRemaining / 7)}w`, urgent: false };
  if (daysRemaining > 0) return { label: `${daysRemaining}d`, urgent: daysRemaining <= 2 };
  return { label: `${hoursRemaining}h`, urgent: true };
}

function getProbabilityStyle(probability: number) {
  if (probability >= 70) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', bar: 'from-emerald-500 to-emerald-400' };
  if (probability >= 50) return { bg: 'bg-lime-500/20', text: 'text-lime-400', bar: 'from-lime-500 to-lime-400' };
  if (probability >= 30) return { bg: 'bg-amber-500/20', text: 'text-amber-400', bar: 'from-amber-500 to-amber-400' };
  return { bg: 'bg-red-500/20', text: 'text-red-400', bar: 'from-red-500 to-red-400' };
}

// Live Stats Header
function LiveStatsHeader({ markets }: { markets: KalshiMarket[] }) {
  const [currentWinner, setCurrentWinner] = useState(0);
  const totalVolume = markets.reduce((acc, m) => acc + (m.volume || 0), 0) / 100;
  const activeMarkets = markets.filter(m => m.status === 'open').length;
  const hotMarkets = markets.slice(0, 4);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWinner((prev) => (prev + 1) % hotMarkets.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [hotMarkets.length]);

  const current = hotMarkets[currentWinner];
  const probability = current?.yes_bid || current?.last_price || 50;

  return (
    <div className="bg-gradient-to-r from-violet-900/20 via-black/40 to-emerald-900/20 border border-white/10 rounded-2xl p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Live ticker */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
          </div>

          <div className="h-4 w-px bg-white/20 shrink-0" />

          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={currentWinner}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 min-w-0"
              >
                <span className="text-sm text-white/80 truncate">{current.title}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                  getProbabilityStyle(probability).bg,
                  getProbabilityStyle(probability).text
                )}>
                  {probability}%
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-white/50 shrink-0">
          <div className="flex items-center gap-1.5">
            <ChartBarIcon className="w-3.5 h-3.5 text-violet-400" />
            <span><span className="font-bold text-white">{activeMarkets}</span> markets</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CurrencyDollarIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span><span className="font-bold text-emerald-400">{formatVolume(totalVolume * 100)}</span> volume</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Category Pills
function CategoryPills({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0",
            "border",
            selected === cat.id
              ? `bg-gradient-to-r ${cat.color} text-white`
              : "bg-white/[0.03] border-white/10 text-white/50 hover:text-white hover:bg-white/[0.06]"
          )}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}

// View Toggle & Controls
function ViewControls({
  viewMode,
  setViewMode,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  itemsPerPage,
  setItemsPerPage,
}: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortField: SortField;
  setSortField: (field: SortField) => void;
  sortDirection: SortDirection;
  setSortDirection: (dir: SortDirection) => void;
  itemsPerPage: number;
  setItemsPerPage: (n: number) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/40">Sort by:</span>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="bg-white/[0.05] border border-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500/50"
        >
          <option value="volume">Volume</option>
          <option value="probability">Probability</option>
          <option value="time">Time Left</option>
          <option value="title">Title</option>
        </select>
        <button
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          className={cn(
            "p-1.5 rounded-lg border transition-all",
            "bg-white/[0.05] border-white/10 hover:bg-white/[0.08]"
          )}
        >
          <ArrowsUpDownIcon className={cn(
            "w-3.5 h-3.5 transition-transform",
            sortDirection === 'asc' ? 'rotate-180' : ''
          )} />
        </button>
      </div>

      {/* View mode & items per page */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-white/40">
          <span>Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-white/[0.05] border border-white/10 text-white rounded-lg px-2 py-1 focus:outline-none focus:border-violet-500/50"
          >
            {ITEMS_PER_PAGE_OPTIONS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center bg-white/[0.03] rounded-xl p-0.5 border border-white/10">
          <button
            onClick={() => setViewMode('cards')}
            className={cn(
              'p-2 rounded-lg transition-all',
              viewMode === 'cards'
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-white/40 hover:text-white/70'
            )}
            title="Card view"
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'p-2 rounded-lg transition-all',
              viewMode === 'table'
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-white/40 hover:text-white/70'
            )}
            title="Table view"
          >
            <TableCellsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showPages = 5;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (currentPage > 3) pages.push('ellipsis');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('ellipsis');

      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
      {/* Items info */}
      <p className="text-xs text-white/40 order-2 sm:order-1">
        Showing <span className="font-semibold text-white/60">{startItem}-{endItem}</span> of{' '}
        <span className="font-semibold text-white/60">{totalItems}</span> markets
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "p-2 rounded-lg border transition-all",
            currentPage === 1
              ? "bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed"
              : "bg-white/[0.05] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white"
          )}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) => (
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-white/30">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "min-w-[36px] h-9 rounded-lg border text-sm font-medium transition-all",
                currentPage === page
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                  : "bg-white/[0.03] border-white/10 text-white/50 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "p-2 rounded-lg border transition-all",
            currentPage === totalPages
              ? "bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed"
              : "bg-white/[0.05] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white"
          )}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Table Row Component
function MarketTableRow({ market, rank, onClick }: { market: KalshiMarket; rank: number; onClick: () => void }) {
  const probability = market.yes_bid || market.last_price || 50;
  const probStyle = getProbabilityStyle(probability);
  const timeInfo = getTimeRemaining(market.expiration_time);
  const isHot = (market.volume || 0) > 100000;

  return (
    <tr
      onClick={onClick}
      className="border-b border-white/[0.06] hover:bg-white/[0.03] cursor-pointer transition-colors group"
    >
      {/* Rank */}
      <td className="py-3 px-3 sm:px-4">
        <span className={cn(
          "text-sm font-bold",
          rank <= 3 ? "text-amber-400" : "text-white/40"
        )}>
          {rank}
        </span>
      </td>

      {/* Market */}
      <td className="py-3 px-3 sm:px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20 flex items-center justify-center text-lg shrink-0">
            {probability >= 60 ? '📈' : probability <= 40 ? '📉' : '📊'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[300px] lg:max-w-[400px] group-hover:text-violet-300 transition-colors">
                {market.title}
              </h4>
              {isHot && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                  <FireIcon className="w-3 h-3" />
                  <span className="text-[10px] font-bold">HOT</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-white/40 font-mono">{market.event_ticker}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Probability */}
      <td className="py-3 px-3 sm:px-4">
        <div className="flex flex-col gap-1">
          <span className={cn("text-sm font-bold", probStyle.text)}>
            {probability}% YES
          </span>
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r", probStyle.bar)}
              style={{ width: `${probability}%` }}
            />
          </div>
        </div>
      </td>

      {/* Volume - hidden on mobile */}
      <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
        <span className="text-sm text-white/70">{formatVolume(market.volume || 0)}</span>
      </td>

      {/* Time Left - hidden on mobile */}
      <td className="py-3 px-3 sm:px-4 hidden md:table-cell">
        <span className={cn(
          "text-sm",
          timeInfo.urgent ? "text-red-400 font-semibold" : "text-white/50"
        )}>
          {timeInfo.label}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3 px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg transition-all"
          >
            YES
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-lg transition-all"
          >
            NO
          </button>
        </div>
      </td>
    </tr>
  );
}

// Card Component
function MarketCard({ market, rank, onClick }: { market: KalshiMarket; rank: number; onClick: () => void }) {
  const probability = market.yes_bid || market.last_price || 50;
  const probStyle = getProbabilityStyle(probability);
  const timeInfo = getTimeRemaining(market.expiration_time);
  const isHot = (market.volume || 0) > 100000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (rank - 1) * 0.03 }}
      onClick={onClick}
      className={cn(
        "relative group p-4 rounded-2xl cursor-pointer",
        "bg-gradient-to-br from-white/[0.04] to-white/[0.02]",
        "border border-white/10 hover:border-violet-500/30",
        "transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5"
      )}
    >
      {/* Rank badge for top 3 */}
      {rank <= 3 && (
        <div className={cn(
          "absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-black z-10",
          rank === 1 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-black",
          rank === 2 && "bg-gradient-to-br from-slate-300 to-slate-400 text-black",
          rank === 3 && "bg-gradient-to-br from-amber-600 to-orange-700 text-white"
        )}>
          {rank}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{probability >= 60 ? '📈' : probability <= 40 ? '📉' : '📊'}</span>
          {isHot && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
              <FireIcon className="w-3 h-3" />
              <span className="text-[10px] font-bold">HOT</span>
            </span>
          )}
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[10px]",
          timeInfo.urgent ? "text-red-400" : "text-white/40"
        )}>
          <ClockIcon className="w-3 h-3" />
          <span>{timeInfo.label}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-white mb-3 line-clamp-2 group-hover:text-violet-300 transition-colors">
        {market.title}
      </h3>

      {/* Probability bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className={cn("font-bold", probStyle.text)}>YES {probability}%</span>
          <span className="text-white/40">NO {100 - probability}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", probStyle.bar)}
            style={{ width: `${probability}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">{formatVolume(market.volume || 0)} vol</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white text-[10px] font-bold rounded-lg transition-all"
          >
            YES
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-[10px] font-bold rounded-lg transition-all"
          >
            NO
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Main Component
export function PredictionsTab() {
  const router = useRouter();
  const [markets, setMarkets] = useState<KalshiMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch markets
  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/kalshi?endpoint=/markets&status=open&limit=100');
      const result = await response.json();

      if (result.success && result.data?.markets) {
        setMarkets(result.data.markets);
      } else {
        setMarkets(getMockMarkets());
      }
    } catch (err) {
      console.error('Error fetching markets:', err);
      setMarkets(getMockMarkets());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 60000);
    return () => clearInterval(interval);
  }, [fetchMarkets]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortField, sortDirection, itemsPerPage]);

  // Filter and sort markets
  const filteredMarkets = selectedCategory === 'all'
    ? markets
    : markets.filter(m =>
        m.event_ticker?.toLowerCase().includes(selectedCategory) ||
        m.ticker?.toLowerCase().includes(selectedCategory) ||
        m.title?.toLowerCase().includes(selectedCategory)
      );

  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'volume':
        comparison = (b.volume || 0) - (a.volume || 0);
        break;
      case 'probability':
        comparison = (b.yes_bid || b.last_price || 50) - (a.yes_bid || a.last_price || 50);
        break;
      case 'time':
        comparison = new Date(a.expiration_time).getTime() - new Date(b.expiration_time).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }
    return sortDirection === 'asc' ? -comparison : comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedMarkets.length / itemsPerPage);
  const paginatedMarkets = sortedMarkets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleMarketClick = (market: KalshiMarket) => {
    router.push(`/predictions/${market.ticker}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Loading markets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live Stats Header */}
      <LiveStatsHeader markets={markets} />

      {/* Category Pills */}
      <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />

      {/* Controls */}
      <ViewControls
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortField={sortField}
        setSortField={setSortField}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
      />

      {/* Content */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left py-3 px-3 sm:px-4 text-[10px] font-semibold text-white/40 uppercase tracking-wider w-12">#</th>
                <th className="text-left py-3 px-3 sm:px-4 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Market</th>
                <th className="text-left py-3 px-3 sm:px-4 text-[10px] font-semibold text-white/40 uppercase tracking-wider w-28">Probability</th>
                <th className="text-left py-3 px-3 sm:px-4 text-[10px] font-semibold text-white/40 uppercase tracking-wider hidden sm:table-cell w-24">Volume</th>
                <th className="text-left py-3 px-3 sm:px-4 text-[10px] font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell w-20">Expires</th>
                <th className="text-left py-3 px-3 sm:px-4 text-[10px] font-semibold text-white/40 uppercase tracking-wider w-28">Trade</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMarkets.map((market, index) => (
                <MarketTableRow
                  key={market.ticker}
                  market={market}
                  rank={(currentPage - 1) * itemsPerPage + index + 1}
                  onClick={() => handleMarketClick(market)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedMarkets.map((market, index) => (
            <MarketCard
              key={market.ticker}
              market={market}
              rank={(currentPage - 1) * itemsPerPage + index + 1}
              onClick={() => handleMarketClick(market)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {paginatedMarkets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 mb-4 rounded-full bg-violet-500/10 flex items-center justify-center">
            <ChartBarIcon className="w-7 h-7 text-violet-400" />
          </div>
          <h3 className="text-white font-semibold mb-2">No markets found</h3>
          <p className="text-white/50 text-sm">Try selecting a different category</p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={sortedMarkets.length}
        itemsPerPage={itemsPerPage}
      />

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-[10px] text-white/30">
          📊 Prediction markets • Data refreshes every minute • 18+ only
        </p>
      </div>
    </div>
  );
}

// Mock markets for fallback
function getMockMarkets(): KalshiMarket[] {
  return [
    {
      ticker: 'KXPRES-25-TRUMP',
      event_ticker: 'KXPRES-25',
      title: 'Will the Republicans win the 2028 Presidential Election?',
      status: 'open',
      yes_bid: 48, yes_ask: 49, no_bid: 51, no_ask: 52,
      last_price: 48,
      volume: 25847523,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2028-11-05T23:59:59Z',
      expiration_time: '2028-11-06T12:00:00Z',
    },
    {
      ticker: 'KXFED-25MAR-RATECUT',
      event_ticker: 'KXFED-25MAR',
      title: 'Will the Fed cut rates by 50bps or more in Q1 2025?',
      status: 'open',
      yes_bid: 22, yes_ask: 24, no_bid: 76, no_ask: 78,
      last_price: 23,
      volume: 4456789,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2025-03-31T23:59:59Z',
      expiration_time: '2025-04-01T00:00:00Z',
    },
    {
      ticker: 'KXBTC-25-150K',
      event_ticker: 'KXBTC-25',
      title: 'Will Bitcoin exceed $150,000 by end of 2025?',
      status: 'open',
      yes_bid: 35, yes_ask: 37, no_bid: 63, no_ask: 65,
      last_price: 36,
      volume: 8234567,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2025-12-31T23:59:59Z',
      expiration_time: '2026-01-01T00:00:00Z',
    },
    {
      ticker: 'KXINFL-25JAN',
      event_ticker: 'KXINFL',
      title: 'Will January 2025 CPI come in above 3.0%?',
      status: 'open',
      yes_bid: 28, yes_ask: 30, no_bid: 70, no_ask: 72,
      last_price: 29,
      volume: 2987654,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2025-02-12T23:59:59Z',
      expiration_time: '2025-02-12T08:30:00Z',
    },
    {
      ticker: 'KXSP500-25-7000',
      event_ticker: 'KXSP500',
      title: 'Will S&P 500 close above 7,000 by end of 2025?',
      status: 'open',
      yes_bid: 42, yes_ask: 44, no_bid: 56, no_ask: 58,
      last_price: 43,
      volume: 3567890,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2025-12-31T23:59:59Z',
      expiration_time: '2026-01-02T00:00:00Z',
    },
    {
      ticker: 'KXETH-25-8K',
      event_ticker: 'KXETH',
      title: 'Will Ethereum exceed $8,000 by end of 2025?',
      status: 'open',
      yes_bid: 25, yes_ask: 27, no_bid: 73, no_ask: 75,
      last_price: 26,
      volume: 2456789,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2025-12-31T23:59:59Z',
      expiration_time: '2026-01-01T00:00:00Z',
    },
    {
      ticker: 'KXGDP-25Q1',
      event_ticker: 'KXGDP',
      title: 'Will Q1 2025 US GDP growth exceed 3.0%?',
      status: 'open',
      yes_bid: 38, yes_ask: 40, no_bid: 60, no_ask: 62,
      last_price: 39,
      volume: 1845678,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2025-04-30T23:59:59Z',
      expiration_time: '2025-04-30T08:30:00Z',
    },
    {
      ticker: 'KXRECESSION-25',
      event_ticker: 'KXRECESSION',
      title: 'Will there be a US recession declared in 2025?',
      status: 'open',
      yes_bid: 18, yes_ask: 20, no_bid: 80, no_ask: 82,
      last_price: 19,
      volume: 3234567,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2025-12-31T23:59:59Z',
      expiration_time: '2026-01-15T00:00:00Z',
    },
    {
      ticker: 'KXSOL-25-500',
      event_ticker: 'KXSOL',
      title: 'Will Solana exceed $500 by end of 2025?',
      status: 'open',
      yes_bid: 32, yes_ask: 34, no_bid: 66, no_ask: 68,
      last_price: 33,
      volume: 1567890,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2025-12-31T23:59:59Z',
      expiration_time: '2026-01-01T00:00:00Z',
    },
    {
      ticker: 'KXAI-25-AGI',
      event_ticker: 'KXAI',
      title: 'Will a major lab claim AGI achievement by end of 2025?',
      status: 'open',
      yes_bid: 12, yes_ask: 14, no_bid: 86, no_ask: 88,
      last_price: 13,
      volume: 987654,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2025-12-31T23:59:59Z',
      expiration_time: '2026-01-01T00:00:00Z',
    },
    {
      ticker: 'KXTSLA-25-500',
      event_ticker: 'KXTSLA',
      title: 'Will Tesla stock exceed $500 by mid-2025?',
      status: 'open',
      yes_bid: 55, yes_ask: 57, no_bid: 43, no_ask: 45,
      last_price: 56,
      volume: 2345678,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2025-06-30T23:59:59Z',
      expiration_time: '2025-07-01T00:00:00Z',
    },
    {
      ticker: 'KXNVDA-25-200',
      event_ticker: 'KXNVDA',
      title: 'Will Nvidia stock exceed $200 by Q2 2025?',
      status: 'open',
      yes_bid: 68, yes_ask: 70, no_bid: 30, no_ask: 32,
      last_price: 69,
      volume: 4123456,
      open_time: '2025-01-01T00:00:00Z',
      close_time: '2025-06-30T23:59:59Z',
      expiration_time: '2025-07-01T00:00:00Z',
    },
  ];
}
