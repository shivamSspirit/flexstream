import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type {
  FlexBalance,
  FlexTransaction,
  FlexLeaderboardEntry,
  FlexAction,
} from '@/types'

interface UseFlexPointsOptions {
  userId?: string
  enabled?: boolean
}

interface EarnFlexResponse {
  earned: number
  base_amount: number
  multiplier: number
  streak_multiplier: number
  event_multiplier: number
  current_streak: number
  new_total: number
  action: FlexAction
}

interface HistoryResponse {
  transactions: FlexTransaction[]
  total: number
  limit: number
  offset: number
  today_summary: {
    total: number
    byAction: Record<string, number>
  }
}

interface LeaderboardResponse {
  leaderboard: FlexLeaderboardEntry[]
  total: number
  limit: number
  offset: number
}

export function useFlexPoints({ userId, enabled = true }: UseFlexPointsOptions) {
  const queryClient = useQueryClient()

  // Fetch balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery<FlexBalance>({
    queryKey: ['flex-balance', userId],
    queryFn: async () => {
      const response = await fetch(`/api/flex/balance?userId=${userId}`)
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Fetch history
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery<HistoryResponse>({
    queryKey: ['flex-history', userId],
    queryFn: async () => {
      const response = await fetch(`/api/flex/history?userId=${userId}&limit=50`)
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: enabled && !!userId,
    staleTime: 60 * 1000, // 1 minute
  })

  // Earn FLEX mutation
  const earnMutation = useMutation<
    EarnFlexResponse,
    Error,
    { action: FlexAction; metadata?: Record<string, unknown> }
  >({
    mutationFn: async ({ action, metadata }) => {
      const response = await fetch('/api/flex/earn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, metadata }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      // Invalidate balance and history queries
      queryClient.invalidateQueries({ queryKey: ['flex-balance', userId] })
      queryClient.invalidateQueries({ queryKey: ['flex-history', userId] })
      queryClient.invalidateQueries({ queryKey: ['flex-leaderboard'] })
    },
  })

  // Earn FLEX helper function
  const earnFlex = useCallback(
    async (action: FlexAction, metadata?: Record<string, unknown>) => {
      if (!userId) return null
      try {
        return await earnMutation.mutateAsync({ action, metadata })
      } catch {
        return null
      }
    },
    [userId, earnMutation]
  )

  return {
    // Balance
    balance,
    isLoadingBalance,
    balanceError,
    refetchBalance,

    // History
    history: historyData?.transactions || [],
    todaySummary: historyData?.today_summary,
    isLoadingHistory,
    refetchHistory,

    // Earning
    earnFlex,
    isEarning: earnMutation.isPending,
    lastEarned: earnMutation.data,

    // Computed values
    totalFlex: balance?.total_flex || 0,
    periodFlex: balance?.period_flex || 0,
    currentStreak: balance?.current_streak || 0,
    rank: balance?.rank || 0,
    activeMultiplier: balance?.active_multiplier || 1,
    todayEarned: balance?.today_earned || 0,
  }
}

// Separate hook for leaderboard (can be used without auth)
export function useFlexLeaderboard(limit = 20) {
  return useQuery<LeaderboardResponse>({
    queryKey: ['flex-leaderboard', limit],
    queryFn: async () => {
      const response = await fetch(`/api/flex/leaderboard?limit=${limit}`)
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 60 * 1000, // 1 minute
  })
}
