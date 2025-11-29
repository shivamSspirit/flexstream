import { useQuery } from '@tanstack/react-query';

export interface UserStats {
  posts_count: number;
  tokens_created: number;
  total_holders: number; // Total unique holders across all user's tokens
  tokens_holding: number; // Number of different tokens user holds
}

interface UserStatsResponse {
  success: boolean;
  data: UserStats;
}

/**
 * Hook to fetch real user statistics
 * Following Nikita Bier principle: Real data creates authenticity and trust
 */
export function useUserStats(userId?: string) {
  return useQuery<UserStatsResponse>({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      if (!userId) {
        return {
          success: true,
          data: {
            posts_count: 0,
            tokens_created: 0,
            total_holders: 0,
            tokens_holding: 0,
          }
        };
      }

      const response = await fetch(`/api/users/stats?userId=${userId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache (previously cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
  });
}
