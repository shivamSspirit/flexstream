'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import {
  ArrowDown,
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Zap,
  ChevronDown,
  Keyboard,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useBestExecutionSwap, JitoPriority } from '@/hooks/useBestExecutionSwap';
import { toast } from 'sonner';

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

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Fetch balances
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

  // Debounced quote fetch
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

  // Calculate output
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

  // Current balance based on direction
  const activeBalance = swapDirection === 'buy' ? solBalance : tokenBalance;
  const activeSymbol = swapDirection === 'buy' ? 'SOL' : tokenSymbol;
  const outputSymbol = swapDirection === 'buy' ? tokenSymbol : 'SOL';

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 bg-[#0A0A0A] border-[0.5px] border-white/[0.08] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#121212] border border-white/[0.08] flex items-center justify-center">
                <span className="text-xs font-medium text-white/60 font-mono">
                  {tokenSymbol.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-sm font-medium text-white tracking-tight">
                  {tokenSymbol}
                </h2>
                {tokenName && (
                  <p className="text-[11px] text-white/40 truncate max-w-[180px]">
                    {tokenName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowKeyboardHints(!showKeyboardHints)}
              className={`p-1.5 rounded transition-colors ${
                showKeyboardHints ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
              }`}
              title="Keyboard shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>

          {/* Keyboard hints */}
          {showKeyboardHints && (
            <div className="mt-3 p-3 bg-[#121212] rounded border border-white/[0.06] text-[10px] text-white/40 font-mono space-y-1">
              <div className="flex justify-between"><span>B / S</span><span>Buy / Sell</span></div>
              <div className="flex justify-between"><span>1-4</span><span>Quick amounts</span></div>
              <div className="flex justify-between"><span>⌘+J</span><span>Toggle Jito</span></div>
              <div className="flex justify-between"><span>⌘+Enter</span><span>Execute</span></div>
            </div>
          )}
        </div>

        {/* Direction Toggle */}
        <div className="px-5 pt-4">
          <div className="flex gap-1 p-0.5 bg-[#0A0A0A] border border-white/[0.06] rounded">
            <button
              onClick={() => { setSwapDirection('buy'); setInputAmount(''); }}
              className={`flex-1 py-2 text-xs font-medium tracking-wide transition-all rounded-[3px] ${
                swapDirection === 'buy'
                  ? 'bg-[#E0FF62] text-[#050505]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => { setSwapDirection('sell'); setInputAmount(''); }}
              className={`flex-1 py-2 text-xs font-medium tracking-wide transition-all rounded-[3px] ${
                swapDirection === 'sell'
                  ? 'bg-white/90 text-[#050505]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              SELL
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="px-5 pt-4">
          <div className="relative">
            {/* Balance indicator */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/30 uppercase tracking-wider">You Pay</span>
              <button
                onClick={fetchBalances}
                disabled={loadingBalances}
                className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/60 transition-colors"
              >
                <span className="font-mono">
                  {loadingBalances ? '...' : formatNumber(activeBalance)} {activeSymbol}
                </span>
                <RefreshCw className={`w-3 h-3 ${loadingBalances ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Amount input */}
            <div className="relative bg-[#121212] border border-white/[0.08] rounded-lg p-4 focus-within:border-[#E0FF62]/50 transition-colors">
              <input
                ref={inputRef}
                type="number"
                placeholder="0.00"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                className="w-full bg-transparent text-2xl font-mono font-light text-white placeholder:text-white/20 outline-none"
                disabled={!connected}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-white/50">
                {activeSymbol}
              </div>
            </div>

            {/* Quick amount buttons */}
            <div className="flex gap-1.5 mt-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt.label}
                  onClick={() => handleQuickAmount(amt.value)}
                  disabled={!connected || activeBalance <= 0}
                  className={`flex-1 py-2 text-[11px] font-medium rounded transition-all border ${
                    amt.label === 'MAX'
                      ? swapDirection === 'buy'
                        ? 'bg-[#E0FF62]/10 border-[#E0FF62]/20 text-[#E0FF62] hover:bg-[#E0FF62]/20'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                      : 'bg-transparent border-white/[0.06] text-white/50 hover:text-white/80 hover:border-white/[0.12]'
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <span className="font-mono text-[9px] opacity-50 mr-1">{amt.key}</span>
                  {amt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Arrow Separator */}
        <div className="flex justify-center py-2">
          <div className="w-8 h-8 rounded-full bg-[#121212] border border-white/[0.06] flex items-center justify-center">
            <ArrowDown className="w-4 h-4 text-white/30" />
          </div>
        </div>

        {/* Output Section */}
        <div className="px-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">You Receive</span>
            {quote && (
              <span className={`text-[10px] font-mono ${
                quote.bestRoute === 'JUPITER' ? 'text-orange-400' : 'text-cyan-400'
              }`}>
                via {quote.bestRoute}
              </span>
            )}
          </div>

          <div className="bg-[#121212] border border-white/[0.08] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-2xl font-light text-white">
                {isLoadingQuote ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white/30" />
                ) : outputAmount !== null ? (
                  <span className={swapDirection === 'buy' ? 'text-[#E0FF62]' : 'text-white'}>
                    {formatNumber(outputAmount, 6)}
                  </span>
                ) : (
                  <span className="text-white/20">0.00</span>
                )}
              </div>
              <span className="text-sm font-mono text-white/50">{outputSymbol}</span>
            </div>
          </div>
        </div>

        {/* Quote Details */}
        {quote && inputAmount && (
          <div className="px-5 pt-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/30">Rate</span>
              <span className="font-mono text-white/60">
                1 {tokenSymbol} = {pricePerToken?.toFixed(9)} SOL
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-white/30">Impact</span>
              <span className={`font-mono ${
                priceImpact && priceImpact > 5 ? 'text-red-400' :
                priceImpact && priceImpact > 1 ? 'text-yellow-400' : 'text-white/60'
              }`}>
                {priceImpact?.toFixed(2)}%
              </span>
            </div>
            {quote.comparison.advantagePercent > 0 && (
              <div className="flex items-center justify-between text-[11px] mt-1.5">
                <span className="text-white/30">Savings</span>
                <span className="font-mono text-[#E0FF62]">
                  +{quote.comparison.advantagePercent.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Advanced Settings (Collapsible) */}
        <div className="px-5 pt-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-2 text-[11px] text-white/40 hover:text-white/60 transition-colors"
          >
            <span>Advanced Settings</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="pb-3 space-y-3 animate-vault-fade">
              {/* Jito Toggle */}
              <div className="flex items-center justify-between p-3 bg-[#121212] rounded border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <div>
                    <div className="text-[11px] text-white/80">Fast Mode</div>
                    <div className="text-[9px] text-white/30">MEV protection via Jito</div>
                  </div>
                </div>
                <button
                  onClick={() => setUseJito(!useJito)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    useJito ? 'bg-purple-500' : 'bg-white/10'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    useJito ? 'left-[18px]' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Priority Selector */}
              {useJito && (
                <div className="p-3 bg-[#121212] rounded border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-white/40">Priority</span>
                    <span className="text-[10px] font-mono text-white/30">
                      {(estimatedJitoTip / 1e9).toFixed(6)} SOL
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {(['NORMAL', 'HIGH', 'URGENT'] as JitoPriority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setJitoPriority(p)}
                        className={`flex-1 py-1.5 text-[10px] font-medium rounded transition-all ${
                          jitoPriority === p
                            ? p === 'URGENT'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : p === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 text-white/40 border border-white/[0.06]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-5 p-3 bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-400 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Execute Button */}
        <div className="p-5 pt-4">
          <button
            onClick={handleSwap}
            disabled={!canExecute}
            className={`w-full py-3.5 rounded text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              swapDirection === 'buy'
                ? 'bg-[#E0FF62] text-[#050505] hover:bg-[#d4f254] active:scale-[0.99]'
                : 'bg-white text-[#050505] hover:bg-white/90 active:scale-[0.99]'
            }`}
          >
            {!connected ? (
              'Connect Wallet'
            ) : isExecuting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {useJito ? 'Submitting Bundle...' : 'Confirming...'}
              </span>
            ) : isLoadingQuote ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching Quote...
              </span>
            ) : !inputAmount || parseFloat(inputAmount) <= 0 ? (
              'Enter Amount'
            ) : (
              <span className="flex items-center justify-center gap-2">
                {swapDirection === 'buy' ? 'Buy' : 'Sell'} {tokenSymbol}
                {useJito && <Zap className="w-3.5 h-3.5" />}
              </span>
            )}
          </button>

          {/* Execution hint */}
          {canExecute && (
            <div className="mt-2 text-center text-[10px] text-white/20 font-mono">
              ⌘+Enter to execute
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 pt-2 border-t border-white/[0.04]">
          <div className="flex items-center justify-center gap-3 text-[9px] text-white/20">
            <a
              href="https://meteora.ag"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/40 transition-colors flex items-center gap-1"
            >
              Meteora <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <span>+</span>
            <a
              href="https://jup.ag"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/40 transition-colors flex items-center gap-1"
            >
              Jupiter <ExternalLink className="w-2.5 h-2.5" />
            </a>
            {useJito && (
              <>
                <span>+</span>
                <a
                  href="https://jito.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white/40 transition-colors flex items-center gap-1"
                >
                  Jito <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </>
            )}
          </div>
          <div className="text-center text-[9px] text-white/15 mt-1 font-mono">
            DEVNET
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
