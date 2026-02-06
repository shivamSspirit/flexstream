import { useQuery } from '@tanstack/react-query';
import type { SubFilter } from '@/components/feed/FeedTabs';

export interface FollowingActivity {
  id: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  tradeType: 'buy' | 'sell' | 'swap';
  tokenSymbol: string;
  tokenDisplayName: string;
  tokenMint: string;
  quantity: number;
  pricePerToken: number;
  totalSolAmount: number;
  totalUsdValue: number | null;
  signature: string;
  createdAt: string;
}

interface FollowingActivityResponse {
  success: boolean;
  data: {
    activities: FollowingActivity[];
    count: number;
    limit: number;
    offset: number;
  };
}

interface UseFollowingActivityOptions {
  userId?: string;
  limit?: number;
  offset?: number;
  sort?: SubFilter;
  enabled?: boolean;
}

export function useFollowingActivity(options: UseFollowingActivityOptions = {}) {
  const { userId, limit = 20, offset = 0, sort = 'latest', enabled = true } = options;

  return useQuery<FollowingActivityResponse>({
    queryKey: ['following-activity', { userId, limit, offset, sort }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      if (sort && sort !== 'latest') params.append('sort', sort);
      params.append('_t', Date.now().toString());

      const response = await fetch(`/api/feed/following-activity?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch following activity');
      }

      return response.json();
    },
    enabled: enabled && !!userId,
    staleTime: 30000,
    gcTime: 60000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
}
