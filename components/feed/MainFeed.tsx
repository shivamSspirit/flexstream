'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PostCard } from '@/components/posts/PostCard';
import { PostSkeleton } from '@/components/posts/PostSkeleton';
import { EmptyState } from '@/components/feed/EmptyState';
import { FeedFilters } from '@/components/feed/FeedFilters';
import { supabase } from '@/lib/supabase';
import { FlexPost, FeedFilter } from '@/types';

export function MainFeed() {
  const [filters, setFilters] = useState<FeedFilter>({});

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['posts', filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users(*)
        `)
        .order('created_at', { ascending: false })
        .range(pageParam * 10, (pageParam + 1) * 10 - 1);

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.verified !== undefined) {
        query = query.eq('verified', filters.verified);
      }
      if (filters.min_earnings) {
        query = query.gte('earnings_amount', filters.min_earnings);
      }
      if (filters.max_earnings) {
        query = query.lte('earnings_amount', filters.max_earnings);
      }

      const { data: posts, error } = await query;

      if (error) {
        throw error;
      }

      return posts as FlexPost[];
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 10 ? pages.length : undefined;
    },
    staleTime: 30000, // 30 seconds
  });

  const posts = data?.pages.flat() || [];

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <FeedFilters filters={filters} onFiltersChange={setFilters} />
        {Array.from({ length: 5 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-lg font-medium mb-2">
          Error loading posts
        </div>
        <div className="text-gray-400 text-sm">
          Please try refreshing the page
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div>
        <FeedFilters filters={filters} onFiltersChange={setFilters} />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FeedFilters filters={filters} onFiltersChange={setFilters} />
      
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {isFetchingNextPage && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={`loading-${i}`} />
          ))}
        </div>
      )}

      {!hasNextPage && posts.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm">
            You've reached the end of the feed
          </div>
        </div>
      )}
    </div>
  );
}
