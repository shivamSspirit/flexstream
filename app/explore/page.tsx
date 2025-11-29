'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dialog, Transition } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
  TableCellsIcon,
  FireIcon,
  SparklesIcon,
  TrophyIcon,
  VideoCameraIcon,
  StarIcon,
  BoltIcon,
  UserGroupIcon,
  ChartBarIcon,
  EyeIcon,
  PlayIcon,
  XMarkIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type ViewMode = 'grid' | 'list' | 'table';
type TabId = 'featured' | 'mayhem' | 'trending' | 'top' | 'new' | 'live' | 'videos' | 'creators';

interface TokenData {
  id: string;
  image: string;
  title: string;
  ticker: string;
  creator: string;
  creatorAvatar: string;
  description?: string;
  price: number;
  priceChange: number;
  marketCap: number;
  athProgress: number;
  liquidity: number;
  holders: number;
  volume24h: number;
  txns: number;
  age: string;
  timeAgo: string;
  badge?: 'new' | 'live' | 'trending' | 'mayhem' | 'featured';
  isVerified?: boolean;
  viewers?: number;
  href: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(2);
}

function formatPrice(num: number): string {
  if (num >= 1000) return `$${formatNumber(num)}`;
  if (num < 0.01) return `$${num.toFixed(6)}`;
  return `$${num.toFixed(2)}`;
}

function formatTimeAgo(date: string) {
  const now = new Date();
  const postDate = new Date(date);
  const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

// Filter Modal Component
function FilterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [sortBy, setSortBy] = useState('trending');
  const [timeRange, setTimeRange] = useState('24h');
  const [minMcap, setMinMcap] = useState('');
  const [maxMcap, setMaxMcap] = useState('');
  const [minHolders, setMinHolders] = useState('');
  const [hideNsfw, setHideNsfw] = useState(true);

  const sortOptions = [
    { id: 'trending', label: 'Trending', icon: FireIcon },
    { id: 'newest', label: 'Newest', icon: SparklesIcon },
    { id: 'mcap_high', label: 'Market Cap ↓', icon: ChartBarIcon },
    { id: 'mcap_low', label: 'Market Cap ↑', icon: ChartBarIcon },
    { id: 'volume', label: 'Volume', icon: ArrowTrendingUpIcon },
    { id: 'holders', label: 'Holders', icon: UsersIcon },
  ];

  const timeOptions = [
    { id: '1h', label: '1H' },
    { id: '6h', label: '6H' },
    { id: '24h', label: '24H' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: 'all', label: 'All' },
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-gradient-to-b from-[#1a1b23] to-[#12131a] border border-white/10 p-6 shadow-2xl shadow-black/50 transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-bold text-white">
                    Filters
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                {/* Sort By */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-white/60 mb-3 block">Sort By</label>
                  <div className="grid grid-cols-2 gap-2">
                    {sortOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                            sortBy === option.id
                              ? 'bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 border border-[#9945FF]/40 text-white'
                              : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Range */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-white/60 mb-3 block">Time Range</label>
                  <div className="flex gap-2">
                    {timeOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setTimeRange(option.id)}
                        className={cn(
                          'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                          timeRange === option.id
                            ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white shadow-lg shadow-[#9945FF]/20'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Market Cap Range */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-white/60 mb-3 block">Market Cap Range</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        value={minMcap}
                        onChange={(e) => setMinMcap(e.target.value)}
                        placeholder="Min"
                        className="w-full pl-9 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#9945FF]/50 transition-colors"
                      />
                    </div>
                    <span className="text-white/30">—</span>
                    <div className="relative flex-1">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        value={maxMcap}
                        onChange={(e) => setMaxMcap(e.target.value)}
                        placeholder="Max"
                        className="w-full pl-9 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#9945FF]/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Min Holders */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-white/60 mb-3 block">Minimum Holders</label>
                  <div className="relative">
                    <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={minHolders}
                      onChange={(e) => setMinHolders(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full pl-9 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#9945FF]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Toggle */}
                <div className="mb-8">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-white/60 group-hover:text-white transition-colors">Hide NSFW Content</span>
                    <button
                      onClick={() => setHideNsfw(!hideNsfw)}
                      className={cn(
                        'relative w-12 h-6 rounded-full transition-all',
                        hideNsfw ? 'bg-[#14F195]' : 'bg-white/20'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-lg',
                          hideNsfw ? 'left-7' : 'left-1'
                        )}
                      />
                    </button>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSortBy('trending');
                      setTimeRange('24h');
                      setMinMcap('');
                      setMaxMcap('');
                      setMinHolders('');
                      setHideNsfw(true);
                    }}
                    className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white/60 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    Reset
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-[#14F195] to-[#00D787] hover:opacity-90 transition-all shadow-lg shadow-[#14F195]/20"
                  >
                    Apply Filters
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Premium Grid Card - Rich Colors & Vibrant - Mobile Responsive
function GridCard({ token }: { token: TokenData }) {
  const router = useRouter();

  // Dynamic gradient based on badge type
  const cardGradient = token.badge === 'featured'
    ? 'from-amber-900/40 via-amber-950/20 to-transparent'
    : token.badge === 'mayhem'
    ? 'from-orange-900/40 via-red-950/20 to-transparent'
    : token.badge === 'trending'
    ? 'from-purple-900/40 via-violet-950/20 to-transparent'
    : token.badge === 'live'
    ? 'from-red-900/40 via-red-950/20 to-transparent'
    : token.badge === 'new'
    ? 'from-blue-900/40 via-blue-950/20 to-transparent'
    : 'from-slate-800/40 via-slate-900/20 to-transparent';

  const borderGlow = token.badge === 'featured'
    ? 'hover:border-amber-500/50 hover:shadow-amber-500/20'
    : token.badge === 'mayhem'
    ? 'hover:border-orange-500/50 hover:shadow-orange-500/20'
    : token.badge === 'trending'
    ? 'hover:border-purple-500/50 hover:shadow-purple-500/20'
    : token.badge === 'live'
    ? 'hover:border-red-500/50 hover:shadow-red-500/20'
    : 'hover:border-[#14F195]/50 hover:shadow-[#14F195]/20';

  return (
    <article
      onClick={() => router.push(token.href)}
      className={cn(
        'group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer',
        'bg-gradient-to-b',
        cardGradient,
        'border border-white/10',
        borderGlow,
        'hover:shadow-xl transition-all duration-300'
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={token.image}
          alt={token.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Rich gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Badge - More vibrant - Smaller on mobile */}
        {token.badge && (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
            <span className={cn(
              'px-1.5 sm:px-2 py-0.5 rounded-md text-[7px] sm:text-[9px] font-black uppercase tracking-wide',
              token.badge === 'live' && 'bg-red-500 text-white animate-pulse',
              token.badge === 'new' && 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white',
              token.badge === 'trending' && 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
              token.badge === 'mayhem' && 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
              token.badge === 'featured' && 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black',
            )}>
              {token.badge === 'live' && '● LIVE'}
              {token.badge === 'new' && '✦ NEW'}
              {token.badge === 'trending' && '🔥 HOT'}
              {token.badge === 'mayhem' && '⚡ MAYHEM'}
              {token.badge === 'featured' && '★ FEATURED'}
            </span>
          </div>
        )}

        {/* Time - top right */}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
          <span className="px-1 sm:px-1.5 py-0.5 rounded bg-black/60 text-[8px] sm:text-[9px] text-white/70 font-medium">
            {token.timeAgo}
          </span>
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/profile/${token.creator}`);
            }}
            className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 hover:opacity-80 transition-opacity"
          >
            <img
              src={token.creatorAvatar}
              alt={token.creator}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/30"
            />
            <span className="text-white/90 text-[9px] sm:text-[11px] font-medium truncate max-w-[80px] sm:max-w-none">@{token.creator}</span>
            {token.isVerified && (
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#14F195] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <h3 className="text-white font-bold text-xs sm:text-sm truncate">{token.title}</h3>
        </div>
      </div>

      {/* Content - Fixed height layout - Compact on mobile */}
      <div className="p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2.5">
        {/* Price Row */}
        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] text-white/50 uppercase tracking-wider">Price</p>
            <p className="text-white font-bold text-xs sm:text-sm truncate">{formatPrice(token.price)}</p>
          </div>
          <div className={cn(
            'px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-bold text-[9px] sm:text-[11px] shrink-0',
            token.priceChange >= 0
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          )}>
            {token.priceChange >= 0 ? '+' : ''}{token.priceChange.toFixed(1)}%
          </div>
        </div>

        {/* Stats - Fixed 3 column grid - Ultra compact on mobile */}
        <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
          <div className="text-center px-1 sm:px-1.5 py-1 sm:py-1.5 bg-purple-500/10 rounded-lg">
            <p className="text-[6px] sm:text-[8px] text-purple-300 uppercase">MC</p>
            <p className="text-[8px] sm:text-[10px] text-white font-semibold truncate">{formatNumber(token.marketCap)}</p>
          </div>
          <div className="text-center px-1 sm:px-1.5 py-1 sm:py-1.5 bg-blue-500/10 rounded-lg">
            <p className="text-[6px] sm:text-[8px] text-blue-300 uppercase">Hold</p>
            <p className="text-[8px] sm:text-[10px] text-white font-semibold truncate">{formatNumber(token.holders)}</p>
          </div>
          <div className="text-center px-1 sm:px-1.5 py-1 sm:py-1.5 bg-cyan-500/10 rounded-lg">
            <p className="text-[6px] sm:text-[8px] text-cyan-300 uppercase">Liq</p>
            <p className="text-[8px] sm:text-[10px] text-white font-semibold truncate">{formatNumber(token.liquidity)}</p>
          </div>
        </div>

        {/* Buy Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs text-white bg-gradient-to-r from-[#9945FF] via-[#7B3FE4] to-[#14F195] hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-[0.98]"
        >
          Buy ${token.ticker}
        </button>
      </div>
    </article>
  );
}

// List Card component - Nikita Bier Viral Style - Bold & Addictive
function ListCard({ token }: { token: TokenData }) {
  const router = useRouter();

  // Dynamic colors based on performance
  const isPumping = token.priceChange >= 10;
  const isGaining = token.priceChange > 0 && token.priceChange < 10;
  const isDumping = token.priceChange < -5;

  // Card gradient based on performance
  const cardBg = isPumping
    ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent'
    : isDumping
    ? 'bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent'
    : 'bg-gradient-to-r from-white/[0.08] to-transparent';

  const borderColor = isPumping
    ? 'border-emerald-500/30 hover:border-emerald-400/50 shadow-emerald-500/10'
    : isDumping
    ? 'border-red-500/30 hover:border-red-400/50 shadow-red-500/10'
    : 'border-white/10 hover:border-[#14F195]/40 shadow-[#14F195]/5';

  return (
    <article
      onClick={() => router.push(token.href)}
      className={cn(
        "group relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl cursor-pointer border-2 transition-all duration-300",
        cardBg,
        borderColor,
        "hover:scale-[1.02] hover:shadow-2xl backdrop-blur-sm",
        isPumping && "animate-pulse-slow"
      )}
    >
      {/* Mobile: Stack layout, Desktop: Horizontal layout */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        {/* Top row on mobile: Image + Title + Price */}
        <div className="flex items-start gap-4 w-full sm:w-auto sm:flex-1">
          {/* Image - LARGER with glow */}
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 ring-2 ring-white/10 group-hover:ring-[#14F195]/50 transition-all">
            <img
              src={token.image}
              alt={token.title}
              className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-2 transition-all duration-500"
            />
            {/* Glow effect */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10",
              isPumping && "bg-emerald-400",
              isDumping && "bg-red-400",
              !isPumping && !isDumping && "bg-[#14F195]"
            )} />

            {/* Animated badge */}
            {token.badge && (
              <div className="absolute -top-1 -right-1 animate-bounce-slow">
                <span className={cn(
                  'w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black shadow-2xl border-2 border-black',
                  token.badge === 'live' && 'bg-red-500 text-white animate-pulse',
                  token.badge === 'new' && 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white',
                  token.badge === 'trending' && 'bg-gradient-to-r from-orange-500 to-pink-500 text-white',
                  token.badge === 'mayhem' && 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black',
                  token.badge === 'featured' && 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black',
                )}>
                  {token.badge === 'live' ? '●' : token.badge === 'new' ? '✦' : '▲'}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-white font-black text-base sm:text-xl truncate max-w-[140px] sm:max-w-none group-hover:text-[#14F195] transition-colors">
                {token.title}
              </h3>
              <span className="text-white/50 text-sm sm:text-base font-bold">${token.ticker}</span>
              {token.isVerified && (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#14F195] shrink-0 animate-pulse-slow" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/profile/${token.creator}`);
                }}
                className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity"
              >
                <img src={token.creatorAvatar} alt={token.creator} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full" />
                <span className="text-white/50 text-[11px] sm:text-xs hover:text-white/70">@{token.creator}</span>
              </button>
              <span className="text-white/30 text-[10px] sm:text-xs">•</span>
              <span className="text-white/40 text-[10px] sm:text-xs">{token.timeAgo}</span>
            </div>

            {/* Stats Row with social proof - Hidden on mobile, shown on desktop */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <span className="text-[11px] text-purple-300 font-bold">MCAP</span>
                <span className="text-sm text-white font-black">{formatNumber(token.marketCap)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                <span className="text-[11px] text-cyan-300 font-bold">LIQ</span>
                <span className="text-sm text-white font-black">{formatNumber(token.liquidity)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <span className="text-[11px] text-blue-300 font-bold">HOLDERS</span>
                <span className="text-sm text-white font-black">{formatNumber(token.holders)}</span>
              </div>
            </div>
          </div>

          {/* Price - BIG and BOLD */}
          <div className="text-right shrink-0">
            <p className="text-white font-black text-xl sm:text-3xl mb-1">{formatPrice(token.price)}</p>
            <div className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm sm:text-base',
              token.priceChange >= 0
                ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-red-500/20 text-red-400 shadow-lg shadow-red-500/20'
            )}>
              <span className="text-base">{token.priceChange >= 0 ? '↑' : '↓'}</span>
              <span>{token.priceChange >= 0 ? '+' : ''}{token.priceChange.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Mobile-only: Stats Row + Buy Button */}
        <div className="flex sm:hidden items-center justify-between gap-2 pt-3 border-t-2 border-white/5">
          {/* Compact Stats with colors */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-500/10 rounded-lg shrink-0 border border-purple-500/20">
              <span className="text-[10px] text-purple-300 font-bold">MC</span>
              <span className="text-xs text-white font-black">{formatNumber(token.marketCap)}</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500/10 rounded-lg shrink-0 border border-cyan-500/20">
              <span className="text-[10px] text-cyan-300 font-bold">LIQ</span>
              <span className="text-xs text-white font-black">{formatNumber(token.liquidity)}</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 rounded-lg shrink-0 border border-blue-500/20">
              <span className="text-[10px] text-blue-300 font-bold">HOL</span>
              <span className="text-xs text-white font-black">{formatNumber(token.holders)}</span>
            </div>
          </div>

          {/* Buy Button - Mobile - VIRAL */}
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="px-5 py-2.5 rounded-xl font-black text-sm text-black bg-gradient-to-r from-[#14F195] via-[#00D787] to-[#14F195] bg-size-200 bg-pos-0 hover:bg-pos-100 transition-all duration-500 shrink-0 shadow-xl shadow-[#14F195]/30 hover:scale-110 active:scale-95 animate-pulse-slow"
          >
            BUY
          </button>
        </div>

        {/* Desktop-only: Buy Button - VIRAL */}
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="hidden sm:flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-base text-black bg-gradient-to-r from-[#14F195] via-[#00D787] to-[#14F195] bg-size-200 bg-pos-0 hover:bg-pos-100 transition-all duration-500 shrink-0 shadow-2xl shadow-[#14F195]/40 hover:scale-110 hover:rotate-2 active:scale-95 group-hover:animate-pulse"
        >
          BUY NOW
        </button>
      </div>
    </article>
  );
}

// Live Stream Card - Nikita Bear Style (Ultra Compact)
function LiveCard({ token }: { token: TokenData }) {
  const router = useRouter();

  return (
    <article
      onClick={() => router.push(token.href)}
      className="group relative rounded-lg overflow-hidden cursor-pointer bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-red-500/30 transition-all duration-300"
    >
      {/* Compact square image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={token.image}
          alt={token.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* LIVE pulse badge */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[9px] font-bold text-white uppercase">Live</span>
        </div>

        {/* Viewers count - top right */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[9px] text-white/80">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{token.viewers || 0}</span>
        </div>

        {/* Bottom: Avatar + Name overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/profile/${token.creator}`);
          }}
          className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <img
            src={token.creatorAvatar}
            alt={token.creator}
            className="w-4 h-4 rounded-full border border-white/20"
          />
          <span className="text-[10px] text-white font-medium truncate flex-1">{token.creator}</span>
        </button>
      </div>

      {/* Ultra compact info */}
      <div className="p-1.5">
        <div className="flex items-center justify-between gap-1">
          <div className={cn(
            'flex items-center gap-0.5 text-[10px] font-bold',
            token.priceChange >= 0 ? 'text-[#14F195]' : 'text-red-400'
          )}>
            <span>{token.priceChange >= 0 ? '↑' : '↓'}</span>
            <span>{formatPrice(token.price)}</span>
          </div>
          <span className="text-[9px] text-white/40">{formatNumber(token.holders)} holders</span>
        </div>
      </div>
    </article>
  );
}

// Mobile Table Card - Card layout for mobile table view
function MobileTableCard({ token, rank }: { token: TokenData; rank: number }) {
  const router = useRouter();

  return (
    <article
      onClick={() => router.push(token.href)}
      className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] cursor-pointer active:bg-white/[0.06]"
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <span className={cn(
          'font-bold text-base w-6 shrink-0',
          rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-white/30'
        )}>
          {rank}
        </span>

        {/* Token Image */}
        <div className="relative shrink-0">
          <img src={token.image} alt={token.title} className="w-10 h-10 rounded-full object-cover" />
          {token.badge && (
            <span className={cn(
              'absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[5px]',
              token.badge === 'live' && 'bg-red-500',
              token.badge === 'trending' && 'bg-[#9945FF]',
              token.badge === 'featured' && 'bg-amber-500',
            )}>
              {token.badge === 'live' ? '●' : '★'}
            </span>
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-semibold text-sm truncate">{token.title}</span>
            {token.isVerified && (
              <svg className="w-3 h-3 text-[#14F195] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <span className="text-white/40 text-xs">${token.ticker}</span>
        </div>

        {/* Price & Change */}
        <div className="text-right shrink-0">
          <p className="text-white font-bold text-sm">{formatPrice(token.price)}</p>
          <p className={cn(
            'text-xs font-semibold',
            token.priceChange >= 0 ? 'text-[#14F195]' : 'text-red-400'
          )}>
            {token.priceChange >= 0 ? '+' : ''}{token.priceChange.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 text-[10px]">
          <div>
            <span className="text-white/40">MC </span>
            <span className="text-white/70 font-medium">{formatNumber(token.marketCap)}</span>
          </div>
          <div>
            <span className="text-white/40">Liq </span>
            <span className="text-white/70 font-medium">{formatNumber(token.liquidity)}</span>
          </div>
          <div>
            <span className="text-white/40">Hold </span>
            <span className="text-white/70 font-medium">{formatNumber(token.holders)}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="px-3 py-1.5 rounded-lg font-bold text-[10px] text-black bg-gradient-to-r from-[#14F195] to-[#00D787]"
        >
          Buy
        </button>
      </div>
    </article>
  );
}

// Table Row component - Mobile Responsive with rounded images
function TableRow({ token, rank }: { token: TokenData; rank: number }) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(token.href)}
      className="group border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-all"
    >
      {/* Rank */}
      <td className="py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4">
        <span className={cn(
          'font-bold text-xs sm:text-sm lg:text-lg',
          rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-amber-600' : 'text-white/30'
        )}>
          {rank}
        </span>
      </td>
      {/* Token with rounded image */}
      <td className="py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="relative shrink-0">
            <img src={token.image} alt={token.title} className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full object-cover" />
            {token.badge && (
              <span className={cn(
                'absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 rounded-full flex items-center justify-center text-[4px] sm:text-[5px] lg:text-[6px]',
                token.badge === 'live' && 'bg-red-500',
                token.badge === 'trending' && 'bg-[#9945FF]',
                token.badge === 'featured' && 'bg-amber-500',
              )}>
                {token.badge === 'live' ? '●' : '★'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
              <span className="text-white font-semibold text-[11px] sm:text-sm lg:text-base truncate max-w-[60px] sm:max-w-[100px] lg:max-w-none">{token.title}</span>
              {token.isVerified && (
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 text-[#14F195] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-white/40 text-[10px] sm:text-xs lg:text-sm">${token.ticker}</span>
          </div>
        </div>
      </td>
      {/* Price */}
      <td className="py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4">
        <span className="text-white font-bold text-[11px] sm:text-sm lg:text-base">{formatPrice(token.price)}</span>
      </td>
      {/* 24h Change - hidden on mobile */}
      <td className="py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 hidden sm:table-cell">
        <span className={cn(
          'font-semibold text-xs sm:text-sm lg:text-base',
          token.priceChange >= 0 ? 'text-[#14F195]' : 'text-red-400'
        )}>
          {token.priceChange >= 0 ? '+' : ''}{token.priceChange.toFixed(1)}%
        </span>
      </td>
      {/* MCAP - hidden on mobile/tablet */}
      <td className="py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 hidden md:table-cell">
        <span className="text-white/70 text-xs sm:text-sm">{formatNumber(token.marketCap)}</span>
      </td>
      {/* Liquidity - hidden until lg */}
      <td className="py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 hidden lg:table-cell">
        <span className="text-white/70 text-sm">{formatNumber(token.liquidity)}</span>
      </td>
      {/* Holders - hidden until lg */}
      <td className="py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 hidden lg:table-cell">
        <span className="text-white/70 text-sm">{formatNumber(token.holders)}</span>
      </td>
      {/* Age - hidden until xl */}
      <td className="py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 hidden xl:table-cell">
        <span className="text-white/50 text-sm">{token.age}</span>
      </td>
      {/* Buy Button */}
      <td className="py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg font-bold text-[9px] sm:text-[10px] lg:text-xs text-black bg-gradient-to-r from-[#14F195] to-[#00D787] sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        >
          Buy
        </button>
      </td>
    </tr>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('featured');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter tabs
  const tabs = [
    { id: 'featured' as TabId, label: 'Featured', icon: StarIcon },
    { id: 'mayhem' as TabId, label: 'Mayhem', icon: BoltIcon },
    { id: 'trending' as TabId, label: 'Trending', icon: FireIcon },
    { id: 'top' as TabId, label: 'Top', icon: TrophyIcon },
    { id: 'new' as TabId, label: 'New', icon: SparklesIcon },
    { id: 'live' as TabId, label: 'Live', icon: PlayIcon },
    { id: 'videos' as TabId, label: 'Videos', icon: VideoCameraIcon },
    { id: 'creators' as TabId, label: 'Creators', icon: UserGroupIcon },
  ];

  // Fetch data
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);

      try {
        // Fetch real posts from API
        const response = await fetch('/api/posts?limit=50');
        const data = await response.json();

        if (data.success && data.data.posts) {
          // Map real posts to TokenData format
          const realTokens: TokenData[] = data.data.posts.map((post: any, index: number) => ({
            id: post.id,
            image: post.media_urls?.[0] || 'https://images.unsplash.com/photo-1579762715459-5a068c289fda?w=400&h=400&fit=crop',
            title: post.title || post.content?.substring(0, 50) || 'Untitled Post',
            ticker: post.token_display_name || post.token_symbol || 'TOKEN',
            creator: post.users?.username || 'anonymous',
            creatorAvatar: post.users?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
            description: post.content,
            price: Math.random() * 100 + 10, // TODO: Fetch real price from token data
            priceChange: (Math.random() * 40) - 10,
            marketCap: Math.random() * 10000000,
            athProgress: Math.random() * 100,
            liquidity: Math.random() * 1000000,
            holders: Math.floor(Math.random() * 10000) + 100,
            volume24h: Math.random() * 500000,
            txns: Math.floor(Math.random() * 5000),
            age: formatTimeAgo(post.created_at),
            timeAgo: formatTimeAgo(post.created_at),
            badge: post.token_is_verified ? 'featured' : index < 5 ? 'new' : undefined,
            isVerified: post.token_is_verified || false,
            href: `/post/${post.id}`,
          }));

          setTokens(realTokens);
        } else {
          console.error('Failed to fetch posts:', data.error);
          setTokens([]);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        setTokens([]);
      }

      setLoading(false);
    }

    fetchPosts();
  }, [activeTab]);

  // BACKUP: Mock data for demonstration (commented out)
  /*
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);

      // Mock data for demonstration
      const mockTokens: TokenData[] = [
        {
          id: '1',
          image: 'https://images.unsplash.com/photo-1579762715459-5a068c289fda?w=400&h=400&fit=crop',
          title: 'Solana Punks',
          ticker: 'SPUNK',
          creator: 'cryptodev',
          creatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
          description: 'The first punk collection on Solana',
          price: 26.24,
          priceChange: 12.5,
          marketCap: 2600000,
          athProgress: 78,
          liquidity: 450000,
          holders: 1234,
          volume24h: 89000,
          txns: 456,
          age: '2d',
          timeAgo: '52s',
          badge: 'featured',
          isVerified: true,
          href: '/post/1',
        },
        {
          id: '2',
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
          title: 'DeGods V2',
          ticker: 'DGOD',
          creator: 'frankdegods',
          creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          description: 'Next generation digital collectibles',
          price: 96.47,
          priceChange: -5.2,
          marketCap: 9600000,
          athProgress: 45,
          liquidity: 1200000,
          holders: 5678,
          volume24h: 234000,
          txns: 1234,
          age: '5d',
          timeAgo: '3m',
          badge: 'mayhem',
          isVerified: true,
          href: '/post/2',
        },
        {
          id: '3',
          image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
          title: 'Okay Bears',
          ticker: 'OKAY',
          creator: 'okaybearsNFT',
          creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
          price: 147.59,
          priceChange: 8.7,
          marketCap: 14700000,
          athProgress: 92,
          liquidity: 2100000,
          holders: 8901,
          volume24h: 567000,
          txns: 2345,
          age: '1w',
          timeAgo: '6m',
          badge: 'trending',
          isVerified: true,
          href: '/post/3',
        },
        {
          id: '4',
          image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=400&fit=crop',
          title: 'Mad Lads',
          ticker: 'MAD',
          creator: 'backlocker',
          creatorAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop',
          price: 89.32,
          priceChange: 25.3,
          marketCap: 8900000,
          athProgress: 67,
          liquidity: 890000,
          holders: 4567,
          volume24h: 123000,
          txns: 890,
          age: '3d',
          timeAgo: '15m',
          badge: 'live',
          viewers: 1234,
          href: '/post/4',
        },
        {
          id: '9',
          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
          title: 'Music Session',
          ticker: 'BEAT',
          creator: 'dj_solana',
          creatorAvatar: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=100&h=100&fit=crop',
          price: 45.80,
          priceChange: 18.2,
          marketCap: 4500000,
          athProgress: 72,
          liquidity: 560000,
          holders: 2345,
          volume24h: 89000,
          txns: 567,
          age: '1d',
          timeAgo: '2m',
          badge: 'live',
          viewers: 892,
          href: '/post/9',
        },
        {
          id: '10',
          image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=400&fit=crop',
          title: 'Gaming Stream',
          ticker: 'GAME',
          creator: 'crypto_gamer',
          creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
          price: 12.50,
          priceChange: 5.6,
          marketCap: 1250000,
          athProgress: 45,
          liquidity: 180000,
          holders: 890,
          volume24h: 34000,
          txns: 234,
          age: '5h',
          timeAgo: '1m',
          badge: 'live',
          viewers: 2456,
          href: '/post/10',
        },
        {
          id: '11',
          image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
          title: 'Art Creation',
          ticker: 'ART',
          creator: 'digital_artist',
          creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
          price: 78.90,
          priceChange: -3.2,
          marketCap: 7800000,
          athProgress: 56,
          liquidity: 920000,
          holders: 3456,
          volume24h: 156000,
          txns: 678,
          age: '2d',
          timeAgo: '5m',
          badge: 'live',
          viewers: 567,
          href: '/post/11',
        },
        {
          id: '12',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop',
          title: 'Trading Live',
          ticker: 'TRAD',
          creator: 'whale_trader',
          creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
          price: 234.00,
          priceChange: 42.8,
          marketCap: 23400000,
          athProgress: 89,
          liquidity: 3400000,
          holders: 8901,
          volume24h: 890000,
          txns: 4567,
          age: '3d',
          timeAgo: '8m',
          badge: 'live',
          viewers: 3891,
          href: '/post/12',
        },
        {
          id: '13',
          image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop',
          title: 'Coding Session',
          ticker: 'CODE',
          creator: 'dev_stream',
          creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          price: 56.70,
          priceChange: 12.3,
          marketCap: 5600000,
          athProgress: 67,
          liquidity: 670000,
          holders: 1234,
          volume24h: 78000,
          txns: 345,
          age: '12h',
          timeAgo: '3m',
          badge: 'live',
          viewers: 1567,
          href: '/post/13',
        },
        {
          id: '5',
          image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
          title: 'Tensorians',
          ticker: 'TENS',
          creator: 'tensor_hq',
          creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
          price: 234.56,
          priceChange: -2.1,
          marketCap: 23400000,
          athProgress: 34,
          liquidity: 3400000,
          holders: 12345,
          volume24h: 890000,
          txns: 5678,
          age: '2w',
          timeAgo: '25m',
          badge: 'new',
          isVerified: true,
          href: '/post/5',
        },
        {
          id: '6',
          image: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=400&h=400&fit=crop',
          title: 'Claynosaurz',
          ticker: 'CLAY',
          creator: 'claynosaurz',
          creatorAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
          price: 178.90,
          priceChange: 15.8,
          marketCap: 17800000,
          athProgress: 88,
          liquidity: 2500000,
          holders: 6789,
          volume24h: 345000,
          txns: 1567,
          age: '1w',
          timeAgo: '32m',
          isVerified: true,
          href: '/post/6',
        },
        {
          id: '7',
          image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=400&fit=crop',
          title: 'Famous Fox',
          ticker: 'FOX',
          creator: 'famousfoxfed',
          creatorAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop',
          price: 45.67,
          priceChange: 3.2,
          marketCap: 4500000,
          athProgress: 56,
          liquidity: 560000,
          holders: 3456,
          volume24h: 78000,
          txns: 456,
          age: '4d',
          timeAgo: '45m',
          href: '/post/7',
        },
        {
          id: '8',
          image: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=400&fit=crop',
          title: 'Bonk Inu',
          ticker: 'BONK',
          creator: 'bonk_inu',
          creatorAvatar: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=100&h=100&fit=crop',
          price: 0.0000234,
          priceChange: 45.6,
          marketCap: 890000000,
          athProgress: 23,
          liquidity: 45000000,
          holders: 567890,
          volume24h: 12000000,
          txns: 123456,
          age: '1y',
          timeAgo: '1h',
          badge: 'trending',
          isVerified: true,
          href: '/post/8',
        },
      ];

      setTokens(mockTokens);
      setLoading(false);
    }

    fetchPosts();
  }, [activeTab]);
  */

  const filteredTokens = tokens.filter(token =>
    token.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <div className="max-w-[1600px] mx-auto pb-20 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Explore</h1>
          <p className="text-white/50 text-sm">Discover trending tokens, creators, and content</p>
        </div>

        {/* Search & Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tokens, creators..."
              className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#9945FF]/50 focus:bg-white/[0.06] transition-all"
            />
          </div>

          {/* Filter Button - Opens Modal */}
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-white/[0.06] to-white/[0.02] border border-white/[0.08] text-white/80 hover:text-white hover:border-white/20 hover:from-white/[0.08] hover:to-white/[0.04] transition-all group"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-sm font-semibold">Filters</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2.5 rounded-xl transition-all',
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 text-white shadow-inner'
                  : 'text-white/40 hover:text-white/70'
              )}
              title="Grid view"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2.5 rounded-xl transition-all',
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 text-white shadow-inner'
                  : 'text-white/40 hover:text-white/70'
              )}
              title="List view"
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2.5 rounded-xl transition-all',
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 text-white shadow-inner'
                  : 'text-white/40 hover:text-white/70'
              )}
              title="Table view"
            >
              <TableCellsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Modal */}
        <FilterModal isOpen={showFilters} onClose={() => setShowFilters(false)} />

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0',
                  isActive
                    ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white shadow-lg shadow-[#9945FF]/25'
                    : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.1]'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#9945FF]/20 border-t-[#9945FF] rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Grid View - Ultra compact grid for Live tab */}
            {viewMode === 'grid' && activeTab === 'live' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {filteredTokens
                  .filter(token => token.badge === 'live')
                  .map((token) => (
                    <LiveCard key={token.id} token={token} />
                  ))}
              </div>
            )}

            {viewMode === 'grid' && activeTab !== 'live' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                {filteredTokens.map((token) => (
                  <GridCard key={token.id} token={token} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-2 sm:space-y-3">
                {filteredTokens.map((token) => (
                  <ListCard key={token.id} token={token} />
                ))}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 text-[9px] sm:text-[10px] lg:text-xs font-semibold text-white/40 uppercase tracking-wider">#</th>
                      <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 text-[9px] sm:text-[10px] lg:text-xs font-semibold text-white/40 uppercase tracking-wider">Token</th>
                      <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 text-[9px] sm:text-[10px] lg:text-xs font-semibold text-white/40 uppercase tracking-wider">Price</th>
                      <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 text-[9px] sm:text-[10px] lg:text-xs font-semibold text-white/40 uppercase tracking-wider hidden sm:table-cell">24h</th>
                      <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 text-[9px] sm:text-[10px] lg:text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">MCAP</th>
                      <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 text-[9px] sm:text-[10px] lg:text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Liq</th>
                      <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 text-[9px] sm:text-[10px] lg:text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Holders</th>
                      <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 text-[9px] sm:text-[10px] lg:text-xs font-semibold text-white/40 uppercase tracking-wider hidden xl:table-cell">Age</th>
                      <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 text-[9px] sm:text-[10px] lg:text-xs font-semibold text-white/40 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTokens.map((token, index) => (
                      <TableRow key={token.id} token={token} rank={index + 1} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty State */}
            {filteredTokens.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <MagnifyingGlassIcon className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-white font-semibold mb-2">No results found</h3>
                <p className="text-white/50 text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
