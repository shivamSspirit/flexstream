/**
 * Prediction Market Hooks
 *
 * React Query hooks for prediction market features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/hooks/useWalletCompat';
import { VersionedTransaction, Connection } from '@solana/web3.js';

// ============================================================================
// TYPES
// ============================================================================

export interface Prediction {
  id: string;
  userId: string;
  marketTicker: string;
  marketTitle: string;
  position: 'yes' | 'no';
  amountUsdc: number;
  probabilityAtBet: number;
  potentialPayout: number;
  status: 'pending' | 'active' | 'won' | 'lost' | 'cancelled';
  txSignature?: string;
  createdAt: string;
}

export interface Challenge {
  id: string;
  challengerId: string;
  challengedId: string;
  marketTicker: string;
  marketTitle: string;
  challengerPosition: 'yes' | 'no';
  stakeAmount: number;
  status: 'pending' | 'active' | 'settled' | 'declined' | 'cancelled';
  winnerId?: string;
  message?: string;
  challenger?: { username: string; avatarUrl?: string };
  challenged?: { username: string; avatarUrl?: string };
}

export interface FlexScore {
  flexScore: number;
  tier: 'oracle' | 'prophet' | 'seer' | 'acolyte' | 'initiate';
  totalPredictions: number;
  correctPredictions: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  totalProfit: number;
  globalRank?: number;
  username?: string;
  avatarUrl?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  flexScore: number;
  tier: string;
  winRate: number;
  currentStreak: number;
  rankChange?: number;
}

// ============================================================================
// BET HOOKS
// ============================================================================

/**
 * Get user's predictions
 */
export function useUserPredictions(userId: string | undefined, status?: string) {
  return useQuery({
    queryKey: ['predictions', userId, status],
    queryFn: async () => {
      if (!userId) return { predictions: [] };

      const params = new URLSearchParams({ userId });
      if (status) params.set('status', status);

      const res = await fetch(`/api/predictions/bet?${params}`);
      if (!res.ok) throw new Error('Failed to fetch predictions');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

/**
 * Place a bet on a prediction market
 */
export function usePlaceBet() {
  const { signTransaction } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      marketTicker: string;
      position: 'yes' | 'no';
      amountUsdc: number;
      userPublicKey: string;
    }) => {
      // Get quote and unsigned transaction
      const res = await fetch('/api/predictions/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to get quote');
      }

      const { prediction, transaction: base64Tx } = await res.json();

      // Deserialize and sign transaction
      if (!signTransaction) {
        throw new Error('Wallet not connected');
      }

      const txBuffer = Buffer.from(base64Tx, 'base64');
      const tx = VersionedTransaction.deserialize(txBuffer);

      const signedTx = await signTransaction(tx);

      // Send transaction
      const connection = new Connection(
        process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.devnet.solana.com'
      );

      const signature = await connection.sendRawTransaction(signedTx.serialize());

      // Confirm prediction
      await fetch('/api/predictions/bet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId: prediction.id,
          signature,
          status: 'active',
        }),
      });

      return { prediction, signature };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['predictions', variables.userId] });
    },
  });
}

// ============================================================================
// CHALLENGE HOOKS
// ============================================================================

/**
 * Get user's challenges
 */
export function useChallenges(
  userId: string | undefined,
  options?: { status?: string; type?: 'sent' | 'received' | 'all' }
) {
  return useQuery({
    queryKey: ['challenges', userId, options],
    queryFn: async () => {
      if (!userId) return { challenges: [] };

      const params = new URLSearchParams({ userId });
      if (options?.status) params.set('status', options.status);
      if (options?.type) params.set('type', options.type);

      const res = await fetch(`/api/predictions/challenges?${params}`);
      if (!res.ok) throw new Error('Failed to fetch challenges');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

/**
 * Create a challenge
 */
export function useCreateChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      challengerId: string;
      challengedId: string;
      marketTicker: string;
      challengerPosition: 'yes' | 'no';
      stakeAmount: number;
      message?: string;
    }) => {
      const res = await fetch('/api/predictions/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create challenge');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['challenges', variables.challengerId] });
    },
  });
}

/**
 * Respond to a challenge
 */
export function useRespondToChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      challengeId: string;
      userId: string;
      action: 'accept' | 'decline' | 'cancel';
    }) => {
      const res = await fetch('/api/predictions/challenges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to respond to challenge');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['challenges', variables.userId] });
    },
  });
}

// ============================================================================
// FLEX SCORE HOOKS
// ============================================================================

/**
 * Get user's Flex Score
 */
export function useFlexScore(userId: string | undefined, options?: { includeHistory?: boolean; includeRank?: boolean }) {
  return useQuery({
    queryKey: ['flexScore', userId, options],
    queryFn: async () => {
      if (!userId) return null;

      const params = new URLSearchParams({ userId });
      if (options?.includeHistory) params.set('history', 'true');
      if (options?.includeRank) params.set('rank', 'true');

      const res = await fetch(`/api/predictions/flex-score?${params}`);
      if (!res.ok) throw new Error('Failed to fetch flex score');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 60000,
  });
}

/**
 * Generate shareable Flex Score card
 */
export function useGenerateFlexCard() {
  return useMutation({
    mutationFn: async (params: { userId: string; format?: 'twitter' }) => {
      const res = await fetch('/api/predictions/flex-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate card');
      }

      return res.json();
    },
  });
}

// ============================================================================
// LEADERBOARD HOOKS
// ============================================================================

/**
 * Get prediction leaderboard
 */
export function useLeaderboard(options?: {
  timeFrame?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  limit?: number;
  offset?: number;
  userId?: string;
}) {
  return useQuery({
    queryKey: ['leaderboard', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.timeFrame) params.set('timeFrame', options.timeFrame);
      if (options?.limit) params.set('limit', options.limit.toString());
      if (options?.offset) params.set('offset', options.offset.toString());
      if (options?.userId) params.set('userId', options.userId);

      const res = await fetch(`/api/predictions/leaderboard?${params}`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
    staleTime: 60000,
  });
}

// ============================================================================
// SOCIAL PROOF HOOKS
// ============================================================================

/**
 * Get social proof for a market (friends betting)
 */
export function useMarketSocialProof(marketTicker: string | undefined, userId?: string) {
  return useQuery({
    queryKey: ['socialProof', marketTicker, userId],
    queryFn: async () => {
      if (!marketTicker) return null;

      const params = new URLSearchParams({
        type: 'market',
        marketTicker,
      });
      if (userId) params.set('userId', userId);

      const res = await fetch(`/api/predictions/social?${params}`);
      if (!res.ok) throw new Error('Failed to fetch social proof');
      return res.json();
    },
    enabled: !!marketTicker,
    staleTime: 30000,
  });
}

/**
 * Get activity feed (friends' predictions)
 */
export function useActivityFeed(userId: string | undefined) {
  return useQuery({
    queryKey: ['activityFeed', userId],
    queryFn: async () => {
      if (!userId) return { activity: [] };

      const params = new URLSearchParams({
        type: 'feed',
        userId,
      });

      const res = await fetch(`/api/predictions/social?${params}`);
      if (!res.ok) throw new Error('Failed to fetch activity feed');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

/**
 * Get friends who are predictors
 */
export function usePredictorFriends(userId: string | undefined) {
  return useQuery({
    queryKey: ['predictorFriends', userId],
    queryFn: async () => {
      if (!userId) return { friends: [] };

      const params = new URLSearchParams({
        type: 'friends',
        userId,
      });

      const res = await fetch(`/api/predictions/social?${params}`);
      if (!res.ok) throw new Error('Failed to fetch friends');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 60000,
  });
}

// ============================================================================
// SQUAD HOOKS
// ============================================================================

/**
 * Get user's squads
 */
export function useUserSquads(userId: string | undefined) {
  return useQuery({
    queryKey: ['squads', userId],
    queryFn: async () => {
      if (!userId) return { squads: [] };

      const res = await fetch(`/api/predictions/squads?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch squads');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 60000,
  });
}

/**
 * Get squad details
 */
export function useSquad(squadId: string | undefined) {
  return useQuery({
    queryKey: ['squad', squadId],
    queryFn: async () => {
      if (!squadId) return null;

      const res = await fetch(`/api/predictions/squads?squadId=${squadId}`);
      if (!res.ok) throw new Error('Failed to fetch squad');
      return res.json();
    },
    enabled: !!squadId,
  });
}

/**
 * Create a squad
 */
export function useCreateSquad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      name: string;
      description?: string;
      isPrivate?: boolean;
    }) => {
      const res = await fetch('/api/predictions/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create squad');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['squads', variables.userId] });
    },
  });
}

/**
 * Join a squad
 */
export function useJoinSquad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { userId: string; inviteCode: string }) => {
      const res = await fetch('/api/predictions/squads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', ...params }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to join squad');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['squads', variables.userId] });
    },
  });
}

/**
 * Get squad markets
 */
export function useSquadMarkets(squadId: string | undefined, status?: string) {
  return useQuery({
    queryKey: ['squadMarkets', squadId, status],
    queryFn: async () => {
      if (!squadId) return { markets: [] };

      const params = new URLSearchParams({ squadId });
      if (status) params.set('status', status);

      const res = await fetch(`/api/predictions/squads/markets?${params}`);
      if (!res.ok) throw new Error('Failed to fetch squad markets');
      return res.json();
    },
    enabled: !!squadId,
  });
}

/**
 * Create a squad market
 */
export function useCreateSquadMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      squadId: string;
      userId: string;
      question: string;
      description?: string;
      expiresAt: string;
      minBet?: number;
      maxBet?: number;
    }) => {
      const res = await fetch('/api/predictions/squads/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create market');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['squadMarkets', variables.squadId] });
    },
  });
}

/**
 * Place a squad bet
 */
export function usePlaceSquadBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      marketId: string;
      userId: string;
      position: 'yes' | 'no';
      amount: number;
    }) => {
      const res = await fetch('/api/predictions/squads/markets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bet', ...params }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to place bet');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['squadMarket', variables.marketId] });
    },
  });
}
