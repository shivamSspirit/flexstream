'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  FireIcon,
  UserGroupIcon,
  TrophyIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';

export interface GameData {
  id: string;
  name: string;
  description: string;
  shortDesc: string;
  category: 'luck' | 'prediction' | 'skill' | 'pvp';
  theme: 'gold' | 'cyan' | 'rainbow' | 'magenta' | 'emerald';
  playersOnline: number;
  totalPlays: number;
  maxWin: string;
  minBet: string;
  icon: string;
  previewAnimation: 'flip' | 'pulse' | 'spin' | 'race' | 'dice';
  isHot?: boolean;
  jackpot?: number;
}

const GAMES: GameData[] = [
  {
    id: 'coin-flip',
    name: 'Coin Flip',
    description: 'Double or nothing. Pick heads or tails, flip the coin, and test your luck.',
    shortDesc: '50/50 chance to 2x',
    category: 'luck',
    theme: 'gold',
    playersOnline: 1247,
    totalPlays: 89420,
    maxWin: '2x',
    minBet: '0.01 SOL',
    icon: '🪙',
    previewAnimation: 'flip',
    isHot: true,
    jackpot: 12.5,
  },
  {
    id: 'price-prediction',
    name: 'Price Oracle',
    description: 'Predict if SOL will go UP or DOWN in 60 seconds.',
    shortDesc: 'Predict SOL price',
    category: 'prediction',
    theme: 'cyan',
    playersOnline: 892,
    totalPlays: 156780,
    maxWin: '1.95x',
    minBet: '0.05 SOL',
    icon: '📈',
    previewAnimation: 'pulse',
    jackpot: 8.2,
  },
  {
    id: 'spin-wheel',
    name: 'Fortune Wheel',
    description: 'Spin for prizes from 0.5x to 100x!',
    shortDesc: 'Up to 100x wins',
    category: 'luck',
    theme: 'rainbow',
    playersOnline: 2103,
    totalPlays: 234500,
    maxWin: '100x',
    minBet: '0.01 SOL',
    icon: '🎡',
    previewAnimation: 'spin',
    isHot: true,
    jackpot: 45.8,
  },
  {
    id: 'trading-race',
    name: 'Speed Trader',
    description: 'Race others! Best trader in 2 min wins.',
    shortDesc: 'PvP trading race',
    category: 'pvp',
    theme: 'magenta',
    playersOnline: 456,
    totalPlays: 45600,
    maxWin: '10x',
    minBet: '0.1 SOL',
    icon: '🏎️',
    previewAnimation: 'race',
    jackpot: 22.1,
  },
  {
    id: 'dice-roll',
    name: 'Crypto Dice',
    description: 'Roll dice and set your target. Higher risk = higher reward.',
    shortDesc: 'Classic dice game',
    category: 'luck',
    theme: 'emerald',
    playersOnline: 678,
    totalPlays: 112300,
    maxWin: '99x',
    minBet: '0.01 SOL',
    icon: '🎲',
    previewAnimation: 'dice',
    jackpot: 15.3,
  },
];

// Recent winners for social proof
const RECENT_WINNERS = [
  { name: 'sol_whale', amount: 4.2, game: 'Coin Flip', avatar: '🐋' },
  { name: 'degen_king', amount: 12.8, game: 'Fortune Wheel', avatar: '👑' },
  { name: 'moon_boy', amount: 2.1, game: 'Price Oracle', avatar: '🌙' },
  { name: 'pump_it', amount: 8.5, game: 'Crypto Dice', avatar: '🚀' },
];

// Compact live ticker
function LiveTicker() {
  const [currentWinner, setCurrentWinner] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWinner(prev => (prev + 1) % RECENT_WINNERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const winner = RECENT_WINNERS[currentWinner];

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs font-bold text-white/60">LIVE</span>
      </div>

      <div className="h-4 w-px bg-white/20" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentWinner}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          className="flex items-center gap-2"
        >
          <span className="text-lg">{winner.avatar}</span>
          <span className="text-xs text-white/70">
            <span className="font-bold text-white">@{winner.name}</span> won{' '}
            <span className="font-black text-emerald-400">{winner.amount} SOL</span>
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Total stats bar
function TotalStats() {
  const [totalPlayers, setTotalPlayers] = useState(5476);
  const [totalWon, setTotalWon] = useState(1234.56);

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalPlayers(prev => prev + Math.floor(Math.random() * 3) - 1);
      setTotalWon(prev => prev + Math.random() * 0.1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 text-xs text-white/50">
      <div className="flex items-center gap-1.5">
        <UserGroupIcon className="w-3.5 h-3.5" />
        <span><span className="font-bold text-white">{totalPlayers.toLocaleString()}</span> playing</span>
      </div>
      <div className="flex items-center gap-1.5">
        <TrophyIcon className="w-3.5 h-3.5 text-amber-400" />
        <span><span className="font-bold text-emerald-400">{totalWon.toFixed(0)} SOL</span> won today</span>
      </div>
    </div>
  );
}

// Compact game card for feed
function GameFeedCard({ game, rank, onPlay }: { game: GameData; rank: number; onPlay: () => void }) {
  const [playersNow, setPlayersNow] = useState(game.playersOnline);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayersNow(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Theme colors
  const themeColors = {
    gold: 'from-amber-500/20 to-yellow-600/10 border-amber-500/30 hover:border-amber-400/50',
    cyan: 'from-cyan-500/20 to-blue-600/10 border-cyan-500/30 hover:border-cyan-400/50',
    rainbow: 'from-purple-500/20 to-pink-600/10 border-purple-500/30 hover:border-purple-400/50',
    magenta: 'from-pink-500/20 to-rose-600/10 border-pink-500/30 hover:border-pink-400/50',
    emerald: 'from-emerald-500/20 to-green-600/10 border-emerald-500/30 hover:border-emerald-400/50',
  };

  const accentColors = {
    gold: 'text-amber-400',
    cyan: 'text-cyan-400',
    rainbow: 'text-purple-400',
    magenta: 'text-pink-400',
    emerald: 'text-emerald-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      onClick={onPlay}
      className={cn(
        'group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer',
        'bg-gradient-to-r border-2 transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]',
        themeColors[game.theme]
      )}
    >
      {/* Rank badge - only for top 3 */}
      {rank <= 3 && (
        <div className={cn(
          'absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center',
          'text-[10px] font-black border-2 border-black shadow-lg',
          rank === 1 && 'bg-amber-400 text-black',
          rank === 2 && 'bg-slate-300 text-black',
          rank === 3 && 'bg-amber-600 text-white'
        )}>
          {rank}
        </div>
      )}

      {/* Game icon */}
      <div className={cn(
        'w-14 h-14 rounded-xl flex items-center justify-center text-3xl',
        'bg-white/10 border border-white/10',
        'group-hover:scale-110 transition-transform'
      )}>
        {game.icon}
      </div>

      {/* Game info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-base font-black text-white truncate">{game.name}</h3>
          {game.isHot && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-500/20 text-[10px] font-bold text-red-400">
              <FireIcon className="w-3 h-3" />
              HOT
            </span>
          )}
        </div>
        <p className="text-xs text-white/60 truncate mb-1">{game.shortDesc}</p>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-white/50">
            <span className={cn('font-bold', accentColors[game.theme])}>{game.maxWin}</span> max
          </span>
          <span className="text-white/50">
            <span className="font-semibold text-white/70">{playersNow.toLocaleString()}</span> playing
          </span>
        </div>
      </div>

      {/* Play button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        className={cn(
          'flex items-center gap-1 px-4 py-2.5 rounded-xl',
          'font-bold text-sm text-black',
          'bg-white hover:bg-white/90 shadow-lg',
          'transition-all'
        )}
      >
        <PlayIcon className="w-4 h-4" />
        Play
      </motion.button>

      {/* Subtle hover glow */}
      <div className={cn(
        'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
        'bg-gradient-to-r from-transparent via-white/5 to-transparent'
      )} />
    </motion.div>
  );
}

// Featured game hero card (for the top game)
function FeaturedGameCard({ game, onPlay }: { game: GameData; onPlay: () => void }) {
  const [jackpot, setJackpot] = useState(game.jackpot || 0);

  useEffect(() => {
    const interval = setInterval(() => {
      setJackpot(prev => prev + Math.random() * 0.01);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onPlay}
      className="relative overflow-hidden rounded-3xl cursor-pointer group"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/80 via-orange-900/60 to-yellow-900/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.3)_0%,_transparent_50%)]" />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-300/40"
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: i * 0.2 }}
            style={{ left: `${10 + i * 12}%`, top: `${60 + Math.random() * 30}%` }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Icon and title */}
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="text-5xl sm:text-6xl"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {game.icon}
            </motion.span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">{game.name}</h2>
                <span className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-red-500 text-[10px] font-black text-white animate-pulse">
                  <FireIcon className="w-3 h-3" />
                  #1 TODAY
                </span>
              </div>
              <p className="text-sm text-white/70">{game.shortDesc}</p>
            </div>
          </div>
        </div>

        {/* Jackpot */}
        <div className="mb-4 p-3 rounded-xl bg-black/30 backdrop-blur-sm border border-amber-400/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300/80 font-bold uppercase tracking-wider">💰 Live Jackpot</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300">{jackpot.toFixed(2)} SOL</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-lg font-black text-white">{game.maxWin}</p>
              <p className="text-[10px] text-white/50 uppercase">Max Win</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-lg font-black text-white">{game.minBet}</p>
              <p className="text-[10px] text-white/50 uppercase">Min Bet</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-lg font-black text-white">{(game.totalPlays / 1000).toFixed(0)}K</p>
              <p className="text-[10px] text-white/50 uppercase">Plays</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="w-full py-4 rounded-xl font-black text-lg text-black bg-white hover:bg-white/90 shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <PlayIcon className="w-5 h-5" />
          Play Now
          <span className="text-emerald-600 text-sm">FREE</span>
        </motion.button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-white/40">
          <span className="flex items-center gap-1">🔒 Provably Fair</span>
          <span className="flex items-center gap-1">⚡ Instant Payouts</span>
        </div>
      </div>
    </motion.div>
  );
}

export function GamesTab() {
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);

  const handlePlay = (game: GameData) => {
    setSelectedGame(game);
    // TODO: Open game modal
    console.log('Play:', game.name);
  };

  // Sort games - hot ones first, then by players
  const sortedGames = [...GAMES].sort((a, b) => {
    if (a.isHot && !b.isHot) return -1;
    if (!a.isHot && b.isHot) return 1;
    return b.playersOnline - a.playersOnline;
  });

  const featuredGame = sortedGames[0];
  const otherGames = sortedGames.slice(1);

  return (
    <div className="space-y-4 pb-4">
      {/* Header with live ticker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <LiveTicker />
        <TotalStats />
      </div>

      {/* Featured game */}
      <FeaturedGameCard game={featuredGame} onPlay={() => handlePlay(featuredGame)} />

      {/* Section header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">More Games</h3>
        <button className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors">
          View All
          <ChevronRightIcon className="w-3 h-3" />
        </button>
      </div>

      {/* Game feed */}
      <div className="space-y-3">
        {otherGames.map((game, index) => (
          <GameFeedCard
            key={game.id}
            game={game}
            rank={index + 2}
            onPlay={() => handlePlay(game)}
          />
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="pt-4 text-center">
        <p className="text-xs text-white/40">
          🎮 All games are provably fair • 18+ only • Play responsibly
        </p>
      </div>
    </div>
  );
}
