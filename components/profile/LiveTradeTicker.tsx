'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  wallet: string;
  amount: string;
  tokenSymbol: string;
  timestamp: Date;
}

interface LiveTradeTickerProps {
  creatorId?: string;
  tokenMint?: string;
  className?: string;
}

// Mock trade generator for demo
function generateMockTrade(tokenSymbol: string): Trade {
  const wallets = [
    'whale.sol',
    'degen420',
    'based_trader',
    'diamond_hands',
    'moon_boy',
    'alpha_hunter',
    'ape_in',
    'chad.sol',
  ];

  const amounts = ['100', '250', '500', '1K', '2.5K', '5K', '10K', '25K'];

  return {
    id: Math.random().toString(36).substring(7),
    type: Math.random() > 0.35 ? 'buy' : 'sell',
    wallet: wallets[Math.floor(Math.random() * wallets.length)],
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    tokenSymbol,
    timestamp: new Date(),
  };
}

function TradeItem({ trade, isNew }: { trade: Trade; isNew?: boolean }) {
  const isBuy = trade.type === 'buy';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap',
        'bg-white/5 border border-white/10',
        isNew && 'animate-slide-in-bounce'
      )}
    >
      {/* Type indicator */}
      <span
        className={cn(
          'w-2 h-2 rounded-full shrink-0',
          isBuy ? 'bg-gain animate-pulse' : 'bg-loss'
        )}
      />

      {/* Wallet */}
      <span className="text-white/60 text-xs">@{trade.wallet}</span>

      {/* Action */}
      <span className={cn('text-xs font-bold', isBuy ? 'text-gain' : 'text-loss')}>
        {isBuy ? 'bought' : 'sold'}
      </span>

      {/* Amount */}
      <span className="text-white font-mono text-xs font-bold">{trade.amount}</span>

      {/* Token */}
      <span className="text-neon-lime text-xs font-mono">${trade.tokenSymbol}</span>
    </div>
  );
}

export function LiveTradeTicker({ creatorId, tokenMint, className }: LiveTradeTickerProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Generate initial trades
  useEffect(() => {
    const tokenSymbol = 'TOKEN'; // Replace with real token symbol
    const initialTrades = Array.from({ length: 10 }, () => generateMockTrade(tokenSymbol));
    setTrades(initialTrades);
  }, []);

  // Add new trades periodically
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const tokenSymbol = 'TOKEN'; // Replace with real token symbol
      const newTrade = generateMockTrade(tokenSymbol);
      setTrades((prev) => [newTrade, ...prev.slice(0, 19)]);
    }, 3000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  if (trades.length === 0) return null;

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        'bg-[#050505] border-y border-white/5',
        'py-2',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />

      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

      {/* Live indicator */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#050505]">
          <span className="w-1.5 h-1.5 rounded-full bg-loss animate-pulse" />
          <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Scrolling ticker */}
      <div
        ref={tickerRef}
        className={cn(
          'flex gap-3 pl-20',
          !isPaused && 'animate-ticker'
        )}
        style={{
          animationDuration: '60s',
        }}
      >
        {/* First set */}
        {trades.map((trade, index) => (
          <TradeItem key={`${trade.id}-1`} trade={trade} isNew={index === 0} />
        ))}

        {/* Duplicate for seamless loop */}
        {trades.map((trade) => (
          <TradeItem key={`${trade.id}-2`} trade={trade} />
        ))}
      </div>
    </div>
  );
}

// Compact version for profile header
export function MiniTradeTicker({ trades, className }: { trades?: Trade[]; className?: string }) {
  const defaultTrades: Trade[] = [
    { id: '1', type: 'buy', wallet: 'whale', amount: '10K', tokenSymbol: 'TOKEN', timestamp: new Date() },
    { id: '2', type: 'sell', wallet: 'paper', amount: '500', tokenSymbol: 'TOKEN', timestamp: new Date() },
    { id: '3', type: 'buy', wallet: 'degen', amount: '2.5K', tokenSymbol: 'TOKEN', timestamp: new Date() },
  ];

  const displayTrades = trades || defaultTrades;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displayTrades.slice(0, 4).map((trade) => (
        <div
          key={trade.id}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs',
            trade.type === 'buy' ? 'bg-gain/10' : 'bg-loss/10'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              trade.type === 'buy' ? 'bg-gain' : 'bg-loss'
            )}
          />
          <span className={trade.type === 'buy' ? 'text-gain' : 'text-loss'}>
            {trade.type === 'buy' ? '+' : '-'}{trade.amount}
          </span>
        </div>
      ))}
    </div>
  );
}
