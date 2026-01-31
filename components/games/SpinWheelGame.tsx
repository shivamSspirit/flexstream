'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/solid';

interface SpinWheelGameProps {
  onClose: () => void;
}

type GameState = 'betting' | 'spinning' | 'result';

interface WheelSegment {
  multiplier: number;
  color: string;
  probability: number; // out of 100
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { multiplier: 0, color: '#374151', probability: 15 },
  { multiplier: 0.5, color: '#6366f1', probability: 20 },
  { multiplier: 1.5, color: '#8b5cf6', probability: 25 },
  { multiplier: 2, color: '#a855f7', probability: 18 },
  { multiplier: 3, color: '#d946ef', probability: 10 },
  { multiplier: 5, color: '#ec4899', probability: 6 },
  { multiplier: 10, color: '#f43f5e', probability: 4 },
  { multiplier: 100, color: '#fbbf24', probability: 2 },
];

const BET_AMOUNTS = [0.01, 0.05, 0.1, 0.25, 0.5, 1];

export function SpinWheelGame({ onClose }: SpinWheelGameProps) {
  const [betAmount, setBetAmount] = useState(0.1);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [balance, setBalance] = useState(1.0);
  const [lastWins, setLastWins] = useState<number[]>([2, 0.5, 1.5, 3, 0, 1.5, 2]);
  const wheelRef = useRef<HTMLDivElement>(null);

  const getResultSegment = (): WheelSegment => {
    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const segment of WHEEL_SEGMENTS) {
      cumulative += segment.probability;
      if (rand <= cumulative) {
        return segment;
      }
    }
    return WHEEL_SEGMENTS[0];
  };

  const handleSpin = () => {
    if (gameState !== 'betting' || betAmount > balance) return;

    setGameState('spinning');

    // Determine result
    const resultSegment = getResultSegment();
    setResult(resultSegment);

    // Calculate rotation to land on result
    const segmentIndex = WHEEL_SEGMENTS.indexOf(resultSegment);
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const targetAngle = segmentIndex * segmentAngle + segmentAngle / 2;

    // Add multiple full rotations + target angle
    // Subtract 90 because pointer is at top
    const newRotation = rotation + 360 * 5 + (360 - targetAngle) + 90;
    setRotation(newRotation);

    // Show result after spin
    setTimeout(() => {
      setGameState('result');

      const winAmount = betAmount * resultSegment.multiplier;
      if (resultSegment.multiplier > 0) {
        setBalance(prev => prev + winAmount - betAmount);
      } else {
        setBalance(prev => Math.max(0, prev - betAmount));
      }

      setLastWins(prev => [resultSegment.multiplier, ...prev.slice(0, 6)]);
    }, 5000);
  };

  const resetGame = () => {
    setGameState('betting');
    setResult(null);
  };

  const segmentAngle = 360 / WHEEL_SEGMENTS.length;

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-br from-violet-950 via-purple-950 to-fuchsia-950 overflow-hidden">
      {/* Animated rainbow background */}
      <div
        className="absolute inset-0 opacity-30 animate-rainbow-shift"
        style={{
          background: 'conic-gradient(from 0deg at 50% 50%, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #8800ff, #ff0088, #ff0000)',
        }}
      />

      {/* Sparkles */}
      {[...Array(20)].map((_, i) => (
        <SparklesIcon
          key={i}
          className="absolute w-4 h-4 text-yellow-300 animate-twinkle"
          style={{
            left: `${5 + Math.random() * 90}%`,
            top: `${5 + Math.random() * 90}%`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            FORTUNE WHEEL
          </h2>
          <p className="text-purple-300/80 text-xs sm:text-sm">Spin to win up to 100x!</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-black/30 border border-purple-400/20">
          <p className="text-[10px] text-purple-300/60 uppercase tracking-wider">Balance</p>
          <p className="text-lg font-black text-white">{balance.toFixed(2)} SOL</p>
        </div>
      </div>

      {/* Last Results */}
      <div className="relative z-10 px-4 sm:px-6 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-white/40 text-xs shrink-0">Recent:</span>
          {lastWins.map((win, i) => (
            <div
              key={i}
              className={cn(
                'px-2 py-1 rounded-lg text-xs font-bold shrink-0',
                win === 0 && 'bg-gray-600/50 text-gray-300',
                win > 0 && win < 2 && 'bg-purple-500/50 text-purple-200',
                win >= 2 && win < 5 && 'bg-pink-500/50 text-pink-200',
                win >= 5 && win < 10 && 'bg-rose-500/50 text-rose-200',
                win >= 10 && 'bg-amber-500/50 text-amber-200 animate-pulse',
              )}
            >
              {win}x
            </div>
          ))}
        </div>
      </div>

      {/* Wheel Area */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4">
        {/* Pointer */}
        <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 z-20">
          <div className="relative">
            <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[28px] border-l-transparent border-r-transparent border-t-white drop-shadow-2xl" />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg" />
          </div>
        </div>

        {/* Wheel Container */}
        <div className="relative">
          {/* Outer glow */}
          <div className="absolute inset-0 scale-110 rounded-full bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-amber-500/30 blur-3xl" />

          {/* Wheel */}
          <motion.div
            ref={wheelRef}
            className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-white/30 shadow-2xl"
            animate={{ rotate: rotation }}
            transition={{
              duration: 5,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{
              background: `conic-gradient(${WHEEL_SEGMENTS.map(
                (seg, i) => `${seg.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
              ).join(', ')})`,
            }}
          >
            {/* Segment labels */}
            {WHEEL_SEGMENTS.map((segment, i) => {
              const angle = i * segmentAngle + segmentAngle / 2 - 90;
              const radius = 90; // Distance from center

              return (
                <div
                  key={i}
                  className="absolute font-black text-white text-sm sm:text-lg"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `
                      translate(-50%, -50%)
                      rotate(${angle}deg)
                      translateY(-${radius}px)
                      rotate(${-angle}deg)
                    `,
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {segment.multiplier === 0 ? '💀' : `${segment.multiplier}x`}
                </div>
              );
            })}

            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-300 shadow-xl flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">🎡</span>
            </div>

            {/* Segment dividers */}
            {[...Array(WHEEL_SEGMENTS.length)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-white/40 origin-bottom"
                style={{ transform: `rotate(${i * segmentAngle}deg)` }}
              />
            ))}
          </motion.div>

          {/* Inner ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/20 pointer-events-none" />
        </div>

        {/* Result Overlay */}
        <AnimatePresence>
          {gameState === 'result' && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full"
            >
              <div className="text-center">
                <p className={cn(
                  'text-5xl sm:text-7xl font-black',
                  result.multiplier === 0 ? 'text-gray-400' : 'text-white'
                )}
                style={{
                  textShadow: result.multiplier > 0
                    ? `0 0 60px ${result.color}`
                    : 'none'
                }}>
                  {result.multiplier === 0 ? '💀' : `${result.multiplier}x`}
                </p>
                <p className={cn(
                  'text-xl sm:text-2xl font-bold mt-2',
                  result.multiplier === 0 ? 'text-gray-400' : 'text-green-400'
                )}>
                  {result.multiplier === 0
                    ? 'Better luck next time!'
                    : `+${(betAmount * result.multiplier - betAmount).toFixed(3)} SOL`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 px-4 sm:px-6 pb-6 space-y-4">
        {/* Bet Amount Selection */}
        {gameState === 'betting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105'
                      : amount > balance
                      ? 'bg-white/5 text-white/20 cursor-not-allowed'
                      : 'bg-white/10 text-white/70 hover:bg-purple-500/20 hover:text-white'
                  )}
                >
                  {amount} SOL
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        {gameState === 'betting' && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={handleSpin}
            disabled={betAmount > balance}
            className={cn(
              'w-full py-5 rounded-2xl font-black text-xl uppercase tracking-wider transition-all duration-300',
              betAmount <= balance
                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/50 active:scale-[0.98]'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            )}
          >
            {betAmount > balance ? 'Insufficient Balance' : `Spin for ${betAmount} SOL`}
          </motion.button>
        )}

        {gameState === 'spinning' && (
          <div className="text-center py-5">
            <p className="text-white text-xl font-bold animate-pulse">Spinning...</p>
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
              className="flex-1 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Spin Again
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
  );
}
