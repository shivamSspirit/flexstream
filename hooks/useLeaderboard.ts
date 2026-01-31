import { useState, useEffect, useCallback } from 'react';

export type TimeframeType = '24h' | '7d' | '30d' | 'all_time';
export type MetricType = 'volume' | 'profit' | 'roi';

export interface LeaderboardTrader {
  rank: number;
  walletAddress: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  verifiedEarnings: number;
  successTier: string;
  metricValue: number;
  tradesCount: number;
  winRate: number;
  averageTradeSize: number;
  currentStreak: number;
  lastUpdated: string;
}

export interface UserRankData {
  walletAddress: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  rankings: {
    volume: number | null;
    profit: number | null;
    roi: number | null;
  };
  stats: {
    [key: string]: {
      volume: number;
      trades: number;
      pnl: number;
      roi: number;
      winRate: number;
    };
  };
  averageTradeSize: number;
  largestWin: number;
  largestLoss: number;
  currentStreak: number;
  bestStreak: number;
  worstStreak: number;
  lastUpdated: string;
}

export interface UseLeaderboardReturn {
  // State
  leaderboard: LeaderboardTrader[];
  userRank: UserRankData | null;
  isLoading: boolean;
  error: string | null;
  timeframe: TimeframeType;
  metric: MetricType;

  // Actions
  fetchLeaderboard: (timeframe?: TimeframeType, metric?: MetricType) => Promise<void>;
  fetchUserRank: (walletAddress: string, timeframe?: TimeframeType) => Promise<void>;
  setTimeframe: (timeframe: TimeframeType) => void;
  setMetric: (metric: MetricType) => void;
  loadMore: () => Promise<void>;

  // Metadata
  hasMore: boolean;
}

export function useLeaderboard(autoFetch = true): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardTrader[]>([]);
  const [userRank, setUserRank] = useState<UserRankData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframeState] = useState<TimeframeType>('7d');
  const [metric, setMetricState] = useState<MetricType>('volume');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = 50;

  /**
   * Fetch leaderboard data
   */
  const fetchLeaderboard = useCallback(async (
    newTimeframe?: TimeframeType,
    newMetric?: MetricType,
    resetOffset = true
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const tf = newTimeframe || timeframe;
      const m = newMetric || metric;
      const currentOffset = resetOffset ? 0 : offset;

      const response = await fetch(
        `/api/leaderboard?timeframe=${tf}&metric=${m}&limit=${limit}&offset=${currentOffset}`
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }

      if (resetOffset) {
        setLeaderboard(data.data.leaderboard);
        setOffset(limit);
      } else {
        setLeaderboard(prev => [...prev, ...data.data.leaderboard]);
        setOffset(prev => prev + limit);
      }

      setHasMore(data.data.pagination.hasMore);

      if (newTimeframe) setTimeframeState(newTimeframe);
      if (newMetric) setMetricState(newMetric);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
      setError(errorMessage);
      console.error('[useLeaderboard] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, metric, offset]);

  /**
   * Fetch user's rank and stats
   */
  const fetchUserRank = useCallback(async (
    walletAddress: string,
    newTimeframe?: TimeframeType
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const tf = newTimeframe || timeframe;

      const response = await fetch(
        `/api/leaderboard/user/${walletAddress}?timeframe=${tf}`
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch user rank');
      }

      setUserRank(data.data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user rank';
      setError(errorMessage);
      console.error('[useLeaderboard] Error fetching user rank:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  /**
   * Load more traders (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchLeaderboard(timeframe, metric, false);
  }, [hasMore, isLoading, timeframe, metric, fetchLeaderboard]);

  /**
   * Update timeframe and refresh
   */
  const setTimeframe = useCallback((newTimeframe: TimeframeType) => {
    fetchLeaderboard(newTimeframe, metric, true);
  }, [metric, fetchLeaderboard]);

  /**
   * Update metric and refresh
   */
  const setMetric = useCallback((newMetric: MetricType) => {
    fetchLeaderboard(timeframe, newMetric, true);
  }, [timeframe, fetchLeaderboard]);

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (autoFetch) {
      fetchLeaderboard();
    }
  }, [autoFetch]); // Only run on mount

  return {
    leaderboard,
    userRank,
    isLoading,
    error,
    timeframe,
    metric,
    fetchLeaderboard,
    fetchUserRank,
    setTimeframe,
    setMetric,
    loadMore,
    hasMore,
  };
}
