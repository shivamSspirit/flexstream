import { useQuery } from '@tanstack/react-query';

export interface PlatformStats {
  activeTraders: number;
  postsToday: number;
  totalCreators: number;
  totalTokens: number;
  volume24h: string;
  tradingNow: number;
  recentLaunches: number;
  avgFirstDayEarnings: string;
}

export function usePlatformStats() {
  return useQuery<PlatformStats>({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const response = await fetch('/api/stats/platform');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch platform stats');
      }

      return data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: false,
  });
}
