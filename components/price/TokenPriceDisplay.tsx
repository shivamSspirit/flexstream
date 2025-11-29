'use client';

import { useTokenPrice } from '@/hooks/useTokenPrice';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenPriceDisplayProps {
  mint: string;
  className?: string;
  showChange?: boolean;
  showLiquidity?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'horizontal' | 'vertical';
}

export function TokenPriceDisplay({
  mint,
  className,
  showChange = true,
  showLiquidity = false,
  size = 'md',
  variant = 'horizontal'
}: TokenPriceDisplayProps) {
  const { price, loading, error } = useTokenPrice(mint, {
    refreshInterval: 60000 // Update every 60 seconds
  });

  if (loading && !price) {
    return (
      <div className={cn(
        'flex gap-1.5',
        variant === 'vertical' ? 'flex-col items-center' : 'items-center',
        className
      )}>
        <Loader2 className={cn(
          'animate-spin text-text-secondary',
          size === 'sm' && 'h-3 w-3',
          size === 'md' && 'h-4 w-4',
          size === 'lg' && 'h-5 w-5'
        )} />
        {variant === 'horizontal' && (
          <span className={cn(
            'text-text-secondary',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}>
            Loading...
          </span>
        )}
      </div>
    );
  }

  if (error || !price) {
    return (
      <div className={cn(
        'flex gap-1',
        variant === 'vertical' ? 'flex-col items-center' : 'items-center',
        className
      )}>
        {variant === 'vertical' && (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
            </svg>
          </div>
        )}
        <span className={cn(
          variant === 'vertical' ? 'text-white drop-shadow-lg' : 'text-text-muted',
          size === 'sm' && 'text-[10px] sm:text-[11px]',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}>
          $--
        </span>
      </div>
    );
  }

  const isPositive = price.priceChange24h >= 0;
  const formattedPrice = formatPrice(price.value);
  const formattedChange = Math.abs(price.priceChange24h).toFixed(2);
  // Use liquidity as a proxy for market cap display, or just show price
  const formattedMarketCap = price.liquidity > 0 ? formatMarketCap(price.liquidity) : formattedPrice;

  // Vertical variant for Reels-style display
  if (variant === 'vertical') {
    return (
      <div className={cn('flex flex-col items-center', className)}>
        {/* Market cap icon */}
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] flex items-center justify-center shadow-lg">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
          </svg>
        </div>
        {/* Market cap value */}
        <span className="text-white text-[10px] sm:text-[11px] font-bold mt-0.5 sm:mt-1 drop-shadow-lg">
          ${formattedMarketCap}
        </span>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Price with green triangle */}
      <div className="flex items-center gap-1.5">
        <svg
          className={cn(
            'text-accent-green',
            size === 'sm' && 'h-2.5 w-2.5',
            size === 'md' && 'h-3 w-3',
            size === 'lg' && 'h-4 w-4'
          )}
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 2L11 10H1L6 2Z" />
        </svg>
        <span className={cn(
          'font-bold text-accent-green',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg'
        )}>
          ${formattedPrice}
        </span>
      </div>

      {/* 24h change */}
      {showChange && price.priceChange24h !== 0 && (
        <div className={cn(
          'flex items-center gap-0.5 font-semibold',
          isPositive ? 'text-accent-green' : 'text-red-400',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}>
          {isPositive ? (
            <TrendingUp className={cn(
              size === 'sm' && 'h-3 w-3',
              size === 'md' && 'h-3.5 w-3.5',
              size === 'lg' && 'h-4 w-4'
            )} />
          ) : (
            <TrendingDown className={cn(
              size === 'sm' && 'h-3 w-3',
              size === 'md' && 'h-3.5 w-3.5',
              size === 'lg' && 'h-4 w-4'
            )} />
          )}
          <span>
            {isPositive ? '+' : '-'}{formattedChange}%
          </span>
        </div>
      )}

      {/* Liquidity (optional) */}
      {showLiquidity && price.liquidity > 0 && (
        <span className={cn(
          'text-text-muted',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}>
          Liq: ${formatLiquidity(price.liquidity)}
        </span>
      )}
    </div>
  );
}

/**
 * Format price for display
 */
function formatPrice(price: number): string {
  if (price === 0) return '0.00';

  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  if (price >= 1) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  if (price >= 0.01) {
    return price.toFixed(4);
  }

  if (price >= 0.0001) {
    return price.toFixed(6);
  }

  // For very small numbers, use scientific notation
  return price.toExponential(2);
}

/**
 * Format liquidity for display
 */
function formatLiquidity(liquidity: number): string {
  if (liquidity >= 1_000_000) {
    return (liquidity / 1_000_000).toFixed(1) + 'M';
  }

  if (liquidity >= 1_000) {
    return (liquidity / 1_000).toFixed(1) + 'K';
  }

  return liquidity.toFixed(0);
}

/**
 * Format market cap for display
 */
function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1_000_000_000) {
    return (marketCap / 1_000_000_000).toFixed(1) + 'B';
  }

  if (marketCap >= 1_000_000) {
    return (marketCap / 1_000_000).toFixed(1) + 'M';
  }

  if (marketCap >= 1_000) {
    return (marketCap / 1_000).toFixed(1) + 'K';
  }

  return marketCap.toFixed(0);
}
