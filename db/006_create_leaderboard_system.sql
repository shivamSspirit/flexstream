-- ============================================================================
-- LEADERBOARD SYSTEM - Complete Database Schema
-- ============================================================================
-- Purpose: Track trader performance metrics and rankings across multiple timeframes
-- Features: Real-time rankings, win rates, P&L tracking, volume analytics
-- ============================================================================

-- Create enum for ranking metrics
CREATE TYPE ranking_metric AS ENUM (
  'volume',        -- Total trading volume
  'profit',        -- Total profit/loss
  'win_rate',      -- Win rate percentage
  'roi',           -- Return on investment
  'trades_count'   -- Number of trades
);

-- Create enum for timeframes
CREATE TYPE ranking_timeframe AS ENUM (
  'day',           -- Last 24 hours
  'week',          -- Last 7 days
  'month',         -- Last 30 days
  'all_time'       -- All time
);

-- ============================================================================
-- Main Leaderboard Metrics Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS leaderboard_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,

  -- 24 Hour Metrics
  volume_24h decimal DEFAULT 0,
  trades_count_24h int DEFAULT 0,
  profitable_trades_24h int DEFAULT 0,
  losing_trades_24h int DEFAULT 0,
  total_pnl_24h decimal DEFAULT 0,
  roi_24h decimal DEFAULT 0,
  win_rate_24h decimal DEFAULT 0,
  rank_volume_24h int,
  rank_profit_24h int,
  rank_roi_24h int,

  -- 7 Day Metrics
  volume_7d decimal DEFAULT 0,
  trades_count_7d int DEFAULT 0,
  profitable_trades_7d int DEFAULT 0,
  losing_trades_7d int DEFAULT 0,
  total_pnl_7d decimal DEFAULT 0,
  roi_7d decimal DEFAULT 0,
  win_rate_7d decimal DEFAULT 0,
  rank_volume_7d int,
  rank_profit_7d int,
  rank_roi_7d int,

  -- 30 Day Metrics
  volume_30d decimal DEFAULT 0,
  trades_count_30d int DEFAULT 0,
  profitable_trades_30d int DEFAULT 0,
  losing_trades_30d int DEFAULT 0,
  total_pnl_30d decimal DEFAULT 0,
  roi_30d decimal DEFAULT 0,
  win_rate_30d decimal DEFAULT 0,
  rank_volume_30d int,
  rank_profit_30d int,
  rank_roi_30d int,

  -- All Time Metrics
  volume_all_time decimal DEFAULT 0,
  trades_count_all_time int DEFAULT 0,
  profitable_trades_all_time int DEFAULT 0,
  losing_trades_all_time int DEFAULT 0,
  total_pnl_all_time decimal DEFAULT 0,
  roi_all_time decimal DEFAULT 0,
  win_rate_all_time decimal DEFAULT 0,
  rank_volume_all_time int,
  rank_profit_all_time int,
  rank_roi_all_time int,

  -- Additional Stats
  average_trade_size decimal DEFAULT 0,
  largest_win decimal DEFAULT 0,
  largest_loss decimal DEFAULT 0,
  current_streak int DEFAULT 0,
  best_streak int DEFAULT 0,
  worst_streak int DEFAULT 0,

  -- Metadata
  last_calculated_at timestamp DEFAULT NOW(),
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW(),

  UNIQUE(wallet_address)
);

-- ============================================================================
-- Performance Indexes
-- ============================================================================
-- Indexes for fast ranking queries
CREATE INDEX idx_leaderboard_volume_24h ON leaderboard_metrics(volume_24h DESC);
CREATE INDEX idx_leaderboard_volume_7d ON leaderboard_metrics(volume_7d DESC);
CREATE INDEX idx_leaderboard_volume_30d ON leaderboard_metrics(volume_30d DESC);
CREATE INDEX idx_leaderboard_volume_all ON leaderboard_metrics(volume_all_time DESC);

CREATE INDEX idx_leaderboard_pnl_24h ON leaderboard_metrics(total_pnl_24h DESC);
CREATE INDEX idx_leaderboard_pnl_7d ON leaderboard_metrics(total_pnl_7d DESC);
CREATE INDEX idx_leaderboard_pnl_30d ON leaderboard_metrics(total_pnl_30d DESC);
CREATE INDEX idx_leaderboard_pnl_all ON leaderboard_metrics(total_pnl_all_time DESC);

CREATE INDEX idx_leaderboard_roi_24h ON leaderboard_metrics(roi_24h DESC);
CREATE INDEX idx_leaderboard_roi_7d ON leaderboard_metrics(roi_7d DESC);
CREATE INDEX idx_leaderboard_roi_30d ON leaderboard_metrics(roi_30d DESC);
CREATE INDEX idx_leaderboard_roi_all ON leaderboard_metrics(roi_all_time DESC);

CREATE INDEX idx_leaderboard_wallet ON leaderboard_metrics(wallet_address);
CREATE INDEX idx_leaderboard_user ON leaderboard_metrics(user_id);
CREATE INDEX idx_leaderboard_updated ON leaderboard_metrics(updated_at DESC);

-- ============================================================================
-- Materialized Views for Fast Queries
-- ============================================================================

-- Top traders by volume (24h)
CREATE MATERIALIZED VIEW IF NOT EXISTS top_traders_volume_24h AS
SELECT
  lm.wallet_address,
  lm.volume_24h,
  lm.trades_count_24h,
  lm.win_rate_24h,
  lm.total_pnl_24h,
  lm.rank_volume_24h,
  u.username,
  u.display_name,
  u.avatar_url,
  u.verified_earnings
FROM leaderboard_metrics lm
LEFT JOIN users u ON lm.user_id = u.id
WHERE lm.volume_24h > 0
ORDER BY lm.volume_24h DESC
LIMIT 100;

CREATE UNIQUE INDEX ON top_traders_volume_24h(wallet_address);

-- Top traders by profit (7d)
CREATE MATERIALIZED VIEW IF NOT EXISTS top_traders_profit_7d AS
SELECT
  lm.wallet_address,
  lm.total_pnl_7d,
  lm.volume_7d,
  lm.trades_count_7d,
  lm.win_rate_7d,
  lm.roi_7d,
  lm.rank_profit_7d,
  u.username,
  u.display_name,
  u.avatar_url,
  u.verified_earnings
FROM leaderboard_metrics lm
LEFT JOIN users u ON lm.user_id = u.id
WHERE lm.total_pnl_7d > 0
ORDER BY lm.total_pnl_7d DESC
LIMIT 100;

CREATE UNIQUE INDEX ON top_traders_profit_7d(wallet_address);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to calculate win rate
CREATE OR REPLACE FUNCTION calculate_win_rate(
  profitable_trades int,
  losing_trades int
) RETURNS decimal AS $$
BEGIN
  IF (profitable_trades + losing_trades) = 0 THEN
    RETURN 0;
  END IF;
  RETURN (profitable_trades::decimal / (profitable_trades + losing_trades)) * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate ROI
CREATE OR REPLACE FUNCTION calculate_roi(
  total_pnl decimal,
  total_invested decimal
) RETURNS decimal AS $$
BEGIN
  IF total_invested = 0 THEN
    RETURN 0;
  END IF;
  RETURN (total_pnl / total_invested) * 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- Automatic Triggers
-- ============================================================================

-- Update timestamp on row update
CREATE OR REPLACE FUNCTION update_leaderboard_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leaderboard_timestamp
  BEFORE UPDATE ON leaderboard_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_timestamp();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE leaderboard_metrics ENABLE ROW LEVEL SECURITY;

-- Allow public read access to leaderboard
CREATE POLICY "Leaderboard metrics are publicly readable"
  ON leaderboard_metrics FOR SELECT
  TO public
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Only service role can modify leaderboard"
  ON leaderboard_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE leaderboard_metrics IS 'Stores trader performance metrics and rankings across multiple timeframes';
COMMENT ON COLUMN leaderboard_metrics.volume_24h IS 'Total trading volume in last 24 hours (in SOL)';
COMMENT ON COLUMN leaderboard_metrics.win_rate_24h IS 'Percentage of profitable trades in last 24 hours';
COMMENT ON COLUMN leaderboard_metrics.roi_24h IS 'Return on investment percentage in last 24 hours';
COMMENT ON COLUMN leaderboard_metrics.current_streak IS 'Current consecutive wins (positive) or losses (negative)';

-- ============================================================================
-- Initial Data Population
-- ============================================================================

-- Insert placeholder entries for existing users (will be calculated by service)
INSERT INTO leaderboard_metrics (user_id, wallet_address)
SELECT id, wallet_address
FROM users
WHERE wallet_address IS NOT NULL
ON CONFLICT (wallet_address) DO NOTHING;

-- ============================================================================
-- End of Leaderboard System Schema
-- ============================================================================
