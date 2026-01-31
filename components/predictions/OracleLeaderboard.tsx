'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * OracleLeaderboard - Top predictors ranking
 *
 * Design: "The Oracle Chamber Rankings"
 * - Tiered visual hierarchy
 * - Win streak flames
 * - Animated rank changes
 * - Obsidian vault aesthetic
 */

interface Predictor {
  id: string;
  rank: number;
  previousRank?: number;
  username: string;
  avatar?: string;
  flexScore: number;
  winRate: number;
  totalPredictions: number;
  currentStreak: number;
  profit: number;
  tier: 'oracle' | 'prophet' | 'seer' | 'acolyte' | 'initiate';
}

interface OracleLeaderboardProps {
  predictors: Predictor[];
  currentUserId?: string;
  timeFrame?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  onTimeFrameChange?: (tf: 'daily' | 'weekly' | 'monthly' | 'all-time') => void;
  onViewProfile?: (userId: string) => void;
}

const TIME_FRAMES = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This Week' },
  { id: 'monthly', label: 'This Month' },
  { id: 'all-time', label: 'All Time' },
] as const;

const TIER_STYLES = {
  oracle: { color: '#FFD700', bg: 'from-[#FFD700]/10 to-[#FFD700]/5', border: 'border-[#FFD700]/30' },
  prophet: { color: '#E0FF62', bg: 'from-[#E0FF62]/10 to-[#E0FF62]/5', border: 'border-[#E0FF62]/30' },
  seer: { color: '#C0C0C0', bg: 'from-[#C0C0C0]/10 to-[#C0C0C0]/5', border: 'border-[#C0C0C0]/30' },
  acolyte: { color: '#CD7F32', bg: 'from-[#CD7F32]/10 to-[#CD7F32]/5', border: 'border-[#CD7F32]/30' },
  initiate: { color: '#666666', bg: 'from-[#666666]/10 to-[#666666]/5', border: 'border-[#666666]/30' },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center shadow-lg shadow-[#FFD700]/30">
        <span className="text-sm font-black text-black">1</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C0C0C0] to-[#A0A0A0] flex items-center justify-center shadow-lg shadow-[#C0C0C0]/30">
        <span className="text-sm font-black text-black">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#CD7F32] to-[#A0522D] flex items-center justify-center shadow-lg shadow-[#CD7F32]/30">
        <span className="text-sm font-black text-white">3</span>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
      <span className="text-sm font-mono font-bold text-white/40">{rank}</span>
    </div>
  );
}

function RankChange({ current, previous }: { current: number; previous?: number }) {
  if (!previous || previous === current) return null;

  const change = previous - current;
  const isUp = change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: isUp ? 5 : -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-0.5 text-[10px] font-mono font-bold",
        isUp ? "text-[#E0FF62]" : "text-red-400"
      )}
    >
      <svg
        className={cn("w-3 h-3", !isUp && "rotate-180")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
      <span>{Math.abs(change)}</span>
    </motion.div>
  );
}

function PredictorRow({
  predictor,
  isCurrentUser,
  onClick,
}: {
  predictor: Predictor;
  isCurrentUser: boolean;
  onClick: () => void;
}) {
  const tierStyle = TIER_STYLES[predictor.tier];
  const isTopThree = predictor.rank <= 3;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: predictor.rank * 0.03 }}
      whileHover={{ scale: 1.01, x: 4 }}
      className={cn(
        "w-full p-4 rounded-xl transition-all duration-300",
        "flex items-center gap-4",
        isCurrentUser
          ? "bg-[#E0FF62]/5 border border-[#E0FF62]/20"
          : "bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08]",
        isTopThree && "relative overflow-hidden"
      )}
    >
      {/* Glow for top 3 */}
      {isTopThree && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${tierStyle.color}20 0%, transparent 50%)`
          }}
        />
      )}

      {/* Rank */}
      <div className="flex items-center gap-2">
        <RankBadge rank={predictor.rank} />
        <RankChange current={predictor.rank} previous={predictor.previousRank} />
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center border"
          style={{
            borderColor: tierStyle.color,
            background: `linear-gradient(135deg, ${tierStyle.color}20, ${tierStyle.color}05)`
          }}
        >
          <span className="text-sm font-bold" style={{ color: tierStyle.color }}>
            {predictor.username[0].toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-medium truncate",
              isCurrentUser ? "text-[#E0FF62]" : "text-white"
            )}>
              @{predictor.username}
            </span>
            {isCurrentUser && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#E0FF62]/20 text-[#E0FF62]">
                YOU
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase"
              style={{ background: `${tierStyle.color}15`, color: tierStyle.color }}
            >
              {predictor.tier}
            </span>
            <span className="text-[10px] font-mono text-white/30">
              {predictor.winRate}% win rate
            </span>
          </div>
        </div>
      </div>

      {/* Streak */}
      {predictor.currentStreak >= 3 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <span className="text-xs">🔥</span>
          <span className="text-xs font-mono font-bold text-orange-400">{predictor.currentStreak}</span>
        </div>
      )}

      {/* Score */}
      <div className="text-right">
        <div className="text-lg font-mono font-bold" style={{ color: tierStyle.color }}>
          {predictor.flexScore}
        </div>
        <div className={cn(
          "text-[10px] font-mono",
          predictor.profit >= 0 ? "text-[#E0FF62]" : "text-red-400"
        )}>
          {predictor.profit >= 0 ? '+' : ''}{predictor.profit} USDC
        </div>
      </div>

      {/* Arrow */}
      <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}

export function OracleLeaderboard({
  predictors,
  currentUserId,
  timeFrame = 'weekly',
  onTimeFrameChange,
  onViewProfile,
}: OracleLeaderboardProps) {
  const [activeTimeFrame, setActiveTimeFrame] = useState(timeFrame);

  const handleTimeFrameChange = (tf: typeof timeFrame) => {
    setActiveTimeFrame(tf);
    onTimeFrameChange?.(tf);
  };

  // Find current user's position
  const currentUserPredictor = predictors.find(p => p.id === currentUserId);

  return (
    <div className={cn(
      "relative overflow-hidden rounded-[20px]",
      "bg-[#0A0A0A] border border-white/[0.06]",
      // Noise texture
      "before:absolute before:inset-0 before:opacity-[0.02]",
      "before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]",
      "before:pointer-events-none"
    )}>
      {/* Header */}
      <div className="relative z-10 p-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/30 flex items-center justify-center">
              <span className="text-lg">🏆</span>
            </div>
            <div>
              <h2 className="text-lg font-serif text-white" style={{ fontFamily: "'Cormorant Garabond', serif" }}>
                Oracle Leaderboard
              </h2>
              <p className="text-xs font-mono text-white/40">Top predictors by Flex Score</p>
            </div>
          </div>

          {/* Time frame toggle */}
          <div className="flex items-center bg-white/[0.03] rounded-lg p-1 border border-white/[0.04]">
            {TIME_FRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => handleTimeFrameChange(tf.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11px] font-mono font-medium transition-all",
                  activeTimeFrame === tf.id
                    ? "bg-[#E0FF62]/10 text-[#E0FF62] border border-[#E0FF62]/20"
                    : "text-white/40 hover:text-white/60"
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Current user position highlight */}
        {currentUserPredictor && currentUserPredictor.rank > 10 && (
          <div className="p-3 rounded-xl bg-[#E0FF62]/5 border border-[#E0FF62]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-white/60">Your rank:</span>
              <span className="text-lg font-mono font-bold text-[#E0FF62]">#{currentUserPredictor.rank}</span>
            </div>
            <span className="text-sm font-mono text-[#E0FF62]">{currentUserPredictor.flexScore} pts</span>
          </div>
        )}
      </div>

      {/* Leaderboard list */}
      <div className="relative z-10 p-4 space-y-2 max-h-[500px] overflow-y-auto">
        <AnimatePresence>
          {predictors.slice(0, 50).map((predictor) => (
            <PredictorRow
              key={predictor.id}
              predictor={predictor}
              isCurrentUser={predictor.id === currentUserId}
              onClick={() => onViewProfile?.(predictor.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 p-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono text-white/30">
            Updated every 5 minutes
          </p>
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
              Oracle
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#E0FF62]" />
              Prophet
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#C0C0C0]" />
              Seer
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
