'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface TokenBadgeProps {
  displayName: string;
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showSymbol?: boolean;
  symbol?: string;
}

export function TokenBadge({
  displayName,
  isVerified,
  size = 'md',
  showSymbol = false,
  symbol
}: TokenBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        className={`
          ${sizeClasses[size]}
          ${isVerified
            ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-white border-accent-purple/50'
            : 'bg-white/10 text-text-secondary border-white/20'
          }
          font-bold inline-flex items-center gap-1.5
        `}
      >
        <span>${displayName}</span>
        {isVerified && (
          <CheckCircle2 className={`${iconSizes[size]} text-white`} />
        )}
      </Badge>

      {showSymbol && symbol && (
        <span className="text-xs text-text-muted font-mono">
          {symbol}
        </span>
      )}

      {!isVerified && (
        <span className="text-xs text-yellow-500 font-semibold">
          ⚠️ Unverified
        </span>
      )}
    </div>
  );
}
