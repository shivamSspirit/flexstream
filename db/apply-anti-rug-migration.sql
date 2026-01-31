-- =====================================================
-- COMBINED MIGRATION: DBC Token Support + Anti-Rug
-- =====================================================
-- Run this file to apply both migrations in the correct order

-- STEP 1: Create tokens table (from add_dbc_token_support.sql)
-- =====================================================

-- Add DBC token fields to posts table
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_token_mint ON posts(token_mint);
CREATE INDEX IF NOT EXISTS idx_posts_pool_address ON posts(pool_address);
CREATE INDEX IF NOT EXISTS idx_posts_tradable ON posts(is_token_tradable) WHERE is_token_tradable = true;

-- Create tokens table for better tracking and analytics
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mint_address TEXT UNIQUE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_uri TEXT,
  metadata_uri TEXT,
  creator_wallet TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
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

-- Create indexes for tokens table
CREATE INDEX IF NOT EXISTS idx_tokens_mint ON tokens(mint_address);
CREATE INDEX IF NOT EXISTS idx_tokens_pool ON tokens(pool_address);
CREATE INDEX IF NOT EXISTS idx_tokens_post ON tokens(post_id);
CREATE INDEX IF NOT EXISTS idx_tokens_creator ON tokens(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_tokens_tradable ON tokens(is_tradable) WHERE is_tradable = true;
CREATE INDEX IF NOT EXISTS idx_tokens_market_cap ON tokens(market_cap DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_volume ON tokens(volume_24h DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_created ON tokens(created_at DESC);

-- Create token trades table for tracking transactions
CREATE TABLE IF NOT EXISTS token_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID REFERENCES tokens(id) ON DELETE CASCADE,
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

-- Create indexes for token_trades table
CREATE INDEX IF NOT EXISTS idx_token_trades_token ON token_trades(token_id);
CREATE INDEX IF NOT EXISTS idx_token_trades_mint ON token_trades(mint_address);
CREATE INDEX IF NOT EXISTS idx_token_trades_trader ON token_trades(trader_wallet);
CREATE INDEX IF NOT EXISTS idx_token_trades_type ON token_trades(trade_type);
CREATE INDEX IF NOT EXISTS idx_token_trades_time ON token_trades(block_time DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tokens table
DROP TRIGGER IF EXISTS update_tokens_updated_at ON tokens;
CREATE TRIGGER update_tokens_updated_at
    BEFORE UPDATE ON tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE tokens IS 'Stores information about DBC tokens created from posts';
COMMENT ON TABLE token_trades IS 'Tracks all buy/sell transactions for DBC tokens';


-- STEP 2: Add Anti-Rug Mechanism
-- =====================================================

-- Add new columns to tokens table for anti-rug mechanism
ALTER TABLE tokens
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add new columns to posts table for easier querying (denormalized for performance)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS token_display_name TEXT,
ADD COLUMN IF NOT EXISTS token_is_verified BOOLEAN DEFAULT false;

-- Create index for display_name lookups (for verification checks)
CREATE INDEX IF NOT EXISTS idx_tokens_display_name ON tokens(display_name);
CREATE INDEX IF NOT EXISTS idx_tokens_verified ON tokens(is_verified) WHERE is_verified = true;

-- Update existing tokens to use symbol as display_name initially
UPDATE tokens
SET display_name = symbol
WHERE display_name IS NULL;

-- Function to check if a display name already exists and mark first as verified
CREATE OR REPLACE FUNCTION check_and_verify_display_name()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INT;
BEGIN
  -- Check if this is the first token with this display_name
  SELECT COUNT(*) INTO existing_count
  FROM tokens
  WHERE LOWER(display_name) = LOWER(NEW.display_name)
  AND id != NEW.id;

  -- If this is the first token with this display_name, mark as verified
  IF existing_count = 0 THEN
    NEW.is_verified = true;
  ELSE
    NEW.is_verified = false;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically verify first token with a display name
DROP TRIGGER IF EXISTS verify_token_display_name ON tokens;
CREATE TRIGGER verify_token_display_name
  BEFORE INSERT OR UPDATE OF display_name ON tokens
  FOR EACH ROW
  EXECUTE FUNCTION check_and_verify_display_name();

-- Create/Update the token_leaderboard view to include display_name and verification
DROP VIEW IF EXISTS token_leaderboard;
CREATE OR REPLACE VIEW token_leaderboard AS
SELECT
  t.id,
  t.mint_address,
  t.symbol,
  t.name,
  t.display_name,
  t.is_verified,
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

-- Create/Update the trending_tokens view to include display_name and verification
DROP VIEW IF EXISTS trending_tokens;
CREATE OR REPLACE VIEW trending_tokens AS
SELECT
  t.id,
  t.mint_address,
  t.symbol,
  t.name,
  t.display_name,
  t.is_verified,
  t.image_uri,
  t.pool_address,
  t.market_cap,
  t.volume_24h,
  t.holders_count,
  t.trades_count,
  t.created_at,
  COUNT(tt.id) as recent_trades_count
FROM tokens t
LEFT JOIN token_trades tt ON t.id = tt.token_id
  AND tt.created_at > NOW() - INTERVAL '1 hour'
WHERE t.is_tradable = true
GROUP BY t.id
ORDER BY recent_trades_count DESC, t.volume_24h DESC
LIMIT 100;

-- Add comments for documentation
COMMENT ON COLUMN tokens.display_name IS 'User-chosen display name that can be duplicate (e.g., PEPE)';
COMMENT ON COLUMN tokens.is_verified IS 'True if this is the first token with this display_name (official token)';
COMMENT ON COLUMN tokens.symbol IS 'Auto-generated unique ticker (e.g., POST_ABC123_1)';
COMMENT ON VIEW token_leaderboard IS 'Top tokens by market cap with creator info and verification status';
COMMENT ON VIEW trending_tokens IS 'Trending tokens based on recent activity with verification status';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify the migration
SELECT
  'Tokens table' as object,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tokens')
    THEN '✓ Created' ELSE '✗ Missing' END as status
UNION ALL
SELECT
  'display_name column',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'display_name')
    THEN '✓ Added' ELSE '✗ Missing' END
UNION ALL
SELECT
  'is_verified column',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'is_verified')
    THEN '✓ Added' ELSE '✗ Missing' END
UNION ALL
SELECT
  'Anti-rug trigger',
  CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'verify_token_display_name')
    THEN '✓ Created' ELSE '✗ Missing' END;
