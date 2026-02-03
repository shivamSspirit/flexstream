'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDBC } from '@/hooks/useDBC';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface TradingInterfaceProps {
  poolAddress?: string; // DBC pool address for the token
  tokenSymbol?: string; // Token symbol for display
}

export function TradingInterface({ poolAddress, tokenSymbol }: TradingInterfaceProps) {
  const { publicKey } = useWallet();
  const { isLoading, error, poolInfo, getPoolInfo, buyTokens, sellTokens } = useDBC();

  const [amount, setAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Fetch pool info on mount
  useEffect(() => {
    if (poolAddress) {
      getPoolInfo(poolAddress);
    }
  }, [poolAddress]);

  const handleTrade = async () => {
    if (!amount || !publicKey) {
      alert('Please enter an amount and ensure your wallet is connected');
      return;
    }

    if (!poolAddress) {
      alert('No pool address provided');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setTxSignature(null);

    try {
      let signature: string | null;

      if (isBuying) {
        // Buy tokens with SOL
        signature = await buyTokens(poolAddress, amountNum);
      } else {
        // Sell tokens for SOL
        signature = await sellTokens(poolAddress, amountNum);
      }

      if (signature) {
        setTxSignature(signature);
        setAmount('');
        alert(`Trade successful! Signature: ${signature.substring(0, 20)}...`);

        // Refresh pool info
        if (poolAddress) {
          setTimeout(() => getPoolInfo(poolAddress), 2000);
        }
      }
    } catch (err) {
      console.error('Trade error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Trading Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-xl">Quick Trade</CardTitle>
              <CardDescription className="text-gray-400">
                Trade tokens directly in Flexit
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Trade Type Toggle */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setIsBuying(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isBuying
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ArrowUpIcon className="w-4 h-4 inline mr-2" />
              Buy
            </button>
            <button
              onClick={() => setIsBuying(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isBuying
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ArrowDownIcon className="w-4 h-4 inline mr-2" />
              Sell
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-white font-medium block mb-2">
              {isBuying ? 'You Pay (SOL)' : `You Sell (${tokenSymbol || 'Tokens'})`}
            </label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step={isBuying ? "0.01" : "1"}
                min="0"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-16 text-lg"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                {isBuying ? 'SOL' : (tokenSymbol || 'TOKENS')}
              </span>
            </div>

            {/* Quote Display */}
            {poolInfo && amount && parseFloat(amount) > 0 && poolInfo.buyPrice > 0 && (
              <div className="mt-3 bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-xs">You Receive</span>
                  <span className="text-green-400 text-sm">≈</span>
                </div>
                <div className="flex items-center justify-between">
                  {isBuying ? (
                    <>
                      <span className="text-white text-xl font-bold">
                        {(parseFloat(amount) / poolInfo.buyPrice).toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                      <span className="text-gray-300 text-sm font-medium">{tokenSymbol || 'TOKENS'}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white text-xl font-bold">
                        {(parseFloat(amount) * poolInfo.sellPrice).toFixed(4)}
                      </span>
                      <span className="text-gray-300 text-sm font-medium">SOL</span>
                    </>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Rate: 1 {tokenSymbol} = {poolInfo.buyPrice.toFixed(9)} SOL
                </p>
              </div>
            )}

            {/* Quick Amount Buttons */}
            {poolInfo && poolInfo.liquidity > 0 && (
              <div className="mt-2">
                <p className="text-gray-400 text-xs mb-2">Quick amounts:</p>
                <div className="grid grid-cols-4 gap-2">
                  {(isBuying ? ['0.1', '0.5', '1.0', '5.0'] : ['100', '1000', '10000', '100000']).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-1.5 px-2 rounded transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No liquidity warning */}
            {poolInfo && poolInfo.liquidity === 0 && (
              <div className="mt-2 bg-yellow-900/20 border border-yellow-700 rounded-lg p-2">
                <p className="text-yellow-400 text-xs">
                  ⚠️ Pool has no liquidity. Trading not available yet.
                </p>
              </div>
            )}
          </div>

          {/* Pool Info Display */}
          {poolInfo && poolInfo.liquidity > 0 && (
            <div className="bg-gray-700 rounded-lg p-4 space-y-3">
              <h4 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4 text-green-400" />
                Pool Stats
              </h4>

              {/* Token Price */}
              <div className="bg-gray-800 rounded-lg p-3 border-l-4 border-green-500">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Token Price</span>
                  <div className="text-right">
                    <div className="text-white font-bold text-base">
                      {poolInfo.buyPrice.toFixed(9)} SOL
                    </div>
                    <div className="text-gray-500 text-xs">
                      per {tokenSymbol || 'token'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Cap</span>
                  <span className="text-white font-medium">{poolInfo.marketCap.toFixed(2)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Liquidity</span>
                  <span className="text-white font-medium">{poolInfo.liquidity.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Reserves</span>
                  <span className="text-white font-medium">{poolInfo.virtualBaseReserves.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Quote Reserves</span>
                  <span className="text-white font-medium">{poolInfo.virtualQuoteReserves.toFixed(4)} SOL</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Wallet Status */}
          {publicKey ? (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm">Wallet Connected</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
              </p>
            </div>
          ) : (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-red-400 text-sm">Wallet Not Connected</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Connect your wallet to start trading
              </p>
            </div>
          )}

          {/* Trade Button */}
          <Button
            onClick={handleTrade}
            disabled={!amount || !publicKey || isLoading}
            className={`w-full ${
              isBuying
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } text-white disabled:opacity-50`}
          >
            {isLoading ? 'Processing...' : `${isBuying ? 'Buy' : 'Sell'} ${tokenSymbol || 'Token'}`}
          </Button>

          {/* Transaction Signature */}
          {txSignature && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
              <p className="text-green-400 text-sm font-medium mb-1">Transaction Successful!</p>
              <a
                href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-xs hover:underline break-all"
              >
                View on Solscan
              </a>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
