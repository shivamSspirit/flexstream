'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

interface TokensTabProps {
  searchQuery?: string;
}

type SortOption = 'newest' | 'volume' | 'price' | 'holders';

export function TokensTab({ searchQuery }: TokensTabProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['explore-tokens', sortBy, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        sort: sortBy,
        limit: '50',
      });
      if (searchQuery) params.set('q', searchQuery);

      const response = await fetch(`/api/tokens?${params}`);
      const data = await response.json();
      return data.success ? data.data : [];
    },
  });

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'newest', label: 'Newest' },
    { id: 'volume', label: 'Volume' },
    { id: 'price', label: 'Price' },
    { id: 'holders', label: 'Holders' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card-bg rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/10 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Sort Options */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {sortOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSortBy(option.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              sortBy === option.id
                ? 'bg-accent-purple text-white'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Token List */}
      <div className="space-y-3">
        {tokens?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">No tokens found</p>
          </div>
        ) : (
          tokens?.map((token: any) => (
            <button
              key={token.id}
              onClick={() => router.push(`/post/${token.id}`)}
              className="w-full bg-card-bg hover:bg-card-hover border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                {/* Token Image */}
                <div className="relative shrink-0">
                  <Avatar className="w-12 h-12 border-2 border-white/10">
                    <AvatarImage src={token.imageUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-accent-purple to-accent-pink text-white font-bold">
                      {token.symbol?.[0] || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  {token.isVerified && (
                    <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-5 h-5 text-accent-blue bg-card-bg rounded-full" />
                  )}
                </div>

                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white truncate">
                      ${token.symbol}
                    </span>
                    <span className="text-text-muted text-sm truncate">
                      {token.displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>by @{token.creator?.username}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(token.createdAt)}</span>
                  </div>
                </div>

                {/* Price Info */}
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-white">
                    ${token.price?.toFixed(4) || '0.01'}
                  </div>
                  <div className={cn(
                    'flex items-center justify-end gap-1 text-xs font-medium',
                    token.priceChange >= 0 ? 'text-accent-green' : 'text-metric-red'
                  )}>
                    {token.priceChange >= 0 ? (
                      <ArrowTrendingUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-3 h-3" />
                    )}
                    {Math.abs(token.priceChange || 0).toFixed(1)}%
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
