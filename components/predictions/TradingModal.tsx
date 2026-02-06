'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import {
  X,
  Loader2,
  Check,
  AlertCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useQuickPredict,
  isMarketTradeable,
  calculateEstimatedReturn,
} from '@/hooks/useUnifiedMarkets';
import type { UnifiedMarket, PredictionSide } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: UnifiedMarket | null;
  side: PredictionSide;
  onSuccess?: (txSignature: string) => void;
}

type TradeStep = 'amount' | 'confirm' | 'signing' | 'success' | 'error';

// Preset amounts
const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function TradingModal({
  isOpen,
  onClose,
  market,
  side,
  onSuccess,
}: TradingModalProps) {
  const { authenticated, login } = usePrivy();
  const { wallets } = useSolanaWallets();
  const { predict, isLoading, error, isSuccess, reset } = useQuickPredict();

  const [step, setStep] = useState<TradeStep>('amount');
  const [amount, setAmount] = useState<number>(10);
  const [txSignature, setTxSignature] = useState<string>('');

  const solanaWallet = wallets?.[0];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('amount');
      setAmount(10);
      setTxSignature('');
      reset();
    }
  }, [isOpen, reset]);

  // Handle successful trade
  useEffect(() => {
    if (isSuccess && txSignature) {
      setStep('success');
      onSuccess?.(txSignature);
    }
  }, [isSuccess, txSignature, onSuccess]);

  // Handle error
  useEffect(() => {
    if (error) {
      setStep('error');
    }
  }, [error]);

  if (!market) return null;

  const isTradeable = isMarketTradeable(market);
  const isYes = side === 'yes';
  const price = isYes ? market.yesPrice : market.noPrice;
  const returns = calculateEstimatedReturn(amount, side, market);

  // Handle trade execution
  const handleTrade = async () => {
    if (!authenticated) {
      login();
      return;
    }

    if (!solanaWallet) {
      setStep('error');
      return;
    }

    setStep('signing');

    try {
      const result = await predict(market, side, amount);
      setTxSignature(result.txSignature);
    } catch (err) {
      console.error('Trade failed:', err);
      setStep('error');
    }
  };

  // Handle close with cleanup
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-hidden"
          >
            <div
              className="rounded-t-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #151519 0%, #0C0C10 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      isYes
                        ? 'bg-[#00D4FF]/10 border border-[#00D4FF]/30'
                        : 'bg-[#FF2D92]/10 border border-[#FF2D92]/30'
                    )}
                  >
                    {isYes ? (
                      <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-[#FF2D92]" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Bet {isYes ? 'YES' : 'NO'}
                    </h2>
                    <p className="text-xs text-white/40">
                      {price}¢ per share → ${returns.multiplier.toFixed(1)}x potential
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Market Title */}
              <div className="px-5 py-3 border-b border-white/[0.04]">
                <p className="text-sm text-white/80 line-clamp-2">{market.title}</p>
              </div>

              {/* Content based on step */}
              <div className="px-5 py-4">
                {/* Step: Amount Selection */}
                {step === 'amount' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* Amount Display */}
                    <div className="text-center py-4">
                      <p className="text-xs text-white/40 mb-1">Bet Amount</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-black text-white">${amount}</span>
                        <span className="text-lg text-white/40">USDC</span>
                      </div>
                    </div>

                    {/* Preset Buttons */}
                    <div className="flex gap-2 justify-center">
                      {PRESET_AMOUNTS.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setAmount(preset)}
                          className={cn(
                            'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                            amount === preset
                              ? isYes
                                ? 'bg-[#00D4FF] text-black'
                                : 'bg-[#FF2D92] text-white'
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          )}
                        >
                          ${preset}
                        </button>
                      ))}
                    </div>

                    {/* Custom Amount Slider */}
                    <div className="px-2">
                      <input
                        type="range"
                        min={1}
                        max={500}
                        value={amount}
                        onChange={(e) => setAmount(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00D4FF]"
                        style={{
                          background: `linear-gradient(to right, ${isYes ? '#00D4FF' : '#FF2D92'} 0%, ${isYes ? '#00D4FF' : '#FF2D92'} ${(amount / 500) * 100}%, rgba(255,255,255,0.1) ${(amount / 500) * 100}%, rgba(255,255,255,0.1) 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-[10px] text-white/30 mt-1">
                        <span>$1</span>
                        <span>$500</span>
                      </div>
                    </div>

                    {/* Potential Return */}
                    <div
                      className={cn(
                        'rounded-xl p-4 border',
                        isYes
                          ? 'bg-[#00D4FF]/5 border-[#00D4FF]/20'
                          : 'bg-[#FF2D92]/5 border-[#FF2D92]/20'
                      )}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-white/50">If {isYes ? 'YES' : 'NO'} wins</span>
                        <span className={cn(
                          'text-xs font-bold',
                          isYes ? 'text-[#00D4FF]' : 'text-[#FF2D92]'
                        )}>
                          {returns.multiplier.toFixed(1)}x
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-white/60">You receive</span>
                        <span className="text-2xl font-black text-white">
                          ${returns.payout.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-white/30">Profit</span>
                        <span className="text-sm font-semibold text-emerald-400">
                          +${returns.profit.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Not Tradeable Warning */}
                    {!isTradeable && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-amber-400">
                          Demo mode - Trading not available for this market yet
                        </span>
                      </div>
                    )}

                    {/* Trade Button */}
                    <button
                      onClick={() => setStep('confirm')}
                      disabled={!isTradeable && authenticated}
                      className={cn(
                        'w-full py-4 rounded-2xl font-bold text-lg transition-all',
                        isYes
                          ? 'bg-gradient-to-r from-[#00D4FF] to-[#00A3FF] text-black hover:opacity-90'
                          : 'bg-gradient-to-r from-[#FF2D92] to-[#FF5C7C] text-white hover:opacity-90',
                        !isTradeable && authenticated && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {!authenticated ? (
                        <span className="flex items-center justify-center gap-2">
                          <Wallet className="w-5 h-5" />
                          Connect Wallet
                        </span>
                      ) : (
                        `Bet $${amount} on ${isYes ? 'YES' : 'NO'}`
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Step: Confirm */}
                {step === 'confirm' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="text-center py-4">
                      <h3 className="text-lg font-bold text-white mb-2">Confirm Your Prediction</h3>
                      <p className="text-sm text-white/50">
                        You're betting <span className="text-white font-semibold">${amount}</span> USDC on{' '}
                        <span className={isYes ? 'text-[#00D4FF]' : 'text-[#FF2D92]'}>
                          {isYes ? 'YES' : 'NO'}
                        </span>
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="bg-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Market</span>
                        <span className="text-white/80 text-right max-w-[60%] truncate">
                          {market.title}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Position</span>
                        <span className={isYes ? 'text-[#00D4FF]' : 'text-[#FF2D92]'}>
                          {isYes ? 'YES' : 'NO'} @ {price}¢
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Stake</span>
                        <span className="text-white">${amount} USDC</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-white/10 pt-3">
                        <span className="text-white/50">Max Payout</span>
                        <span className="text-emerald-400 font-bold">${returns.payout.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Wallet Info */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
                      <Wallet className="w-4 h-4 text-white/40" />
                      <span className="text-xs text-white/40 truncate">
                        {solanaWallet?.address
                          ? `${solanaWallet.address.slice(0, 6)}...${solanaWallet.address.slice(-4)}`
                          : 'No wallet connected'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep('amount')}
                        className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 font-semibold hover:bg-white/10 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleTrade}
                        className={cn(
                          'flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2',
                          isYes
                            ? 'bg-[#00D4FF] text-black'
                            : 'bg-[#FF2D92] text-white'
                        )}
                      >
                        <Zap className="w-4 h-4" />
                        Confirm
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step: Signing */}
                {step === 'signing' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-8 text-center"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Processing...</h3>
                    <p className="text-sm text-white/50">
                      Please sign the transaction in your wallet
                    </p>
                  </motion.div>
                )}

                {/* Step: Success */}
                {step === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
                    >
                      <Check className="w-8 h-8 text-emerald-400" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-white mb-2">Prediction Placed!</h3>
                    <p className="text-sm text-white/50 mb-4">
                      You bet ${amount} on {isYes ? 'YES' : 'NO'}
                    </p>

                    {txSignature && (
                      <a
                        href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#00D4FF] hover:underline"
                      >
                        View transaction
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <button
                      onClick={handleClose}
                      className="w-full mt-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/15 transition-colors"
                    >
                      Done
                    </button>
                  </motion.div>
                )}

                {/* Step: Error */}
                {step === 'error' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-8 text-center"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Trade Failed</h3>
                    <p className="text-sm text-white/50 mb-4">
                      {error?.message || 'Something went wrong. Please try again.'}
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={handleClose}
                        className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 font-semibold hover:bg-white/10 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          reset();
                          setStep('amount');
                        }}
                        className="flex-1 py-3 rounded-xl bg-[#00D4FF] text-black font-semibold hover:opacity-90 transition-opacity"
                      >
                        Try Again
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Safe area padding for mobile */}
              <div className="h-8 bg-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
