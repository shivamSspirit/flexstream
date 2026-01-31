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
  PlayIcon,
  XMarkIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  UsersIcon,
  PuzzlePieceIcon,
  ScaleIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { TrendingUp, TrendingDown, Zap, Activity, Users } from 'lucide-react';
import { GamesTab } from '@/components/explore/GamesTab';
import { PredictionsTab } from '@/components/explore/PredictionsTab';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list' | 'table';
type TabId = 'featured' | 'predictions' | 'trending' | 'top' | 'new' | 'live' | 'videos' | 'creators' | 'games';

interface TokenData {
  id: string;
  image: string;
  title: string;
  ticker: string;
  creator: string;
  creatorWallet: string;
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

// Filter Modal Component - Trading Terminal Style
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
    { id: 'mcap_high', label: 'MCap High', icon: ChartBarIcon },
    { id: 'mcap_low', label: 'MCap Low', icon: ChartBarIcon },
    { id: 'volume', label: 'Volume', icon: ArrowTrendingUpIcon },
    { id: 'holders', label: 'Holders', icon: UsersIcon },
  ];

  const timeOptions = [
    { id: '1h', label: '1H' },
    { id: '6h', label: '6H' },
    { id: '24h', label: '24H' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: 'all', label: 'ALL' },
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md trading-card border-white/20 p-5 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-400/10 rounded-lg border border-cyan-400/30">
                      <AdjustmentsHorizontalIcon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <Dialog.Title className="text-lg font-bold text-white font-display uppercase tracking-wide">
                      Filters
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 text-white/40" />
                  </button>
                </div>

                {/* Sort By */}
                <div className="mb-5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">Sort By</label>
                  <div className="grid grid-cols-2 gap-2">
                    {sortOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold font-mono transition-all',
                            sortBy === option.id
                              ? 'bg-neon-lime/10 border border-neon-lime/30 text-neon-lime'
                              : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Range */}
                <div className="mb-5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">Time Range</label>
                  <div className="flex gap-1.5">
                    {timeOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setTimeRange(option.id)}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-[10px] font-bold font-mono transition-all',
                          timeRange === option.id
                            ? 'bg-gain/10 text-gain border border-gain/30'
                            : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Market Cap Range */}
                <div className="mb-5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">Market Cap Range</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input
                        type="text"
                        value={minMcap}
                        onChange={(e) => setMinMcap(e.target.value)}
                        placeholder="Min"
                        className="w-full pl-8 pr-3 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-neon-lime/30 transition-colors"
                      />
                    </div>
                    <span className="text-white/20 text-xs">—</span>
                    <div className="relative flex-1">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input
                        type="text"
                        value={maxMcap}
                        onChange={(e) => setMaxMcap(e.target.value)}
                        placeholder="Max"
                        className="w-full pl-8 pr-3 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-neon-lime/30 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Min Holders */}
                <div className="mb-5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">Minimum Holders</label>
                  <div className="relative">
                    <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                      type="text"
                      value={minHolders}
                      onChange={(e) => setMinHolders(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full pl-8 pr-3 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-neon-lime/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Toggle */}
                <div className="mb-6 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-white/60">Hide NSFW Content</span>
                    <button
                      onClick={() => setHideNsfw(!hideNsfw)}
                      className={cn(
                        'relative w-10 h-5 rounded-full transition-all',
                        hideNsfw ? 'bg-gain' : 'bg-white/20'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-lg',
                          hideNsfw ? 'left-5' : 'left-0.5'
                        )}
                      />
                    </button>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSortBy('trending');
                      setTimeRange('24h');
                      setMinMcap('');
                      setMaxMcap('');
                      setMinHolders('');
                      setHideNsfw(true);
                    }}
                    className="flex-1 py-2.5 rounded-lg text-xs font-bold font-mono text-white/40 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                  >
                    RESET
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 btn-trade-buy py-2.5 text-xs"
                  >
                    <Zap size={12} />
                    APPLY
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

// Trading Grid Card - Terminal Style
function GridCard({ token }: { token: TokenData }) {
  const router = useRouter();
  const isGain = token.priceChange >= 0;

  return (
    <article
      onClick={() => router.push(token.href)}
      className={cn(
        'group trading-card overflow-hidden cursor-pointer',
        'hover:border-neon-lime/30 hover:shadow-trading-card-hover'
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={token.image}
          alt={token.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Badge */}
        {token.badge && (
          <div className="absolute top-2 left-2">
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase',
              token.badge === 'live' && 'bg-loss text-white animate-pulse',
              token.badge === 'new' && 'bg-cyan-400 text-black',
              token.badge === 'trending' && 'bg-gold text-black',
              token.badge === 'mayhem' && 'bg-coral-400 text-black',
              token.badge === 'featured' && 'bg-neon-lime text-black',
            )}>
              {token.badge === 'live' && 'LIVE'}
              {token.badge === 'new' && 'NEW'}
              {token.badge === 'trending' && 'HOT'}
              {token.badge === 'mayhem' && 'MAYHEM'}
              {token.badge === 'featured' && 'FEATURED'}
            </span>
          </div>
        )}

        {/* Time */}
        <div className="absolute top-2 right-2">
          <span className="px-1.5 py-0.5 rounded bg-black/60 text-[8px] text-white/60 font-mono">
            {token.timeAgo}
          </span>
        </div>

        {/* Bottom overlay - Creator */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/profile/${token.creatorWallet}`);
            }}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <img
              src={token.creatorAvatar}
              alt={token.creator}
              className="w-4 h-4 rounded-full border border-white/30"
            />
            <span className="text-white/80 text-[10px] font-medium truncate">@{token.creator}</span>
            {token.isVerified && (
              <div className="w-3 h-3 bg-gain rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
            )}
          </button>
          <h3 className="text-white font-bold text-xs truncate mt-1">{token.title}</h3>
        </div>
      </div>

      {/* Content - Trading Style */}
      <div className="p-2.5 bg-terminal/50 border-t border-white/5">
        {/* Price Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <p className="text-[8px] text-white/30 uppercase font-mono tracking-wider">Price</p>
            <p className="text-white font-bold text-sm font-mono">{formatPrice(token.price)}</p>
          </div>
          <div className={cn(
            'px-2 py-1 rounded text-[10px] font-bold font-mono',
            isGain ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
          )}>
            {isGain ? '+' : ''}{token.priceChange.toFixed(1)}%
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-1 mb-2">
          <div className="text-center p-1.5 bg-white/[0.02] rounded border border-white/5">
            <p className="text-[7px] text-purple-400 uppercase font-mono">MC</p>
            <p className="text-[9px] text-white font-bold font-mono">{formatNumber(token.marketCap)}</p>
          </div>
          <div className="text-center p-1.5 bg-white/[0.02] rounded border border-white/5">
            <p className="text-[7px] text-cyan-400 uppercase font-mono">Liq</p>
            <p className="text-[9px] text-white font-bold font-mono">{formatNumber(token.liquidity)}</p>
          </div>
          <div className="text-center p-1.5 bg-white/[0.02] rounded border border-white/5">
            <p className="text-[7px] text-gold uppercase font-mono">Hold</p>
            <p className="text-[9px] text-white font-bold font-mono">{formatNumber(token.holders)}</p>
          </div>
        </div>

        {/* Buy Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="w-full btn-trade-buy py-1.5 text-[10px]"
        >
          <Zap size={10} />
          BUY ${token.ticker}
        </button>
      </div>
    </article>
  );
}

// Trading List Card
function ListCard({ token }: { token: TokenData }) {
  const router = useRouter();
  const isGain = token.priceChange >= 0;
  const isPumping = token.priceChange >= 10;

  return (
    <article
      onClick={() => router.push(token.href)}
      className={cn(
        'group trading-card p-3 sm:p-4 cursor-pointer',
        'hover:border-neon-lime/30 hover:shadow-trading-card-hover',
        isPumping && 'border-gain/20'
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Image */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 border border-white/10">
          <img
            src={token.image}
            alt={token.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {token.badge && (
            <div className="absolute top-0.5 right-0.5">
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold',
                token.badge === 'live' && 'bg-loss animate-pulse',
                token.badge === 'new' && 'bg-cyan-400 text-black',
                token.badge === 'trending' && 'bg-gold text-black',
              )}>
                {token.badge === 'live' ? '●' : token.badge === 'new' ? '✦' : '▲'}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-white font-bold text-sm truncate group-hover:text-neon-lime transition-colors">
              {token.title}
            </h3>
            <span className="text-white/30 text-xs font-mono">${token.ticker}</span>
            {token.isVerified && (
              <div className="w-4 h-4 bg-gain rounded-full flex items-center justify-center shrink-0">
                <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/profile/${token.creatorWallet}`);
            }}
            className="flex items-center gap-1.5 mb-2 hover:opacity-80 transition-opacity"
          >
            <img src={token.creatorAvatar} alt={token.creator} className="w-4 h-4 rounded-full" />
            <span className="text-white/40 text-[10px] font-mono">@{token.creator}</span>
            <span className="text-white/20 text-[10px]">·</span>
            <span className="text-white/30 text-[10px] font-mono">{token.timeAgo}</span>
          </button>

          {/* Stats Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-400/10 rounded border border-purple-400/20">
              <span className="text-[8px] text-purple-400 font-bold">MC</span>
              <span className="text-[10px] text-white font-bold font-mono">{formatNumber(token.marketCap)}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-cyan-400/10 rounded border border-cyan-400/20">
              <span className="text-[8px] text-cyan-400 font-bold">LIQ</span>
              <span className="text-[10px] text-white font-bold font-mono">{formatNumber(token.liquidity)}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-gold/10 rounded border border-gold/20">
              <span className="text-[8px] text-gold font-bold">HOLD</span>
              <span className="text-[10px] text-white font-bold font-mono">{formatNumber(token.holders)}</span>
            </div>
          </div>
        </div>

        {/* Price + Action */}
        <div className="text-right shrink-0">
          <p className="text-white font-bold text-lg font-mono mb-0.5">{formatPrice(token.price)}</p>
          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold font-mono mb-2',
            isGain ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
          )}>
            {isGain ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isGain ? '+' : ''}{token.priceChange.toFixed(1)}%
          </div>
          <button
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex btn-trade-buy px-4 py-2 text-xs w-full justify-center"
          >
            <Zap size={12} />
            BUY
          </button>
        </div>
      </div>

      {/* Mobile Buy Button */}
      <div className="sm:hidden mt-3 pt-3 border-t border-white/5">
        <button
          onClick={(e) => e.stopPropagation()}
          className="btn-trade-buy w-full py-2 text-xs"
        >
          <Zap size={12} />
          BUY ${token.ticker}
        </button>
      </div>
    </article>
  );
}

// Live Stream Card - Compact
function LiveCard({ token }: { token: TokenData }) {
  const router = useRouter();
  const isGain = token.priceChange >= 0;

  return (
    <article
      onClick={() => router.push(token.href)}
      className="group trading-card overflow-hidden cursor-pointer hover:border-loss/30"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={token.image}
          alt={token.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* LIVE Badge */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-loss opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-loss"></span>
          </span>
          <span className="text-[8px] font-bold text-white uppercase font-mono">LIVE</span>
        </div>

        {/* Viewers */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[8px] text-white/70 font-mono">
          <Users size={8} />
          <span>{token.viewers || 0}</span>
        </div>

        {/* Creator */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/profile/${token.creatorWallet}`);
          }}
          className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1.5"
        >
          <img
            src={token.creatorAvatar}
            alt={token.creator}
            className="w-4 h-4 rounded-full border border-white/20"
          />
          <span className="text-[9px] text-white font-medium truncate">{token.creator}</span>
        </button>
      </div>

      <div className="p-1.5 bg-terminal/50 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className={cn(
            'text-[9px] font-bold font-mono',
            isGain ? 'text-gain' : 'text-loss'
          )}>
            {formatPrice(token.price)}
          </span>
          <span className="text-[8px] text-white/30 font-mono">{formatNumber(token.holders)} hold</span>
        </div>
      </div>
    </article>
  );
}

// Table Row - Trading Terminal Style
function TableRow({ token, rank }: { token: TokenData; rank: number }) {
  const router = useRouter();
  const isGain = token.priceChange >= 0;

  return (
    <tr
      onClick={() => router.push(token.href)}
      className="group border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-all"
    >
      {/* Rank */}
      <td className="py-3 px-3">
        <span className={cn(
          'font-bold text-sm font-mono',
          rank === 1 ? 'text-gold' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-amber-600' : 'text-white/30'
        )}>
          {rank}
        </span>
      </td>

      {/* Token */}
      <td className="py-3 px-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img src={token.image} alt={token.title} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
            {token.badge && (
              <span className={cn(
                'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold',
                token.badge === 'live' && 'bg-loss',
                token.badge === 'trending' && 'bg-gold text-black',
                token.badge === 'featured' && 'bg-neon-lime text-black',
              )}>
                {token.badge === 'live' ? '●' : '★'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-semibold text-sm truncate group-hover:text-neon-lime transition-colors">{token.title}</span>
              {token.isVerified && (
                <div className="w-3.5 h-3.5 bg-gain rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-white/30 text-xs font-mono">${token.ticker}</span>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="py-3 px-3">
        <span className="text-white font-bold text-sm font-mono">{formatPrice(token.price)}</span>
      </td>

      {/* 24h Change */}
      <td className="py-3 px-3 hidden sm:table-cell">
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold font-mono',
          isGain ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
        )}>
          {isGain ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isGain ? '+' : ''}{token.priceChange.toFixed(1)}%
        </span>
      </td>

      {/* MCAP */}
      <td className="py-3 px-3 hidden md:table-cell">
        <span className="text-white/60 text-xs font-mono">{formatNumber(token.marketCap)}</span>
      </td>

      {/* Liquidity */}
      <td className="py-3 px-3 hidden lg:table-cell">
        <span className="text-cyan-400 text-xs font-mono">{formatNumber(token.liquidity)}</span>
      </td>

      {/* Holders */}
      <td className="py-3 px-3 hidden lg:table-cell">
        <span className="text-gold text-xs font-mono">{formatNumber(token.holders)}</span>
      </td>

      {/* Age */}
      <td className="py-3 px-3 hidden xl:table-cell">
        <span className="text-white/40 text-xs font-mono">{token.age}</span>
      </td>

      {/* Buy Button */}
      <td className="py-3 px-3">
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'px-3 py-1.5 rounded text-[10px] font-bold font-mono',
            'bg-gain/10 text-gain border border-gain/30',
            'hover:bg-gain/20 hover:border-gain/50',
            'opacity-0 group-hover:opacity-100 transition-all'
          )}
        >
          BUY
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

  const tabs = [
    { id: 'featured' as TabId, label: 'Featured', icon: StarIcon },
    { id: 'predictions' as TabId, label: 'Predictions', icon: ScaleIcon },
    { id: 'trending' as TabId, label: 'Trending', icon: FireIcon },
    { id: 'top' as TabId, label: 'Top', icon: TrophyIcon },
    { id: 'new' as TabId, label: 'New', icon: SparklesIcon },
    { id: 'live' as TabId, label: 'Live', icon: PlayIcon },
    { id: 'games' as TabId, label: 'Games', icon: PuzzlePieceIcon },
    { id: 'videos' as TabId, label: 'Videos', icon: VideoCameraIcon },
    { id: 'creators' as TabId, label: 'Creators', icon: UserGroupIcon },
  ];

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);

      try {
        const response = await fetch('/api/posts?limit=50');
        const data = await response.json();

        if (data.success && data.data.posts) {
          const realTokens: TokenData[] = data.data.posts.map((post: unknown, index: number) => {
            const p = post as Record<string, unknown>;
            const users = p.users as Record<string, unknown> | undefined;
            const mediaUrls = p.media_urls as string[] | undefined;

            return {
              id: p.id as string,
              image: mediaUrls?.[0] || 'https://images.unsplash.com/photo-1579762715459-5a068c289fda?w=400&h=400&fit=crop',
              title: (p.title as string) || (p.content as string)?.substring(0, 50) || 'Untitled Post',
              ticker: (p.token_display_name as string) || (p.token_symbol as string) || 'TOKEN',
              creator: (users?.username as string) || 'anonymous',
              creatorWallet: (users?.wallet_address as string) || '',
              creatorAvatar: (users?.avatar_url as string) || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
              description: p.content as string,
              price: (p.token_price as number) || 0,
              priceChange: (p.token_price_change_24h as number) || 0,
              marketCap: (p.token_market_cap as number) || 0,
              athProgress: (p.token_ath_progress as number) || 0,
              liquidity: (p.token_liquidity as number) || 0,
              holders: (p.token_holders as number) || 0,
              volume24h: (p.token_volume_24h as number) || 0,
              txns: (p.token_txns_24h as number) || 0,
              age: formatTimeAgo(p.created_at as string),
              timeAgo: formatTimeAgo(p.created_at as string),
              badge: p.token_is_verified ? 'featured' : index < 5 ? 'new' : undefined,
              isVerified: (p.token_is_verified as boolean) || false,
              href: `/post/${p.id}`,
            };
          });

          setTokens(realTokens);
        } else {
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

  const filteredTokens = tokens.filter(token =>
    token.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout showWallet={true} showSearch={false}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-trading-screen" />
        <div className="absolute inset-0 bg-grid-glow opacity-20" />
      </div>

      <div className="relative max-w-[1600px] mx-auto pb-20 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-neon-lime/10 rounded-lg border border-neon-lime/30">
              <Activity size={18} className="text-neon-lime" />
            </div>
            <h1 className="text-2xl font-bold text-white font-display uppercase tracking-wide">Explore</h1>
            <div className="live-indicator text-[10px]">LIVE</div>
          </div>
          <p className="text-white/40 text-sm font-mono">Discover trending tokens, creators, and content</p>
        </div>

        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tokens, creators..."
              className="w-full pl-11 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-neon-lime/30 transition-all"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg',
              'bg-white/5 border border-white/10',
              'text-white/60 hover:text-white hover:border-white/20',
              'transition-all'
            )}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span className="text-xs font-bold font-mono uppercase">Filters</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-black/50 border border-white/10 rounded-lg">
            {[
              { mode: 'grid' as ViewMode, icon: Squares2X2Icon },
              { mode: 'list' as ViewMode, icon: ListBulletIcon },
              { mode: 'table' as ViewMode, icon: TableCellsIcon },
            ].map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  viewMode === mode
                    ? 'bg-neon-lime/10 text-neon-lime border border-neon-lime/30'
                    : 'text-white/30 hover:text-white/60'
                )}
                title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <FilterModal isOpen={showFilters} onClose={() => setShowFilters(false)} />

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap shrink-0',
                  isActive
                    ? 'bg-neon-lime/10 text-neon-lime border border-neon-lime/30'
                    : 'bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="uppercase">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === 'games' ? (
          <GamesTab />
        ) : activeTab === 'predictions' ? (
          <PredictionsTab />
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-neon-lime/20 border-t-neon-lime rounded-full animate-spin" />
              <p className="text-white/30 text-xs font-mono uppercase">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Grid View - Live Tab */}
            {viewMode === 'grid' && activeTab === 'live' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {filteredTokens
                  .filter(token => token.badge === 'live')
                  .map((token) => (
                    <LiveCard key={token.id} token={token} />
                  ))}
              </div>
            )}

            {/* Grid View - Other Tabs */}
            {viewMode === 'grid' && activeTab !== 'live' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredTokens.map((token) => (
                  <GridCard key={token.id} token={token} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {filteredTokens.map((token) => (
                  <ListCard key={token.id} token={token} />
                ))}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="trading-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-terminal/50">
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">#</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Token</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Price</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono hidden sm:table-cell">24h</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono hidden md:table-cell">MCap</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono hidden lg:table-cell">Liq</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono hidden lg:table-cell">Holders</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono hidden xl:table-cell">Age</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTokens.map((token, index) => (
                        <TableRow key={token.id} token={token} rank={index + 1} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredTokens.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <MagnifyingGlassIcon className="w-6 h-6 text-white/20" />
                </div>
                <h3 className="text-white font-bold text-sm mb-1">No results found</h3>
                <p className="text-white/40 text-xs font-mono">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
