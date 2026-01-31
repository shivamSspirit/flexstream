'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  PhotoIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid';

interface StatItemProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  accentColor: string;
  loading?: boolean;
  animate?: boolean;
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 1000, enabled: boolean = true) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCount(end);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      countRef.current = Math.floor(easeOutQuart * end);
      setCount(countRef.current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, enabled]);

  return count;
}

function StatItem({
  icon,
  value,
  label,
  delta,
  deltaType = 'neutral',
  accentColor,
  loading = false,
  animate = true,
}: StatItemProps) {
  const numericValue = typeof value === 'number' ? value : 0;
  const animatedValue = useAnimatedCounter(numericValue, 800, animate && typeof value === 'number');
  const displayValue = typeof value === 'number' ? animatedValue : value;

  const deltaColors = {
    positive: 'text-gain',
    negative: 'text-loss',
    neutral: 'text-white/40',
  };

  if (loading) {
    return (
      <div className="flex-1 min-w-0">
        <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5 h-full">
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-4 bg-white/10 rounded" />
            <div className="h-8 w-16 bg-white/10 rounded" />
            <div className="h-3 w-12 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 group">
      <div
        className={cn(
          'relative overflow-hidden rounded-xl p-3 sm:p-4 h-full',
          'bg-gradient-to-br from-white/[0.08] to-white/[0.02]',
          'border border-white/10',
          'hover:border-opacity-100 transition-all duration-300',
          'hover:scale-[1.02] hover:shadow-lg cursor-default'
        )}
        style={{
          '--accent': accentColor,
          borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
        } as React.CSSProperties}
      >
        {/* Hover glow effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${accentColor} 15%, transparent), transparent 70%)`,
          }}
        />

        <div className="relative">
          {/* Icon */}
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center mb-2"
            style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)` }}
          >
            <span style={{ color: accentColor }}>{icon}</span>
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                'text-2xl sm:text-3xl font-black tabular-nums font-mono leading-none',
                'group-hover:scale-105 transition-transform duration-300'
              )}
              style={{ color: accentColor }}
            >
              {displayValue.toLocaleString()}
            </span>
          </div>

          {/* Label */}
          <p className="text-white/50 text-xs sm:text-sm font-medium mt-1 group-hover:text-white/70 transition-colors">
            {label}
          </p>

          {/* Delta */}
          {delta && (
            <p className={cn('text-[10px] sm:text-xs font-mono mt-1', deltaColors[deltaType])}>
              {delta}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProfileStatBarProps {
  postsCount: number;
  tokensCreated: number;
  totalEarned?: number;
  tradesCount?: number;
  rank?: number;
  rankDelta?: number;
  trustScore?: number;
  loading?: boolean;
  className?: string;
}

export function ProfileStatBar({
  postsCount,
  tokensCreated,
  totalEarned = 0,
  tradesCount = 0,
  rank,
  rankDelta,
  trustScore,
  loading = false,
  className,
}: ProfileStatBarProps) {
  const formatEarned = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    if (amount > 0) return `$${amount.toFixed(0)}`;
    return '--';
  };

  const stats: Array<{
    icon: React.ReactNode;
    value: number | string;
    label: string;
    delta?: string;
    deltaType?: 'positive' | 'negative' | 'neutral';
    accentColor: string;
  }> = [
    {
      icon: <PhotoIcon className="w-4 h-4" />,
      value: postsCount,
      label: 'Posts',
      delta: postsCount > 0 ? '+2 this week' : undefined,
      deltaType: 'positive',
      accentColor: '#CCFF00', // neon-lime
    },
    {
      icon: <CurrencyDollarIcon className="w-4 h-4" />,
      value: tokensCreated,
      label: 'Tokens',
      accentColor: '#00FFFF', // neon-cyan
    },
    {
      icon: <ChartBarIcon className="w-4 h-4" />,
      value: formatEarned(totalEarned),
      label: 'Earned',
      delta: totalEarned > 0 ? '+$120 today' : undefined,
      deltaType: 'positive',
      accentColor: '#00FF88', // gain
    },
    {
      icon: <ArrowTrendingUpIcon className="w-4 h-4" />,
      value: tradesCount,
      label: 'Trades',
      delta: tradesCount > 0 ? 'on your tokens' : undefined,
      deltaType: 'neutral',
      accentColor: '#BF40FF', // neon-purple
    },
  ];

  // Add rank if available
  if (rank !== undefined) {
    stats.push({
      icon: <TrophyIcon className="w-4 h-4" />,
      value: `#${rank}`,
      label: 'Rank',
      delta: rankDelta ? (rankDelta > 0 ? `↑ ${rankDelta}` : `↓ ${Math.abs(rankDelta)}`) : undefined,
      deltaType: rankDelta ? (rankDelta > 0 ? 'positive' : 'negative') : undefined,
      accentColor: '#FFD700', // gold
    });
  }

  // Add trust score if available
  if (trustScore !== undefined) {
    stats.push({
      icon: <ShieldCheckIcon className="w-4 h-4" />,
      value: trustScore,
      label: 'Trust',
      accentColor: '#00FF88', // gain
    });
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
        {stats.map((stat, index) => (
          <StatItem
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            delta={stat.delta}
            deltaType={stat.deltaType}
            accentColor={stat.accentColor}
            loading={loading}
            animate={!loading}
          />
        ))}
      </div>
    </div>
  );
}
