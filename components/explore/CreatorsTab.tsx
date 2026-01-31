'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckBadgeIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { getSuccessTierIcon } from '@/lib/utils';

interface CreatorsTabProps {
  searchQuery?: string;
}

type SortOption = 'earnings' | 'followers' | 'tokens' | 'newest';

export function CreatorsTab({ searchQuery }: CreatorsTabProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>('earnings');

  const { data: creators, isLoading } = useQuery({
    queryKey: ['explore-creators', sortBy, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        sort: sortBy,
        limit: '50',
      });
      if (searchQuery) params.set('q', searchQuery);

      const response = await fetch(`/api/users/top-creators?${params}`);
      const data = await response.json();
      return data.success ? data.data : [];
    },
  });

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'earnings', label: 'Top Earners' },
    { id: 'followers', label: 'Most Followed' },
    { id: 'tokens', label: 'Most Tokens' },
    { id: 'newest', label: 'New Creators' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card-bg rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/2" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
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

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {creators?.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-text-muted">No creators found</p>
          </div>
        ) : (
          creators?.map((creator: any, index: number) => (
            <button
              key={creator.id}
              onClick={() => router.push(`/profile/${creator.wallet_address}`)}
              className="bg-card-bg hover:bg-card-hover border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
                  index < 3
                    ? 'bg-gradient-to-br from-accent-gold to-yellow-600 text-black'
                    : 'bg-white/10 text-text-secondary'
                )}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <Avatar className="w-14 h-14 border-2 border-white/10 shrink-0">
                  <AvatarImage src={creator.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-accent-purple to-accent-pink text-white font-bold">
                    {creator.display_name?.[0] || creator.username?.[0] || 'C'}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white truncate">
                      {creator.display_name || creator.username}
                    </span>
                    {creator.verified && (
                      <CheckBadgeIcon className="w-4 h-4 text-accent-blue shrink-0" />
                    )}
                    <Badge variant={creator.success_tier || 'bronze'} className="text-xs shrink-0">
                      {getSuccessTierIcon(creator.success_tier || 'bronze')}
                    </Badge>
                  </div>
                  <div className="text-sm text-text-muted truncate">
                    @{creator.username}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                    <span>
                      <span className="text-accent-green font-bold">
                        ${creator.verified_earnings?.toLocaleString() || 0}
                      </span> earned
                    </span>
                    <span>
                      <span className="text-white font-medium">
                        {creator.tokens_count || 0}
                      </span> tokens
                    </span>
                  </div>
                </div>

                {/* Follow Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle follow
                  }}
                >
                  <UserPlusIcon className="w-4 h-4" />
                </Button>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
