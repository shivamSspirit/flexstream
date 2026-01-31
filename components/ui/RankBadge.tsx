'use client';

import { cn } from '@/lib/utils';
import { Crown, Diamond, Medal, Award, Star, Flame, Zap } from 'lucide-react';

type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legendary';

interface RankBadgeProps {
  rank: number;
  tier?: RankTier;
  showRank?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const tierConfig: Record<RankTier, {
  bg: string;
  text: string;
  glow: string;
  icon: typeof Crown;
  label: string;
}> = {
  bronze: {
    bg: 'bg-gradient-to-r from-amber-700 to-amber-900',
    text: 'text-amber-100',
    glow: 'shadow-[0_0_15px_rgba(205,127,50,0.3)]',
    icon: Medal,
    label: 'Bronze',
  },
  silver: {
    bg: 'bg-gradient-to-r from-slate-300 to-slate-500',
    text: 'text-slate-900',
    glow: 'shadow-[0_0_15px_rgba(192,192,192,0.3)]',
    icon: Award,
    label: 'Silver',
  },
  gold: {
    bg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    text: 'text-yellow-900',
    glow: 'shadow-[0_0_20px_rgba(255,215,0,0.4)]',
    icon: Crown,
    label: 'Gold',
  },
  platinum: {
    bg: 'bg-gradient-to-r from-cyan-300 to-blue-400',
    text: 'text-cyan-900',
    glow: 'shadow-[0_0_20px_rgba(0,255,255,0.3)]',
    icon: Star,
    label: 'Platinum',
  },
  diamond: {
    bg: 'bg-gradient-to-r from-cyan-400 via-neon-lime to-purple-400',
    text: 'text-black',
    glow: 'shadow-[0_0_25px_rgba(0,255,255,0.4),0_0_25px_rgba(204,255,0,0.2)]',
    icon: Diamond,
    label: 'Diamond',
  },
  legendary: {
    bg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400',
    text: 'text-white',
    glow: 'shadow-[0_0_30px_rgba(191,64,255,0.5),0_0_30px_rgba(255,51,102,0.3)]',
    icon: Flame,
    label: 'Legendary',
  },
};

function getTierFromRank(rank: number): RankTier {
  if (rank <= 3) return 'legendary';
  if (rank <= 10) return 'diamond';
  if (rank <= 25) return 'platinum';
  if (rank <= 50) return 'gold';
  if (rank <= 100) return 'silver';
  return 'bronze';
}

export function RankBadge({
  rank,
  tier,
  showRank = true,
  size = 'md',
  animated = true,
  className,
}: RankBadgeProps) {
  const actualTier = tier || getTierFromRank(rank);
  const config = tierConfig[actualTier];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 10,
    md: 14,
    lg: 18,
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-bold uppercase tracking-wider',
        'font-display transition-all duration-300',
        config.bg,
        config.text,
        config.glow,
        sizeClasses[size],
        animated && actualTier === 'diamond' && 'animate-gradient-shift bg-[length:200%_200%]',
        animated && actualTier === 'legendary' && 'animate-gradient-shift bg-[length:200%_200%]',
        className
      )}
    >
      <Icon size={iconSizes[size]} />
      {showRank && <span>#{rank}</span>}
    </div>
  );
}

// Leaderboard position indicator
interface LeaderboardPositionProps {
  position: number;
  previousPosition?: number;
  className?: string;
}

export function LeaderboardPosition({ position, previousPosition, className }: LeaderboardPositionProps) {
  const change = previousPosition ? previousPosition - position : 0;
  const isUp = change > 0;
  const isDown = change < 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="font-mono text-2xl font-bold text-white">#{position}</span>
      {change !== 0 && (
        <div
          className={cn(
            'flex items-center gap-0.5 text-xs font-bold font-mono',
            isUp && 'text-gain',
            isDown && 'text-loss'
          )}
        >
          {isUp && <span>↑</span>}
          {isDown && <span>↓</span>}
          <span>{Math.abs(change)}</span>
        </div>
      )}
    </div>
  );
}

// Whale indicator badge
interface WhaleBadgeProps {
  holdingValue: number;
  className?: string;
}

export function WhaleBadge({ holdingValue, className }: WhaleBadgeProps) {
  // Different whale tiers based on holding value
  const isShrimp = holdingValue < 100;
  const isFish = holdingValue >= 100 && holdingValue < 1000;
  const isDolphin = holdingValue >= 1000 && holdingValue < 10000;
  const isWhale = holdingValue >= 10000 && holdingValue < 100000;
  const isMegaWhale = holdingValue >= 100000;

  if (isShrimp) return null;

  const config = isMegaWhale
    ? { label: 'MEGA WHALE', icon: '🐋', color: 'text-gold bg-gold/20 border-gold/40' }
    : isWhale
    ? { label: 'WHALE', icon: '🐳', color: 'text-cyan-400 bg-cyan-400/20 border-cyan-400/40' }
    : isDolphin
    ? { label: 'DOLPHIN', icon: '🐬', color: 'text-blue-400 bg-blue-400/20 border-blue-400/40' }
    : { label: 'FISH', icon: '🐟', color: 'text-white/60 bg-white/10 border-white/20' };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold uppercase border',
        config.color,
        isMegaWhale && 'animate-whale-alert',
        className
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}

// Diamond hands / Paper hands indicator
interface HandsBadgeProps {
  holdingDays: number;
  className?: string;
}

export function HandsBadge({ holdingDays, className }: HandsBadgeProps) {
  const isDiamondHands = holdingDays >= 30;
  const isStrongHands = holdingDays >= 7 && holdingDays < 30;
  const isPaperHands = holdingDays < 1;

  if (!isDiamondHands && !isStrongHands && !isPaperHands) return null;

  const config = isDiamondHands
    ? { label: 'DIAMOND HANDS', icon: '💎', color: 'text-cyan-400 bg-cyan-400/20 border-cyan-400/40' }
    : isStrongHands
    ? { label: 'STRONG HANDS', icon: '💪', color: 'text-neon-lime bg-neon-lime/20 border-neon-lime/40' }
    : { label: 'PAPER HANDS', icon: '📄', color: 'text-white/40 bg-white/5 border-white/10' };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold uppercase border',
        config.color,
        className
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}

// Achievement badge
interface AchievementBadgeProps {
  type: 'first_trade' | 'whale_buyer' | 'diamond_hands' | 'top_trader' | 'og' | 'verified';
  className?: string;
}

const achievementConfig: Record<string, { icon: typeof Zap; label: string; color: string }> = {
  first_trade: { icon: Zap, label: 'First Trade', color: 'text-neon-lime bg-neon-lime/20 border-neon-lime/40' },
  whale_buyer: { icon: Diamond, label: 'Whale', color: 'text-gold bg-gold/20 border-gold/40' },
  diamond_hands: { icon: Diamond, label: 'Diamond', color: 'text-cyan-400 bg-cyan-400/20 border-cyan-400/40' },
  top_trader: { icon: Crown, label: 'Top Trader', color: 'text-purple-400 bg-purple-400/20 border-purple-400/40' },
  og: { icon: Star, label: 'OG', color: 'text-coral-400 bg-coral-400/20 border-coral-400/40' },
  verified: { icon: Award, label: 'Verified', color: 'text-blue-400 bg-blue-400/20 border-blue-400/40' },
};

export function AchievementBadge({ type, className }: AchievementBadgeProps) {
  const config = achievementConfig[type];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase border',
        config.color,
        className
      )}
    >
      <Icon size={12} />
      <span>{config.label}</span>
    </div>
  );
}
