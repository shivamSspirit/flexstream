'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * FlexScoreCard - Shareable prediction accuracy card
 *
 * Design: "Spotify Wrapped for Predictions"
 * - Beautiful shareable card for Twitter
 * - Shows accuracy, win streak, rank
 * - Oracle Glow accent
 * - Obsidian vault aesthetic
 */

interface FlexScoreCardProps {
  user: {
    username: string;
    avatar?: string;
    flexScore: number;
    rank: number;
    totalPredictions: number;
    correctPredictions: number;
    currentStreak: number;
    longestStreak: number;
    totalProfit: number;
    topCategory?: string;
  };
  compact?: boolean;
  onShare?: () => void;
}

export function FlexScoreCard({ user, compact = false, onShare }: FlexScoreCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const winRate = user.totalPredictions > 0
    ? Math.round((user.correctPredictions / user.totalPredictions) * 100)
    : 0;

  // Score tier
  const getTier = (score: number) => {
    if (score >= 900) return { name: 'Oracle', color: '#FFD700', glow: 'shadow-[#FFD700]/30' };
    if (score >= 750) return { name: 'Prophet', color: '#E0FF62', glow: 'shadow-[#E0FF62]/30' };
    if (score >= 600) return { name: 'Seer', color: '#C0C0C0', glow: 'shadow-[#C0C0C0]/30' };
    if (score >= 400) return { name: 'Acolyte', color: '#CD7F32', glow: 'shadow-[#CD7F32]/30' };
    return { name: 'Initiate', color: '#666666', glow: '' };
  };

  const tier = getTier(user.flexScore);

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={cn(
          "relative overflow-hidden p-4 rounded-xl",
          "bg-[#0A0A0A] border border-white/[0.06]",
          "hover:border-[#E0FF62]/20 transition-all duration-300"
        )}
      >
        <div className="flex items-center gap-3">
          {/* Avatar with tier ring */}
          <div className="relative">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: tier.color, background: `${tier.color}10` }}
            >
              <span className="text-lg font-bold" style={{ color: tier.color }}>
                {user.username[0].toUpperCase()}
              </span>
            </div>
            {/* Rank badge */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0A0A0A] border border-white/[0.1] flex items-center justify-center">
              <span className="text-[8px] font-mono font-bold text-white/60">#{user.rank}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate">@{user.username}</span>
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                style={{ background: `${tier.color}20`, color: tier.color }}
              >
                {tier.name}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-lg font-mono font-bold" style={{ color: tier.color }}>
                {user.flexScore}
              </span>
              <span className="text-[10px] font-mono text-white/30">
                {winRate}% win rate
              </span>
            </div>
          </div>

          {/* Streak */}
          {user.currentStreak > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <span className="text-xs">🔥</span>
              <span className="text-xs font-mono font-bold text-orange-400">{user.currentStreak}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-[20px]",
        "bg-[#0A0A0A] border border-white/[0.06]",
        // Noise texture
        "before:absolute before:inset-0 before:opacity-[0.02]",
        "before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]",
        "before:pointer-events-none"
      )}
    >
      {/* Glow effect on hover */}
      <motion.div
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${tier.color}15 0%, transparent 50%)`
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${tier.color}60, transparent)`
        }}
      />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Avatar with tier ring */}
            <div className="relative">
              <motion.div
                animate={{ rotate: isHovered ? 360 : 0 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, ${tier.color}, transparent, ${tier.color})`
                }}
              />
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center m-0.5 bg-[#0A0A0A]"
              >
                <span className="text-2xl font-bold" style={{ color: tier.color }}>
                  {user.username[0].toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-white">@{user.username}</span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                  style={{ background: `${tier.color}20`, color: tier.color }}
                >
                  {tier.name}
                </span>
              </div>
              <p className="text-xs font-mono text-white/40 mt-0.5">
                Rank #{user.rank} • {user.topCategory || 'All Markets'}
              </p>
            </div>
          </div>

          {/* Share button */}
          <motion.button
            onClick={onShare}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-[#E0FF62]/20 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="text-xs font-mono text-white/60">Share</span>
          </motion.button>
        </div>

        {/* Flex Score - Hero number */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative inline-block"
          >
            {/* Glow behind score */}
            <div
              className="absolute inset-0 blur-2xl opacity-50"
              style={{ background: tier.color }}
            />
            <span
              className="relative text-7xl font-mono font-black tracking-tight"
              style={{ color: tier.color }}
            >
              {user.flexScore}
            </span>
          </motion.div>
          <p className="text-sm font-serif text-white/40 mt-2" style={{ fontFamily: "'Cormorant Garabond', serif" }}>
            Flex Score
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎯</span>
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Win Rate</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-white">{winRate}</span>
              <span className="text-sm font-mono text-white/40">%</span>
            </div>
            <p className="text-[10px] font-mono text-white/30 mt-1">
              {user.correctPredictions}/{user.totalPredictions} correct
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔥</span>
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Streak</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-orange-400">{user.currentStreak}</span>
              <span className="text-sm font-mono text-white/40">wins</span>
            </div>
            <p className="text-[10px] font-mono text-white/30 mt-1">
              Best: {user.longestStreak} wins
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📊</span>
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Predictions</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-white">{user.totalPredictions}</span>
              <span className="text-sm font-mono text-white/40">total</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💰</span>
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Profit</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-2xl font-mono font-bold",
                user.totalProfit >= 0 ? "text-[#E0FF62]" : "text-red-400"
              )}>
                {user.totalProfit >= 0 ? '+' : ''}{user.totalProfit}
              </span>
              <span className="text-sm font-mono text-white/40">USDC</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#E0FF62]/10 flex items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-[#E0FF62]">F</span>
            </div>
            <span className="text-[10px] font-mono text-white/30">Flexit Oracle</span>
          </div>
          <span className="text-[10px] font-mono text-white/20">
            flexit.io/@{user.username}
          </span>
        </div>
      </div>

      {/* Bottom glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${tier.color}30, transparent)`
        }}
      />
    </motion.div>
  );
}
