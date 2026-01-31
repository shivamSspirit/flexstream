'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { GameData } from '@/components/explore/GamesTab';
import {
  PlayIcon,
  UsersIcon,
  TrophyIcon,
  BoltIcon,
  SparklesIcon,
  FireIcon,
} from '@heroicons/react/24/solid';

interface GameCardProps {
  game: GameData;
  isActive: boolean;
  onPlay: () => void;
}

// HOT Badge component
function HotBadge({ intensity }: { intensity: 'hot' | 'fire' | 'explosive' }) {
  const config = {
    hot: { bg: 'from-orange-500 to-red-500', text: 'HOT', icon: '🔥' },
    fire: { bg: 'from-red-500 to-pink-500', text: 'ON FIRE', icon: '🔥🔥' },
    explosive: { bg: 'from-yellow-400 to-red-500', text: 'EXPLOSIVE', icon: '💥' },
  };

  const { bg, text, icon } = config[intensity];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: [1, 1.1, 1], opacity: 1 }}
      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      className={cn(
        'absolute -top-2 -right-2 z-20 px-2 py-1 rounded-lg',
        'bg-gradient-to-r', bg,
        'text-white text-[10px] font-black uppercase tracking-wider',
        'shadow-lg shadow-red-500/50 border border-white/20'
      )}
    >
      <span className="flex items-center gap-1">
        <span>{icon}</span>
        <span>{text}</span>
      </span>
    </motion.div>
  );
}

// Live players pulse
function LivePlayersPulse({ count, isActive }: { count: number; isActive: boolean }) {
  const [displayCount, setDisplayCount] = useState(count);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setDisplayCount(prev => {
        const change = Math.floor(Math.random() * 10) - 3; // -3 to +7
        return Math.max(100, prev + change);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </div>
      <UsersIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white/70" />
      <motion.span
        key={displayCount}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-[10px] sm:text-xs font-bold text-white"
      >
        {displayCount.toLocaleString()}
      </motion.span>
      <span className="text-[10px] sm:text-xs text-white/50 hidden sm:inline">playing now</span>
    </div>
  );
}

// Jackpot display
function JackpotDisplay({ amount, isActive }: { amount: number; isActive: boolean }) {
  const [displayAmount, setDisplayAmount] = useState(amount);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setDisplayAmount(prev => prev + Math.random() * 0.001);
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/40 px-3 sm:px-4 py-2 sm:py-3">
      {/* Shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

      <div className="relative text-center">
        <p className="text-[8px] sm:text-[10px] text-amber-300/80 uppercase tracking-widest font-bold mb-0.5">
          💰 Current Jackpot
        </p>
        <p
          className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          {displayAmount.toFixed(3)} SOL
        </p>
      </div>
    </div>
  );
}

// Recent win notification
function RecentWinPopup({ username, amount }: { username: string; amount: number }) {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="absolute top-16 sm:top-20 right-2 sm:right-4 z-20"
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/90 backdrop-blur-sm text-black text-xs font-bold shadow-lg shadow-emerald-500/50">
        <span>🎉</span>
        <span>@{username} just won {amount.toFixed(2)} SOL!</span>
      </div>
    </motion.div>
  );
}

// Animated background components for each theme - MOBILE OPTIMIZED
function GoldBackground({ isActive }: { isActive: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-yellow-950 to-orange-950" />

      {/* Animated gold particles - fewer on mobile */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/60"
            animate={isActive ? {
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 0.8, 0.3],
            } : {}}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${50 + Math.random() * 40}%`,
            }}
          />
        ))}
      </div>

      {/* Central coin glow */}
      <div className="absolute top-1/3 sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-72 sm:h-72">
        <motion.div
          animate={isActive ? { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-gradient-radial from-amber-500/40 via-amber-600/20 to-transparent"
        />
      </div>

      {/* Spinning coin */}
      <div className="absolute top-1/3 sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={isActive ? { rotateY: [0, 360] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="text-5xl sm:text-7xl md:text-8xl"
          style={{
            filter: 'drop-shadow(0 0 40px rgba(251, 191, 36, 0.6))',
            transformStyle: 'preserve-3d',
          }}
        >
          🪙
        </motion.div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
}

function CyanBackground({ isActive }: { isActive: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(34, 211, 238, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Chart icon */}
      <div className="absolute top-1/3 sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={isActive ? { y: [0, -10, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-5xl sm:text-7xl md:text-8xl"
          style={{ filter: 'drop-shadow(0 0 40px rgba(34, 211, 238, 0.6))' }}
        >
          📈
        </motion.div>
      </div>

      {/* Pulse rings */}
      {isActive && [...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-1/3 sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/30"
          initial={{ width: 100, height: 100, opacity: 0.5 }}
          animate={{ width: 300, height: 300, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
        />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
}

function RainbowBackground({ isActive }: { isActive: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-purple-950 to-fuchsia-950" />

      {/* Rainbow overlay */}
      <motion.div
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 opacity-30"
        style={{
          background: 'conic-gradient(from 0deg at 50% 50%, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #8800ff, #ff0088, #ff0000)',
        }}
      />

      {/* Wheel */}
      <div className="absolute top-1/3 sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={isActive ? { rotate: [0, 360] } : {}}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="w-36 h-36 sm:w-52 sm:h-52 md:w-64 md:h-64 rounded-full border-4 border-white/20"
          style={{
            background: 'conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)',
          }}
        >
          {/* Segments */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-white/30 origin-bottom"
              style={{ transform: `rotate(${i * 45}deg)` }}
            />
          ))}
          {/* Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white shadow-xl flex items-center justify-center">
            <span className="text-xl sm:text-2xl">🎡</span>
          </div>
        </motion.div>
      </div>

      {/* Sparkles */}
      {isActive && [...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 text-yellow-300"
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
        >
          ✦
        </motion.div>
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}

function MagentaBackground({ isActive }: { isActive: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-pink-950 to-rose-950" />

      {/* Speed lines */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-pink-400 to-transparent"
            animate={isActive ? { x: ['-100%', '100%'] } : {}}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'linear',
            }}
            style={{
              top: `${5 + i * 6}%`,
              width: '200%',
              left: '-100%',
              opacity: 0.3 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      {/* Racing car */}
      <div className="absolute top-1/3 sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={isActive ? { x: [-5, 5, -5] } : {}}
          transition={{ duration: 0.3, repeat: Infinity }}
          className="text-5xl sm:text-7xl md:text-8xl"
          style={{ filter: 'drop-shadow(0 0 40px rgba(236, 72, 153, 0.8))' }}
        >
          🏎️
        </motion.div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
}

function EmeraldBackground({ isActive }: { isActive: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950 to-green-950" />

      {/* Dice */}
      <div className="absolute top-1/3 sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={isActive ? {
            rotateX: [0, 360],
            rotateY: [0, 180],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-5xl sm:text-7xl md:text-8xl"
          style={{
            filter: 'drop-shadow(0 0 40px rgba(52, 211, 153, 0.6))',
            transformStyle: 'preserve-3d',
          }}
        >
          🎲
        </motion.div>
      </div>

      {/* Floating orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-emerald-500/10 blur-3xl"
          animate={isActive ? {
            y: [0, -20, 0],
            x: [0, 10, 0],
          } : {}}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
          }}
          style={{
            left: `${20 + i * 15}%`,
            top: `${20 + (i % 2) * 40}%`,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
}

const THEME_BACKGROUNDS: Record<GameData['theme'], React.FC<{ isActive: boolean }>> = {
  gold: GoldBackground,
  cyan: CyanBackground,
  rainbow: RainbowBackground,
  magenta: MagentaBackground,
  emerald: EmeraldBackground,
};

const CATEGORY_CONFIG = {
  luck: { icon: SparklesIcon, label: 'Luck', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-400/30' },
  prediction: { icon: TrophyIcon, label: 'Prediction', color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-400/30' },
  skill: { icon: BoltIcon, label: 'Skill', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-400/30' },
  pvp: { icon: FireIcon, label: 'PvP', color: 'text-pink-400', bg: 'bg-pink-500/20 border-pink-400/30' },
};

export function GameCard({ game, isActive, onPlay }: GameCardProps) {
  const [showRecentWin, setShowRecentWin] = useState(false);
  const Background = THEME_BACKGROUNDS[game.theme];
  const categoryConfig = CATEGORY_CONFIG[game.category];
  const CategoryIcon = categoryConfig.icon;

  // Determine if game is "hot"
  const isHot = game.playersOnline > 1000;
  const isFire = game.playersOnline > 1500;

  // Simulate recent wins
  useEffect(() => {
    if (!isActive) return;

    const showWin = () => {
      setShowRecentWin(true);
      setTimeout(() => setShowRecentWin(false), 3000);
    };

    const interval = setInterval(showWin, 8000 + Math.random() * 7000);
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div
      className="relative h-full w-full cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl"
      onClick={onPlay}
    >
      {/* Animated Background */}
      <Background isActive={isActive} />

      {/* HOT Badge */}
      {isHot && <HotBadge intensity={isFire ? 'fire' : 'hot'} />}

      {/* Recent Win Popup */}
      {showRecentWin && (
        <RecentWinPopup
          username={['sol_whale', 'degen_king', 'moon_boy'][Math.floor(Math.random() * 3)]}
          amount={Math.random() * 5}
        />
      )}

      {/* Content Overlay - MOBILE FIRST */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 md:p-8">
        {/* Top Section */}
        <div className="flex items-start justify-between gap-2">
          {/* Category Badge */}
          <div className={cn(
            'flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border backdrop-blur-sm',
            categoryConfig.bg,
            categoryConfig.color
          )}>
            <CategoryIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{categoryConfig.label}</span>
          </div>

          {/* Live players */}
          <LivePlayersPulse count={game.playersOnline} isActive={isActive} />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Section - Game Info & Play Button */}
        <div className="space-y-3 sm:space-y-4">
          {/* Jackpot (for certain games) */}
          {(game.id === 'spin-wheel' || game.id === 'coin-flip') && (
            <JackpotDisplay amount={parseFloat((Math.random() * 50 + 10).toFixed(3))} isActive={isActive} />
          )}

          {/* Recent wins indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold">
                {Math.floor(Math.random() * 50 + 20)} wins in last hour
              </span>
            </div>
          </div>

          {/* Game Title & Description */}
          <div className="space-y-1">
            <h2
              className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              {game.name}
            </h2>
            <p className="text-white/70 text-sm sm:text-base">{game.shortDesc}</p>
          </div>

          {/* Stats Row - MOBILE OPTIMIZED */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-black text-white">{game.maxWin}</p>
              <p className="text-[8px] sm:text-[10px] text-white/50 uppercase tracking-wider">Max Win</p>
            </div>
            <div className="w-px h-8 sm:h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-black text-white">{game.minBet}</p>
              <p className="text-[8px] sm:text-[10px] text-white/50 uppercase tracking-wider">Min Bet</p>
            </div>
            <div className="w-px h-8 sm:h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-black text-white">{(game.totalPlays / 1000).toFixed(0)}K</p>
              <p className="text-[8px] sm:text-[10px] text-white/50 uppercase tracking-wider">Plays</p>
            </div>
          </div>

          {/* Play Button - HUGE AND IRRESISTIBLE */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'group relative w-full py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl',
              'font-black text-base sm:text-lg md:text-xl uppercase tracking-wider',
              'bg-white text-black overflow-hidden',
              'shadow-2xl shadow-white/30',
              'transition-all duration-300'
            )}
          >
            {/* Animated gradient shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />

            {/* Pulse effect when active */}
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-green-400/20"
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            <span className="relative flex items-center justify-center gap-2 sm:gap-3">
              <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              <span>Play Now</span>
              <span className="text-green-600 text-sm hidden sm:inline">FREE</span>
            </span>
          </motion.button>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-white/40">
            <span className="flex items-center gap-1">
              <span>🔒</span> Provably Fair
            </span>
            <span className="flex items-center gap-1">
              <span>⚡</span> Instant Payouts
            </span>
          </div>
        </div>
      </div>

      {/* Edge glow when active */}
      {isActive && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            'absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none',
            'ring-2 sm:ring-4 ring-inset',
            game.theme === 'gold' && 'ring-amber-400/50',
            game.theme === 'cyan' && 'ring-cyan-400/50',
            game.theme === 'rainbow' && 'ring-purple-400/50',
            game.theme === 'magenta' && 'ring-pink-400/50',
            game.theme === 'emerald' && 'ring-emerald-400/50',
          )}
        />
      )}
    </div>
  );
}
