import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface SearchUser {
  type: 'user';
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  verifiedEarnings: number;
  successTier: string;
  walletAddress: string;
}

export interface SearchPost {
  type: 'post';
  id: string;
  title: string;
  content: string;
  postType: string;
  createdAt: string;
  tokenMint?: string;
  tokenSymbol?: string;
  mediaUrl?: string;
  user: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface SearchToken {
  type: 'token';
  id: string;
  mint: string;
  symbol: string;
  displayName: string;
  isVerified: boolean;
  poolAddress?: string;
  createdAt: string;
  imageUrl?: string;
  creator: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface SearchResults {
  users: SearchUser[];
  posts: SearchPost[];
  tokens: SearchToken[];
}

export type SearchType = 'all' | 'users' | 'posts' | 'tokens';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useState(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  });

  return debouncedValue;
}

export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>('all');
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['search', debouncedQuery, searchType],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { users: [], posts: [], tokens: [] };
      }

      const params = new URLSearchParams({
        q: debouncedQuery,
        type: searchType,
        limit: '20',
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      return data.data.results as SearchResults;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
  });

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  const allResults = data ? [...data.users, ...data.posts, ...data.tokens] : [];

  return {
    query,
    setQuery: search,
    clearSearch,
    searchType,
    setSearchType,
    results: data || { users: [], posts: [], tokens: [] },
    allResults,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    hasResults: allResults.length > 0,
  };
}
