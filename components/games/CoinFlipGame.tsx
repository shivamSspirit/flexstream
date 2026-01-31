'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinFlipGameProps {
  onClose: () => void;
}

type CoinSide = 'heads' | 'tails';
type GameState = 'betting' | 'flipping' | 'result';

const BET_AMOUNTS = [0.01, 0.05, 0.1, 0.25, 0.5, 1];

export function CoinFlipGame({ onClose }: CoinFlipGameProps) {
  const [selectedSide, setSelectedSide] = useState<CoinSide | null>(null);
  const [betAmount, setBetAmount] = useState(0.1);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [result, setResult] = useState<CoinSide | null>(null);
  const [isWin, setIsWin] = useState(false);
  const [flipCount, setFlipCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [balance, setBalance] = useState(1.5); // Demo balance

  const handleFlip = () => {
    if (!selectedSide || gameState !== 'betting') return;

    setGameState('flipping');
    setFlipCount(prev => prev + 6 + Math.floor(Math.random() * 4)); // 6-10 flips

    // Determine result after animation
    setTimeout(() => {
      const coinResult: CoinSide = Math.random() > 0.5 ? 'heads' : 'tails';
      setResult(coinResult);
      const won = coinResult === selectedSide;
      setIsWin(won);
      setGameState('result');

      if (won) {
        setBalance(prev => prev + betAmount);
        setStreak(prev => prev + 1);
      } else {
        setBalance(prev => Math.max(0, prev - betAmount));
        setStreak(0);
      }
    }, 2000);
  };

  const resetGame = () => {
    setGameState('betting');
    setResult(null);
    setSelectedSide(null);
    setFlipCount(0);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-br from-amber-950 via-yellow-950 to-orange-950 overflow-hidden">
      {/* Animated gold particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/40 animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            COIN FLIP
          </h2>
          <p className="text-amber-400/80 text-xs sm:text-sm">Double or Nothing</p>
        </div>
        <div className="flex items-center gap-4">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30">
              <span className="text-amber-300 text-xs font-bold">{streak}</span>
              <span className="text-amber-400/70 text-[10px]">STREAK</span>
            </div>
          )}
          <div className="px-4 py-2 rounded-xl bg-black/30 border border-amber-400/20">
            <p className="text-[10px] text-amber-400/60 uppercase tracking-wider">Balance</p>
            <p className="text-lg font-black text-white">{balance.toFixed(2)} SOL</p>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        {/* Coin */}
        <div className="relative mb-8">
          {/* Glow effect */}
          <div className={cn(
            'absolute inset-0 rounded-full bg-amber-400/30 blur-3xl scale-150 transition-all duration-500',
            gameState === 'result' && isWin && 'bg-green-400/40 scale-[2]',
            gameState === 'result' && !isWin && 'bg-red-400/30 scale-125'
          )} />

          {/* Coin container */}
          <motion.div
            className="relative w-40 h-40 sm:w-56 sm:h-56"
            animate={gameState === 'flipping' ? {
              rotateY: [0, 360 * 8],
              scale: [1, 1.2, 1],
            } : {}}
            transition={{
              duration: 2,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
          >
            {/* Coin face */}
            <div className={cn(
              'absolute inset-0 rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500',
              'border-4 border-amber-200/50 shadow-2xl shadow-amber-500/50',
              'transition-all duration-300'
            )}>
              <div className="text-6xl sm:text-8xl">
                {gameState === 'result' ? (result === 'heads' ? '👑' : '🦅') : '🪙'}
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
          </motion.div>

          {/* Result text */}
          <AnimatePresence>
            {gameState === 'result' && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center"
              >
                <p className={cn(
                  'text-3xl sm:text-4xl font-black uppercase tracking-wider',
                  isWin ? 'text-green-400' : 'text-red-400'
                )}
                style={{
                  textShadow: isWin
                    ? '0 0 40px rgba(74, 222, 128, 0.6)'
                    : '0 0 40px rgba(248, 113, 113, 0.6)'
                }}>
                  {isWin ? 'YOU WIN!' : 'YOU LOSE'}
                </p>
                <p className="text-white/60 text-sm mt-1">
                  {result === 'heads' ? 'Heads' : 'Tails'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side Selection */}
        {gameState === 'betting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 sm:gap-6 mb-8"
          >
            <button
              onClick={() => setSelectedSide('heads')}
              className={cn(
                'group relative px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-bold text-lg transition-all duration-300',
                'border-2 overflow-hidden',
                selectedSide === 'heads'
                  ? 'bg-amber-500/30 border-amber-400 text-white scale-105'
                  : 'bg-black/20 border-white/10 text-white/70 hover:bg-amber-500/10 hover:border-amber-400/50 hover:text-white'
              )}
            >
              <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">👑</span>
                <span>HEADS</span>
              </span>
              {selectedSide === 'heads' && (
                <motion.div
                  layoutId="selection"
                  className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20"
                />
              )}
            </button>

            <button
              onClick={() => setSelectedSide('tails')}
              className={cn(
                'group relative px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-bold text-lg transition-all duration-300',
                'border-2 overflow-hidden',
                selectedSide === 'tails'
                  ? 'bg-amber-500/30 border-amber-400 text-white scale-105'
                  : 'bg-black/20 border-white/10 text-white/70 hover:bg-amber-500/10 hover:border-amber-400/50 hover:text-white'
              )}
            >
              <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">🦅</span>
                <span>TAILS</span>
              </span>
              {selectedSide === 'tails' && (
                <motion.div
                  layoutId="selection"
                  className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20"
                />
              )}
            </button>
          </motion.div>
        )}

        {/* Bet Amount Selection */}
        {gameState === 'betting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-md mb-6"
          >
            <p className="text-center text-white/60 text-sm mb-3 uppercase tracking-wider">Bet Amount</p>
            <div className="flex flex-wrap justify-center gap-2">
              {BET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={amount > balance}
                  className={cn(
                    'px-4 py-2 rounded-xl font-bold text-sm transition-all',
                    betAmount === amount
                      ? 'bg-amber-500 text-black scale-105'
                      : amount > balance
                      ? 'bg-white/5 text-white/20 cursor-not-allowed'
                      : 'bg-white/10 text-white/70 hover:bg-amber-500/20 hover:text-white'
                  )}
                >
                  {amount} SOL
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="w-full max-w-md">
          {gameState === 'betting' && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={handleFlip}
              disabled={!selectedSide || betAmount > balance}
              className={cn(
                'w-full py-5 rounded-2xl font-black text-xl uppercase tracking-wider transition-all duration-300',
                selectedSide && betAmount <= balance
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/50 active:scale-[0.98]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              )}
            >
              {!selectedSide ? 'Select a Side' : betAmount > balance ? 'Insufficient Balance' : `Flip for ${betAmount} SOL`}
            </motion.button>
          )}

          {gameState === 'flipping' && (
            <div className="text-center">
              <p className="text-white/80 text-lg font-medium animate-pulse">Flipping...</p>
            </div>
          )}

          {gameState === 'result' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <button
                onClick={resetGame}
                className="flex-1 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Play Again
              </button>
              <button
                onClick={onClose}
                className="px-6 py-4 rounded-2xl font-bold text-lg bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                Exit
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Win/Lose overlay effect */}
      <AnimatePresence>
        {gameState === 'result' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute inset-0 pointer-events-none',
              isWin
                ? 'bg-gradient-to-t from-green-500/20 via-transparent to-transparent'
                : 'bg-gradient-to-t from-red-500/20 via-transparent to-transparent'
            )}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
