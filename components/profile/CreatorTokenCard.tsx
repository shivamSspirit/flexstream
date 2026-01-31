'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  UserGroupIcon,
  FireIcon,
  BoltIcon,
} from '@heroicons/react/24/solid';
import { ExternalLink } from 'lucide-react';

interface CreatorTokenCardProps {
  tokenMint: string;
  tokenSymbol: string;
  creatorName: string;
  className?: string;
}

interface TokenData {
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  ath: number;
}

// Mini sparkline chart component
function MiniSparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      <defs>
        <linearGradient id={`sparkGrad-${isPositive ? 'up' : 'down'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isPositive ? '#00FF88' : '#FF3366'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={isPositive ? '#00FF88' : '#FF3366'} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`0,100 ${points} 100,100`}
        fill={`url(#sparkGrad-${isPositive ? 'up' : 'down'})`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? '#00FF88' : '#FF3366'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-[0_0_6px_rgba(0,255,136,0.5)]"
      />
    </svg>
  );
}

// Recent trade item
function RecentTrade({ type, amount, time }: { type: 'buy' | 'sell'; amount: string; time: string }) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs',
      'animate-slide-in-right',
      type === 'buy' ? 'bg-gain/10' : 'bg-loss/10'
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        type === 'buy' ? 'bg-gain animate-pulse' : 'bg-loss'
      )} />
      <span className={type === 'buy' ? 'text-gain' : 'text-loss'}>
        {type === 'buy' ? '+' : '-'}{amount}
      </span>
      <span className="text-white/40">{time}</span>
    </div>
  );
}

export function CreatorTokenCard({ tokenMint, tokenSymbol, creatorName, className }: CreatorTokenCardProps) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<number[]>([]);

  // Mock data for demo - replace with real API calls
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      // Generate mock chart data
      const mockChart = Array.from({ length: 24 }, (_, i) => {
        const base = 0.004;
        const variation = Math.sin(i / 3) * 0.001 + Math.random() * 0.0005;
        return base + variation;
      });

      setChartData(mockChart);
      setTokenData({
        price: 0.00421,
        priceChange24h: 127.3,
        priceChange7d: 892.1,
        volume24h: 12400,
        marketCap: 45200,
        holders: 892,
        ath: 0.0089,
      });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [tokenMint]);

  const isPositive = (tokenData?.priceChange24h ?? 0) >= 0;

  const formatPrice = (price: number) => {
    if (price < 0.0001) return `$${price.toFixed(8)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-[#0A0A0A] to-[#0D0D0D]',
        'border border-white/10',
        'p-6',
        className
      )}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-white/10 rounded" />
          <div className="h-24 bg-white/5 rounded-xl" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl',
      'bg-gradient-to-br from-[#0A0A0A] via-[#0D0D0D] to-[#0A1A0A]',
      'border-2',
      isPositive ? 'border-gain/30' : 'border-loss/30',
      'group hover:border-gain/50 transition-all duration-300',
      className
    )}>
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-glow opacity-20" />
      <div className={cn(
        'absolute inset-0 opacity-20',
        isPositive
          ? 'bg-gradient-to-br from-gain/10 via-transparent to-transparent'
          : 'bg-gradient-to-br from-loss/10 via-transparent to-transparent'
      )} />

      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              'bg-gradient-to-br from-neon-lime/20 to-neon-cyan/20',
              'border border-neon-lime/30'
            )}>
              <span className="text-xl">🪙</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg font-display uppercase tracking-wide">
                ${tokenSymbol}
              </h3>
              <p className="text-white/40 text-xs font-mono">Creator Coin</p>
            </div>
          </div>

          <Button
            onClick={() => window.open(`https://jup.ag/swap/SOL-${tokenMint}`, '_blank')}
            className="btn-trade-buy text-sm px-4 py-2"
          >
            <BoltIcon className="w-4 h-4" />
            Trade
            <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
          </Button>
        </div>

        {/* Price and Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          {/* Price Info */}
          <div className="space-y-3">
            <div>
              <div className="flex items-baseline gap-3">
                <span className={cn(
                  'text-3xl sm:text-4xl font-bold font-mono tabular-nums',
                  isPositive ? 'text-gain' : 'text-loss'
                )}>
                  {formatPrice(tokenData?.price ?? 0)}
                </span>
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold',
                  isPositive ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss'
                )}>
                  {isPositive ? (
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4" />
                  )}
                  {Math.abs(tokenData?.priceChange24h ?? 0).toFixed(1)}%
                </div>
              </div>
              <p className="text-white/40 text-xs mt-1">24H Change</p>
            </div>

            {/* Mini Stats */}
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-white/40">7D: </span>
                <span className={cn(
                  'font-mono font-semibold',
                  (tokenData?.priceChange7d ?? 0) >= 0 ? 'text-gain' : 'text-loss'
                )}>
                  {(tokenData?.priceChange7d ?? 0) >= 0 ? '+' : ''}{tokenData?.priceChange7d?.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-white/40">ATH: </span>
                <span className="text-white/70 font-mono">{formatPrice(tokenData?.ath ?? 0)}</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-24 lg:h-auto min-h-[80px]">
            <MiniSparkline data={chartData} isPositive={isPositive} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <ChartBarIcon className="w-4 h-4 text-neon-cyan" />
              <span className="text-white/40 text-xs uppercase tracking-wider">Volume</span>
            </div>
            <p className="text-white font-bold font-mono text-lg">{formatVolume(tokenData?.volume24h ?? 0)}</p>
            <p className="text-white/30 text-xs">24H</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <FireIcon className="w-4 h-4 text-gold" />
              <span className="text-white/40 text-xs uppercase tracking-wider">MCap</span>
            </div>
            <p className="text-white font-bold font-mono text-lg">{formatVolume(tokenData?.marketCap ?? 0)}</p>
            <p className="text-white/30 text-xs">Fully Diluted</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <UserGroupIcon className="w-4 h-4 text-neon-purple" />
              <span className="text-white/40 text-xs uppercase tracking-wider">Holders</span>
            </div>
            <p className="text-white font-bold font-mono text-lg">{tokenData?.holders?.toLocaleString()}</p>
            <p className="text-white/30 text-xs">Unique</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🔥</span>
              <span className="text-white/40 text-xs uppercase tracking-wider">Trades</span>
            </div>
            <p className="text-white font-bold font-mono text-lg">247</p>
            <p className="text-white/30 text-xs">Today</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/40 text-xs uppercase tracking-wider font-display">Recent Trades</span>
            <div className="live-indicator text-[10px] py-0.5 px-2">LIVE</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <RecentTrade type="buy" amount="500" time="2s" />
            <RecentTrade type="sell" amount="200" time="1m" />
            <RecentTrade type="buy" amount="1.2K" time="3m" />
            <RecentTrade type="buy" amount="850" time="5m" />
          </div>
        </div>
      </div>
    </div>
  );
}
