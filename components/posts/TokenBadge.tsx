'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface TokenBadgeProps {
  displayName: string;
  isVerified: boolean;           // Token name verification (anti-rug)
  isCreatorVerified?: boolean;   // Creator profile verification (avatar + X OAuth)
  size?: 'sm' | 'md' | 'lg';
  showSymbol?: boolean;
  symbol?: string;
}

/**
 * Verification Badge Display Logic:
 * | Token Verified | Creator Verified | Display                          |
 * |----------------|------------------|----------------------------------|
 * | Yes            | Yes              | Verified (green gradient)        |
 * | Yes            | No               | Unverified Creator (yellow)      |
 * | No             | Yes              | Unverified Token (orange)        |
 * | No             | No               | Unverified (red)                 |
 */
export function TokenBadge({
  displayName,
  isVerified,
  isCreatorVerified = false,
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

  // Determine verification state and styling
  const isFullyVerified = isVerified && isCreatorVerified;
  const isTokenOnlyVerified = isVerified && !isCreatorVerified;
  const isCreatorOnlyVerified = !isVerified && isCreatorVerified;
  // const isUnverified = !isVerified && !isCreatorVerified;

  // Badge styling based on verification state
  const getBadgeClasses = () => {
    if (isFullyVerified) {
      // Both verified: green gradient
      return 'bg-gradient-to-r from-green-500 to-emerald-400 text-white border-green-500/50';
    } else if (isTokenOnlyVerified) {
      // Token verified but creator unverified: yellow/amber
      return 'bg-gradient-to-r from-yellow-500/80 to-amber-400/80 text-white border-yellow-500/50';
    } else if (isCreatorOnlyVerified) {
      // Creator verified but token unverified: orange
      return 'bg-gradient-to-r from-orange-500/80 to-amber-500/80 text-white border-orange-500/50';
    } else {
      // Both unverified: muted/red
      return 'bg-white/10 text-text-secondary border-white/20';
    }
  };

  // Get warning message
  const getWarningMessage = (): { text: string; color: string } | null => {
    if (isFullyVerified) {
      return null;
    } else if (isTokenOnlyVerified) {
      return { text: 'Unverified Creator', color: 'text-yellow-500' };
    } else if (isCreatorOnlyVerified) {
      return { text: 'Unverified Token', color: 'text-orange-500' };
    } else {
      return { text: 'Unverified', color: 'text-red-400' };
    }
  };

  const warning = getWarningMessage();

  return (
    <div className="flex items-center gap-2">
      <Badge
        className={`
          ${sizeClasses[size]}
          ${getBadgeClasses()}
          font-bold inline-flex items-center gap-1.5
        `}
      >
        <span>${displayName}</span>
        {isFullyVerified ? (
          <CheckCircle2 className={`${iconSizes[size]} text-white`} />
        ) : (
          <AlertTriangle className={`${iconSizes[size]} ${warning?.color || 'text-yellow-500'}`} />
        )}
      </Badge>

      {showSymbol && symbol && (
        <span className="text-xs text-text-muted font-mono">
          {symbol}
        </span>
      )}

      {warning && (
        <span className={`text-xs ${warning.color} font-semibold`}>
          {warning.text}
        </span>
      )}
    </div>
  );
}
