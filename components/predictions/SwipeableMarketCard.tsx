'use client';

import { useState, useRef, useMemo, useCallback, createRef, RefObject, useEffect } from 'react';
import TinderCard from 'react-tinder-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, Check, RotateCcw, TrendingUp, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// VIRAL TINDER-STYLE SWIPEABLE MARKET CARDS
// Nikita Bier Playbook: 3-sec aha, FOMO, dopamine, instant actions
// MOBILE-FIRST: Full screen, large touch targets, clean hierarchy
// ═══════════════════════════════════════════════════════════════════════════════

type Direction = 'left' | 'right' | 'up' | 'down';
interface TinderCardAPI {
  swipe: (dir?: Direction) => Promise<void>;
  restoreCard: () => Promise<void>;
}

interface Market {
  ticker: string;
  event_ticker: string;
  title: string;
  status: 'open' | 'closed' | 'settled';
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  volume_24h?: number;
  open_time: string;
  close_time: string;
  expiration_time: string;
  category?: string;
}

interface SwipeableMarketCardsProps {
  markets: Market[];
  onBet: (market: Market, side: 'yes' | 'no') => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKET ICON — Compact circular icon
// ─────────────────────────────────────────────────────────────────────────────
function MarketIcon({ market }: { market: Market }) {
  const ticker = (market.event_ticker || market.ticker || '').toLowerCase();
  const title = (market.title || '').toLowerCase();

  let icon = '📈';
  let bg = 'bg-gradient-to-br from-slate-500 to-slate-600';

  if (ticker.includes('btc') || title.includes('bitcoin')) {
    icon = '₿'; bg = 'bg-gradient-to-br from-orange-500 to-amber-600';
  } else if (ticker.includes('eth') || title.includes('ethereum')) {
    icon = 'Ξ'; bg = 'bg-gradient-to-br from-indigo-500 to-purple-600';
  } else if (ticker.includes('sol') || title.includes('solana')) {
    icon = '◎'; bg = 'bg-gradient-to-br from-purple-500 to-fuchsia-600';
  } else if (ticker.includes('crypto') || title.includes('crypto') || title.includes('doge')) {
    icon = '🪙'; bg = 'bg-gradient-to-br from-yellow-500 to-orange-500';
  } else if (ticker.includes('fed') || title.includes('fed') || title.includes('rate') || title.includes('powell')) {
    icon = '🏦'; bg = 'bg-gradient-to-br from-emerald-500 to-teal-600';
  } else if (ticker.includes('trump') || title.includes('trump')) {
    icon = '🇺🇸'; bg = 'bg-gradient-to-br from-red-500 to-blue-600';
  } else if (ticker.includes('politic') || title.includes('election') || title.includes('biden') || title.includes('ceasefire') || title.includes('china') || title.includes('taiwan') || title.includes('ukraine') || title.includes('russia')) {
    icon = '🏛️'; bg = 'bg-gradient-to-br from-blue-500 to-indigo-600';
  } else if (title.includes('openai') || title.includes('gpt') || title.includes('ai') || title.includes('agi')) {
    icon = '🤖'; bg = 'bg-gradient-to-br from-cyan-500 to-blue-600';
  } else if (title.includes('tesla') || title.includes('tsla')) {
    icon = '⚡'; bg = 'bg-gradient-to-br from-red-500 to-rose-600';
  } else if (title.includes('nvidia') || title.includes('nvda')) {
    icon = '🎮'; bg = 'bg-gradient-to-br from-green-500 to-lime-600';
  } else if (title.includes('apple')) {
    icon = '🍎'; bg = 'bg-gradient-to-br from-gray-500 to-gray-700';
  } else if (title.includes('spacex') || title.includes('mars')) {
    icon = '🚀'; bg = 'bg-gradient-to-br from-slate-500 to-zinc-600';
  } else if (title.includes('recession') || title.includes('gdp') || title.includes('s&p') || title.includes('inflation')) {
    icon = '📊'; bg = 'bg-gradient-to-br from-emerald-500 to-teal-600';
  }

  return (
    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0', bg)}>
      {icon}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function formatVolume(v: number): string {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  if (v > 0) return `$${v.toFixed(0)}`;
  return '$0';
}

function getTimeLeft(closeTime: string): string {
  const now = new Date();
  const close = new Date(closeTime);
  const diff = close.getTime() - now.getTime();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 30) return `${Math.floor(days / 30)}mo`;
  if (days > 0) return `${days}d`;
  return `${hours}h`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export function SwipeableMarketCards({ markets, onBet }: SwipeableMarketCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(markets.length - 1);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showHint, setShowHint] = useState(true);
  const currentIndexRef = useRef(currentIndex);
  const prevMarketsLengthRef = useRef(markets.length);
  const hasSwipedRef = useRef(false);

  const childRefs = useMemo<RefObject<TinderCardAPI>[]>(
    () => Array(markets.length).fill(0).map(() => createRef<TinderCardAPI>()),
    [markets.length]
  );

  // Hide hint after first swipe
  useEffect(() => {
    if (hasSwipedRef.current) {
      setShowHint(false);
    }
  }, [currentIndex]);

  // Only reset if markets length changes AND user hasn't started swiping
  useEffect(() => {
    if (markets.length !== prevMarketsLengthRef.current && !hasSwipedRef.current) {
      const newIndex = markets.length - 1;
      setCurrentIndex(newIndex);
      currentIndexRef.current = newIndex;
      setSwipeDirection(null);
      prevMarketsLengthRef.current = markets.length;
    }
  }, [markets.length]);

  const updateCurrentIndex = (val: number) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  };

  const canSwipe = currentIndex >= 0;

  const swiped = useCallback((direction: string, market: Market, index: number) => {
    hasSwipedRef.current = true;
    setSwipeDirection(null);
    setShowHint(false);
    updateCurrentIndex(index - 1);
    if (direction === 'right') {
      onBet(market, 'yes');
    } else if (direction === 'left') {
      onBet(market, 'no');
    }
  }, [onBet]);

  const outOfFrame = (idx: number) => {
    if (currentIndexRef.current >= idx && childRefs[idx].current) {
      childRefs[idx].current?.restoreCard();
    }
  };

  const swipe = async (dir: Direction) => {
    if (canSwipe && currentIndex < markets.length && childRefs[currentIndex].current) {
      setSwipeDirection(dir as 'left' | 'right');
      await childRefs[currentIndex].current?.swipe(dir);
    }
  };

  const reset = () => {
    hasSwipedRef.current = false;
    setCurrentIndex(markets.length - 1);
    currentIndexRef.current = markets.length - 1;
    setSwipeDirection(null);
    setShowHint(true);
  };

  // Empty state
  if (markets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <TrendingUp className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/50 font-medium">No markets available</p>
        <p className="text-white/30 text-sm mt-1">Check back soon</p>
      </div>
    );
  }

  // All cards swiped
  if (currentIndex < 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00D4FF]/20 to-[#FF2D92]/20 flex items-center justify-center mb-4 mx-auto">
            <span className="text-3xl">🎯</span>
          </div>
          <h2 className="text-lg font-bold text-white mb-1">All caught up!</h2>
          <p className="text-white/50 text-sm mb-5">{markets.length} markets reviewed</p>
          <motion.button
            onClick={reset}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00D4FF] to-[#FF2D92] text-white text-sm font-semibold rounded-full"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100svh-180px)] bg-[#0A0A0F]">
      {/* Swipe Hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-4 py-1"
          >
            <motion.div
              animate={{ x: [-2, 2, -2] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="flex items-center gap-1 text-[#FF2D92]/60"
            >
              <ChevronLeft className="w-3 h-3" />
              <span className="text-[9px] font-medium">NO</span>
            </motion.div>
            <span className="text-white/20 text-[8px]">swipe</span>
            <motion.div
              animate={{ x: [2, -2, 2] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="flex items-center gap-1 text-[#00D4FF]/60"
            >
              <span className="text-[9px] font-medium">YES</span>
              <ChevronRight className="w-3 h-3" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Stack */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="relative w-full max-w-[320px] aspect-[4/4.5]">
          {markets.map((market, index) => {
            const yesPrice = market.yes_bid || market.last_price || 50;
            const noPrice = 100 - yesPrice;
            const yesPayout = yesPrice > 0 ? Math.round((100 / yesPrice) * 100) : 0;
            const noPayout = noPrice > 0 ? Math.round((100 / noPrice) * 100) : 0;
            const volume = (market.volume || 0) / 100;
            const isTopCard = index === currentIndex;
            const isVisible = index >= currentIndex - 2;

            if (!isVisible) return null;

            return (
              <TinderCard
                ref={childRefs[index]}
                key={market.ticker}
                onSwipe={(dir) => swiped(dir, market, index)}
                onCardLeftScreen={() => outOfFrame(index)}
                preventSwipe={['up', 'down']}
                swipeRequirementType="position"
                swipeThreshold={50}
                className="absolute inset-0"
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isTopCard ? 1 : 0.97 - (currentIndex - index) * 0.015,
                    y: isTopCard ? 0 : (currentIndex - index) * 8,
                    opacity: isTopCard ? 1 : 0.5,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={cn(
                    'w-full h-full rounded-3xl overflow-hidden select-none touch-none',
                    isTopCard ? 'cursor-grab active:cursor-grabbing' : ''
                  )}
                  style={{
                    background: 'linear-gradient(180deg, #151519 0%, #0C0C10 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: isTopCard
                      ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
                      : '0 10px 30px -10px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {/* ═══ CARD CONTENT ═══ */}
                  <div className="h-full flex flex-col p-3.5">

                    {/* ─── HEADER ROW — Compact ─── */}
                    <div className="flex items-center gap-2 mb-2">
                      <MarketIcon market={market} />
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          </span>
                          <span className="text-[8px] font-bold text-emerald-400 uppercase">Live</span>
                        </div>
                        <div className="flex items-center gap-1 text-white/30">
                          <span className="text-[9px]">{getTimeLeft(market.close_time)}</span>
                          <span className="text-white/10">•</span>
                          <span className="text-[9px] font-mono">{formatVolume(volume)}</span>
                        </div>
                      </div>
                    </div>

                    {/* ─── QUESTION ─── */}
                    <h2 className="text-base font-bold text-white leading-snug flex-1 flex items-center">
                      <span className="line-clamp-3">{market.title}</span>
                    </h2>

                    {/* ─── PRICE CARDS ─── */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {/* YES */}
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); swipe('right'); }}
                        animate={{ scale: swipeDirection === 'right' ? 1.02 : 1 }}
                        whileTap={{ scale: 0.98 }}
                        className="rounded-xl py-2.5 px-2 text-center transition-colors"
                        style={{
                          background: swipeDirection === 'right'
                            ? 'rgba(0, 212, 255, 0.15)'
                            : 'rgba(0, 212, 255, 0.06)',
                          border: swipeDirection === 'right'
                            ? '2px solid rgba(0, 212, 255, 0.4)'
                            : '1px solid rgba(0, 212, 255, 0.12)',
                        }}
                      >
                        <p className="text-[8px] font-bold text-[#00D4FF]/50 uppercase">Yes</p>
                        <p className="text-2xl font-black text-[#00D4FF] tabular-nums leading-none">
                          {yesPrice}<span className="text-sm">¢</span>
                        </p>
                        <p className="text-[9px] text-white/30 mt-0.5">
                          → <span className="text-[#00D4FF] font-semibold">${yesPayout}</span>
                        </p>
                      </motion.button>

                      {/* NO */}
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); swipe('left'); }}
                        animate={{ scale: swipeDirection === 'left' ? 1.02 : 1 }}
                        whileTap={{ scale: 0.98 }}
                        className="rounded-xl py-2.5 px-2 text-center transition-colors"
                        style={{
                          background: swipeDirection === 'left'
                            ? 'rgba(255, 45, 146, 0.12)'
                            : 'rgba(255, 255, 255, 0.03)',
                          border: swipeDirection === 'left'
                            ? '2px solid rgba(255, 45, 146, 0.4)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <p className="text-[8px] font-bold text-white/30 uppercase">No</p>
                        <p className="text-2xl font-black text-white/70 tabular-nums leading-none">
                          {noPrice}<span className="text-sm">¢</span>
                        </p>
                        <p className="text-[9px] text-white/30 mt-0.5">
                          → <span className="text-white/50 font-semibold">${noPayout}</span>
                        </p>
                      </motion.button>
                    </div>

                    {/* ─── SOCIAL PROOF ─── */}
                    <div className="flex items-center justify-center gap-1 mt-1.5 pt-1.5 border-t border-white/[0.04]">
                      <Users className="w-2.5 h-2.5 text-white/20" />
                      <span className="text-[8px] text-white/25">{Math.floor(Math.random() * 800) + 100} betting</span>
                    </div>
                  </div>

                  {/* ═══ SWIPE OVERLAYS ═══ */}
                  <AnimatePresence>
                    {isTopCard && swipeDirection === 'right' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ background: 'rgba(0, 212, 255, 0.15)' }}
                      >
                        <motion.div
                          initial={{ scale: 0.5, rotate: -20 }}
                          animate={{ scale: 1, rotate: -12 }}
                          className="px-8 py-3 border-4 border-[#00D4FF] rounded-xl bg-[#00D4FF]/10"
                          style={{ boxShadow: '0 0 40px rgba(0, 212, 255, 0.4)' }}
                        >
                          <span className="text-5xl font-black text-[#00D4FF]">YES</span>
                        </motion.div>
                      </motion.div>
                    )}
                    {isTopCard && swipeDirection === 'left' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ background: 'rgba(255, 45, 146, 0.15)' }}
                      >
                        <motion.div
                          initial={{ scale: 0.5, rotate: 20 }}
                          animate={{ scale: 1, rotate: 12 }}
                          className="px-8 py-3 border-4 border-[#FF2D92] rounded-xl bg-[#FF2D92]/10"
                          style={{ boxShadow: '0 0 40px rgba(255, 45, 146, 0.4)' }}
                        >
                          <span className="text-5xl font-black text-[#FF2D92]">NO</span>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </TinderCard>
            );
          })}
        </div>
      </div>

      {/* ═══ BOTTOM ACTION BAR ═══ */}
      <div className="flex-shrink-0 px-4 pb-20 pt-2">
        {/* Progress + Action Buttons inline */}
        <div className="flex items-center justify-center gap-6">
          {/* NO */}
          <motion.button
            onClick={() => swipe('left')}
            whileTap={{ scale: 0.9 }}
            disabled={!canSwipe}
            className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-[#FF2D92]/30 bg-[#FF2D92]/5 disabled:opacity-30"
          >
            <X className="w-5 h-5 text-[#FF2D92]" strokeWidth={2.5} />
          </motion.button>

          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00D4FF 0%, #FF2D92 100%)' }}
                animate={{ width: `${((markets.length - currentIndex - 1) / markets.length) * 100}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-white/25">
              {markets.length - currentIndex - 1}/{markets.length}
            </span>
          </div>

          {/* YES */}
          <motion.button
            onClick={() => swipe('right')}
            whileTap={{ scale: 0.9 }}
            disabled={!canSwipe}
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[#00D4FF]/50 bg-[#00D4FF]/10 disabled:opacity-30"
          >
            <Check className="w-6 h-6 text-[#00D4FF]" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
