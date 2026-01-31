'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  format?: 'number' | 'currency' | 'percent' | 'compact';
  animated?: boolean;
  glowColor?: 'lime' | 'cyan' | 'coral' | 'purple' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function formatValue(value: number, format: string, prefix?: string, suffix?: string): string {
  let formatted: string;

  switch (format) {
    case 'currency':
      if (value >= 1000000) {
        formatted = `$${(value / 1000000).toFixed(2)}M`;
      } else if (value >= 1000) {
        formatted = `$${(value / 1000).toFixed(2)}K`;
      } else {
        formatted = `$${value.toFixed(2)}`;
      }
      break;
    case 'percent':
      formatted = `${value.toFixed(2)}%`;
      break;
    case 'compact':
      if (value >= 1000000) {
        formatted = `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        formatted = `${(value / 1000).toFixed(1)}K`;
      } else {
        formatted = value.toLocaleString();
      }
      break;
    default:
      formatted = value.toLocaleString();
  }

  return `${prefix || ''}${formatted}${suffix || ''}`;
}

export function StatCard({
  label,
  value,
  previousValue,
  prefix,
  suffix,
  icon: Icon,
  trend,
  trendValue,
  format = 'number',
  animated = true,
  glowColor,
  size = 'md',
  className,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(typeof value === 'number' ? 0 : value);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (typeof value !== 'number' || !animated) {
      setDisplayValue(value);
      return;
    }

    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      setDisplayValue(prev => {
        const startValue = typeof prev === 'number' ? prev : 0;
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        return startValue + (value - startValue) * easeOutQuart;
      });

      if (Date.now() - startTime < duration) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    setIsAnimating(true);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, animated]);

  useEffect(() => {
    if (isAnimating) {
      const timeout = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [isAnimating]);

  // Calculate trend from previous value if not explicitly provided
  const calculatedTrend = trend || (
    previousValue !== undefined && typeof value === 'number'
      ? value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral'
      : undefined
  );

  const calculatedTrendValue = trendValue ?? (
    previousValue !== undefined && typeof value === 'number'
      ? ((value - previousValue) / previousValue) * 100
      : undefined
  );

  const glowClasses: Record<string, string> = {
    lime: 'hover:shadow-glow-lime border-neon-lime/20',
    cyan: 'hover:shadow-glow-cyan border-cyan-400/20',
    coral: 'hover:shadow-glow-coral border-coral-400/20',
    purple: 'hover:shadow-glow-purple border-purple-400/20',
    gold: 'hover:shadow-glow-gold border-gold/20',
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const valueSizes = {
    sm: 'text-xl',
    md: 'text-2xl md:text-3xl',
    lg: 'text-3xl md:text-4xl',
  };

  const formattedValue = typeof displayValue === 'number'
    ? formatValue(displayValue, format, prefix, suffix)
    : displayValue;

  return (
    <div
      className={cn(
        'stat-card relative overflow-hidden',
        sizeClasses[size],
        glowColor && glowClasses[glowColor],
        className
      )}
    >
      {/* Background glow effect */}
      {glowColor && (
        <div
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-300',
            'group-hover:opacity-100',
            glowColor === 'lime' && 'bg-gradient-to-br from-neon-lime/5 to-transparent',
            glowColor === 'cyan' && 'bg-gradient-to-br from-cyan-400/5 to-transparent',
            glowColor === 'coral' && 'bg-gradient-to-br from-coral-400/5 to-transparent',
            glowColor === 'purple' && 'bg-gradient-to-br from-purple-400/5 to-transparent',
            glowColor === 'gold' && 'bg-gradient-to-br from-gold/5 to-transparent'
          )}
        />
      )}

      <div className="relative z-10">
        {/* Header with icon and label */}
        <div className="flex items-center gap-2 mb-2">
          {Icon && (
            <Icon
              size={size === 'lg' ? 20 : size === 'md' ? 16 : 14}
              className={cn(
                'text-white/40',
                glowColor === 'lime' && 'text-neon-lime/60',
                glowColor === 'cyan' && 'text-cyan-400/60',
                glowColor === 'coral' && 'text-coral-400/60',
                glowColor === 'purple' && 'text-purple-400/60',
                glowColor === 'gold' && 'text-gold/60'
              )}
            />
          )}
          <span className="stat-card-label">{label}</span>
        </div>

        {/* Value */}
        <div
          className={cn(
            'font-mono font-bold tabular-nums text-white transition-all duration-300',
            valueSizes[size],
            isAnimating && 'animate-count-up'
          )}
        >
          {formattedValue}
        </div>

        {/* Trend indicator */}
        {calculatedTrend && calculatedTrendValue !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 mt-2 text-xs font-mono font-bold',
              calculatedTrend === 'up' && 'text-gain',
              calculatedTrend === 'down' && 'text-loss',
              calculatedTrend === 'neutral' && 'text-white/40'
            )}
          >
            {calculatedTrend === 'up' && <TrendingUp size={12} />}
            {calculatedTrend === 'down' && <TrendingDown size={12} />}
            {calculatedTrend === 'neutral' && <Minus size={12} />}
            <span>
              {calculatedTrend === 'up' ? '+' : ''}
              {calculatedTrendValue.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Stats grid component for dashboard layouts
interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {children}
    </div>
  );
}

// Mini stat for inline displays
interface MiniStatProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down';
  className?: string;
}

export function MiniStat({ label, value, trend, className }: MiniStatProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs text-white/40 uppercase">{label}</span>
      <span
        className={cn(
          'text-sm font-mono font-bold',
          trend === 'up' && 'text-gain',
          trend === 'down' && 'text-loss',
          !trend && 'text-white'
        )}
      >
        {value}
      </span>
    </div>
  );
}
