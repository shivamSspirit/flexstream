'use client';

import { useState, useEffect, useCallback } from 'react';
import { PumpFunLiveStream } from '@/types';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCoins: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

interface UsePaginatedLiveStreamsReturn {
  streams: PumpFunLiveStream[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  refresh: () => void;
}

export function usePaginatedLiveStreams(
  initialPage: number = 1,
  limit: number = 10,
  includeDexScreener: boolean = true,
  includeHelius: boolean = false
): UsePaginatedLiveStreamsReturn {
  const [streams, setStreams] = useState<PumpFunLiveStream[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: initialPage,
    totalPages: 1,
    totalCoins: 0,
    limit,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStreams = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 [PAGINATED HOOK] Fetching page ${page} with limit ${limit}`);
      
      const url = new URL('/api/simple-paginated', window.location.origin);
      url.searchParams.append('fetchAll', 'true');
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('includeDexScreener', includeDexScreener.toString());
      url.searchParams.append('includeHelius', includeHelius.toString());

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 [PAGINATED HOOK] API Response:', {
        success: result.success,
        dataLength: result.data?.length,
        pagination: result.pagination,
        error: result.error
      });
      
      if (result.success && result.data) {
        setStreams(result.data);
        setPagination({
          currentPage: result.pagination.currentPage,
          totalPages: result.pagination.totalPages,
          totalCoins: result.pagination.totalCoins,
          limit: result.pagination.limit,
          hasNextPage: result.pagination.hasNextPage,
          hasPrevPage: result.pagination.hasPrevPage,
          nextPage: result.pagination.nextPage,
          prevPage: result.pagination.prevPage
        });
        
        console.log(`✅ [PAGINATED HOOK] Loaded ${result.data.length} streams for page ${page}`);
        console.log(`📊 [PAGINATED HOOK] Pagination: ${result.pagination.currentPage}/${result.pagination.totalPages} pages`);
      } else {
        throw new Error(result.error || 'Failed to fetch streams');
      }
    } catch (err) {
      console.error('❌ [PAGINATED HOOK] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [limit, includeDexScreener, includeHelius]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages && !loading) {
      fetchStreams(page);
    }
  }, [fetchStreams, pagination.totalPages, loading]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage && !loading) {
      fetchStreams(pagination.currentPage + 1);
    }
  }, [fetchStreams, pagination.hasNextPage, pagination.currentPage, loading]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage && !loading) {
      fetchStreams(pagination.currentPage - 1);
    }
  }, [fetchStreams, pagination.hasPrevPage, pagination.currentPage, loading]);

  const refresh = useCallback(() => {
    fetchStreams(pagination.currentPage);
  }, [fetchStreams, pagination.currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchStreams(initialPage);
  }, [fetchStreams, initialPage]);

  return {
    streams,
    pagination,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    refresh
  };
}
