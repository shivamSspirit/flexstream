/**
 * Best Execution Trading Interface
 *
 * Advanced trading UI with:
 * - Intelligent routing (DBC vs Jupiter)
 * - Jito MEV protection
 * - Real-time quotes
 * - Execution analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useBestExecution } from '@/hooks/useBestExecution';
import { SwapDirection, ExecutionPriority, RoutingStrategy } from '@/lib/execution';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  BoltIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface BestExecutionTradingInterfaceProps {
  poolAddress?: string;
  tokenMint?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
}

export function BestExecutionTradingInterface({
  poolAddress,
  tokenMint,
  tokenSymbol = 'TOKEN',
  tokenDecimals = 9,
}: BestExecutionTradingInterfaceProps) {
  const { publicKey } = useWallet();

  const {
    // State
    quote,
    isLoadingQuote,
    quoteError,
    isExecuting,
    executionResult,
    routingPreference,
    useJito,
    priority,
    slippageBps,
    engineHealth,
    isReady,
    routeInfo,

    // Actions
    getQuote,
    executeSwap,
    compareRoutes,
    setRoutingPreference,
    setUseJito,
    setPriority,
    setSlippageBps,
  } = useBestExecution({
    tokenMint,
    poolAddress,
    tokenSymbol,
    autoRefreshQuotes: false, // Manual refresh for now
  });

  const [amount, setAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-fetch quote when amount changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0 && publicKey) {
      const timer = setTimeout(() => {
        getQuote({
          direction: isBuying ? SwapDirection.BUY : SwapDirection.SELL,
          amountIn: parseFloat(amount),
          tokenDecimals,
        });
      }, 500); // Debounce

      return () => clearTimeout(timer);
    }
  }, [amount, isBuying, publicKey, tokenDecimals, getQuote]);

  const handleTrade = async () => {
    if (!amount || !publicKey) {
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    await executeSwap({
      direction: isBuying ? SwapDirection.BUY : SwapDirection.SELL,
      amountIn: amountNum,
      tokenDecimals,
    });
  };

  return (
    <div className="space-y-4">
      {/* Main Trading Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-green to-accent-cyan rounded-lg flex items-center justify-center">
                <BoltIcon className="w-5 h-5 text-black" />
              </div>
              <div>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  Best Execution
                  <Badge variant="secondary" className="text-xs bg-accent-green/20 text-accent-green border-accent-green/30">
                    BETA
                  </Badge>
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  {routeInfo ? (
                    <span className="flex items-center gap-1">
                      <SparklesIcon className="w-3 h-3" />
                      Routing via {routeInfo.route} • ~{routeInfo.executionTimeMs}ms
                    </span>
                  ) : (
                    'Fastest execution + MEV protection'
                  )}
                </p>
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Advanced Settings Panel */}
          {showAdvanced && (
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-4 border border-gray-600">
              <h4 className="text-white text-sm font-semibold">Advanced Settings</h4>

              {/* Routing Preference */}
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-2">
                  Routing Strategy
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: RoutingStrategy.USER_PREFERENCE, label: 'Auto', desc: 'Best route' },
                    { value: RoutingStrategy.DIRECT_DBC, label: 'DBC', desc: 'Fastest' },
                    { value: RoutingStrategy.JUPITER, label: 'Jupiter', desc: 'Best price' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setRoutingPreference(option.value)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        routingPreference === option.value
                          ? 'border-accent-green bg-accent-green/10 text-white'
                          : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-sm font-semibold">{option.label}</div>
                      <div className="text-xs opacity-75">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Jito MEV Protection */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-accent-blue" />
                    Jito MEV Protection
                  </label>
                  <p className="text-gray-500 text-xs mt-1">
                    Private mempool + priority execution
                  </p>
                </div>
                <Switch
                  checked={useJito}
                  onCheckedChange={setUseJito}
                  className="data-[state=checked]:bg-accent-green"
                />
              </div>

              {/* Priority Level */}
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-2">
                  Priority Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: ExecutionPriority.LOW, label: 'Low', tip: '0.000005 SOL' },
                    { value: ExecutionPriority.NORMAL, label: 'Normal', tip: '0.00001 SOL' },
                    { value: ExecutionPriority.HIGH, label: 'High', tip: '0.00005 SOL' },
                    { value: ExecutionPriority.URGENT, label: 'Urgent', tip: '0.0001 SOL' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPriority(option.value)}
                      className={`p-2 rounded-lg border transition-all ${
                        priority === option.value
                          ? 'border-accent-green bg-accent-green/10 text-white'
                          : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-xs font-semibold">{option.label}</div>
                      <div className="text-[10px] opacity-75">{option.tip}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slippage */}
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-2">
                  Slippage Tolerance: {(slippageBps / 100).toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={slippageBps}
                  onChange={(e) => setSlippageBps(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.1%</span>
                  <span>10%</span>
                </div>
              </div>
            </div>
          )}

          {/* Buy/Sell Toggle */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setIsBuying(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isBuying
                  ? 'bg-gradient-to-r from-accent-green to-accent-cyan text-black'
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
                  ? 'bg-gradient-to-r from-accent-red to-accent-orange text-white'
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
              {isBuying ? 'You Pay (SOL)' : `You Sell (${tokenSymbol})`}
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step={isBuying ? '0.01' : '1'}
              min="0"
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-lg"
            />

            {/* Quote Display */}
            {quote && !quoteError && (
              <div className="mt-3 bg-gradient-to-br from-gray-700/80 to-gray-800/80 rounded-lg p-4 border border-accent-green/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">You Receive</span>
                  <Badge className="bg-accent-green/20 text-accent-green border-accent-green/30">
                    {routeInfo?.route}
                  </Badge>
                </div>

                <div className="text-white text-2xl font-bold mb-1">
                  {isBuying
                    ? (quote.amountOut.toNumber() / Math.pow(10, tokenDecimals)).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })
                    : (quote.amountOut.toNumber() / 1e9).toFixed(4)}
                  <span className="text-lg text-gray-400 ml-2">
                    {isBuying ? tokenSymbol : 'SOL'}
                  </span>
                </div>

                {/* Execution Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-600">
                  <div className="text-center">
                    <div className="text-gray-400 text-xs mb-1">Price Impact</div>
                    <div className={`text-sm font-semibold ${
                      routeInfo && routeInfo.priceImpactPercent < 1 ? 'text-green-400' :
                      routeInfo && routeInfo.priceImpactPercent < 5 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {routeInfo ? routeInfo.priceImpactPercent.toFixed(2) : '0.00'}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs mb-1 flex items-center justify-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      Speed
                    </div>
                    <div className="text-accent-green text-sm font-semibold">
                      ~{routeInfo?.executionTimeMs || 0}ms
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs mb-1 flex items-center justify-center gap-1">
                      <ShieldCheckIcon className="w-3 h-3" />
                      MEV
                    </div>
                    <div className={`text-sm font-semibold ${useJito ? 'text-accent-blue' : 'text-gray-500'}`}>
                      {useJito ? 'Protected' : 'Off'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quote Loading */}
            {isLoadingQuote && (
              <div className="mt-3 bg-gray-700 rounded-lg p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-green mx-auto"></div>
                <p className="text-gray-400 text-sm mt-2">Getting best quote...</p>
              </div>
            )}

            {/* Quote Error */}
            {quoteError && (
              <div className="mt-3 bg-red-900/20 border border-red-700 rounded-lg p-3">
                <p className="text-red-400 text-sm">{quoteError}</p>
              </div>
            )}
          </div>

          {/* Trade Button */}
          <Button
            onClick={handleTrade}
            disabled={!amount || !publicKey || isExecuting || !isReady || !quote}
            className={`w-full ${
              isBuying
                ? 'bg-gradient-to-r from-accent-green to-accent-cyan hover:from-accent-green/90 hover:to-accent-cyan/90 text-black'
                : 'bg-gradient-to-r from-accent-red to-accent-orange hover:from-accent-red/90 hover:to-accent-orange/90 text-white'
            } text-white font-bold py-3 disabled:opacity-50`}
          >
            {isExecuting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Executing...
              </span>
            ) : (
              `${isBuying ? 'Buy' : 'Sell'} ${tokenSymbol}`
            )}
          </Button>

          {/* Engine Health Status */}
          {engineHealth && !engineHealth.healthy && (
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
              <p className="text-yellow-400 text-sm font-medium">⚠️ Some components offline</p>
              <ul className="text-xs text-gray-400 mt-2 space-y-1">
                {!engineHealth.components.rpc && <li>• RPC connection</li>}
                {!engineHealth.components.jupiter && <li>• Jupiter routing</li>}
                {!engineHealth.components.dbc && <li>• DBC pools</li>}
                {!engineHealth.components.jito && <li>• Jito bundles</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Result */}
      {executionResult && executionResult.success && (
        <Card className="bg-green-900/20 border-green-700">
          <CardContent className="p-4">
            <p className="text-green-400 text-sm font-medium mb-2">✅ Trade Executed Successfully!</p>
            <a
              href={`https://solscan.io/tx/${executionResult.signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-cyan text-xs hover:underline"
            >
              View on Solscan →
            </a>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Execution Time:</span>
                <span className="text-white ml-1">{executionResult.executionTimeMs}ms</span>
              </div>
              {executionResult.jitoTip && (
                <div>
                  <span className="text-gray-400">Jito Tip:</span>
                  <span className="text-white ml-1">{(executionResult.jitoTip / 1e9).toFixed(6)} SOL</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BestExecutionTradingInterface;
