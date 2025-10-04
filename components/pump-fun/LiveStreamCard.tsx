'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  PlayIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowTopRightOnSquareIcon,
  SignalIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { PumpFunLiveStream } from '@/types';

interface LiveStreamCardProps {
  stream: PumpFunLiveStream;
  onWatchStream?: (stream: PumpFunLiveStream) => void;
  onViewToken?: (mint: string) => void;
}

export function LiveStreamCard({ stream, onWatchStream, onViewToken }: LiveStreamCardProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return ArrowTrendingUpIcon;
    if (change < 0) return ArrowTrendingDownIcon;
    return null;
  };

  const PriceChangeIcon = getPriceChangeIcon(stream.trading_activity?.price_change_24h || 0);

  const copyContractAddress = async () => {
    try {
      await navigator.clipboard.writeText(stream.token.mint);
      setCopied(true);
      showToast('Contract address copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy contract address:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = stream.token.mint;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      showToast('Contract address copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card 
      className="bg-white/5 backdrop-blur-md border-white/10"
    >
      <CardContent className="p-6">
        {/* Token Image Header */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden border-4 border-white/20">
            {stream.token.image_uri && stream.token.image_uri !== '/placeholder-token.png' ? (
              <img
                src={stream.token.image_uri}
                alt={stream.token.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) nextElement.style.display = 'flex';
                }}
              />
            ) : null}
            <span className="text-white font-bold text-lg" style={{ display: stream.token.image_uri && stream.token.image_uri !== '/placeholder-token.png' ? 'none' : 'flex' }}>
              {stream.token.symbol?.substring(0, 2).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Token Name and Symbol */}
        <div className="text-center mb-4">
          <h2 className="text-white font-bold text-xl">{stream.token.name}</h2>
          <p className="text-gray-400 text-sm">${stream.token.symbol}</p>
          <p className="text-gray-500 text-xs font-mono">
            {stream.token.mint.substring(0, 8)}...{stream.token.mint.substring(-8)}
          </p>
        </div>

        {/* Header with streamer info and live indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={stream.streamer.avatar_url || '/default-avatar.png'}
                alt={stream.streamer.display_name}
                className="w-8 h-8 rounded-full border-2 border-purple-500/50"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900">
                <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-semibold text-sm">
                  {stream.streamer.display_name}
                </h3>
                {stream.streamer.verified && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    ✓
                  </Badge>
                )}
              </div>
              <p className="text-gray-400 text-xs">
                {stream.streamer.followers_count.toLocaleString()} followers
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 animate-pulse">
              <SignalIcon className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
            <div className="flex items-center text-gray-400 text-sm">
              <EyeIcon className="w-4 h-4 mr-1" />
              {formatViewerCount(stream.stream_info?.viewer_count || stream.streamer.followers_count || 0)}
            </div>
          </div>
        </div>

        {/* Price and Market Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center space-x-1 mb-1">
              {PriceChangeIcon && (
                <PriceChangeIcon className={`w-4 h-4 ${getPriceChangeColor(stream.trading_activity?.price_change_24h || 0)}`} />
              )}
              <span className={`font-semibold text-lg ${getPriceChangeColor(stream.trading_activity?.price_change_24h || 0)}`}>
                {(stream.trading_activity?.price_change_24h || 0) > 0 ? '+' : ''}
                {(stream.trading_activity?.price_change_24h || 0).toFixed(2)}%
              </span>
            </div>
            
            {/* Enhanced Market Cap Display */}
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-gray-400 text-sm">MC:</span>
                <span className="text-white font-semibold text-sm">
                  {formatNumber(stream.token.market_cap || stream.trading_activity?.market_cap || 0)}
                </span>
                {stream.token.enhanced_with_dexscreener && (
                  <span className="text-green-400 text-xs" title="Enhanced with DexScreener">✓</span>
                )}
                {stream.token.enhanced_with_helius && (
                  <span className="text-blue-400 text-xs" title="Enhanced with Helius">H</span>
                )}
              </div>
              
              {stream.token.fdv && stream.token.fdv > 0 && (
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-gray-400 text-xs">FDV:</span>
                  <span className="text-gray-300 text-xs">
                    {formatNumber(stream.token.fdv)}
                  </span>
                </div>
              )}
              
              {stream.token.price_usd && stream.token.price_usd > 0 && (
                <p className="text-gray-500 text-xs">
                  ${stream.token.price_usd.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stream Title */}
        {stream.stream_info?.title && (
          <div className="mb-4">
            <p className="text-gray-300 text-sm text-center line-clamp-2">
              {stream.stream_info.title}
            </p>
          </div>
        )}

        {/* Token Description */}
        {stream.token.description && (
          <div className="mb-4">
            <p className="text-gray-500 text-xs text-center line-clamp-2">
              {stream.token.description}
            </p>
          </div>
        )}

        {/* Trading stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-gray-400 text-xs mb-1">24h Volume</div>
            <div className="text-white font-semibold text-sm">
              {formatNumber(stream.token.volume_24h || stream.trading_activity?.total_volume_24h || 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-xs mb-1">Trades</div>
            <div className="text-white font-semibold text-sm">
              {(stream.token.trades_24h || stream.trading_activity?.trades_count_24h || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Additional stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-gray-400 text-xs mb-1">Holders</div>
            <div className="text-blue-400 font-semibold text-sm">
              {(stream.token.holders_count || 0).toLocaleString()}
            </div>
            {stream.token.enhanced_with_helius && (
              <div className="text-blue-300 text-xs">✓ Helius</div>
            )}
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-xs mb-1">Platform</div>
            <div className="text-white font-semibold text-sm">
              Pump.fun
            </div>
          </div>
        </div>

        {/* Enhanced DexScreener stats */}
        {stream.token.enhanced_with_dexscreener && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">Liquidity</div>
              <div className="text-white font-semibold text-sm">
                {formatNumber(stream.token.liquidity_usd || 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">DEX</div>
              <div className="text-white font-semibold text-sm capitalize">
                {stream.token.dex_info?.dex_id || 'Unknown'}
              </div>
            </div>
          </div>
        )}

        {/* Supply Information */}
        {((stream.token.circulating_supply && stream.token.circulating_supply > 0) || (stream.token.total_supply && stream.token.total_supply > 0)) && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {stream.token.circulating_supply && stream.token.circulating_supply > 0 && (
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-1">Circulating</div>
                <div className="text-white font-semibold text-sm">
                  {(stream.token.circulating_supply / 1000000).toFixed(1)}M
                </div>
              </div>
            )}
            {stream.token.total_supply > 0 && (
              <div className="text-center">
                <div className="text-gray-400 text-xs mb-1">Total Supply</div>
                <div className="text-white font-semibold text-sm">
                  {(stream.token.total_supply / 1000000).toFixed(1)}M
                </div>
              </div>
            )}
          </div>
        )}

        {/* Social links */}
        {(stream.social_links?.twitter || stream.social_links?.telegram || stream.social_links?.website) && (
          <div className="flex items-center space-x-2 mb-3">
            {stream.social_links?.twitter && (
              <a 
                href={stream.social_links.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 text-xs"
              >
                Twitter
              </a>
            )}
            {stream.social_links?.telegram && (
              <a 
                href={stream.social_links.telegram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 text-xs"
              >
                Telegram
              </a>
            )}
            {stream.social_links?.website && (
              <a 
                href={stream.social_links.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 text-xs"
              >
                Website
              </a>
            )}
          </div>
        )}

        {/* Contract Address */}
        <div className="mb-4">
          <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs mb-1">Contract Address</p>
              <p className="text-white text-sm font-mono truncate">
                {stream.token.mint}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`ml-2 border-white/20 text-white ${
                copied ? 'border-green-500/50 text-green-400' : ''
              }`}
              onClick={copyContractAddress}
            >
              {copied ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <DocumentDuplicateIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <Button
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            onClick={() => onWatchStream?.(stream)}
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            Watch Stream
          </Button>
          
          <Button
            variant="outline"
            className="border-white/20 text-white"
            onClick={() => onViewToken?.(stream.token.mint)}
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </Button>
          
          {stream.token.dex_info?.pair_url && (
            <Button
              variant="outline"
              className="border-blue-500/50 text-blue-400"
              onClick={() => stream.token.dex_info?.pair_url && window.open(stream.token.dex_info.pair_url, '_blank')}
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Stream thumbnail overlay */}
        {stream.stream_info?.thumbnail_url && (
          <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 pointer-events-none">
            <img
              src={stream.stream_info.thumbnail_url}
              alt="Stream thumbnail"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
