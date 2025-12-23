'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface TradingInterfaceProps {
  walletAddress?: string;
}

export function TradingInterface({ walletAddress }: TradingInterfaceProps) {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('SOL');
  const [isBuying, setIsBuying] = useState(true);
  const [tokens, setTokens] = useState<Array<{ symbol: string; name: string; price: number; change: number }>>([]);

  // TODO: Fetch real token prices from Jupiter API or similar
  // Example: useEffect(() => { fetchTokenPrices(); }, []);

  const handleTrade = () => {
    if (!amount || !walletAddress) {
      alert('Please enter an amount and ensure your wallet is connected');
      return;
    }
    
    // Mock trade execution
    alert(`Trade executed: ${isBuying ? 'Buy' : 'Sell'} ${amount} ${selectedToken}`);
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
                Trade tokens directly in FlexStream
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

          {/* Token Selection */}
          <div>
            <label className="text-white font-medium block mb-2">Select Token</label>
            <div className="grid grid-cols-2 gap-2">
              {tokens.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => setSelectedToken(token.symbol)}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedToken === token.symbol
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{token.symbol}</span>
                      <span className={`text-xs ${
                        token.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {token.change >= 0 ? '+' : ''}{token.change}%
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">${token.price}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-white font-medium block mb-2">Amount</label>
            <div className="flex items-center space-x-3">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <span className="text-gray-400 text-sm">{selectedToken}</span>
            </div>
          </div>

          {/* Wallet Status */}
          {walletAddress ? (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm">Wallet Connected</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
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
            disabled={!amount || !walletAddress}
            className={`w-full ${
              isBuying
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } text-white`}
          >
            {isBuying ? 'Buy' : 'Sell'} {amount || '0'} {selectedToken}
          </Button>
        </CardContent>
      </Card>

      {/* Market Overview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tokens.map((token) => (
              <div key={token.symbol} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{token.symbol[0]}</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">{token.symbol}</div>
                    <div className="text-gray-400 text-sm">{token.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">${token.price}</div>
                  <div className={`text-sm ${
                    token.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {token.change >= 0 ? '+' : ''}{token.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
