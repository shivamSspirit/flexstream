'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useBestExecutionSwap, JitoPriority } from '@/hooks/useBestExecutionSwap';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════════
// SWAP MODAL — "The Strike Zone"
// Genius-level responsive design: Mobile-first, bulletproof across all devices
// ═══════════════════════════════════════════════════════════════════════════════

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenMint: string;
  tokenSymbol: string;
  tokenName?: string;
  poolAddress?: string;
  creatorWallet?: string;
}

const QUICK_AMOUNTS = [
  { label: '25%', value: 0.25, key: '1' },
  { label: '50%', value: 0.50, key: '2' },
  { label: '75%', value: 0.75, key: '3' },
  { label: 'MAX', value: 1.00, key: '4' },
];

export function SwapModal({
  isOpen,
  onClose,
  tokenMint,
  tokenSymbol,
  tokenName,
  poolAddress,
}: SwapModalProps) {
  const { publicKey, connected } = useWallet();
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputAmount, setInputAmount] = useState('');
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [swapDirection, setSwapDirection] = useState<'buy' | 'sell'>('buy');
  const [slippageBps] = useState(300);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);

  const {
    quote,
    isLoadingQuote,
    quoteError,
    isExecuting,
    executionResult,
    useJito,
    setUseJito,
    jitoPriority,
    setJitoPriority,
    estimatedJitoTip,
    getQuote,
    executeSwap,
    clearError,
  } = useBestExecutionSwap();

  const isLoading = isLoadingQuote || isExecuting;
  const error = quoteError || executionResult?.error || null;

  const connection = useMemo(() => new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  ), []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connected) return;

    setLoadingBalances(true);
    try {
      const solBal = await connection.getBalance(publicKey);
      setSolBalance(solBal / LAMPORTS_PER_SOL);

      if (tokenMint) {
        try {
          const mintPubkey = new PublicKey(tokenMint);
          const ata = await getAssociatedTokenAddress(mintPubkey, publicKey);
          const tokenAccount = await getAccount(connection, ata);
          setTokenBalance(Number(tokenAccount.amount) / 1e6);
        } catch {
          setTokenBalance(0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    } finally {
      setLoadingBalances(false);
    }
  }, [publicKey, connected, connection, tokenMint]);

  useEffect(() => {
    if (isOpen && connected) {
      fetchBalances();
    }
  }, [isOpen, connected, fetchBalances]);

  useEffect(() => {
    if (!isOpen || !connected || !publicKey || !inputAmount) return;

    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) return;

    const timer = setTimeout(() => {
      getQuote({
        tokenMint,
        poolAddress,
        amount,
        direction: swapDirection,
        slippageBps,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [isOpen, connected, publicKey, inputAmount, tokenMint, poolAddress, swapDirection, slippageBps, getQuote]);

  const outputAmount = useMemo(() => {
    if (!quote || !inputAmount) return null;
    const outAmount = BigInt(quote.bestQuote.amountOut);
    return Number(outAmount) / 1e9;
  }, [quote, inputAmount]);

  const pricePerToken = useMemo(() => {
    if (!quote) return null;
    return quote.bestQuote.price;
  }, [quote]);

  const priceImpact = useMemo(() => {
    if (!quote) return null;
    return quote.bestQuote.priceImpactBps / 100;
  }, [quote]);

  const activeBalance = swapDirection === 'buy' ? solBalance : tokenBalance;
  const activeSymbol = swapDirection === 'buy' ? 'SOL' : tokenSymbol;
  const outputSymbol = swapDirection === 'buy' ? tokenSymbol : 'SOL';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current && !e.metaKey && !e.ctrlKey) {
        return;
      }

      switch (e.key) {
        case 'b':
        case 'B':
          e.preventDefault();
          setSwapDirection('buy');
          setInputAmount('');
          break;
        case 's':
        case 'S':
          e.preventDefault();
          setSwapDirection('sell');
          setInputAmount('');
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            handleQuickAmount(QUICK_AMOUNTS[parseInt(e.key) - 1].value);
          }
          break;
        case 'Enter':
          if ((e.metaKey || e.ctrlKey) && canExecute) {
            e.preventDefault();
            handleSwap();
          }
          break;
        case 'j':
        case 'J':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setUseJito(!useJito);
          }
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, useJito, setUseJito, swapDirection, activeBalance]);

  const handleQuickAmount = (percent: number) => {
    if (activeBalance <= 0) return;

    if (swapDirection === 'buy') {
      const amount = Math.max(0, (solBalance - 0.01) * percent);
      setInputAmount(amount.toFixed(6));
    } else {
      const amount = tokenBalance * percent;
      setInputAmount(amount.toFixed(2));
    }
  };

  const canExecute = connected && publicKey && inputAmount && parseFloat(inputAmount) > 0 && !isLoading;

  const handleSwap = async () => {
    if (!canExecute) return;

    const amount = parseFloat(inputAmount);

    try {
      const result = await executeSwap({
        tokenMint,
        poolAddress,
        amount,
        direction: swapDirection,
        slippageBps,
        route: quote?.bestRoute,
      });

      if (result.success && result.signature) {
        const methodLabel = result.method === 'JITO_BUNDLE' ? 'via Jito' : '';
        toast.success(`${swapDirection === 'buy' ? 'Bought' : 'Sold'} ${tokenSymbol} ${methodLabel}`.trim(), {
          description: 'Transaction confirmed',
          action: {
            label: 'View',
            onClick: () => window.open(result.explorerUrl || `https://solscan.io/tx/${result.signature}?cluster=devnet`, '_blank')
          }
        });

        setInputAmount('');
        clearError();
        setTimeout(fetchBalances, 2000);
      } else if (result.error) {
        toast.error('Transaction failed', { description: result.error });
      }
    } catch (err) {
      toast.error('Transaction failed', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const handleClose = () => {
    setInputAmount('');
    setShowAdvanced(false);
    onClose();
  };

  const formatNumber = (num: number, decimals = 4) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
  };

  const isBuyMode = swapDirection === 'buy';
  const accentColor = isBuyMode ? '#E0FF62' : '#ff6b6b';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="p-0 border-0"
        style={{
          background: 'linear-gradient(180deg, #0c0c0c 0%, #080808 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════════════
            MOBILE DRAG HANDLE — Visual affordance for bottom sheet
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-white/15" />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            HEADER — Token Identity
            Tight padding on mobile (px-3), comfortable on tablet+ (px-5)
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="px-3 sm:px-5 pt-2 sm:pt-5 pb-2.5 sm:pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 pr-8">
              {/* Token Icon */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #121212 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <span className="text-xs sm:text-sm font-bold font-mono" style={{ color: accentColor }}>
                    {tokenSymbol.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-pulse"
                  style={{ background: '#10b981', border: '2px solid #0c0c0c' }}
                />
              </div>

              {/* Token Name */}
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-semibold text-white truncate">{tokenSymbol}</h2>
                {tokenName && (
                  <p className="text-[10px] sm:text-xs text-white/40 truncate">{tokenName}</p>
                )}
              </div>
            </div>

            {/* Keyboard hints - desktop only */}
            <button
              onClick={() => setShowKeyboardHints(!showKeyboardHints)}
              className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg transition-all mr-6"
              style={{
                background: showKeyboardHints ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                color: showKeyboardHints ? '#FAFAFA' : 'rgba(255,255,255,0.3)',
              }}
              title="Keyboard shortcuts"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5M3.75 6.75h16.5v10.5H3.75V6.75z" />
              </svg>
            </button>
          </div>

          {showKeyboardHints && (
            <div className="hidden sm:block mt-3 p-2.5 rounded-lg text-[9px] font-mono space-y-1 bg-black/40 border border-white/5">
              <div className="flex justify-between text-white/50">
                <span className="px-1 py-0.5 rounded bg-white/10">B</span>
                <span>/ </span>
                <span className="px-1 py-0.5 rounded bg-white/10">S</span>
                <span className="ml-auto">Buy / Sell</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span className="px-1 py-0.5 rounded bg-white/10">1-4</span>
                <span className="ml-auto">Quick amounts</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span className="px-1 py-0.5 rounded bg-white/10">⌘+↵</span>
                <span className="ml-auto">Execute</span>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            BUY / SELL TOGGLE
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="px-3 sm:px-5 pb-3 sm:pb-4">
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{
              background: '#0f0f0f',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <button
              onClick={() => { setSwapDirection('buy'); setInputAmount(''); }}
              className="flex-1 py-2.5 text-xs font-bold tracking-wide rounded-lg transition-all active:scale-[0.97]"
              style={{
                background: isBuyMode ? 'linear-gradient(135deg, #E0FF62 0%, #c8e650 100%)' : 'transparent',
                color: isBuyMode ? '#050505' : 'rgba(255, 255, 255, 0.4)',
                boxShadow: isBuyMode ? '0 2px 8px rgba(224, 255, 98, 0.3)' : 'none',
              }}
            >
              BUY
            </button>
            <button
              onClick={() => { setSwapDirection('sell'); setInputAmount(''); }}
              className="flex-1 py-2.5 text-xs font-bold tracking-wide rounded-lg transition-all active:scale-[0.97]"
              style={{
                background: !isBuyMode ? 'linear-gradient(135deg, #ff6b6b 0%, #e55555 100%)' : 'transparent',
                color: !isBuyMode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                boxShadow: !isBuyMode ? '0 2px 8px rgba(255, 107, 107, 0.3)' : 'none',
              }}
            >
              SELL
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            YOU PAY SECTION
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="px-3 sm:px-5 pb-2.5 sm:pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-medium text-white/35">
              You Pay
            </span>
            <button
              onClick={fetchBalances}
              disabled={loadingBalances}
              className="flex items-center gap-1.5 text-[10px] sm:text-xs text-white/50 hover:text-white/70 transition-all"
            >
              <span className="font-mono">{loadingBalances ? '...' : formatNumber(activeBalance)} {activeSymbol}</span>
              <svg className={`w-3 h-3 ${loadingBalances ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div
            className="rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #141414 0%, #101010 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center gap-2 p-3 sm:p-3.5">
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-lg sm:text-xl font-mono text-white placeholder:text-white/15 outline-none"
                disabled={!connected}
              />
              <div
                className="flex-shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  minWidth: '52px',
                }}
              >
                <span className="text-[11px] sm:text-xs font-mono font-medium text-white/60">
                  {activeSymbol}
                </span>
              </div>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-1.5 sm:gap-2 mt-2.5 sm:mt-3">
            {QUICK_AMOUNTS.map((amt) => {
              const isMax = amt.label === 'MAX';
              return (
                <button
                  key={amt.label}
                  onClick={() => handleQuickAmount(amt.value)}
                  disabled={!connected || activeBalance <= 0}
                  className="flex-1 py-2 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all disabled:opacity-30 active:scale-95"
                  style={{
                    background: isMax
                      ? (isBuyMode ? 'rgba(224, 255, 98, 0.12)' : 'rgba(255, 107, 107, 0.12)')
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isMax ? (isBuyMode ? 'rgba(224, 255, 98, 0.25)' : 'rgba(255, 107, 107, 0.25)') : 'rgba(255, 255, 255, 0.06)'}`,
                    color: isMax ? accentColor : 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {amt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            ARROW CONNECTOR
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex justify-center py-1.5 sm:py-2">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #181818 0%, #101010 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {isLoadingQuote ? (
              <svg className="w-3.5 h-3.5 animate-spin text-white/40" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            YOU RECEIVE SECTION
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="px-3 sm:px-5 pb-2.5 sm:pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-medium text-white/35">
              You Receive
            </span>
            {quote && (
              <span
                className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  color: quote.bestRoute === 'JUPITER' ? '#f97316' : '#06b6d4',
                  background: quote.bestRoute === 'JUPITER' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                }}
              >
                via {quote.bestRoute}
              </span>
            )}
          </div>

          <div
            className="rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #141414 0%, #101010 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center justify-between gap-2 p-3 sm:p-3.5">
              <div
                className="flex-1 min-w-0 font-mono text-lg sm:text-xl truncate"
                style={{ color: outputAmount !== null ? accentColor : 'rgba(255, 255, 255, 0.15)' }}
              >
                {isLoadingQuote ? '...' : outputAmount !== null ? formatNumber(outputAmount, 6) : '0.00'}
              </div>
              <div
                className="flex-shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  minWidth: '52px',
                }}
              >
                <span className="text-[11px] sm:text-xs font-mono font-medium text-white/60 truncate block max-w-[60px] sm:max-w-[80px]">
                  {outputSymbol}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            QUOTE DETAILS
            ═══════════════════════════════════════════════════════════════════════ */}
        {quote && inputAmount && (
          <div
            className="mx-3 sm:mx-5 mb-2.5 sm:mb-3 p-2.5 sm:p-3 rounded-xl space-y-1.5 sm:space-y-2"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <div className="flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-white/40">Rate</span>
              <span className="font-mono text-white/60 truncate ml-2">
                1 {tokenSymbol} = {pricePerToken?.toFixed(9)} SOL
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-white/40">Impact</span>
              <span
                className="font-mono px-1 py-0.5 rounded"
                style={{
                  color: priceImpact && priceImpact > 5 ? '#ef4444' : priceImpact && priceImpact > 1 ? '#fbbf24' : 'rgba(255, 255, 255, 0.6)',
                  background: priceImpact && priceImpact > 5 ? 'rgba(239, 68, 68, 0.1)' : priceImpact && priceImpact > 1 ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                }}
              >
                {priceImpact?.toFixed(2)}%
              </span>
            </div>
            {quote.comparison.advantagePercent > 0 && (
              <div className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className="text-white/40">Savings</span>
                <span className="font-mono px-1 py-0.5 rounded" style={{ color: '#E0FF62', background: 'rgba(224, 255, 98, 0.1)' }}>
                  +{quote.comparison.advantagePercent.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            ADVANCED SETTINGS
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="px-3 sm:px-5 pb-3 sm:pb-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-2 text-xs font-medium text-white/45 active:opacity-70 transition-colors"
          >
            <span>Advanced Settings</span>
            <svg className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAdvanced && (
            <div className="pt-2.5 space-y-2.5 sm:space-y-3">
              {/* Turbo Mode */}
              <div
                className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #141414 0%, #101010 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: useJito ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${useJito ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
                    }}
                  >
                    <svg className="w-4 h-4" style={{ color: useJito ? '#a855f7' : 'rgba(255,255,255,0.4)' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">Fast Mode</div>
                    <div className="text-[9px] sm:text-[10px] text-white/35">MEV protection</div>
                  </div>
                </div>
                <button
                  onClick={() => setUseJito(!useJito)}
                  className="relative w-10 h-6 rounded-full transition-all"
                  style={{
                    background: useJito ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md"
                    style={{ left: useJito ? 'calc(100% - 20px)' : '4px' }}
                  />
                </button>
              </div>

              {useJito && (
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, #141414 0%, #101010 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-medium text-white/50">Priority</span>
                    <span className="text-[10px] font-mono text-white/40">~{(estimatedJitoTip / 1e9).toFixed(6)} SOL</span>
                  </div>
                  <div className="flex gap-1.5">
                    {(['NORMAL', 'HIGH', 'URGENT'] as JitoPriority[]).map((p) => {
                      const isActive = jitoPriority === p;
                      const colors = { NORMAL: '#22c55e', HIGH: '#f97316', URGENT: '#ef4444' };
                      return (
                        <button
                          key={p}
                          onClick={() => setJitoPriority(p)}
                          className="flex-1 py-2 text-[9px] sm:text-[10px] font-semibold rounded-lg transition-all active:scale-95"
                          style={{
                            background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isActive ? colors[p] + '40' : 'rgba(255, 255, 255, 0.06)'}`,
                            color: isActive ? colors[p] : 'rgba(255, 255, 255, 0.4)',
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            ERROR DISPLAY
            ═══════════════════════════════════════════════════════════════════════ */}
        {error && (
          <div
            className="mx-3 sm:mx-5 mb-3 p-3 rounded-xl flex items-start gap-2.5"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-[10px] sm:text-xs text-red-300">{error}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            EXECUTE BUTTON
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="px-3 sm:px-5 pb-3 sm:pb-5">
          <button
            onClick={handleSwap}
            disabled={!canExecute}
            className="w-full py-3 sm:py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 active:scale-[0.98]"
            style={{
              background: !canExecute
                ? 'rgba(255, 255, 255, 0.08)'
                : isBuyMode
                  ? 'linear-gradient(135deg, #E0FF62 0%, #c8e650 100%)'
                  : 'linear-gradient(135deg, #ff6b6b 0%, #e55555 100%)',
              color: canExecute ? (isBuyMode ? '#050505' : '#FFFFFF') : 'rgba(255, 255, 255, 0.3)',
              boxShadow: canExecute
                ? (isBuyMode ? '0 4px 20px rgba(224, 255, 98, 0.35)' : '0 4px 20px rgba(255, 107, 107, 0.35)')
                : 'none',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              {!connected ? (
                'Connect Wallet'
              ) : isExecuting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {useJito ? 'Submitting...' : 'Confirming...'}
                </>
              ) : isLoadingQuote ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Getting Quote...
                </>
              ) : !inputAmount || parseFloat(inputAmount) <= 0 ? (
                'Enter Amount'
              ) : (
                <>
                  {isBuyMode ? 'Buy' : 'Sell'} {tokenSymbol}
                  {useJito && <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                </>
              )}
            </span>
          </button>

          {canExecute && (
            <div className="hidden sm:block mt-2 text-center text-[9px] font-mono text-white/25">
              Press ⌘+Enter to execute
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════════════════════════════════ */}
        <div
          className="px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-center gap-2 text-[8px] sm:text-[9px]"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            background: 'rgba(0, 0, 0, 0.2)',
            color: 'rgba(255, 255, 255, 0.25)',
          }}
        >
          <span>Powered by</span>
          <a href="https://meteora.ag" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">Meteora</a>
          <span className="text-white/15">+</span>
          <a href="https://jup.ag" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">Jupiter</a>
          <span
            className="ml-1.5 px-1 py-0.5 rounded font-mono text-[7px] sm:text-[8px]"
            style={{ background: 'rgba(224, 255, 98, 0.1)', color: '#E0FF62', border: '1px solid rgba(224, 255, 98, 0.15)' }}
          >
            DEVNET
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
