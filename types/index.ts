export interface User {
  id: string
  wallet_address: string
  username: string
  display_name: string
  avatar_url?: string
  banner_url?: string
  cover_url?: string
  bio?: string
  verified: boolean
  verified_earnings: number
  success_tier: 'bronze' | 'silver' | 'gold' | 'diamond'
  total_followers: number
  total_following: number
  followers_count?: number
  following_count?: number
  website_url?: string
  website?: string
  twitter_handle?: string
  twitter?: string
  telegram_handle?: string
  discord_handle?: string
  youtube_channel?: string
  instagram?: string
  tiktok?: string
  created_at: string
  updated_at: string

  // Social verification fields
  twitter_verified?: boolean
  twitter_followers?: number
  twitter_verified_at?: string
  youtube_verified?: boolean
  youtube_subscribers?: number
  youtube_channel_name?: string
  youtube_channel_id?: string
  youtube_verified_at?: string
  tiktok_verified?: boolean
  tiktok_followers?: number
  tiktok_verified_at?: string

  // Trust score
  trust_score?: number
  last_social_activity?: string

  // Analytics fields
  total_post_views?: number
  total_token_volume?: number
  total_trading_fees_earned?: number

  // Creator coin fields
  creator_coin_enabled?: boolean
  creator_coin_mint?: string
  creator_coin_pool?: string
  creator_coin_metadata_uri?: string
}

export interface FlexPost {
  id: string
  user_id: string
  type: 'earnings_flex' | 'stream_highlight' | 'lifestyle' | 'trading_journey'
  title?: string
  content: string
  media_urls: string[]
  social_link?: string
  earnings_amount?: number
  token_mint?: string // Token mint address (Solana address)
  token_symbol?: string // Auto-generated unique symbol (e.g., T5K9P_A7M3X)
  token_display_name?: string // User's chosen display name (can be duplicate, e.g., PEPE)
  token_is_verified?: boolean // True if this is the first token with this display_name
  creator_is_verified?: boolean // True if creator has custom avatar + X OAuth verification
  pool_address?: string // DBC pool address for trading
  content_category?: string // Content category (movie, album, etc.) - only for token posts
  content_link?: string // Link to the content (URL) - only for token posts
  token_utility_description?: string // Description of token utility - only for token posts
  verified: boolean
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  updated_at: string
  user?: User
  is_liked?: boolean
  is_following?: boolean
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  parent_id?: string
  content: string
  created_at: string
  updated_at: string
  user?: User
  replies?: Comment[]
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
  user?: User
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  follower?: User
  following?: User
}

export interface Notification {
  id: string
  user_id: string
  type: 'like' | 'comment' | 'follow' | 'mention'
  from_user_id: string
  post_id?: string
  read: boolean
  created_at: string
  from_user?: User
  post?: FlexPost
}

export interface EarningsVerification {
  id: string
  user_id: string
  post_id: string
  wallet_address: string
  claimed_amount: number
  verified_amount?: number
  verification_status: 'pending' | 'verified' | 'rejected'
  pump_fun_tx_hash?: string
  verification_date?: string
  created_at: string
  updated_at: string
  user?: User
  post?: FlexPost
}

export interface Hashtag {
  id: string
  name: string
  post_count: number
  trending_score: number
}

export interface Subscription {
  id: string
  user_id: string
  plan_type: 'flex_pro' | 'creator_premium'
  price_monthly: number
  features: string[]
  active: boolean
}

export interface PostType {
  value: 'earnings_flex' | 'stream_highlight' | 'lifestyle' | 'trading_journey'
  label: string
  icon: string
  description: string
  color: string
}

export const POST_TYPES: PostType[] = [
  {
    value: 'earnings_flex',
    label: 'Earnings Flex',
    icon: '💰',
    description: 'Show off your trading profits',
    color: 'text-green-500'
  },
  {
    value: 'stream_highlight',
    label: 'Stream Highlight',
    icon: '🎥',
    description: 'Share your best stream moments',
    color: 'text-purple-500'
  },
  {
    value: 'lifestyle',
    label: 'Lifestyle',
    icon: '✨',
    description: 'Share your crypto lifestyle',
    color: 'text-pink-500'
  },
  {
    value: 'trading_journey',
    label: 'Trading Journey',
    icon: '📈',
    description: 'Document your trading progress',
    color: 'text-blue-500'
  }
]

export interface CreatePostData {
  type: 'earnings_flex' | 'stream_highlight' | 'lifestyle' | 'trading_journey'
  content: string
  media_urls?: string[]
  social_link?: string
  earnings_amount?: number
  token_address?: string
}

export interface UpdateProfileData {
  display_name: string
  bio?: string
  avatar_url?: string
}

export interface SearchResult {
  users: User[]
  posts: FlexPost[]
  hashtags: Hashtag[]
}

export interface LeaderboardEntry {
  user: User
  earnings: number
  rank: number
  period: 'week' | 'month' | 'all'
}

export interface FeedFilter {
  type?: 'earnings_flex' | 'stream_highlight' | 'lifestyle' | 'trading_journey'
  verified?: boolean
  min_earnings?: number
  max_earnings?: number
  time_range?: 'day' | 'week' | 'month' | 'all'
}

export interface LinkPreview {
  title: string
  description: string
  image: string
  url: string
  domain: string
}

// Pump.fun Live Stream Types
export interface PumpFunToken {
  mint: string
  name: string
  symbol: string
  description?: string
  image_uri?: string
  metadata_uri?: string
  creator: string
  created_timestamp: number
  complete: boolean
  virtual_sol_reserves: number
  virtual_token_reserves: number
  real_sol_reserves: number
  real_token_reserves: number
  total_supply: number
  market_cap?: number
  price_usd?: number
  price_sol?: number
  volume_24h?: number
  holders_count?: number
  is_live_streaming?: boolean
  stream_url?: string
  streamer_info?: {
    username: string
    display_name: string
    avatar_url?: string
    followers_count: number
  }
  // Additional token data
  decimals?: number
  website?: string
  twitter?: string
  telegram?: string
  last_trade_timestamp?: number
  // DexScreener enhanced data
  enhanced_with_dexscreener?: boolean
  enhanced_with_helius?: boolean
  liquidity_usd?: number
  liquidity_base?: number
  liquidity_quote?: number
  volume_6h?: number
  volume_1h?: number
  price_change_6h?: number
  price_change_1h?: number
  price_change_24h?: number
  trades_6h?: number
  trades_1h?: number
  trades_24h?: number
  fdv?: number
  circulating_supply?: number
  dex_info?: {
    dex_id?: string
    pair_address?: string
    pair_url?: string
    pair_created_at?: number
    base_token?: any
    quote_token?: any
  }
}

export interface PumpFunTrade {
  signature: string
  mint: string
  timestamp: number
  type: 'buy' | 'sell'
  amount_sol: number
  amount_tokens: number
  price_per_token: number
  user: string
  slippage?: number
  fee?: number
}

export interface PumpFunLiveStream {
  token: PumpFunToken
  streamer: {
    username: string
    display_name: string
    avatar_url?: string
    wallet_address: string
    followers_count: number
    verified: boolean
  }
  stream_info: {
    title: string
    description?: string
    thumbnail_url?: string
    viewer_count: number
    started_at: number
    platform: 'twitch' | 'youtube' | 'kick' | 'other'
    stream_url: string
    stream_id?: string
    stream_status?: string
    stream_category?: string
  }
  trading_activity: {
    total_volume_24h: number
    trades_count_24h: number
    price_change_24h: number
    market_cap: number
    volume_1h?: number
    volume_7d?: number
    price_change_1h?: number
    price_change_6h?: number
    price_change_7d?: number
    high_24h?: number
    low_24h?: number
    liquidity?: number
    buy_volume_24h?: number
    sell_volume_24h?: number
  }
  is_active: boolean
  social_links?: {
    website?: string
    twitter?: string
    telegram?: string
    discord?: string
  }
  metadata?: {
    tags?: string[]
    risk_score?: number
    trending_score?: number
  }
}

export interface PumpFunStreamFilter {
  min_viewers?: number
  max_viewers?: number
  min_market_cap?: number
  max_market_cap?: number
  min_volume_24h?: number
  max_volume_24h?: number
  platform?: 'twitch' | 'youtube' | 'kick' | 'all'
  verified_streamers_only?: boolean
  price_change_direction?: 'up' | 'down' | 'all'
}

// Social Verification Types
export interface SocialVerification {
  platform: 'twitter' | 'youtube' | 'tiktok'
  verified: boolean
  username?: string
  followers?: number
  verifiedAt?: string
}

export interface UserAnalytics {
  // Overview
  trustScore: number
  successTier: 'bronze' | 'silver' | 'gold' | 'diamond'

  // Social verification
  socialVerification: {
    twitter: {
      verified: boolean
      username: string | null
      followers: number
      verifiedAt?: string
    }
    youtube: {
      verified: boolean
      channelName: string | null
      subscribers: number
      verifiedAt?: string
    }
    tiktok: {
      verified: boolean
      username: string | null
      followers: number
      verifiedAt?: string
    }
  }
  totalSocialFollowers: number

  // Followers
  followers: {
    total: number
    following: number
    newInPeriod: number
  }

  // Content
  content: {
    totalPosts: number
    totalLikes: number
    totalComments: number
    totalShares: number
    engagementRate: number
    tokensCreated: number
  }

  // Trading
  trading: {
    totalTrades: number
    totalVolumeSol: string
    buyTrades: number
    sellTrades: number
    feesEarned: number
  }

  // Charts data
  chartData: Array<{
    date: string
    posts?: number
    likes?: number
    followers?: number
    volume?: number
  }>

  // Period info
  period: '7d' | '30d' | 'all'
  startDate: string
  endDate: string
}

// FLEX Points Types
export type FlexAction =
  | 'login'
  | 'post'
  | 'like'
  | 'comment'
  | 'share'
  | 'watch'
  | 'trade'
  | 'first_trade'
  | 'streak_bonus'

export interface FlexPoints {
  id: string
  user_id: string
  total_flex: number
  available_flex: number
  current_streak: number
  longest_streak: number
  last_active_date: string | null
  created_at: string
  updated_at: string
}

export interface FlexTransaction {
  id: string
  user_id: string
  action: FlexAction
  amount: number
  multiplier: number
  final_amount: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface FlexMultiplier {
  id: string
  name: string
  multiplier: number
  starts_at: string
  ends_at: string
  active: boolean
  created_at: string
}

export interface FlexBalance {
  total_flex: number
  available_flex: number
  period_flex: number
  current_streak: number
  longest_streak: number
  today_earned: number
  rank: number
  active_multiplier: number
}

export interface FlexAirdrop {
  id: string
  period_start: string
  period_end: string
  total_points_distributed: number
  total_tokens_minted: number
  conversion_rate: number
  participants_count: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  tx_signature?: string
  created_at: string
  completed_at?: string
}

export interface FlexAirdropClaim {
  id: string
  airdrop_id: string
  user_id: string
  points_snapshot: number
  tokens_received: number
  claimed: boolean
  claimed_at?: string
  tx_signature?: string
  created_at: string
}

export interface FlexLeaderboardEntry {
  user: User
  total_flex: number
  rank: number
}

export const FLEX_REWARDS: Record<FlexAction, { base: number; max_daily: number; description: string }> = {
  login: { base: 10, max_daily: 10, description: 'Daily login bonus' },
  post: { base: 50, max_daily: 250, description: 'Create a post' },
  like: { base: 5, max_daily: 250, description: 'Like a post' },
  comment: { base: 15, max_daily: 300, description: 'Comment on a post' },
  share: { base: 20, max_daily: 200, description: 'Share a post' },
  watch: { base: 10, max_daily: 200, description: 'Watch a video' },
  trade: { base: 25, max_daily: 250, description: 'Make a trade' },
  first_trade: { base: 100, max_daily: 100, description: 'First trade bonus' },
  streak_bonus: { base: 0, max_daily: 0, description: 'Streak multiplier bonus' },
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED PREDICTION MARKETS TYPES
// Combines Kalshi + DFlow for seamless prediction trading on Solana
// ═══════════════════════════════════════════════════════════════════════════════

export type PredictionSource = 'kalshi' | 'dflow' | 'polymarket';
export type MarketStatus = 'open' | 'closed' | 'settled';
export type PredictionSide = 'yes' | 'no';

/**
 * Unified market representation combining Kalshi + DFlow data
 */
export interface UnifiedMarket {
  // Core identifiers
  ticker: string;
  eventTicker: string;
  title: string;
  subtitle?: string;

  // Status
  status: MarketStatus;
  isLive: boolean;

  // Pricing (in cents, 0-100)
  yesPrice: number;
  noPrice: number;
  yesBid: number;
  yesAsk: number;
  noBid: number;
  noAsk: number;
  lastPrice: number;

  // Volume & liquidity
  volume: number;
  volume24h: number;
  openInterest?: number;
  liquidity?: number;

  // Timestamps
  openTime: string;
  closeTime: string;
  expirationTime: string;

  // Category & metadata
  category: string;
  tags?: string[];

  // Source information
  source: PredictionSource;
  kalshiTicker?: string;

  // DFlow-specific (for Solana trading)
  dflow?: {
    yesMint: string;      // YES token SPL address
    noMint: string;       // NO token SPL address
    marketLedger: string; // Settlement currency (USDC)
    isInitialized: boolean;
  };

  // Computed fields
  impliedProbability: number;  // 0-100
  potentialPayoutYes: number;  // Payout for $100 YES bet
  potentialPayoutNo: number;   // Payout for $100 NO bet
  timeRemaining: string;       // Human readable

  // Arbitrage opportunity (when Kalshi vs DFlow prices differ)
  arbitrage?: {
    spreadPercent: number;
    direction: 'buy_dflow' | 'buy_kalshi';
    opportunity: boolean;
  };
}

/**
 * User's prediction position
 */
export interface PredictionPosition {
  id: string;
  marketTicker: string;
  marketTitle: string;
  side: PredictionSide;

  // Position details
  shares: number;
  entryPrice: number;      // Average entry price (cents)
  currentPrice: number;    // Current market price
  stakeAmount: number;     // USDC invested
  currentValue: number;    // Current USDC value

  // P&L
  unrealizedPnl: number;
  unrealizedPnlPercent: number;

  // DFlow token tracking
  dflowMint?: string;      // YES or NO mint address
  txSignature?: string;    // Original transaction

  // Status
  status: 'active' | 'won' | 'lost' | 'sold';
  createdAt: string;
  updatedAt: string;
}

/**
 * Trade request for DFlow execution
 */
export interface PredictionTradeRequest {
  marketTicker: string;
  side: PredictionSide;
  amountUsdc: number;
  userPublicKey: string;
  slippageBps?: number;  // Default 100 (1%)
}

/**
 * Trade response with transaction to sign
 */
export interface PredictionTradeResponse {
  success: boolean;
  trade?: {
    transaction: string;      // Base64 encoded VersionedTransaction
    inputAmount: string;      // USDC amount (micro units)
    outputAmount: string;     // Token amount received
    pricePerToken: number;    // Price in cents
    priceImpact: number;      // Slippage %
    fee: number;              // Trading fee
    estimatedPayout: number;  // If prediction wins
  };
  error?: string;
}

/**
 * Trade confirmation after signing
 */
export interface PredictionTradeConfirmation {
  success: boolean;
  position?: PredictionPosition;
  txSignature?: string;
  flexScoreChange?: number;
  error?: string;
}

/**
 * Market discovery filters
 */
export interface MarketFilters {
  category?: string;
  status?: MarketStatus;
  source?: PredictionSource;
  search?: string;
  sortBy?: 'volume' | 'newest' | 'closing' | 'probability';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  // FOMO filters
  minVolume?: number;
  hasArbitrage?: boolean;
  endingSoon?: boolean;  // Within 24 hours
}

/**
 * Unified markets API response
 */
export interface UnifiedMarketsResponse {
  markets: UnifiedMarket[];
  total: number;
  hasMore: boolean;
  sources: {
    kalshi: { count: number; status: 'ok' | 'error' };
    dflow: { count: number; status: 'ok' | 'error' };
  };
  lastUpdated: string;
}

/**
 * User's portfolio summary
 */
export interface PredictionPortfolio {
  positions: PredictionPosition[];
  totalValue: number;
  totalInvested: number;
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  activePositions: number;
  settledPositions: number;
}

/**
 * Social proof for a market
 */
export interface MarketSocialProof {
  marketTicker: string;
  totalBettors: number;
  friendsBetting: Array<{
    user: Pick<User, 'id' | 'username' | 'avatar_url'>;
    side: PredictionSide;
  }>;
  topPredictors: Array<{
    user: Pick<User, 'id' | 'username' | 'avatar_url'>;
    side: PredictionSide;
    flexScore: number;
  }>;
  volumeLast24h: number;
  sentiment: {
    yesPercent: number;
    noPercent: number;
  };
}

/**
 * Category definitions for UI
 */
export const PREDICTION_CATEGORIES = [
  { id: 'trending', label: 'Trending', icon: '🔥', color: 'from-orange-500 to-red-500' },
  { id: 'all', label: 'All', icon: '📊', color: 'from-gray-500 to-gray-600' },
  { id: 'crypto', label: 'Crypto', icon: '₿', color: 'from-orange-500 to-amber-600' },
  { id: 'politics', label: 'Politics', icon: '🏛️', color: 'from-blue-500 to-indigo-600' },
  { id: 'economics', label: 'Economics', icon: '📈', color: 'from-emerald-500 to-teal-600' },
  { id: 'tech', label: 'Tech', icon: '🤖', color: 'from-cyan-500 to-blue-600' },
  { id: 'sports', label: 'Sports', icon: '⚽', color: 'from-green-500 to-lime-600' },
  { id: 'climate', label: 'Climate', icon: '🌍', color: 'from-blue-400 to-cyan-500' },
  { id: 'companies', label: 'Companies', icon: '🏢', color: 'from-purple-500 to-pink-500' },
] as const;

export type PredictionCategory = typeof PREDICTION_CATEGORIES[number]['id'];
