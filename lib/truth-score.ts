/**
 * Flex Truth Score System
 *
 * The reputation layer that transforms prediction markets into a status game.
 * High Truth Score = More visibility in feed = More followers = More alpha.
 *
 * Formula: TruthScore = Σ(W × C × E × S)
 * Where:
 *   W = Win points (10 base, settled by Kalshi)
 *   C = Confidence multiplier (bet size / avg bet)
 *   E = Early bonus (position # / total participants)
 *   S = Streak multiplier (1.1^consecutive_wins)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type TruthTier = 'novice' | 'visionary' | 'seer' | 'prophet' | 'oracle';

export interface TruthScoreConfig {
  baseWinPoints: number;        // Base points for a win (default: 10)
  baseLossPoints: number;       // Points deducted for loss (default: -2)
  streakMultiplierBase: number; // Streak multiplier base (default: 1.1)
  maxStreakMultiplier: number;  // Cap on streak bonus (default: 3.0)
  earlyBonusCap: number;        // Max early bonus multiplier (default: 200)
}

export interface TruthScoreState {
  totalScore: number;
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  tier: TruthTier;
  tierProgress: number;         // % progress to next tier
  nextTierAt: number;           // Score needed for next tier
  alphaPriorityMinutes: number; // Minutes of early access to new markets
  feeSharePercent: number;      // % of protocol fees earned
}

export interface PredictionResult {
  isWin: boolean;
  positionNumber: number;       // Which buyer they were
  totalParticipants: number;    // Total participants in market
  betSize: number;              // Their bet size in SOL
  avgBetSize: number;           // Average bet size in market
  payout: number;               // Actual payout received
}

export interface ScoreCalculation {
  basePoints: number;
  confidenceMultiplier: number;
  earlyBonus: number;
  streakMultiplier: number;
  totalPoints: number;
  breakdown: string;            // Human-readable breakdown
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const TRUTH_TIERS: Record<TruthTier, {
  minScore: number;
  badge: string;
  color: string;
  alphaPriorityMinutes: number;
  feeSharePercent: number;
  description: string;
}> = {
  novice: {
    minScore: 0,
    badge: '📊',
    color: '#6B7280',     // Gray
    alphaPriorityMinutes: 0,
    feeSharePercent: 0,
    description: 'Just starting out',
  },
  visionary: {
    minScore: 1000,
    badge: '👁️',
    color: '#10B981',     // Green
    alphaPriorityMinutes: 0,
    feeSharePercent: 0,
    description: 'Showing potential',
  },
  seer: {
    minScore: 10000,
    badge: '🔮',
    color: '#8B5CF6',     // Purple
    alphaPriorityMinutes: 1,
    feeSharePercent: 5,
    description: 'Proven accuracy',
  },
  prophet: {
    minScore: 50000,
    badge: '⚡',
    color: '#F59E0B',     // Amber
    alphaPriorityMinutes: 3,
    feeSharePercent: 10,
    description: 'Exceptional foresight',
  },
  oracle: {
    minScore: 100000,
    badge: '✨',
    color: '#FFD700',     // Gold
    alphaPriorityMinutes: 5,
    feeSharePercent: 20,
    description: 'Legendary predictor',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_SCORE_CONFIG: TruthScoreConfig = {
  baseWinPoints: 10,
  baseLossPoints: -2,
  streakMultiplierBase: 1.1,
  maxStreakMultiplier: 3.0,
  earlyBonusCap: 200,
};

// ═══════════════════════════════════════════════════════════════════════════════
// CORE SCORE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate points earned from a single prediction result
 */
export function calculatePoints(
  result: PredictionResult,
  currentStreak: number,
  config: TruthScoreConfig = DEFAULT_SCORE_CONFIG
): ScoreCalculation {
  if (!result.isWin) {
    return {
      basePoints: config.baseLossPoints,
      confidenceMultiplier: 1,
      earlyBonus: 1,
      streakMultiplier: 1,
      totalPoints: config.baseLossPoints,
      breakdown: `Loss: ${config.baseLossPoints} points`,
    };
  }

  // Base win points
  const basePoints = config.baseWinPoints;

  // Confidence multiplier: bet size / average bet size
  // Betting more than average shows conviction
  const confidenceMultiplier = Math.max(1, result.betSize / Math.max(result.avgBetSize, 0.001));
  const cappedConfidence = Math.min(confidenceMultiplier, 5); // Cap at 5x

  // Early bonus: reward for being an early participant
  // Earlier position = higher multiplier
  const earlyRatio = result.totalParticipants / Math.max(result.positionNumber, 1);
  const earlyBonus = Math.min(earlyRatio, config.earlyBonusCap);

  // Streak multiplier: consecutive wins compound
  const rawStreakMultiplier = Math.pow(config.streakMultiplierBase, currentStreak);
  const streakMultiplier = Math.min(rawStreakMultiplier, config.maxStreakMultiplier);

  // Total points
  const totalPoints = Math.floor(basePoints * cappedConfidence * earlyBonus * streakMultiplier);

  // Human-readable breakdown
  const breakdown = [
    `Base: ${basePoints}`,
    `Confidence: ×${cappedConfidence.toFixed(2)}`,
    `Early bonus: ×${earlyBonus.toFixed(1)}`,
    `Streak (${currentStreak}): ×${streakMultiplier.toFixed(2)}`,
    `Total: ${totalPoints}`,
  ].join(' → ');

  return {
    basePoints,
    confidenceMultiplier: cappedConfidence,
    earlyBonus,
    streakMultiplier,
    totalPoints,
    breakdown,
  };
}

/**
 * Determine tier from score
 */
export function getTierFromScore(score: number): TruthTier {
  if (score >= TRUTH_TIERS.oracle.minScore) return 'oracle';
  if (score >= TRUTH_TIERS.prophet.minScore) return 'prophet';
  if (score >= TRUTH_TIERS.seer.minScore) return 'seer';
  if (score >= TRUTH_TIERS.visionary.minScore) return 'visionary';
  return 'novice';
}

/**
 * Get next tier threshold
 */
export function getNextTierThreshold(currentTier: TruthTier): number {
  const tiers: TruthTier[] = ['novice', 'visionary', 'seer', 'prophet', 'oracle'];
  const currentIndex = tiers.indexOf(currentTier);

  if (currentIndex >= tiers.length - 1) {
    return Infinity; // Already at max tier
  }

  return TRUTH_TIERS[tiers[currentIndex + 1]].minScore;
}

/**
 * Calculate tier progress percentage
 */
export function getTierProgress(score: number, currentTier: TruthTier): number {
  const currentThreshold = TRUTH_TIERS[currentTier].minScore;
  const nextThreshold = getNextTierThreshold(currentTier);

  if (nextThreshold === Infinity) return 100;

  const progress = ((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

/**
 * Get full Truth Score state for a user
 */
export function getTruthScoreState(
  totalScore: number,
  wins: number,
  losses: number,
  currentStreak: number,
  bestStreak: number
): TruthScoreState {
  const tier = getTierFromScore(totalScore);
  const tierConfig = TRUTH_TIERS[tier];

  return {
    totalScore,
    wins,
    losses,
    currentStreak,
    bestStreak,
    tier,
    tierProgress: getTierProgress(totalScore, tier),
    nextTierAt: getNextTierThreshold(tier),
    alphaPriorityMinutes: tierConfig.alphaPriorityMinutes,
    feeSharePercent: tierConfig.feeSharePercent,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALPHA-PRIORITY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export interface AlphaPriorityWindow {
  tier: TruthTier;
  opensAt: Date;
  closesAt: Date;
  isOpen: boolean;
}

/**
 * Get Alpha-Priority windows for a new market launch
 * Higher tiers get earlier access to bonding curves
 */
export function getAlphaPriorityWindows(
  marketLaunchTime: Date
): AlphaPriorityWindow[] {
  const tiers: TruthTier[] = ['oracle', 'prophet', 'seer'];
  const windows: AlphaPriorityWindow[] = [];

  let cumulativeMinutes = 0;

  // Oracle gets first access, then Prophet, then Seer
  for (const tier of tiers) {
    const tierConfig = TRUTH_TIERS[tier];
    if (tierConfig.alphaPriorityMinutes === 0) continue;

    const opensAt = new Date(marketLaunchTime.getTime() - (5 - cumulativeMinutes) * 60 * 1000);
    cumulativeMinutes += tierConfig.alphaPriorityMinutes;
    const closesAt = new Date(marketLaunchTime.getTime() - (5 - cumulativeMinutes) * 60 * 1000);

    windows.push({
      tier,
      opensAt,
      closesAt,
      isOpen: false, // Will be set based on current time
    });
  }

  return windows;
}

/**
 * Check if a user can access a market based on their tier
 */
export function canAccessMarket(
  userTier: TruthTier,
  marketLaunchTime: Date,
  currentTime: Date = new Date()
): { canAccess: boolean; waitTimeSeconds: number; reason: string } {
  const tierConfig = TRUTH_TIERS[userTier];
  const alphaPriorityMs = tierConfig.alphaPriorityMinutes * 60 * 1000;

  // User's access time = launch time - their alpha priority
  const accessTime = new Date(marketLaunchTime.getTime() - alphaPriorityMs);

  if (currentTime >= accessTime) {
    return {
      canAccess: true,
      waitTimeSeconds: 0,
      reason: `${userTier.charAt(0).toUpperCase() + userTier.slice(1)} access granted`,
    };
  }

  const waitTimeMs = accessTime.getTime() - currentTime.getTime();
  const waitTimeSeconds = Math.ceil(waitTimeMs / 1000);

  return {
    canAccess: false,
    waitTimeSeconds,
    reason: `${userTier.charAt(0).toUpperCase() + userTier.slice(1)} access in ${formatWaitTime(waitTimeSeconds)}`,
  };
}

/**
 * Format wait time for display
 */
function formatWaitTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEE SHARE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface FeeShareAllocation {
  tier: TruthTier;
  userCount: number;
  totalShare: number;      // Total % of fees for this tier
  perUserShare: number;    // % per user in this tier
}

/**
 * Calculate fee share allocation across tiers
 * Total fee share pool is 25% of protocol fees
 */
export function calculateFeeShareAllocations(
  tierCounts: Record<TruthTier, number>,
  totalFeesCollected: number,
  feeSharePoolPercent: number = 0.25
): FeeShareAllocation[] {
  const feeSharePool = totalFeesCollected * feeSharePoolPercent;
  const allocations: FeeShareAllocation[] = [];

  // Only tiers with fee share participate
  const participatingTiers: TruthTier[] = ['seer', 'prophet', 'oracle'];

  // Weight by tier fee share percent
  let totalWeight = 0;
  for (const tier of participatingTiers) {
    const count = tierCounts[tier] || 0;
    if (count > 0) {
      totalWeight += count * TRUTH_TIERS[tier].feeSharePercent;
    }
  }

  for (const tier of participatingTiers) {
    const count = tierCounts[tier] || 0;
    const tierFeePercent = TRUTH_TIERS[tier].feeSharePercent;

    if (count === 0 || tierFeePercent === 0) {
      allocations.push({
        tier,
        userCount: count,
        totalShare: 0,
        perUserShare: 0,
      });
      continue;
    }

    const tierWeight = count * tierFeePercent;
    const totalShare = (tierWeight / totalWeight) * feeSharePool;
    const perUserShare = totalShare / count;

    allocations.push({
      tier,
      userCount: count,
      totalShare,
      perUserShare,
    });
  }

  return allocations;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  truthScore: number;
  tier: TruthTier;
  winRate: number;
  currentStreak: number;
  roi: number;              // Return on investment %
}

/**
 * Calculate win rate
 */
export function calculateWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return (wins / total) * 100;
}

/**
 * Calculate ROI (for leaderboard - rewards skill, not just capital)
 */
export function calculateROI(totalPayout: number, totalInvested: number): number {
  if (totalInvested === 0) return 0;
  return ((totalPayout - totalInvested) / totalInvested) * 100;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHAREABLE STATS (for viral "I told you so" moments)
// ═══════════════════════════════════════════════════════════════════════════════

export interface ShareableStats {
  headline: string;         // "Called 12 in a row!"
  subtext: string;          // "Top 0.5% of predictors"
  badges: string[];         // Earned badges
  shareText: string;        // Pre-filled share text
}

/**
 * Generate shareable stats for social posts
 */
export function generateShareableStats(
  state: TruthScoreState,
  totalUsers: number
): ShareableStats {
  const percentile = calculatePercentile(state.totalScore, totalUsers);
  const tierConfig = TRUTH_TIERS[state.tier];

  // Calculate win rate
  const totalPredictions = state.wins + state.losses;
  const winRate = totalPredictions > 0 ? (state.wins / totalPredictions) * 100 : 0;

  // Generate headline based on achievements
  let headline = '';
  if (state.currentStreak >= 10) {
    headline = `🔥 ${state.currentStreak} correct predictions in a row!`;
  } else if (state.tier === 'oracle') {
    headline = `✨ Achieved Oracle status!`;
  } else if (winRate >= 70) {
    headline = `🎯 ${winRate.toFixed(0)}% accuracy!`;
  } else {
    headline = `${tierConfig.badge} ${state.tier.charAt(0).toUpperCase() + state.tier.slice(1)} Tier`;
  }

  const subtext = `Top ${percentile.toFixed(1)}% of predictors on Flex`;

  const badges: string[] = [];
  if (state.currentStreak >= 5) badges.push(`🔥 ${state.currentStreak} streak`);
  if (state.tier !== 'novice') badges.push(`${tierConfig.badge} ${state.tier}`);
  if (state.wins >= 50) badges.push('💯 50+ wins');
  if (state.bestStreak >= 10) badges.push('⚡ 10+ best streak');

  const shareText = `${headline}\n\n${subtext}\n\nProve your predictions on @FlexStream 🔮`;

  return {
    headline,
    subtext,
    badges,
    shareText,
  };
}

/**
 * Calculate percentile rank
 */
function calculatePercentile(score: number, totalUsers: number): number {
  // Simplified - in production would use actual distribution
  // Assuming normal distribution of scores
  if (score >= 100000) return 1;
  if (score >= 50000) return 5;
  if (score >= 10000) return 20;
  if (score >= 1000) return 50;
  return 80;
}

// Add missing winRate to TruthScoreState
interface ExtendedTruthScoreState extends TruthScoreState {
  winRate: number;
}

export function getExtendedTruthScoreState(
  totalScore: number,
  wins: number,
  losses: number,
  currentStreak: number,
  bestStreak: number
): ExtendedTruthScoreState {
  const baseState = getTruthScoreState(totalScore, wins, losses, currentStreak, bestStreak);
  return {
    ...baseState,
    winRate: calculateWinRate(wins, losses),
  };
}
