'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  SignalIcon, 
  EyeIcon, 
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  GlobeAltIcon,
  ShareIcon,
  HeartIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { PumpFunLiveStream } from '@/types';

interface EnhancedLiveStreamCardProps {
  stream: PumpFunLiveStream;
  onWatchStream: (stream: PumpFunLiveStream) => void;
  onViewToken: (mint: string) => void;
}

export function EnhancedLiveStreamCard({ stream, onWatchStream, onViewToken }: EnhancedLiveStreamCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toLocaleString();
    }
  };

  const formatCurrency = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    } else {
      return `$${num.toFixed(0)}`;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return '$0.00';
    if (price < 0.000001) return `$${price.toExponential(2)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(4)}`;
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />;
    if (change < 0) return <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />;
    return null;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`${label} copied!`);
      setTimeout(() => setCopyMessage(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyMessage('Failed to copy');
      setTimeout(() => setCopyMessage(null), 2000);
    }
  };

  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/10 rounded-xl overflow-hidden">
      {/* Live Video Section */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        {/* Stream Thumbnail */}
        {stream.stream_info?.thumbnail_url ? (
          <img 
            src={stream.stream_info.thumbnail_url} 
            alt={stream.stream_info.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
              <SignalIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        
        {/* Live Badge */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-red-500 text-white px-2 py-1 text-xs font-bold">
            🔴 LIVE
          </Badge>
        </div>

        {/* Viewer Count */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center space-x-1">
            <EyeIcon className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">
              {formatNumber(stream.stream_info?.viewer_count || 0)}
            </span>
          </div>
        </div>
        
        {/* Market Cap */}
        <div className="absolute bottom-4 right-4">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center space-x-1">
            <ChartBarIcon className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">
              {formatCurrency(stream.token.market_cap || 0)}
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Token Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              {stream.token.image_uri && (
                <img 
                  src={stream.token.image_uri} 
                  alt={stream.token.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-white font-bold text-lg">
                  {stream.token.name} ({stream.token.symbol})
                </h3>
                <p className="text-gray-400 text-sm">
                  {stream.token.mint.substring(0, 8)}...{stream.token.mint.substring(stream.token.mint.length - 8)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-lg">
                {formatPrice(stream.token.price_usd || 0)}
              </div>
              <div className={`text-sm flex items-center justify-end space-x-1 ${getPriceChangeColor(stream.trading_activity?.price_change_24h || 0)}`}>
                {getPriceChangeIcon(stream.trading_activity?.price_change_24h || 0)}
                <span>
                  {stream.trading_activity?.price_change_24h ? 
                    `${stream.trading_activity.price_change_24h > 0 ? '+' : ''}${stream.trading_activity.price_change_24h.toFixed(2)}%` : 
                    '0.00%'
                  }
                </span>
              </div>
            </div>
          </div>
          
          {/* Streamer Info */}
          <div className="mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <span className="text-white font-medium">
                {stream.streamer.display_name || stream.streamer.wallet_address.substring(0, 8) + '...'}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">{formatNumber(stream.streamer.followers_count || 0)} followers</span>
              {stream.streamer.verified && (
                <Badge className="bg-blue-500 text-white px-1 py-0.5 text-xs">✓</Badge>
              )}
            </div>
            
            {/* Streamer Username/Address */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Streamer:</span>
              <a
                href={`https://pump.fun/profile/${stream.streamer.wallet_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm font-mono underline hover:no-underline transition-colors"
                title="View streamer profile on Pump.fun"
              >
                {stream.streamer.display_name ? 
                  `@${stream.streamer.display_name.replace(/\s+/g, '_').toLowerCase()}` : 
                  `@${stream.streamer.wallet_address.substring(0, 8)}...${stream.streamer.wallet_address.substring(stream.streamer.wallet_address.length - 8)}`
                }
              </a>
              <button
                onClick={() => copyToClipboard(
                  stream.streamer.display_name || stream.streamer.wallet_address, 
                  'Streamer info'
                )}
                className="text-gray-400 hover:text-white text-xs"
                title="Copy streamer info"
              >
                📋
              </button>
            </div>
            
            {/* Wallet Address */}
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-gray-400 text-sm">Wallet:</span>
              <a
                href={`https://pump.fun/profile/${stream.streamer.wallet_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 text-sm font-mono underline hover:no-underline transition-colors"
                title="View streamer profile on Pump.fun"
              >
                {stream.streamer.wallet_address.substring(0, 8)}...{stream.streamer.wallet_address.substring(stream.streamer.wallet_address.length - 8)}
              </a>
              <button
                onClick={() => copyToClipboard(stream.streamer.wallet_address, 'Wallet address')}
                className="text-gray-400 hover:text-white text-xs"
                title="Copy wallet address"
              >
                📋
              </button>
            </div>
          </div>
          
          {/* Stream Title */}
          <h4 className="text-white font-semibold mb-2">
            {stream.stream_info?.title || 'Live Trading Stream'}
          </h4>
          
          {/* Stream Description */}
          <p className="text-gray-300 text-sm mb-3 line-clamp-2">
            {stream.stream_info?.description || stream.token.description || 'Live trading stream'}
          </p>
          
          {/* Stream Status */}
          <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>Started {formatTimeAgo(stream.stream_info?.started_at || Date.now())}</span>
            </div>
            <div className="flex items-center space-x-1">
              <SignalIcon className="w-4 h-4" />
              <span>{stream.stream_info?.platform || 'Pump.fun'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FireIcon className="w-4 h-4" />
              <span>Risk: {stream.metadata?.risk_score || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Trading Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Market Cap */}
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-sm">Market Cap</span>
              <div className="flex items-center space-x-1">
                <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                {stream.token.enhanced_with_dexscreener && (
                  <span className="text-green-400 text-xs font-bold" title="Enhanced with DexScreener">
                    D
                  </span>
                )}
              </div>
            </div>
            <div className="text-white font-bold text-lg">
              {formatCurrency(stream.token.market_cap || 0)}
            </div>
            {stream.token.enhanced_with_dexscreener && (
              <div className="text-green-400 text-xs">✓ DexScreener</div>
            )}
          </div>

          {/* 24h Volume */}
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-sm">24h Volume</span>
              <div className="flex items-center space-x-1">
                <ChartBarIcon className="w-4 h-4 text-gray-400" />
                {stream.token.enhanced_with_dexscreener && (
                  <span className="text-green-400 text-xs font-bold" title="Enhanced with DexScreener">
                    D
                  </span>
                )}
              </div>
            </div>
            <div className="text-white font-bold text-lg">
              {formatCurrency(stream.token.volume_24h || stream.trading_activity?.total_volume_24h || 0)}
            </div>
            {stream.token.enhanced_with_dexscreener && (
              <div className="text-green-400 text-xs">✓ DexScreener</div>
            )}
          </div>

          {/* Holders */}
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-sm">Holders</span>
              <div className="flex items-center space-x-1">
                <UserGroupIcon className="w-4 h-4 text-gray-400" />
                {stream.token.enhanced_with_helius && (
                  <span className="text-blue-400 text-xs font-bold" title="Enhanced with Helius">
                    H
                  </span>
                )}
              </div>
            </div>
            <div className="text-white font-bold text-lg">
              {formatNumber(stream.token.holders_count || 0)}
            </div>
            {stream.token.enhanced_with_helius && (
              <div className="text-blue-400 text-xs">✓ Helius</div>
            )}
          </div>

          {/* 24h Trades */}
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-sm">24h Trades</span>
              <div className="flex items-center space-x-1">
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400" />
                {stream.token.enhanced_with_dexscreener && (
                  <span className="text-green-400 text-xs font-bold" title="Enhanced with DexScreener">
                    D
                  </span>
                )}
              </div>
            </div>
            <div className="text-white font-bold text-lg">
              {formatNumber(stream.token.trades_24h || stream.trading_activity?.trades_count_24h || 0)}
            </div>
            {stream.token.enhanced_with_dexscreener && (
              <div className="text-green-400 text-xs">✓ DexScreener</div>
            )}
          </div>
        </div>

        {/* Price Performance */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center">
            <div className="text-gray-400 text-xs mb-1">1h Change</div>
            <div className={`font-semibold ${getPriceChangeColor(stream.token.price_change_1h || stream.trading_activity?.price_change_1h || 0)}`}>
              {stream.token.price_change_1h || stream.trading_activity?.price_change_1h ? 
                `${(stream.token.price_change_1h || stream.trading_activity?.price_change_1h || 0) > 0 ? '+' : ''}${(stream.token.price_change_1h || stream.trading_activity?.price_change_1h || 0).toFixed(2)}%` : 
                '0.00%'
              }
            </div>
            {stream.token.enhanced_with_dexscreener && (
              <div className="text-green-400 text-xs">D</div>
            )}
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-xs mb-1">6h Change</div>
            <div className={`font-semibold ${getPriceChangeColor(stream.token.price_change_6h || stream.trading_activity?.price_change_6h || 0)}`}>
              {stream.token.price_change_6h || stream.trading_activity?.price_change_6h ? 
                `${(stream.token.price_change_6h || stream.trading_activity?.price_change_6h || 0) > 0 ? '+' : ''}${(stream.token.price_change_6h || stream.trading_activity?.price_change_6h || 0).toFixed(2)}%` : 
                '0.00%'
              }
            </div>
            {stream.token.enhanced_with_dexscreener && (
              <div className="text-green-400 text-xs">D</div>
            )}
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-xs mb-1">24h Change</div>
            <div className={`font-semibold ${getPriceChangeColor(stream.token.price_change_24h || stream.trading_activity?.price_change_24h || 0)}`}>
              {stream.token.price_change_24h || stream.trading_activity?.price_change_24h ? 
                `${(stream.token.price_change_24h || stream.trading_activity?.price_change_24h || 0) > 0 ? '+' : ''}${(stream.token.price_change_24h || stream.trading_activity?.price_change_24h || 0).toFixed(2)}%` : 
                '0.00%'
              }
            </div>
            {stream.token.enhanced_with_dexscreener && (
              <div className="text-green-400 text-xs">D</div>
            )}
          </div>
        </div>

        {/* Social Links */}
        {(stream.social_links?.twitter || stream.social_links?.telegram || stream.social_links?.website) && (
          <div className="mb-4">
            <div className="text-gray-400 text-sm mb-2">Social Links</div>
            <div className="flex items-center space-x-3">
              {stream.social_links?.twitter && (
                <a 
                  href={stream.social_links.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Twitter
                </a>
              )}
              {stream.social_links?.telegram && (
                <a 
                  href={stream.social_links.telegram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Telegram
                </a>
              )}
              {stream.social_links?.website && (
                <a 
                  href={stream.social_links.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Website
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button 
            onClick={() => onWatchStream(stream)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            <SignalIcon className="w-4 h-4 mr-2" />
            Watch Stream
          </Button>
          <Button 
            onClick={() => onViewToken(stream.token.mint)}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            <GlobeAltIcon className="w-4 h-4 mr-2" />
            View Token
          </Button>
        </div>

        {/* Toast Notification */}
        {copyMessage && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-10">
            {copyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}