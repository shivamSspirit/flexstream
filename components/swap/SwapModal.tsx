'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ArrowDown, AlertTriangle, Info, Loader2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useJupiterSwap } from '@/hooks/useJupiterSwap';
import { useTokenShield } from '@/hooks/useTokenShield';
import { toast } from 'sonner';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenMint: string;
  tokenSymbol: string;
  tokenName?: string;
  creatorWallet?: string;
}

// SOL mint address
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function SwapModal({
  isOpen,
  onClose,
  tokenMint,
  tokenSymbol,
  tokenName,
  creatorWallet
}: SwapModalProps) {
  const { publicKey, connected } = useWallet();
  const [solAmount, setSolAmount] = useState('');
  const [solBalance, setSolBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const { loading, quote, error, getQuote, executeSwap, reset } = useJupiterSwap();
  const { shieldData, loading: loadingShield, checkShield, getRiskLevel } = useTokenShield();

  // Fetch SOL balance
  useEffect(() => {
    if (!publicKey || !connected) return;

    const fetchBalance = async () => {
      setLoadingBalance(true);
      try {
        // Use Jupiter mainnet RPC for swaps
        const connection = new Connection(
          process.env.NEXT_PUBLIC_JUPITER_RPC_URL || 'https://api.mainnet-beta.solana.com'
        );
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [publicKey, connected]);

  // Check token risks when modal opens
  useEffect(() => {
    if (isOpen && tokenMint) {
      checkShield(tokenMint);
    }
  }, [isOpen, tokenMint, checkShield]);

  // Fetch quote when amount changes (debounced)
  useEffect(() => {
    if (!solAmount || !publicKey || !connected) {
      return;
    }

    const amount = parseFloat(solAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      getQuote({
        inputMint: SOL_MINT,
        outputMint: tokenMint,
        amount: Math.floor(amount * LAMPORTS_PER_SOL)
      });
    }, 800); // Debounce for free tier rate limiting

    return () => clearTimeout(timeoutId);
  }, [solAmount, publicKey, connected, tokenMint, getQuote]);

  // Calculate values for display
  const outputAmount = useMemo(() => {
    if (!quote) return '0';
    return (parseFloat(quote.outAmount) / LAMPORTS_PER_SOL).toFixed(6);
  }, [quote]);

  const pricePerToken = useMemo(() => {
    if (!quote || !solAmount) return '0';
    const input = parseFloat(solAmount);
    const output = parseFloat(outputAmount);
    if (output === 0) return '0';
    return (input / output).toFixed(9);
  }, [quote, solAmount, outputAmount]);

  const platformFee = useMemo(() => {
    if (!quote || !quote.feeBps) return '0';
    return (quote.feeBps / 100).toFixed(2);
  }, [quote]);

  const riskLevel = useMemo(() => {
    return getRiskLevel(tokenMint);
  }, [tokenMint, getRiskLevel]);

  const riskColor = {
    safe: 'bg-green-500/20 text-green-500 border-green-500/50',
    low: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
    medium: 'bg-orange-500/20 text-orange-500 border-orange-500/50',
    high: 'bg-red-500/20 text-red-500 border-red-500/50'
  };

  const handleSwap = async () => {
    if (!quote) {
      toast.error('No quote available. Please enter an amount.');
      return;
    }

    if (!connected) {
      toast.error('Please connect your wallet');
      return;
    }

    const result = await executeSwap(quote);

    if (result?.status === 'success') {
      // Reset form on success
      setSolAmount('');
      reset();

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    reset();
    setSolAmount('');
    onClose();
  };

  const handleMaxClick = () => {
    if (solBalance > 0) {
      // Leave some SOL for transaction fees (0.01 SOL)
      const maxAmount = Math.max(0, solBalance - 0.01);
      setSolAmount(maxAmount.toFixed(6));
    }
  };

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-black/95 border-purple-500/30 backdrop-blur-xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-black text-white text-center">
            Trade {tokenSymbol}
          </DialogTitle>
          <DialogDescription className="text-white/60 text-center text-sm">
            {tokenName || tokenSymbol} • Powered by Jupiter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Risk Warning */}
          {shieldData && riskLevel !== 'safe' && (
            <div className={`p-3 rounded-lg border ${riskColor[riskLevel]}`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm mb-1">
                    {riskLevel === 'high' ? 'High Risk Token' :
                     riskLevel === 'medium' ? 'Medium Risk Token' : 'Low Risk Token'}
                  </p>
                  <ul className="text-xs space-y-0.5">
                    {shieldData?.tokens?.[tokenMint]?.warnings.map((warning, idx) => (
                      <li key={idx}>• {warning.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Buy/Sell Toggle */}
          <div className="relative mb-2 p-1 bg-black/60 rounded-full border border-white/10">
            <div className="grid grid-cols-2 gap-1 relative">
              <button
                onClick={() => setTradeType('buy')}
                className={`relative z-10 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                  tradeType === 'buy' ? 'text-white' : 'text-white/50 hover:text-white/70'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setTradeType('sell')}
                className={`relative z-10 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                  tradeType === 'sell' ? 'text-white' : 'text-white/50 hover:text-white/70'
                }`}
              >
                Sell
              </button>
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] ${
                  tradeType === 'buy'
                    ? 'bg-green-500 left-1'
                    : 'bg-red-500 right-1'
                } rounded-full transition-all duration-300 ease-out shadow-lg`}
              />
            </div>
          </div>

          {/* From (SOL) */}
          <div className="bg-black/40 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">You Pay</span>
              <span className="text-white/40 text-xs">
                Balance: {loadingBalance ? '...' : solBalance.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="0.00"
                value={solAmount}
                onChange={(e) => setSolAmount(e.target.value)}
                className="flex-1 text-2xl font-black bg-transparent border-0 text-white p-0 h-auto focus-visible:ring-0 placeholder:text-white/20"
                disabled={!connected}
              />
              <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-full border border-purple-500/30">
                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-black">
                  S
                </div>
                <span className="text-white text-sm font-bold">SOL</span>
              </div>
            </div>
            {/* Quick Select Buttons - Capsule Style */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setSolAmount('0.1')}
                disabled={!connected}
                className="flex-1 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 text-white/70 hover:text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                0.1 SOL
              </button>
              <button
                onClick={() => setSolAmount('0.5')}
                disabled={!connected}
                className="flex-1 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 text-white/70 hover:text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                0.5 SOL
              </button>
              <button
                onClick={() => setSolAmount('1')}
                disabled={!connected}
                className="flex-1 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 text-white/70 hover:text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                1 SOL
              </button>
              <button
                onClick={handleMaxClick}
                disabled={!connected || solBalance === 0}
                className="flex-1 px-4 py-2 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 hover:border-purple-500 text-purple-400 hover:text-purple-300 text-xs sm:text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <ArrowDown className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* To (Token) */}
          <div className="bg-black/40 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">You Receive</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-2xl font-black text-white">
                {loading ? '...' : outputAmount}
              </div>
              <div className="flex items-center gap-2 bg-pink-500/20 px-3 py-1.5 rounded-full border border-pink-500/30">
                <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white text-[8px] font-black">
                  {tokenSymbol.substring(0, 2)}
                </div>
                <span className="text-white text-sm font-bold">{tokenSymbol}</span>
              </div>
            </div>
          </div>

          {/* Quote Details */}
          {quote && !loading && (
            <div className="bg-app-bg/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Price per token</span>
                <span className="text-primary font-medium">{pricePerToken} SOL</span>
              </div>

              {quote.priceImpact !== undefined && (
                <div className="flex justify-between">
                  <span className="text-secondary">Price impact</span>
                  <span className={quote.priceImpact > 5 ? 'text-orange-400' : 'text-primary'}>
                    {quote.priceImpact.toFixed(2)}%
                  </span>
                </div>
              )}

              {quote.feeBps && quote.feeBps > 0 && (
                <div className="flex justify-between">
                  <span className="text-secondary">Platform fee</span>
                  <span className="text-primary">{platformFee}%</span>
                </div>
              )}

              {quote.isGasless && (
                <div className="flex items-center gap-1 text-green-400">
                  <Info className="h-3 w-3" />
                  <span className="text-xs">Gasless transaction (no SOL needed for fees)</span>
                </div>
              )}

              {quote.rateLimit && (
                <div className="flex items-center gap-1 text-secondary">
                  <Info className="h-3 w-3" />
                  <span className="text-xs">Free tier: {quote.rateLimit.rps} RPS</span>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!connected || !quote || loading || !solAmount}
            className="w-full py-4 rounded-xl font-black text-base bg-purple-500 hover:bg-purple-600 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
          >
            {!connected ? (
              <span className="flex items-center justify-center gap-2">
                Connect Wallet
              </span>
            ) : loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </span>
            ) : !solAmount ? (
              <span className="flex items-center justify-center gap-2">
                Enter Amount
              </span>
            ) : !quote ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Getting Quote...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Swap Now
              </span>
            )}
          </button>

          {/* Footer Info */}
          <div className="text-xs text-secondary text-center space-y-1">
            <p>
              Powered by{' '}
              <a
                href="https://jup.ag"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline inline-flex items-center gap-1"
              >
                Jupiter
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            {creatorWallet && quote?.feeBps && quote.feeBps > 0 && (
              <p>Platform fees support content creators</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
