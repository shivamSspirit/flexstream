/**
 * Flexit Prediction Market Components
 *
 * "The Oracle of Solana" - Social Prediction Layer
 *
 * Design System:
 * - Obsidian Vault aesthetic (dark, sophisticated, crypto-native)
 * - Mint Frost (#E0FF62) as primary accent ("Oracle Glow")
 * - Gold (#FFD700) for YES positions
 * - Silver (#C0C0C0) for NO positions
 * - No generic red/green trading colors
 * - Serif typography for gravitas (Cormorant Garabond)
 * - Monospace for data precision (IBM Plex Mono)
 * - Noise textures for depth
 * - Hairline borders, dramatic shadows
 */

// Core prediction card
export { OracleCard } from './OracleCard';

// Challenge system - stake against friends
export { ChallengeModal } from './ChallengeModal';

// Flex Score - shareable accuracy card
export { FlexScoreCard } from './FlexScoreCard';

// Leaderboard - top predictors ranking
export { OracleLeaderboard } from './OracleLeaderboard';

// Squad Markets - private group predictions
export { SquadMarket, CreateSquadMarketModal } from './SquadMarket';

// Social proof - friends betting indicator
export { SocialProofBadge, FriendActivityNotification } from './SocialProofBadge';

// Win streak - animated streak display
export { WinStreakBadge, WinStreakCelebration } from './WinStreakBadge';
