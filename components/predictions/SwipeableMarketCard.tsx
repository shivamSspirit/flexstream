'use client';

import { useState, useRef, useMemo, useCallback, createRef, RefObject } from 'react';
import TinderCard from 'react-tinder-card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Types for react-tinder-card API
type Direction = 'left' | 'right' | 'up' | 'down';
interface TinderCardAPI {
  swipe: (dir?: Direction) => Promise<void>;
  restoreCard: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TINDER-STYLE SWIPEABLE MARKET CARDS
// Swipe right = Yes, Swipe left = No
// ═══════════════════════════════════════════════════════════════════════════════

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

// Market Icon Component
function MarketIcon({ market }: { market: Market }) {
  const ticker = (market.event_ticker || market.ticker || '').toLowerCase();
  const title = (market.title || '').toLowerCase();

  let icon = '📈';
  let gradient = 'from-gray-600 to-gray-700';

  if (ticker.includes('btc') || title.includes('bitcoin')) {
    icon = '₿';
    gradient = 'from-orange-500 to-amber-600';
  } else if (ticker.includes('eth') || title.includes('ethereum')) {
    icon = 'Ξ';
    gradient = 'from-indigo-500 to-purple-600';
  } else if (ticker.includes('sol') || title.includes('solana')) {
    icon = '◎';
    gradient = 'from-purple-500 to-fuchsia-600';
  } else if (ticker.includes('crypto') || title.includes('crypto') || title.includes('doge')) {
    icon = '🪙';
    gradient = 'from-yellow-500 to-orange-500';
  } else if (ticker.includes('fed') || title.includes('fed') || title.includes('rate') || title.includes('powell')) {
    icon = '🏦';
    gradient = 'from-green-600 to-emerald-700';
  } else if (ticker.includes('trump') || title.includes('trump')) {
    icon = '🇺🇸';
    gradient = 'from-red-500 to-blue-600';
  } else if (ticker.includes('politic') || title.includes('election') || title.includes('biden') || title.includes('ceasefire') || title.includes('china') || title.includes('taiwan')) {
    icon = '🏛️';
    gradient = 'from-blue-600 to-indigo-700';
  } else if (ticker.includes('tech') || title.includes('openai') || title.includes('gpt') || title.includes('ai') || title.includes('tesla') || title.includes('nvidia') || title.includes('apple') || title.includes('spacex')) {
    icon = '🤖';
    gradient = 'from-cyan-500 to-blue-600';
  } else if (title.includes('recession') || title.includes('gdp') || title.includes('s&p') || title.includes('inflation')) {
    icon = '📉';
    gradient = 'from-emerald-600 to-teal-700';
  }

  return (
    <div className={cn(
      "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 shadow-lg",
      `bg-gradient-to-br ${gradient}`
    )}>
      {icon}
    </div>
  );
}

export function SwipeableMarketCards({ markets, onBet }: SwipeableMarketCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(markets.length - 1);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const currentIndexRef = useRef(currentIndex);

  const childRefs = useMemo<RefObject<TinderCardAPI>[]>(
    () => Array(markets.length).fill(0).map(() => createRef<TinderCardAPI>()),
    [markets.length]
  );

  const updateCurrentIndex = (val: number) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  };

  const canSwipe = currentIndex >= 0;

  const swiped = useCallback((direction: string, market: Market, index: number) => {
    setSwipeDirection(null);
    updateCurrentIndex(index - 1);

    // Trigger bet based on swipe direction
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

  const handleCardMove = useCallback((dir: string | null) => {
    if (dir === 'left' || dir === 'right') {
      setSwipeDirection(dir);
    } else {
      setSwipeDirection(null);
    }
  }, []);

  // Reset to start
  const reset = () => {
    setCurrentIndex(markets.length - 1);
    setSwipeDirection(null);
  };

  if (markets.length === 0) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <p className="text-white/50">No markets available</p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-180px)] flex flex-col items-center justify-center px-4">
      {/* Swipe Instructions */}
      <div className="absolute top-4 left-0 right-0 flex justify-center gap-8 z-10">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
          swipeDirection === 'left'
            ? "bg-red-500/30 border-2 border-red-500 scale-110"
            : "bg-white/5 border border-white/10"
        )}>
          <span className="text-lg">👈</span>
          <span className={cn(
            "text-sm font-medium",
            swipeDirection === 'left' ? "text-red-400" : "text-white/50"
          )}>NO</span>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
          swipeDirection === 'right'
            ? "bg-[#E0FF62]/30 border-2 border-[#E0FF62] scale-110"
            : "bg-white/5 border border-white/10"
        )}>
          <span className={cn(
            "text-sm font-medium",
            swipeDirection === 'right' ? "text-[#E0FF62]" : "text-white/50"
          )}>YES</span>
          <span className="text-lg">👉</span>
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative w-full max-w-[340px] h-[480px]">
        {markets.map((market, index) => {
          const yesPrice = market.yes_bid || market.last_price || 50;
          const noPrice = 100 - yesPrice;
          const yesPayout = yesPrice > 0 ? Math.round((100 / yesPrice) * 100) : 0;
          const noPayout = noPrice > 0 ? Math.round((100 / noPrice) * 100) : 0;
          const volume = (market.volume || 0) / 100;

          const formatVolume = (v: number): string => {
            if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
            if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
            if (v > 0) return `$${v.toFixed(0)}`;
            return '$0';
          };

          return (
            <TinderCard
              ref={childRefs[index]}
              key={market.ticker}
              onSwipe={(dir) => swiped(dir, market, index)}
              onCardLeftScreen={() => outOfFrame(index)}
              preventSwipe={['up', 'down']}
              swipeRequirementType="position"
              swipeThreshold={100}
              className="absolute w-full"
            >
              <div
                className={cn(
                  "w-full h-[480px] rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing",
                  "bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]",
                  "border border-white/10",
                  "shadow-2xl",
                  "select-none"
                )}
              >
                {/* Card Content */}
                <div className="h-full flex flex-col p-6">
                  {/* Top Section - Icon & Status */}
                  <div className="flex items-start justify-between mb-4">
                    <MarketIcon market={market} />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-medium text-emerald-400">LIVE</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-white leading-tight mb-6 flex-grow">
                    {market.title}
                  </h2>

                  {/* Price Display */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#E0FF62]/10 border border-[#E0FF62]/30 rounded-2xl p-4 text-center">
                      <p className="text-xs text-[#E0FF62]/70 uppercase tracking-wider mb-1">Yes</p>
                      <p className="text-3xl font-bold text-[#E0FF62]">{yesPrice}¢</p>
                      <p className="text-xs text-white/40 mt-1">Win ${yesPayout}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">No</p>
                      <p className="text-3xl font-bold text-white/80">{noPrice}¢</p>
                      <p className="text-xs text-white/40 mt-1">Win ${noPayout}</p>
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="flex items-center justify-center gap-2 text-white/40 text-sm mb-4">
                    <span>Volume:</span>
                    <span className="font-mono font-medium text-white/60">{formatVolume(volume)}</span>
                  </div>

                  {/* Manual Buttons (as backup) */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        swipe('left');
                      }}
                      className="py-3 px-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-colors"
                    >
                      No {noPrice}¢
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        swipe('right');
                      }}
                      className="py-3 px-4 rounded-xl bg-[#E0FF62] text-black font-semibold text-sm hover:bg-[#d4f055] transition-colors"
                    >
                      Yes {yesPrice}¢
                    </button>
                  </div>
                </div>

                {/* Swipe Overlays */}
                <AnimatePresence>
                  {index === currentIndex && swipeDirection === 'right' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#E0FF62]/20 flex items-center justify-center pointer-events-none"
                    >
                      <div className="text-6xl font-bold text-[#E0FF62] rotate-[-15deg] border-4 border-[#E0FF62] px-6 py-2 rounded-lg">
                        YES
                      </div>
                    </motion.div>
                  )}
                  {index === currentIndex && swipeDirection === 'left' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none"
                    >
                      <div className="text-6xl font-bold text-red-500 rotate-[15deg] border-4 border-red-500 px-6 py-2 rounded-lg">
                        NO
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TinderCard>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-sm">
            {markets.length - currentIndex - 1} / {markets.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E0FF62] transition-all duration-300"
            style={{ width: `${((markets.length - currentIndex - 1) / markets.length) * 100}%` }}
          />
        </div>

        {/* Reset Button (when all cards swiped) */}
        {currentIndex < 0 && (
          <button
            onClick={reset}
            className="mt-4 px-6 py-3 bg-[#E0FF62] text-black font-semibold rounded-xl hover:bg-[#d4f055] transition-colors"
          >
            Start Over
          </button>
        )}
      </div>

      {/* Bottom Action Buttons */}
      {canSwipe && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-6">
          <button
            onClick={() => swipe('left')}
            className="w-16 h-16 rounded-full bg-white/5 border-2 border-red-500/50 flex items-center justify-center text-2xl hover:bg-red-500/20 hover:scale-110 transition-all active:scale-95"
          >
            ✕
          </button>
          <button
            onClick={() => swipe('right')}
            className="w-16 h-16 rounded-full bg-[#E0FF62]/20 border-2 border-[#E0FF62] flex items-center justify-center text-2xl hover:bg-[#E0FF62]/30 hover:scale-110 transition-all active:scale-95"
          >
            ✓
          </button>
        </div>
      )}
    </div>
  );
}
