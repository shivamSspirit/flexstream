'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Token {
  id: string;
  symbol: string;
  displayName: string;
  imageUrl?: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  createdAt: string;
}

interface TokensTabProps {
  userId: string;
}

export function TokensTab({ userId }: TokensTabProps) {
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTokens() {
      try {
        const response = await fetch(`/api/tokens?userId=${userId}`);
        const data = await response.json();
        if (data.success) {
          setTokens(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchTokens();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-card-bg border border-white/10 rounded-xl p-4 animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl" />
              <div className="flex-1">
                <div className="h-5 w-24 bg-white/10 rounded mb-2" />
                <div className="h-4 w-32 bg-white/10 rounded" />
              </div>
              <div className="text-right">
                <div className="h-5 w-16 bg-white/10 rounded mb-2" />
                <div className="h-4 w-12 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-green/20 to-accent-cyan/20 flex items-center justify-center">
          <CurrencyDollarIcon className="w-10 h-10 text-accent-green" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Tokens Yet</h3>
        <p className="text-text-muted text-sm max-w-sm mx-auto">
          Tokens created by this user will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tokens.map((token) => (
        <button
          key={token.id}
          onClick={() => router.push(`/post/${token.id}`)}
          className="w-full bg-card-bg hover:bg-card-hover border border-white/10 hover:border-accent-green/30 rounded-xl p-4 transition-all group text-left"
        >
          <div className="flex items-center gap-4">
            {/* Token Image */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center shrink-0">
              {token.imageUrl ? (
                <img src={token.imageUrl} alt={token.symbol} className="w-full h-full object-cover" />
              ) : (
                <CurrencyDollarIcon className="w-6 h-6 text-black" />
              )}
            </div>

            {/* Token Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-white group-hover:text-accent-green transition-colors">
                  ${token.symbol}
                </span>
              </div>
              <p className="text-sm text-text-muted truncate">{token.displayName}</p>
            </div>

            {/* Price & Change */}
            <div className="text-right shrink-0">
              <p className="font-bold text-white">${token.price.toFixed(4)}</p>
              <div className={cn(
                'flex items-center justify-end gap-1 text-sm',
                token.priceChange24h >= 0 ? 'text-metric-green' : 'text-metric-red'
              )}>
                {token.priceChange24h >= 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4" />
                )}
                <span>{Math.abs(token.priceChange24h).toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-text-muted">
            <span>MCap: ${(token.marketCap / 1000).toFixed(1)}k</span>
            <span>Vol: ${(token.volume24h / 1000).toFixed(1)}k</span>
            <span>{token.holders} holders</span>
          </div>
        </button>
      ))}
    </div>
  );
}
