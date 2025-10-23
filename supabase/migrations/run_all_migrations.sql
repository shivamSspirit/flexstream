-- ============================================
-- FlexStream Complete Database Migration
-- Run this script in Supabase SQL Editor
-- ============================================

-- STEP 1: Initial Schema
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
  CREATE TYPE success_tier AS ENUM ('bronze', 'silver', 'gold', 'diamond');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE post_type AS ENUM ('earnings_flex', 'stream_highlight', 'lifestyle', 'trading_journey');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('like', 'comment', 'follow', 'mention');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  verified_earnings DECIMAL(20,8) DEFAULT 0,
  success_tier success_tier DEFAULT 'bronze',
  total_followers INTEGER DEFAULT 0,
  total_following INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type post_type NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  earnings_amount DECIMAL(20,8),
  token_address TEXT,
  verified BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID,
  following_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  post_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  post_id UUID,
  parent_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  type notification_type NOT NULL,
  from_user_id UUID,
  post_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Earnings verifications table
CREATE TABLE IF NOT EXISTS earnings_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  post_id UUID,
  wallet_address TEXT NOT NULL,
  claimed_amount DECIMAL(20,8) NOT NULL,
  verified_amount DECIMAL(20,8),
  verification_status verification_status DEFAULT 'pending',
  pump_fun_tx_hash TEXT,
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Add wallet fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS encrypted_private_key TEXT,
ADD COLUMN IF NOT EXISTS wallet_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- STEP 3: Add token fields to posts
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS token_mint TEXT,
ADD COLUMN IF NOT EXISTS token_symbol TEXT,
ADD COLUMN IF NOT EXISTS token_name TEXT,
ADD COLUMN IF NOT EXISTS pool_address TEXT,
ADD COLUMN IF NOT EXISTS bonding_curve_address TEXT,
ADD COLUMN IF NOT EXISTS token_metadata_uri TEXT,
ADD COLUMN IF NOT EXISTS initial_market_cap DECIMAL,
ADD COLUMN IF NOT EXISTS current_market_cap DECIMAL,
ADD COLUMN IF NOT EXISTS token_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS token_signature TEXT,
ADD COLUMN IF NOT EXISTS is_token_tradable BOOLEAN DEFAULT false;

-- STEP 4: Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mint_address TEXT UNIQUE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_uri TEXT,
  metadata_uri TEXT,
  creator_wallet TEXT NOT NULL,
  post_id UUID,
  pool_address TEXT UNIQUE NOT NULL,
  bonding_curve_address TEXT,
  config_key TEXT DEFAULT 'GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF',

  -- Supply info
  initial_supply BIGINT,
  current_supply BIGINT,
  virtual_base_reserves BIGINT,
  virtual_quote_reserves BIGINT,

  -- Market data
  market_cap DECIMAL DEFAULT 0,
  price_usd DECIMAL DEFAULT 0,
  price_sol DECIMAL DEFAULT 0,
  volume_24h DECIMAL DEFAULT 0,
  volume_total DECIMAL DEFAULT 0,
  holders_count INT DEFAULT 0,
  trades_count INT DEFAULT 0,

  -- Status
  is_tradable BOOLEAN DEFAULT true,
  is_migrated BOOLEAN DEFAULT false,
  migrated_at TIMESTAMP,

  -- Transaction info
  creation_signature TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create token_trades table
CREATE TABLE IF NOT EXISTS token_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID,
  mint_address TEXT NOT NULL,
  pool_address TEXT NOT NULL,

  -- Trade details
  signature TEXT UNIQUE NOT NULL,
  trader_wallet TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),

  -- Amounts
  base_amount BIGINT NOT NULL,
  quote_amount BIGINT NOT NULL,
  price_per_token DECIMAL,

  -- Fees
  fee_amount BIGINT DEFAULT 0,

  -- Timestamps
  block_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- STEP 5: Create all indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_token_mint ON posts(token_mint);
CREATE INDEX IF NOT EXISTS idx_posts_pool_address ON posts(pool_address);
CREATE INDEX IF NOT EXISTS idx_posts_tradable ON posts(is_token_tradable) WHERE is_token_tradable = true;

CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

CREATE INDEX IF NOT EXISTS idx_tokens_mint ON tokens(mint_address);
CREATE INDEX IF NOT EXISTS idx_tokens_pool ON tokens(pool_address);
CREATE INDEX IF NOT EXISTS idx_tokens_post ON tokens(post_id);
CREATE INDEX IF NOT EXISTS idx_tokens_creator ON tokens(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_tokens_tradable ON tokens(is_tradable) WHERE is_tradable = true;
CREATE INDEX IF NOT EXISTS idx_tokens_market_cap ON tokens(market_cap DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_created ON tokens(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_token_trades_token ON token_trades(token_id);
CREATE INDEX IF NOT EXISTS idx_token_trades_mint ON token_trades(mint_address);
CREATE INDEX IF NOT EXISTS idx_token_trades_trader ON token_trades(trader_wallet);

-- STEP 6: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_trades ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create RLS policies (allow all for now - secure in app layer)
DROP POLICY IF EXISTS "Allow all operations" ON users;
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON posts;
CREATE POLICY "Allow all operations" ON posts FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON follows;
CREATE POLICY "Allow all operations" ON follows FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON likes;
CREATE POLICY "Allow all operations" ON likes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON comments;
CREATE POLICY "Allow all operations" ON comments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON notifications;
CREATE POLICY "Allow all operations" ON notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON earnings_verifications;
CREATE POLICY "Allow all operations" ON earnings_verifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON tokens;
CREATE POLICY "Allow all operations" ON tokens FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON token_trades;
CREATE POLICY "Allow all operations" ON token_trades FOR ALL USING (true);

-- STEP 8: Create helper functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 9: Create triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tokens_updated_at ON tokens;
CREATE TRIGGER update_tokens_updated_at
    BEFORE UPDATE ON tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 10: Create views
CREATE OR REPLACE VIEW token_leaderboard AS
SELECT
  t.id,
  t.mint_address,
  t.symbol,
  t.name,
  t.image_uri,
  t.creator_wallet,
  t.pool_address,
  t.market_cap,
  t.volume_24h,
  t.volume_total,
  t.holders_count,
  t.trades_count,
  t.created_at,
  p.id as post_id,
  p.content as post_content,
  p.media_urls as post_media,
  u.username as creator_username,
  u.avatar_url as creator_avatar
FROM tokens t
LEFT JOIN posts p ON t.post_id = p.id
LEFT JOIN users u ON t.creator_wallet = u.wallet_address
WHERE t.is_tradable = true
ORDER BY t.market_cap DESC;

-- ============================================
-- Migration Complete!
-- ============================================

SELECT 'Migration completed successfully!' as status;
