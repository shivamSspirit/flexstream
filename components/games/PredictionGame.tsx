'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';

interface PredictionGameProps {
  onClose: () => void;
}

type Prediction = 'up' | 'down';
type GameState = 'betting' | 'waiting' | 'result';

const BET_AMOUNTS = [0.05, 0.1, 0.25, 0.5, 1, 2];
const ROUND_DURATION = 60; // seconds

export function PredictionGame({ onClose }: PredictionGameProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [betAmount, setBetAmount] = useState(0.1);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [startPrice, setStartPrice] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [isWin, setIsWin] = useState(false);
  const [balance, setBalance] = useState(2.5);
  const [totalBets, setTotalBets] = useState({ up: 1247, down: 892 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate price movement
  useEffect(() => {
    // Initialize with a random SOL price around 150
    const basePrice = 150 + Math.random() * 10;
    setStartPrice(basePrice);
    setCurrentPrice(basePrice);
    setPriceHistory([basePrice]);
  }, []);

  // Price simulation during waiting period
  useEffect(() => {
    if (gameState !== 'waiting') return;

    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 2; // -1 to +1
        const newPrice = prev + change;
        setPriceHistory(h => [...h.slice(-59), newPrice]);
        return newPrice;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'waiting' || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      if (timeLeft === 1) {
        // Game ends
        const finalPrice = currentPrice;
        const wentUp = finalPrice > startPrice;
        const won = (prediction === 'up' && wentUp) || (prediction === 'down' && !wentUp);
        setIsWin(won);
        setGameState('result');

        if (won) {
          setBalance(prev => prev + betAmount * 0.95); // 1.95x payout
        } else {
          setBalance(prev => Math.max(0, prev - betAmount));
        }
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, gameState, currentPrice, startPrice, prediction, betAmount]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    if (priceHistory.length < 2) return;

    const minPrice = Math.min(...priceHistory) - 1;
    const maxPrice = Math.max(...priceHistory) + 1;
    const priceRange = maxPrice - minPrice;

    // Grid lines
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Price line
    ctx.beginPath();
    ctx.strokeStyle = currentPrice >= startPrice ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    priceHistory.forEach((price, i) => {
      const x = (i / (ROUND_DURATION - 1)) * width;
      const y = height - ((price - minPrice) / priceRange) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = currentPrice >= startPrice ? '#22c55e' : '#ef4444';
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Start price line
    const startY = height - ((startPrice - minPrice) / priceRange) * height;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.lineTo(width, startY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [priceHistory, startPrice, currentPrice]);

  const handlePlaceBet = () => {
    if (!prediction || gameState !== 'betting') return;

    setGameState('waiting');
    setTimeLeft(ROUND_DURATION);
    setStartPrice(currentPrice);
    setPriceHistory([currentPrice]);

    // Update pool
    if (prediction === 'up') {
      setTotalBets(prev => ({ ...prev, up: prev.up + 1 }));
    } else {
      setTotalBets(prev => ({ ...prev, down: prev.down + 1 }));
    }
  };

  const resetGame = () => {
    setGameState('betting');
    setPrediction(null);
    setTimeLeft(ROUND_DURATION);
  };

  const priceChange = currentPrice - startPrice;
  const priceChangePercent = startPrice > 0 ? (priceChange / startPrice) * 100 : 0;

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-950 overflow-hidden">
      {/* Grid background */}
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

      {/* Scan line effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-scan-line pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            PRICE ORACLE
          </h2>
          <p className="text-cyan-400/80 text-xs sm:text-sm">Predict SOL&apos;s next move</p>
        </div>
        <div className="flex items-center gap-4">
          {gameState === 'waiting' && (
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              timeLeft <= 10 ? 'bg-red-500/20 border border-red-400/30' : 'bg-cyan-500/20 border border-cyan-400/30'
            )}>
              <ClockIcon className={cn('w-5 h-5', timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400')} />
              <span className={cn('text-lg font-black', timeLeft <= 10 ? 'text-red-400' : 'text-white')}>
                {timeLeft}s
              </span>
            </div>
          )}
          <div className="px-4 py-2 rounded-xl bg-black/30 border border-cyan-400/20">
            <p className="text-[10px] text-cyan-400/60 uppercase tracking-wider">Balance</p>
            <p className="text-lg font-black text-white">{balance.toFixed(2)} SOL</p>
          </div>
        </div>
      </div>

      {/* Price Display */}
      <div className="relative z-10 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider">SOL/USD</p>
            <p className="text-3xl sm:text-4xl font-black text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              ${currentPrice.toFixed(2)}
            </p>
          </div>
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl',
            priceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          )}>
            {priceChange >= 0 ? (
              <ArrowTrendingUpIcon className="w-5 h-5" />
            ) : (
              <ArrowTrendingDownIcon className="w-5 h-5" />
            )}
            <span className="font-bold">
              {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="relative h-40 sm:h-56 rounded-xl bg-black/30 border border-cyan-400/20 overflow-hidden mb-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full h-full"
          />
          {/* Entry price marker */}
          {gameState !== 'betting' && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-white/40">
              Entry: ${startPrice.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Betting Pool Stats */}
      <div className="relative z-10 px-4 sm:px-6 mb-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-black/20 border border-white/5">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                <ArrowTrendingUpIcon className="w-3 h-3" /> UP
              </span>
              <span className="text-white/60 text-xs">{totalBets.up} bets</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                style={{ width: `${(totalBets.up / (totalBets.up + totalBets.down)) * 100}%` }}
              />
            </div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-red-400 text-xs font-bold flex items-center gap-1">
                <ArrowTrendingDownIcon className="w-3 h-3" /> DOWN
              </span>
              <span className="text-white/60 text-xs">{totalBets.down} bets</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all"
                style={{ width: `${(totalBets.down / (totalBets.up + totalBets.down)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 flex flex-col justify-end px-4 sm:px-6 pb-6 relative z-10">
        {/* Betting UI */}
        {gameState === 'betting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Prediction Selection */}
            <div className="flex gap-3">
              <button
                onClick={() => setPrediction('up')}
                className={cn(
                  'flex-1 py-5 rounded-2xl font-bold text-lg transition-all duration-300 border-2',
                  'flex items-center justify-center gap-3',
                  prediction === 'up'
                    ? 'bg-green-500/30 border-green-400 text-green-400 scale-[1.02]'
                    : 'bg-black/20 border-white/10 text-white/70 hover:bg-green-500/10 hover:border-green-400/50 hover:text-green-400'
                )}
              >
                <ArrowTrendingUpIcon className="w-6 h-6" />
                <span>LONG</span>
              </button>

              <button
                onClick={() => setPrediction('down')}
                className={cn(
                  'flex-1 py-5 rounded-2xl font-bold text-lg transition-all duration-300 border-2',
                  'flex items-center justify-center gap-3',
                  prediction === 'down'
                    ? 'bg-red-500/30 border-red-400 text-red-400 scale-[1.02]'
                    : 'bg-black/20 border-white/10 text-white/70 hover:bg-red-500/10 hover:border-red-400/50 hover:text-red-400'
                )}
              >
                <ArrowTrendingDownIcon className="w-6 h-6" />
                <span>SHORT</span>
              </button>
            </div>

            {/* Bet Amount */}
            <div>
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
                        ? 'bg-cyan-500 text-black scale-105'
                        : amount > balance
                        ? 'bg-white/5 text-white/20 cursor-not-allowed'
                        : 'bg-white/10 text-white/70 hover:bg-cyan-500/20 hover:text-white'
                    )}
                  >
                    {amount} SOL
                  </button>
                ))}
              </div>
            </div>

            {/* Place Bet Button */}
            <button
              onClick={handlePlaceBet}
              disabled={!prediction || betAmount > balance}
              className={cn(
                'w-full py-5 rounded-2xl font-black text-xl uppercase tracking-wider transition-all duration-300',
                prediction && betAmount <= balance
                  ? 'bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 text-black hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/50 active:scale-[0.98]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              )}
            >
              {!prediction ? 'Select a Direction' : betAmount > balance ? 'Insufficient Balance' : `Predict for ${betAmount} SOL`}
            </button>
          </motion.div>
        )}

        {/* Waiting State */}
        {gameState === 'waiting' && (
          <div className="text-center">
            <p className="text-white/60 text-sm mb-2">Your prediction</p>
            <div className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-lg',
              prediction === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            )}>
              {prediction === 'up' ? <ArrowTrendingUpIcon className="w-5 h-5" /> : <ArrowTrendingDownIcon className="w-5 h-5" />}
              {prediction === 'up' ? 'LONG' : 'SHORT'}
            </div>
          </div>
        )}

        {/* Result State */}
        {gameState === 'result' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center">
              <p className={cn(
                'text-4xl font-black uppercase tracking-wider mb-2',
                isWin ? 'text-green-400' : 'text-red-400'
              )}
              style={{
                textShadow: isWin
                  ? '0 0 40px rgba(74, 222, 128, 0.6)'
                  : '0 0 40px rgba(248, 113, 113, 0.6)'
              }}>
                {isWin ? 'YOU WIN!' : 'YOU LOSE'}
              </p>
              <p className="text-white/60">
                Price {priceChange >= 0 ? 'went up' : 'went down'} by {Math.abs(priceChangePercent).toFixed(2)}%
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetGame}
                className="flex-1 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-cyan-400 to-teal-500 text-black hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Play Again
              </button>
              <button
                onClick={onClose}
                className="px-6 py-4 rounded-2xl font-bold text-lg bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                Exit
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Result overlay */}
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
