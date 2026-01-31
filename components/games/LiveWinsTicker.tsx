'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Winner {
  id: string;
  username: string;
  avatar: string;
  game: string;
  amount: number;
  multiplier: string;
  timestamp: Date;
}

// Generate mock winners for demo
function generateMockWinners(): Winner[] {
  const games = ['Coin Flip', 'Price Oracle', 'Fortune Wheel', 'Speed Trader', 'Crypto Dice'];
  const usernames = ['sol_whale', 'degen_king', 'moon_boy', 'diamond_hands', 'crypto_queen', 'ape_strong', 'hodl_master', 'pump_it', 'lambo_soon', 'wagmi_chad'];
  const multipliers = ['2x', '1.95x', '5x', '10x', '25x', '50x', '100x'];

  return Array.from({ length: 20 }, (_, i) => ({
    id: `win-${i}`,
    username: usernames[Math.floor(Math.random() * usernames.length)],
    avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${Math.random()}`,
    game: games[Math.floor(Math.random() * games.length)],
    amount: parseFloat((Math.random() * 10).toFixed(3)),
    multiplier: multipliers[Math.floor(Math.random() * multipliers.length)],
    timestamp: new Date(Date.now() - Math.random() * 3600000),
  }));
}

export function LiveWinsTicker() {
  const [winners, setWinners] = useState<Winner[]>(generateMockWinners());
  const [newWin, setNewWin] = useState<Winner | null>(null);

  // Simulate new wins coming in
  useEffect(() => {
    const interval = setInterval(() => {
      const games = ['Coin Flip', 'Price Oracle', 'Fortune Wheel', 'Speed Trader', 'Crypto Dice'];
      const usernames = ['sol_whale', 'degen_king', 'moon_boy', 'diamond_hands', 'crypto_queen'];
      const multipliers = ['2x', '5x', '10x', '25x', '50x'];

      const win: Winner = {
        id: `win-${Date.now()}`,
        username: usernames[Math.floor(Math.random() * usernames.length)],
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${Math.random()}`,
        game: games[Math.floor(Math.random() * games.length)],
        amount: parseFloat((Math.random() * 5).toFixed(3)),
        multiplier: multipliers[Math.floor(Math.random() * multipliers.length)],
        timestamp: new Date(),
      };

      setNewWin(win);
      setWinners(prev => [win, ...prev.slice(0, 19)]);

      // Clear the new win highlight after animation
      setTimeout(() => setNewWin(null), 3000);
    }, 5000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* New Win Popup */}
      <AnimatePresence>
        {newWin && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="relative px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 shadow-2xl shadow-emerald-500/50">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-emerald-400 blur-xl opacity-50 animate-pulse" />

              <div className="relative flex items-center gap-3">
                <div className="relative">
                  <img
                    src={newWin.avatar}
                    alt={newWin.username}
                    className="w-8 h-8 rounded-full border-2 border-white"
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-[8px]">$</span>
                  </div>
                </div>
                <div className="text-black font-bold">
                  <span className="text-emerald-900">@{newWin.username}</span>
                  <span className="mx-1">won</span>
                  <span className="text-lg">{newWin.amount.toFixed(2)} SOL</span>
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-xs">
                    {newWin.multiplier}
                  </span>
                </div>
              </div>

              {/* Sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{
                    opacity: 0,
                    scale: 0,
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 60,
                  }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrolling Ticker */}
      <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 pr-3 border-r border-white/20">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </div>
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">LIVE WINS</span>
        </div>

        {/* Scrolling wins */}
        <div className="flex-1 overflow-hidden">
          <motion.div
            className="flex gap-4"
            animate={{ x: [0, -1500] }}
            transition={{
              duration: 30,
              ease: 'linear',
              repeat: Infinity,
            }}
          >
            {[...winners, ...winners].map((winner, i) => (
              <div
                key={`${winner.id}-${i}`}
                className="flex items-center gap-2 shrink-0"
              >
                <img
                  src={winner.avatar}
                  alt={winner.username}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-white/70 text-xs">
                  <span className="text-white font-medium">@{winner.username}</span>
                  {' won '}
                  <span className="text-emerald-400 font-bold">{winner.amount.toFixed(2)} SOL</span>
                  {' on '}
                  <span className="text-white/90">{winner.game}</span>
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Compact version for inside game cards
export function MiniWinsBadge({ game, recentWins }: { game: string; recentWins: number }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 animate-pulse">
      <div className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </div>
      <span className="text-[10px] font-bold text-emerald-400">
        {recentWins} wins in last hour
      </span>
    </div>
  );
}

// Jackpot counter with counting animation
export function JackpotCounter({ amount, label }: { amount: number; label: string }) {
  const [displayAmount, setDisplayAmount] = useState(amount * 0.9);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayAmount(prev => {
        const increment = (Math.random() * 0.01);
        return prev + increment;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/30 px-4 py-2">
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

      <div className="relative flex items-center gap-3">
        <div className="text-2xl">💰</div>
        <div>
          <p className="text-[10px] text-amber-300/70 uppercase tracking-wider font-medium">{label}</p>
          <p className="text-xl font-black text-amber-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            {displayAmount.toFixed(3)} SOL
          </p>
        </div>
      </div>
    </div>
  );
}
