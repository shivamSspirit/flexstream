'use client';

import { useState } from 'react';
import { usePosts } from '@/hooks/usePosts';
import { PostCard } from '@/components/posts/PostCard';
import { cn } from '@/lib/utils';

interface PostsTabProps {
  searchQuery?: string;
}

type FilterOption = 'trending' | 'newest' | 'earnings' | 'lifestyle';

export function PostsTab({ searchQuery }: PostsTabProps) {
  const [filter, setFilter] = useState<FilterOption>('trending');

  const { data, isLoading } = usePosts({
    limit: 20,
  });

  const filterOptions: { id: FilterOption; label: string }[] = [
    { id: 'trending', label: 'Trending' },
    { id: 'newest', label: 'Newest' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'lifestyle', label: 'Lifestyle' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card-bg rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/10 rounded w-1/4" />
              </div>
            </div>
            <div className="h-48 bg-white/10 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Filter posts based on type
  let filteredPosts = data?.data?.posts || [];
  if (filter === 'earnings') {
    filteredPosts = filteredPosts.filter((p: any) => p.type === 'earnings_flex');
  } else if (filter === 'lifestyle') {
    filteredPosts = filteredPosts.filter((p: any) => p.type === 'lifestyle');
  }

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredPosts = filteredPosts.filter((p: any) =>
      p.title?.toLowerCase().includes(query) ||
      p.content?.toLowerCase().includes(query) ||
      p.token_symbol?.toLowerCase().includes(query)
    );
  }

  return (
    <div>
      {/* Filter Options */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {filterOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setFilter(option.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              filter === option.id
                ? 'bg-accent-purple text-white'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">No posts found</p>
          </div>
        ) : (
          filteredPosts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
