import { useQuery } from '@tanstack/react-query';

export interface TopCreator {
  id: string;
  username: string;
  display_name: string;
  wallet_address: string;
  avatar_url: string | null;
  bio: string | null;
  post_count: number;
}

interface TopCreatorsResponse {
  success: boolean;
  data: {
    creators: TopCreator[];
  };
}

/**
 * Hook to fetch top creators (users with most posts)
 * Following Nikita Bier principle: Show real, active users to create FOMO
 */
export function useTopCreators(limit: number = 5) {
  return useQuery<TopCreatorsResponse>({
    queryKey: ['topCreators', limit],
    queryFn: async () => {
      const response = await fetch(`/api/users/top-creators?limit=${limit}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch top creators');
      }

      return response.json();
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });
}
