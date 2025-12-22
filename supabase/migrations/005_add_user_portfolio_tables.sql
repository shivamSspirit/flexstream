-- =====================================================
-- MIGRATION: User Portfolio & Trading History Tables
-- =====================================================
-- This migration adds tables to track user holdings and trading activity
-- for the Portfolio/Collectibles dashboard feature

-- STEP 1: Create user_token_holdings table
-- =====================================================
-- This table tracks what tokens each user currently owns

CREATE TABLE IF NOT EXISTS user_token_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User identification
  user_id TEXT NOT NULL,  -- Can be wallet address or user.id
  wallet_address TEXT NOT NULL,

  -- Token identification
  token_id UUID REFERENCES tokens(id) ON DELETE CASCADE,
  token_mint TEXT NOT NULL,

  -- Holdings information
  quantity_owned BIGINT NOT NULL DEFAULT 0,
  average_cost_basis DECIMAL DEFAULT 0,  -- Average price paid per token
  total_invested DECIMAL DEFAULT 0,      -- Total amount spent in SOL

  -- Tracking
  first_acquired_at TIMESTAMP DEFAULT NOW(),
  last_updated_at TIMESTAMP DEFAULT NOW(),

  -- Performance
  realized_pnl DECIMAL DEFAULT 0,  -- Profit/loss from sales

  created_at TIMESTAMP DEFAULT NOW(),

  -- Ensure one row per user per token
  UNIQUE(wallet_address, token_mint)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_holdings_wallet ON user_token_holdings(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_holdings_token ON user_token_holdings(token_id);
CREATE INDEX IF NOT EXISTS idx_user_holdings_token_mint ON user_token_holdings(token_mint);
CREATE INDEX IF NOT EXISTS idx_user_holdings_quantity ON user_token_holdings(quantity_owned) WHERE quantity_owned > 0;
CREATE INDEX IF NOT EXISTS idx_user_holdings_updated ON user_token_holdings(last_updated_at DESC);

COMMENT ON TABLE user_token_holdings IS 'Tracks current token holdings for each user with cost basis';
COMMENT ON COLUMN user_token_holdings.average_cost_basis IS 'Weighted average price paid per token in SOL';
COMMENT ON COLUMN user_token_holdings.realized_pnl IS 'Total profit/loss from tokens already sold';


-- STEP 2: Create user_trading_history table
-- =====================================================
-- This table tracks all buy/sell transactions for each user

CREATE TABLE IF NOT EXISTS user_trading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User identification
  user_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,

  -- Token identification
  token_id UUID REFERENCES tokens(id) ON DELETE CASCADE,
  token_mint TEXT NOT NULL,

  -- Trade details
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell', 'swap')),

  -- Amounts
  quantity BIGINT NOT NULL,              -- Number of tokens bought/sold
  price_per_token DECIMAL NOT NULL,       -- Price per token in SOL
  total_sol_amount DECIMAL NOT NULL,      -- Total SOL spent/received
  total_usd_value DECIMAL,                -- USD value at time of trade

  -- Fees
  fee_amount DECIMAL DEFAULT 0,           -- Platform + network fees in SOL

  -- Transaction info
  signature TEXT UNIQUE NOT NULL,         -- Solana transaction signature
  block_time TIMESTAMP,                   -- Blockchain timestamp

  -- Status
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed')),

  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_trading_history_wallet ON user_trading_history(wallet_address);
CREATE INDEX IF NOT EXISTS idx_trading_history_token ON user_trading_history(token_id);
CREATE INDEX IF NOT EXISTS idx_trading_history_token_mint ON user_trading_history(token_mint);
CREATE INDEX IF NOT EXISTS idx_trading_history_type ON user_trading_history(trade_type);
CREATE INDEX IF NOT EXISTS idx_trading_history_time ON user_trading_history(block_time DESC);
CREATE INDEX IF NOT EXISTS idx_trading_history_created ON user_trading_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_history_signature ON user_trading_history(signature);
CREATE INDEX IF NOT EXISTS idx_trading_history_user_time ON user_trading_history(wallet_address, created_at DESC);

COMMENT ON TABLE user_trading_history IS 'Complete trading history for all users';
COMMENT ON COLUMN user_trading_history.price_per_token IS 'Execution price in SOL per token';
COMMENT ON COLUMN user_trading_history.signature IS 'Solana transaction signature for verification';


-- STEP 3: Create triggers for automatic updates
-- =====================================================

-- Function to update last_updated_at timestamp on holdings
CREATE OR REPLACE FUNCTION update_holdings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_token_holdings
DROP TRIGGER IF EXISTS update_user_holdings_timestamp ON user_token_holdings;
CREATE TRIGGER update_user_holdings_timestamp
    BEFORE UPDATE ON user_token_holdings
    FOR EACH ROW
    EXECUTE FUNCTION update_holdings_timestamp();


-- STEP 4: Create views for portfolio analytics
-- =====================================================

-- View: User portfolio summary with current values
DROP VIEW IF EXISTS user_portfolio_summary;
CREATE OR REPLACE VIEW user_portfolio_summary AS
SELECT
  h.wallet_address,
  h.token_mint,
  h.token_id,
  t.symbol,
  t.name,
  t.display_name,
  t.image_uri,
  t.is_verified,

  -- Holdings
  h.quantity_owned,
  h.average_cost_basis,
  h.total_invested,

  -- Current market data
  t.price_sol as current_price_sol,
  t.price_usd as current_price_usd,

  -- Portfolio value
  (h.quantity_owned * t.price_sol) as current_value_sol,
  (h.quantity_owned * t.price_usd) as current_value_usd,

  -- Unrealized P&L
  ((h.quantity_owned * t.price_sol) - h.total_invested) as unrealized_pnl_sol,
  (((h.quantity_owned * t.price_sol) - h.total_invested) / NULLIF(h.total_invested, 0) * 100) as unrealized_pnl_percentage,

  -- Realized P&L
  h.realized_pnl,

  -- Total P&L
  (((h.quantity_owned * t.price_sol) - h.total_invested) + h.realized_pnl) as total_pnl,

  -- Metadata
  h.first_acquired_at,
  h.last_updated_at,
  t.created_at as token_created_at,

  -- Post info
  p.id as post_id,
  p.content as post_content,
  p.media_urls as post_media,

  -- Creator info
  u.username as creator_username,
  u.display_name as creator_display_name,
  u.avatar_url as creator_avatar

FROM user_token_holdings h
LEFT JOIN tokens t ON h.token_id = t.id
LEFT JOIN posts p ON t.post_id = p.id
LEFT JOIN users u ON t.creator_wallet = u.wallet_address
WHERE h.quantity_owned > 0
ORDER BY current_value_sol DESC;

COMMENT ON VIEW user_portfolio_summary IS 'Complete portfolio view with current values and P&L calculations';


-- View: User created tokens (for "Wallet" tab)
DROP VIEW IF EXISTS user_created_tokens;
CREATE OR REPLACE VIEW user_created_tokens AS
SELECT
  t.creator_wallet,
  t.id as token_id,
  t.mint_address,
  t.symbol,
  t.name,
  t.display_name,
  t.is_verified,
  t.image_uri,

  -- Market data
  t.market_cap,
  t.price_sol,
  t.price_usd,
  t.volume_24h,
  t.volume_total,
  t.holders_count,
  t.trades_count,

  -- Status
  t.is_tradable,
  t.created_at,

  -- Post info
  p.id as post_id,
  p.content as post_content,
  p.media_urls as post_media,
  p.created_at as post_created_at

FROM tokens t
LEFT JOIN posts p ON t.post_id = p.id
WHERE t.is_tradable = true
ORDER BY t.created_at DESC;

COMMENT ON VIEW user_created_tokens IS 'All tokens created by each user (for creator dashboard)';


-- STEP 5: Create RLS policies for security
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE user_token_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trading_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own holdings
DROP POLICY IF EXISTS "Users can view own holdings" ON user_token_holdings;
CREATE POLICY "Users can view own holdings"
  ON user_token_holdings
  FOR SELECT
  USING (true);  -- Public read for now, tighten in production

-- Policy: Users can insert their own holdings
DROP POLICY IF EXISTS "Users can insert own holdings" ON user_token_holdings;
CREATE POLICY "Users can insert own holdings"
  ON user_token_holdings
  FOR INSERT
  WITH CHECK (true);  -- Service role only in production

-- Policy: Users can update their own holdings
DROP POLICY IF EXISTS "Users can update own holdings" ON user_token_holdings;
CREATE POLICY "Users can update own holdings"
  ON user_token_holdings
  FOR UPDATE
  USING (true);  -- Service role only in production

-- Policy: Users can view their own trading history
DROP POLICY IF EXISTS "Users can view own history" ON user_trading_history;
CREATE POLICY "Users can view own history"
  ON user_trading_history
  FOR SELECT
  USING (true);  -- Public read for now

-- Policy: Users can insert their own trades
DROP POLICY IF EXISTS "Users can insert own trades" ON user_trading_history;
CREATE POLICY "Users can insert own trades"
  ON user_trading_history
  FOR INSERT
  WITH CHECK (true);  -- Service role only in production


-- STEP 6: Add helper functions
-- =====================================================

-- Function to calculate user portfolio total value
CREATE OR REPLACE FUNCTION get_user_portfolio_value(user_wallet TEXT)
RETURNS TABLE (
  total_value_sol DECIMAL,
  total_value_usd DECIMAL,
  total_invested DECIMAL,
  total_pnl DECIMAL,
  total_pnl_percentage DECIMAL,
  holdings_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(current_value_sol), 0)::DECIMAL as total_value_sol,
    COALESCE(SUM(current_value_usd), 0)::DECIMAL as total_value_usd,
    COALESCE(SUM(total_invested), 0)::DECIMAL as total_invested,
    COALESCE(SUM(total_pnl), 0)::DECIMAL as total_pnl,
    CASE
      WHEN COALESCE(SUM(total_invested), 0) > 0
      THEN (COALESCE(SUM(total_pnl), 0) / SUM(total_invested) * 100)::DECIMAL
      ELSE 0::DECIMAL
    END as total_pnl_percentage,
    COUNT(*)::BIGINT as holdings_count
  FROM user_portfolio_summary
  WHERE wallet_address = user_wallet;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_portfolio_value IS 'Calculate total portfolio value and P&L for a user';


-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify the migration
SELECT
  'user_token_holdings table' as object,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_token_holdings')
    THEN '✓ Created' ELSE '✗ Missing' END as status
UNION ALL
SELECT
  'user_trading_history table',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_trading_history')
    THEN '✓ Created' ELSE '✗ Missing' END
UNION ALL
SELECT
  'user_portfolio_summary view',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_portfolio_summary')
    THEN '✓ Created' ELSE '✗ Missing' END
UNION ALL
SELECT
  'user_created_tokens view',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_created_tokens')
    THEN '✓ Created' ELSE '✗ Missing' END;
