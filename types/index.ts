export interface User {
  id: string
  wallet_address: string
  username: string
  display_name: string
  avatar_url?: string
  banner_url?: string
  bio?: string
  verified: boolean
  verified_earnings: number
  success_tier: 'bronze' | 'silver' | 'gold' | 'diamond'
  total_followers: number
  total_following: number
  followers_count?: number
  following_count?: number
  website_url?: string
  twitter_handle?: string
  telegram_handle?: string
  discord_handle?: string
  youtube_channel?: string
  created_at: string
  updated_at: string
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
  token_address?: string
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
