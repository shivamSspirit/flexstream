/**
 * Flex Score Service
 *
 * Calculates and manages user prediction accuracy scores
 * - ELO-like rating system
 * - Tier progression (Initiate → Oracle)
 * - Streak tracking
 * - Leaderboard rankings
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// TYPES
// ============================================================================

export interface FlexScore {
  id: string;
  userId: string;
  flexScore: number;
  tier: 'oracle' | 'prophet' | 'seer' | 'acolyte' | 'initiate';
  totalPredictions: number;
  correctPredictions: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  totalWagered: number;
  totalProfit: number;
  globalRank: number | null;
  weeklyRank: number | null;
  dailyRank: number | null;
  topCategory: string | null;
}

export interface FlexScoreChange {
  userId: string;
  oldScore: number;
  newScore: number;
  change: number;
  reason: string;
  referenceId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Score changes for different outcomes
const SCORE_CHANGES = {
  // Predictions
  PREDICTION_WIN_BASE: 25,
  PREDICTION_LOSS_BASE: -20,
  PREDICTION_WIN_MULTIPLIER_UNDERDOG: 1.5, // Bonus for winning unlikely bets
  PREDICTION_LOSS_MULTIPLIER_FAVORITE: 0.5, // Less penalty for losing likely bets

  // Challenges
  CHALLENGE_WIN: 50,
  CHALLENGE_LOSS: -35,
  CHALLENGE_CREATE: 5, // Small bonus for initiating

  // Streaks
  STREAK_BONUS_PER_WIN: 5, // Extra points per win in streak
  STREAK_MILESTONE_3: 25,
  STREAK_MILESTONE_5: 50,
  STREAK_MILESTONE_10: 100,

  // Minimum/Maximum
  MIN_SCORE: 100,
  MAX_SCORE: 1500,
  STARTING_SCORE: 500,
};

// Tier thresholds
const TIER_THRESHOLDS = {
  oracle: 900,
  prophet: 750,
  seer: 600,
  acolyte: 400,
  initiate: 0,
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get or create Flex Score for a user
 */
export async function getFlexScore(userId: string): Promise<FlexScore | null> {
  const { data, error } = await supabase
    .from('flex_scores')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching flex score:', error);
    return null;
  }

  if (!data) {
    // Create initial score
    return createFlexScore(userId);
  }

  return mapDbToFlexScore(data);
}

/**
 * Create initial Flex Score for a new user
 */
export async function createFlexScore(userId: string): Promise<FlexScore | null> {
  const { data, error } = await supabase
    .from('flex_scores')
    .insert({
      user_id: userId,
      flex_score: SCORE_CHANGES.STARTING_SCORE,
      tier: 'initiate',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating flex score:', error);
    return null;
  }

  return mapDbToFlexScore(data);
}

/**
 * Update Flex Score after a prediction resolves
 */
export async function updateScoreForPrediction(params: {
  userId: string;
  predictionId: string;
  won: boolean;
  probability: number; // 0-100, the probability of the outcome when they bet
  stakeAmount: number;
  payout: number;
}): Promise<FlexScoreChange | null> {
  const currentScore = await getFlexScore(params.userId);
  if (!currentScore) return null;

  // Calculate score change
  let baseChange = params.won
    ? SCORE_CHANGES.PREDICTION_WIN_BASE
    : SCORE_CHANGES.PREDICTION_LOSS_BASE;

  // Adjust for probability (underdog bonus / favorite penalty)
  if (params.won && params.probability < 30) {
    // Won an underdog bet
    baseChange = Math.floor(baseChange * SCORE_CHANGES.PREDICTION_WIN_MULTIPLIER_UNDERDOG);
  } else if (!params.won && params.probability > 70) {
    // Lost a favorite bet (less penalty)
    baseChange = Math.floor(baseChange * SCORE_CHANGES.PREDICTION_LOSS_MULTIPLIER_FAVORITE);
  }

  // Streak bonus
  let streakBonus = 0;
  let newStreak = params.won ? currentScore.currentStreak + 1 : 0;

  if (params.won) {
    streakBonus = currentScore.currentStreak * SCORE_CHANGES.STREAK_BONUS_PER_WIN;

    // Milestone bonuses
    if (newStreak === 3) streakBonus += SCORE_CHANGES.STREAK_MILESTONE_3;
    if (newStreak === 5) streakBonus += SCORE_CHANGES.STREAK_MILESTONE_5;
    if (newStreak === 10) streakBonus += SCORE_CHANGES.STREAK_MILESTONE_10;
  }

  const totalChange = baseChange + streakBonus;
  const newScore = Math.max(
    SCORE_CHANGES.MIN_SCORE,
    Math.min(SCORE_CHANGES.MAX_SCORE, currentScore.flexScore + totalChange)
  );

  // Update in database
  const profit = params.won ? params.payout - params.stakeAmount : -params.stakeAmount;

  const { error } = await supabase
    .from('flex_scores')
    .update({
      flex_score: newScore,
      total_predictions: currentScore.totalPredictions + 1,
      correct_predictions: currentScore.correctPredictions + (params.won ? 1 : 0),
      current_streak: newStreak,
      longest_streak: Math.max(currentScore.longestStreak, newStreak),
      total_wagered: currentScore.totalWagered + params.stakeAmount,
      total_profit: currentScore.totalProfit + profit,
    })
    .eq('user_id', params.userId);

  if (error) {
    console.error('Error updating flex score:', error);
    return null;
  }

  // Log the change
  await logScoreChange({
    userId: params.userId,
    change: totalChange,
    reason: params.won ? 'prediction_win' : 'prediction_loss',
    referenceId: params.predictionId,
    newScore,
  });

  return {
    userId: params.userId,
    oldScore: currentScore.flexScore,
    newScore,
    change: totalChange,
    reason: params.won ? 'prediction_win' : 'prediction_loss',
    referenceId: params.predictionId,
  };
}

/**
 * Update Flex Score after a challenge resolves
 */
export async function updateScoreForChallenge(params: {
  winnerId: string;
  loserId: string;
  challengeId: string;
  stakeAmount: number;
}): Promise<{ winner: FlexScoreChange; loser: FlexScoreChange } | null> {
  const winnerScore = await getFlexScore(params.winnerId);
  const loserScore = await getFlexScore(params.loserId);

  if (!winnerScore || !loserScore) return null;

  // Winner update
  const winnerNewScore = Math.min(
    SCORE_CHANGES.MAX_SCORE,
    winnerScore.flexScore + SCORE_CHANGES.CHALLENGE_WIN
  );

  await supabase
    .from('flex_scores')
    .update({
      flex_score: winnerNewScore,
      total_predictions: winnerScore.totalPredictions + 1,
      correct_predictions: winnerScore.correctPredictions + 1,
      current_streak: winnerScore.currentStreak + 1,
      longest_streak: Math.max(winnerScore.longestStreak, winnerScore.currentStreak + 1),
      total_profit: winnerScore.totalProfit + params.stakeAmount,
    })
    .eq('user_id', params.winnerId);

  // Loser update
  const loserNewScore = Math.max(
    SCORE_CHANGES.MIN_SCORE,
    loserScore.flexScore + SCORE_CHANGES.CHALLENGE_LOSS
  );

  await supabase
    .from('flex_scores')
    .update({
      flex_score: loserNewScore,
      total_predictions: loserScore.totalPredictions + 1,
      current_streak: 0,
      total_profit: loserScore.totalProfit - params.stakeAmount,
    })
    .eq('user_id', params.loserId);

  // Log changes
  await logScoreChange({
    userId: params.winnerId,
    change: SCORE_CHANGES.CHALLENGE_WIN,
    reason: 'challenge_win',
    referenceId: params.challengeId,
    newScore: winnerNewScore,
  });

  await logScoreChange({
    userId: params.loserId,
    change: SCORE_CHANGES.CHALLENGE_LOSS,
    reason: 'challenge_loss',
    referenceId: params.challengeId,
    newScore: loserNewScore,
  });

  return {
    winner: {
      userId: params.winnerId,
      oldScore: winnerScore.flexScore,
      newScore: winnerNewScore,
      change: SCORE_CHANGES.CHALLENGE_WIN,
      reason: 'challenge_win',
      referenceId: params.challengeId,
    },
    loser: {
      userId: params.loserId,
      oldScore: loserScore.flexScore,
      newScore: loserNewScore,
      change: SCORE_CHANGES.CHALLENGE_LOSS,
      reason: 'challenge_loss',
      referenceId: params.challengeId,
    },
  };
}

// ============================================================================
// LEADERBOARD
// ============================================================================

/**
 * Get leaderboard (top predictors)
 */
export async function getLeaderboard(params?: {
  limit?: number;
  offset?: number;
  timeFrame?: 'daily' | 'weekly' | 'monthly' | 'all-time';
}): Promise<FlexScore[]> {
  const limit = params?.limit || 50;
  const offset = params?.offset || 0;

  // For now, use all-time. Time-based filtering would need activity table
  const { data, error } = await supabase
    .from('flex_scores')
    .select(`
      *,
      users!inner(username, avatar_url)
    `)
    .order('flex_score', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return data.map((row, index) => ({
    ...mapDbToFlexScore(row),
    globalRank: offset + index + 1,
  }));
}

/**
 * Get user's rank
 */
export async function getUserRank(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('flex_scores')
    .select('user_id, flex_score')
    .order('flex_score', { ascending: false });

  if (error || !data) return null;

  const index = data.findIndex(row => row.user_id === userId);
  return index >= 0 ? index + 1 : null;
}

/**
 * Update all ranks (run periodically)
 */
export async function updateAllRanks(): Promise<void> {
  const { data } = await supabase
    .from('flex_scores')
    .select('user_id, flex_score')
    .order('flex_score', { ascending: false });

  if (!data) return;

  // Update ranks in batches
  for (let i = 0; i < data.length; i++) {
    await supabase
      .from('flex_scores')
      .update({ global_rank: i + 1 })
      .eq('user_id', data[i].user_id);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Log a score change to history
 */
async function logScoreChange(params: {
  userId: string;
  change: number;
  reason: string;
  referenceId?: string;
  newScore: number;
}): Promise<void> {
  await supabase.from('flex_score_history').insert({
    user_id: params.userId,
    flex_score: params.newScore,
    change_amount: params.change,
    reason: params.reason,
    reference_id: params.referenceId,
  });
}

/**
 * Get tier from score
 */
export function getTierFromScore(score: number): FlexScore['tier'] {
  if (score >= TIER_THRESHOLDS.oracle) return 'oracle';
  if (score >= TIER_THRESHOLDS.prophet) return 'prophet';
  if (score >= TIER_THRESHOLDS.seer) return 'seer';
  if (score >= TIER_THRESHOLDS.acolyte) return 'acolyte';
  return 'initiate';
}

/**
 * Map database row to FlexScore type
 */
function mapDbToFlexScore(row: Record<string, unknown>): FlexScore {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    flexScore: row.flex_score as number,
    tier: row.tier as FlexScore['tier'],
    totalPredictions: row.total_predictions as number,
    correctPredictions: row.correct_predictions as number,
    winRate: row.win_rate as number,
    currentStreak: row.current_streak as number,
    longestStreak: row.longest_streak as number,
    totalWagered: parseFloat(row.total_wagered as string) || 0,
    totalProfit: parseFloat(row.total_profit as string) || 0,
    globalRank: row.global_rank as number | null,
    weeklyRank: row.weekly_rank as number | null,
    dailyRank: row.daily_rank as number | null,
    topCategory: row.top_category as string | null,
  };
}

/**
 * Get score change preview (for UI)
 */
export function previewScoreChange(params: {
  currentScore: number;
  won: boolean;
  probability: number;
  currentStreak: number;
}): { newScore: number; change: number; newStreak: number } {
  let baseChange = params.won
    ? SCORE_CHANGES.PREDICTION_WIN_BASE
    : SCORE_CHANGES.PREDICTION_LOSS_BASE;

  if (params.won && params.probability < 30) {
    baseChange = Math.floor(baseChange * SCORE_CHANGES.PREDICTION_WIN_MULTIPLIER_UNDERDOG);
  } else if (!params.won && params.probability > 70) {
    baseChange = Math.floor(baseChange * SCORE_CHANGES.PREDICTION_LOSS_MULTIPLIER_FAVORITE);
  }

  const newStreak = params.won ? params.currentStreak + 1 : 0;
  let streakBonus = 0;

  if (params.won) {
    streakBonus = params.currentStreak * SCORE_CHANGES.STREAK_BONUS_PER_WIN;
    if (newStreak === 3) streakBonus += SCORE_CHANGES.STREAK_MILESTONE_3;
    if (newStreak === 5) streakBonus += SCORE_CHANGES.STREAK_MILESTONE_5;
    if (newStreak === 10) streakBonus += SCORE_CHANGES.STREAK_MILESTONE_10;
  }

  const totalChange = baseChange + streakBonus;
  const newScore = Math.max(
    SCORE_CHANGES.MIN_SCORE,
    Math.min(SCORE_CHANGES.MAX_SCORE, params.currentScore + totalChange)
  );

  return { newScore, change: totalChange, newStreak };
}
