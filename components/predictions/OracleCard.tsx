'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * OracleCard - The core prediction market card
 *
 * Design: "The Oracle Chamber" aesthetic
 * - Deep obsidian surfaces with noise texture
 * - Mint Frost (#E0FF62) as primary accent ("Oracle Glow")
 * - Gold/Silver for YES/NO instead of generic red/green
 * - Serif typography for gravitas
 * - Hairline borders, dramatic depth
 */

interface OracleCardProps {
  market: {
    ticker: string;
    title: string;
    yesPrice: number; // 0-100
    noPrice: number;
    volume: number;
    expiresAt: string;
    category?: string;
  };
  friendsBetting?: {
    yes: { avatar: string; name: string }[];
    no: { avatar: string; name: string }[];
  };
  onBetYes?: () => void;
  onBetNo?: () => void;
  onChallenge?: () => void;
  featured?: boolean;
}

export function OracleCard({
  market,
  friendsBetting,
  onBetYes,
  onBetNo,
  onChallenge,
  featured = false,
}: OracleCardProps) {
  const [hoveredSide, setHoveredSide] = useState<'yes' | 'no' | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const yesPercentage = market.yesPrice;
  const noPercentage = market.noPrice;

  // Time remaining
  const expiresDate = new Date(market.expiresAt);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const daysLeft = Math.floor(hoursLeft / 24);
  const timeLabel = daysLeft > 0 ? `${daysLeft}d` : `${hoursLeft}h`;
  const isUrgent = hoursLeft < 24;

  // Format volume
  const formatVolume = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
  };

  const totalFriends = (friendsBetting?.yes.length || 0) + (friendsBetting?.no.length || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      onHoverStart={() => setIsRevealed(true)}
      onHoverEnd={() => setIsRevealed(false)}
      className={cn(
        "group relative overflow-hidden",
        "bg-[#0A0A0A] border border-white/[0.06]",
        featured ? "rounded-[20px]" : "rounded-[12px]",
        // Noise texture overlay
        "before:absolute before:inset-0 before:opacity-[0.03]",
        "before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]",
        "before:pointer-events-none before:z-10",
        // Glow on hover
        "transition-all duration-500",
        "hover:border-[#E0FF62]/20",
        "hover:shadow-[0_0_60px_-15px_rgba(224,255,98,0.15)]"
      )}
    >
      {/* Oracle Glow - top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E0FF62]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className={cn("relative z-20", featured ? "p-6" : "p-4")}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Category badge */}
            <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-[10px] font-mono tracking-wider text-white/40 uppercase">
              {market.category || 'Oracle'}
            </span>
            {featured && (
              <span className="px-2 py-0.5 bg-[#E0FF62]/10 border border-[#E0FF62]/20 rounded text-[10px] font-mono tracking-wider text-[#E0FF62] uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E0FF62] animate-pulse" />
                Featured
              </span>
            )}
          </div>

          {/* Time remaining */}
          <div className={cn(
            "flex items-center gap-1.5 text-[11px] font-mono",
            isUrgent ? "text-amber-400" : "text-white/30"
          )}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{timeLabel}</span>
          </div>
        </div>

        {/* Title - Serif for gravitas */}
        <h3 className={cn(
          "font-serif text-white leading-tight mb-5",
          featured ? "text-2xl" : "text-lg"
        )} style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {market.title}
        </h3>

        {/* The Oracle Bar - Split YES/NO visualization */}
        <div className="relative mb-4">
          {/* Background track */}
          <div className="h-12 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-hidden flex">
            {/* YES Side */}
            <motion.button
              onHoverStart={() => setHoveredSide('yes')}
              onHoverEnd={() => setHoveredSide(null)}
              onClick={onBetYes}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-2",
                "transition-all duration-300",
                hoveredSide === 'yes' && "bg-[#FFD700]/5"
              )}
              style={{ flexBasis: `${yesPercentage}%` }}
            >
              {/* Gold accent for YES */}
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#FFD700] via-[#FFD700]/60 to-transparent" />

              <span className="text-[#FFD700] font-mono text-xs font-medium tracking-wide">YES</span>
              <span className="text-white font-mono text-lg font-bold">{yesPercentage}¢</span>

              {/* Hover reveal */}
              <AnimatePresence>
                {hoveredSide === 'yes' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#FFD700] text-black text-[10px] font-mono font-bold rounded whitespace-nowrap"
                  >
                    Bet YES
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Divider */}
            <div className="w-px bg-white/[0.08] relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0A0A0A] border border-white/[0.08] flex items-center justify-center">
                <span className="text-[8px] font-mono text-white/30">VS</span>
              </div>
            </div>

            {/* NO Side */}
            <motion.button
              onHoverStart={() => setHoveredSide('no')}
              onHoverEnd={() => setHoveredSide(null)}
              onClick={onBetNo}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-2",
                "transition-all duration-300",
                hoveredSide === 'no' && "bg-[#C0C0C0]/5"
              )}
              style={{ flexBasis: `${noPercentage}%` }}
            >
              <span className="text-white font-mono text-lg font-bold">{noPercentage}¢</span>
              <span className="text-[#C0C0C0] font-mono text-xs font-medium tracking-wide">NO</span>

              {/* Silver accent for NO */}
              <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-[#C0C0C0] via-[#C0C0C0]/60 to-transparent" />

              <AnimatePresence>
                {hoveredSide === 'no' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#C0C0C0] text-black text-[10px] font-mono font-bold rounded whitespace-nowrap"
                  >
                    Bet NO
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Social Proof - Friends betting */}
        {totalFriends > 0 && (
          <div className="flex items-center justify-between mb-4 py-3 border-t border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              {/* YES friends */}
              {friendsBetting?.yes && friendsBetting.yes.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {friendsBetting.yes.slice(0, 3).map((friend, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 flex items-center justify-center"
                        title={friend.name}
                      >
                        <span className="text-[8px] font-bold text-[#FFD700]">
                          {friend.name[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-white/40 font-mono">
                    <span className="text-[#FFD700]">{friendsBetting.yes.length}</span> YES
                  </span>
                </div>
              )}

              {/* NO friends */}
              {friendsBetting?.no && friendsBetting.no.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {friendsBetting.no.slice(0, 3).map((friend, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-gradient-to-br from-[#C0C0C0]/20 to-[#C0C0C0]/5 flex items-center justify-center"
                        title={friend.name}
                      >
                        <span className="text-[8px] font-bold text-[#C0C0C0]">
                          {friend.name[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-white/40 font-mono">
                    <span className="text-[#C0C0C0]">{friendsBetting.no.length}</span> NO
                  </span>
                </div>
              )}
            </div>

            <span className="text-[10px] text-white/20 font-mono">
              {totalFriends} friend{totalFriends > 1 ? 's' : ''} betting
            </span>
          </div>
        )}

        {/* Footer - Volume & Challenge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] font-mono text-white/30">
            <span>{formatVolume(market.volume)} vol</span>
            <span className="text-white/10">|</span>
            <span className="text-white/20">{market.ticker}</span>
          </div>

          {/* Challenge Button */}
          <motion.button
            onClick={onChallenge}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "px-3 py-1.5 rounded-md",
              "bg-[#E0FF62]/10 border border-[#E0FF62]/20",
              "text-[#E0FF62] text-[11px] font-mono font-medium tracking-wide",
              "hover:bg-[#E0FF62]/20 hover:border-[#E0FF62]/30",
              "transition-all duration-300",
              "flex items-center gap-1.5"
            )}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Challenge
          </motion.button>
        </div>
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </motion.div>
  );
}
