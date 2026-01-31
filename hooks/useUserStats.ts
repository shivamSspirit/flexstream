import { useQuery, useQueryClient } from '@tanstack/react-query';

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

/**
 * Hook to invalidate user stats cache
 * Use this after creating a post to update the post count
 */
export function useInvalidateUserStats() {
  const queryClient = useQueryClient();

  return async (userId?: string) => {
    console.log('[INVALIDATE USER STATS] Invalidating stats for user:', userId || 'all users');

    if (userId) {
      // Invalidate specific user's stats
      await queryClient.invalidateQueries({
        queryKey: ['userStats', userId],
        exact: true,
      });
      await queryClient.refetchQueries({
        queryKey: ['userStats', userId],
        exact: true,
      });
    } else {
      // Invalidate all user stats
      await queryClient.invalidateQueries({
        queryKey: ['userStats'],
        exact: false,
      });
      await queryClient.refetchQueries({
        queryKey: ['userStats'],
        exact: false,
      });
    }

    console.log('[INVALIDATE USER STATS] Complete');
  };
}
