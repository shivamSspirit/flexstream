'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Wallet,
  Trophy,
  Clock,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserPositions } from '@/hooks/useUnifiedMarkets';
import type { PredictionPosition } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════════
// POSITION CARD
// ═══════════════════════════════════════════════════════════════════════════════

function PositionCard({ position }: { position: PredictionPosition }) {
  const isYes = position.side === 'yes';
  const isProfit = position.unrealizedPnl > 0;
  const isLoss = position.unrealizedPnl < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 hover:border-white/[0.12] transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/80 line-clamp-2 leading-tight">
            {position.marketTitle}
          </p>
        </div>
        <div
          className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-bold',
            isYes
              ? 'bg-[#00D4FF]/10 text-[#00D4FF]'
              : 'bg-[#FF2D92]/10 text-[#FF2D92]'
          )}
        >
          {isYes ? 'YES' : 'NO'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <p className="text-[9px] text-white/30 uppercase">Entry</p>
          <p className="text-xs font-mono text-white/70">{position.entryPrice}¢</p>
        </div>
        <div>
          <p className="text-[9px] text-white/30 uppercase">Current</p>
          <p className="text-xs font-mono text-white/70">{position.currentPrice}¢</p>
        </div>
        <div>
          <p className="text-[9px] text-white/30 uppercase">Stake</p>
          <p className="text-xs font-mono text-white/70">${position.stakeAmount}</p>
        </div>
      </div>

      {/* P&L */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-1">
          {isProfit && <TrendingUp className="w-3 h-3 text-emerald-400" />}
          {isLoss && <TrendingDown className="w-3 h-3 text-red-400" />}
          <span
            className={cn(
              'text-xs font-semibold',
              isProfit && 'text-emerald-400',
              isLoss && 'text-red-400',
              !isProfit && !isLoss && 'text-white/50'
            )}
          >
            {isProfit ? '+' : ''}${position.unrealizedPnl.toFixed(2)}
          </span>
          <span className="text-[10px] text-white/30">
            ({position.unrealizedPnlPercent >= 0 ? '+' : ''}{position.unrealizedPnlPercent.toFixed(1)}%)
          </span>
        </div>

        {position.txSignature && (
          <a
            href={`https://solscan.io/tx/${position.txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/30 hover:text-[#00D4FF] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PORTFOLIO SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

function PortfolioSummary({ positions }: { positions: PredictionPosition[] }) {
  const totalValue = positions.reduce((acc, p) => acc + p.currentValue, 0);
  const totalInvested = positions.reduce((acc, p) => acc + p.stakeAmount, 0);
  const totalPnl = totalValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? ((totalPnl / totalInvested) * 100) : 0;
  const isProfit = totalPnl > 0;

  return (
    <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/80">Portfolio</h3>
        <div className="flex items-center gap-1 text-white/40">
          <Wallet className="w-3 h-3" />
          <span className="text-[10px]">{positions.length} positions</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-[10px] text-white/40 uppercase mb-1">Total Value</p>
          <p className="text-lg font-bold text-white">${totalValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase mb-1">Invested</p>
          <p className="text-lg font-bold text-white/70">${totalInvested.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase mb-1">P&L</p>
          <p
            className={cn(
              'text-lg font-bold',
              isProfit ? 'text-emerald-400' : totalPnl < 0 ? 'text-red-400' : 'text-white/50'
            )}
          >
            {isProfit ? '+' : ''}${totalPnl.toFixed(2)}
          </p>
          <p className="text-[10px] text-white/30">
            ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface PositionsPanelProps {
  className?: string;
  defaultExpanded?: boolean;
}

export function PositionsPanel({ className, defaultExpanded = false }: PositionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { data: positions, isLoading, error } = useUserPositions();

  const activePositions = positions?.filter(p => p.status === 'active') || [];
  const hasPositions = activePositions.length > 0;

  return (
    <div className={cn('', className)}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all',
          hasPositions
            ? 'bg-gradient-to-r from-[#00D4FF]/10 to-[#FF2D92]/10 border border-[#00D4FF]/20'
            : 'bg-white/[0.03] border border-white/[0.06]',
          'hover:border-white/[0.15]'
        )}
      >
        <div className="flex items-center gap-2">
          <Trophy className={cn('w-4 h-4', hasPositions ? 'text-[#00D4FF]' : 'text-white/30')} />
          <span className="text-sm font-medium text-white/80">
            My Predictions
          </span>
          {hasPositions && (
            <span className="px-1.5 py-0.5 bg-[#00D4FF]/20 rounded-full text-[10px] font-bold text-[#00D4FF]">
              {activePositions.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40" />
        )}
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#00D4FF]/30 border-t-[#00D4FF] rounded-full animate-spin" />
                </div>
              )}

              {error && (
                <div className="text-center py-6">
                  <p className="text-sm text-red-400">Failed to load positions</p>
                </div>
              )}

              {!isLoading && !error && !hasPositions && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/[0.05] flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-sm text-white/50 mb-1">No active predictions</p>
                  <p className="text-xs text-white/30">Swipe to place your first bet!</p>
                </div>
              )}

              {hasPositions && (
                <>
                  <PortfolioSummary positions={activePositions} />

                  <div className="space-y-2">
                    {activePositions.map((position) => (
                      <PositionCard key={position.id} position={position} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINI POSITIONS BAR (For header/floating display)
// ═══════════════════════════════════════════════════════════════════════════════

export function MiniPositionsBar() {
  const { data: positions } = useUserPositions();
  const activePositions = positions?.filter(p => p.status === 'active') || [];

  if (activePositions.length === 0) return null;

  const totalPnl = activePositions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
  const isProfit = totalPnl > 0;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] rounded-full border border-white/[0.08]">
      <Trophy className="w-3 h-3 text-[#00D4FF]" />
      <span className="text-xs text-white/60">{activePositions.length} active</span>
      <span
        className={cn(
          'text-xs font-semibold',
          isProfit ? 'text-emerald-400' : totalPnl < 0 ? 'text-red-400' : 'text-white/50'
        )}
      >
        {isProfit ? '+' : ''}${totalPnl.toFixed(2)}
      </span>
    </div>
  );
}
