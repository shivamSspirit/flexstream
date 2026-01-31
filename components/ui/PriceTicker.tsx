'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceTickerProps {
  price: number;
  previousPrice?: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showChange?: boolean;
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

export function PriceTicker({
  price,
  previousPrice,
  currency = '$',
  size = 'md',
  showChange = true,
  showIcon = true,
  animate = true,
  className,
}: PriceTickerProps) {
  const [displayPrice, setDisplayPrice] = useState(price);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const prevPriceRef = useRef(price);

  useEffect(() => {
    if (price !== prevPriceRef.current) {
      const newDirection = price > prevPriceRef.current ? 'up' : price < prevPriceRef.current ? 'down' : 'neutral';
      setDirection(newDirection);

      if (animate) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
      }

      prevPriceRef.current = price;
    }
    setDisplayPrice(price);
  }, [price, animate]);

  const change = previousPrice ? ((price - previousPrice) / previousPrice) * 100 : 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl md:text-3xl',
    xl: 'text-3xl md:text-4xl',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 18,
    xl: 22,
  };

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    } else if (value >= 1) {
      return value.toFixed(2);
    } else {
      return value.toFixed(6);
    }
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {/* Main Price */}
      <span
        className={cn(
          'font-mono font-bold tabular-nums tracking-tight transition-all duration-300',
          sizeClasses[size],
          isAnimating && direction === 'up' && 'animate-price-up text-gain',
          isAnimating && direction === 'down' && 'animate-price-down text-loss',
          !isAnimating && 'text-white'
        )}
      >
        {currency}{formatPrice(displayPrice)}
      </span>

      {/* Change Badge */}
      {showChange && previousPrice !== undefined && (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold font-mono',
            isPositive && 'bg-gain/15 text-gain border border-gain/30',
            isNegative && 'bg-loss/15 text-loss border border-loss/30',
            !isPositive && !isNegative && 'bg-white/10 text-white/60 border border-white/20'
          )}
        >
          {showIcon && (
            <>
              {isPositive && <TrendingUp size={iconSizes[size]} />}
              {isNegative && <TrendingDown size={iconSizes[size]} />}
              {!isPositive && !isNegative && <Minus size={iconSizes[size]} />}
            </>
          )}
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </span>
      )}
    </div>
  );
}

// Mini version for tight spaces
interface MiniTickerProps {
  symbol: string;
  price: number;
  change: number;
  className?: string;
}

export function MiniTicker({ symbol, price, change, className }: MiniTickerProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className={cn('inline-flex items-center gap-3 text-xs font-mono', className)}>
      <span className="text-white/60 uppercase">{symbol}</span>
      <span className="text-white font-semibold">${price.toFixed(4)}</span>
      <span
        className={cn(
          'font-bold',
          isPositive && 'text-gain',
          isNegative && 'text-loss',
          !isPositive && !isNegative && 'text-white/40'
        )}
      >
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    </div>
  );
}

// Scrolling ticker tape
interface TickerTapeProps {
  items: Array<{ symbol: string; price: number; change: number }>;
  className?: string;
}

export function TickerTape({ items, className }: TickerTapeProps) {
  return (
    <div className={cn('ticker-tape py-2 bg-terminal border-y border-white/5', className)}>
      <div className="ticker-tape-content">
        {[...items, ...items].map((item, index) => (
          <MiniTicker
            key={`${item.symbol}-${index}`}
            symbol={item.symbol}
            price={item.price}
            change={item.change}
          />
        ))}
      </div>
    </div>
  );
}
