-- ============================================================================
-- TRENDING TOKENS - Materialized View for Fast Queries
-- ============================================================================
-- Purpose: Pre-computed trending tokens with composite scoring
-- Part of DB-FLEX-ARC-RECOMMENDED.md Phase 2 implementation
-- Refreshed by pg_cron every 2 minutes
-- ============================================================================

-- ============================================================================
-- 1. Trending Tokens Materialized View
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS trending_tokens_cached;

CREATE MATERIALIZED VIEW trending_tokens_cached AS
SELECT
    t.id,
    t.mint_address,
    t.symbol,
    t.name,
    t.display_name,
    t.description,
    t.image_uri,
    t.is_verified,
    t.is_tradable,
    t.market_cap,
    t.price_sol,
    t.price_usd,
    t.volume_24h,
    t.volume_total,
    t.holders_count,
    t.trades_count,
    t.creator_wallet,
    t.pool_address,
    t.created_at AS token_created_at,

    -- Creator info
    u.id AS creator_id,
    u.username AS creator_username,
    u.display_name AS creator_display_name,
    u.avatar_url AS creator_avatar,
    u.twitter_verified AS creator_verified,
    u.success_tier AS creator_tier,

    -- Post info (if token is from a post)
    p.id AS post_id,
    p.title AS post_title,
    COALESCE(p.likes_count, 0) AS likes_count,
    COALESCE(p.comments_count, 0) AS comments_count,

    -- Trading activity (from token_trades table)
    COUNT(tt.id) FILTER (WHERE tt.created_at > now() - interval '1 hour') AS trades_1h,
    COUNT(tt.id) FILTER (WHERE tt.created_at > now() - interval '24 hours') AS trades_24h,
    COALESCE(SUM(tt.quote_amount) FILTER (WHERE tt.created_at > now() - interval '1 hour'), 0)::numeric / 1e9 AS volume_1h_sol,
    COALESCE(SUM(tt.quote_amount) FILTER (WHERE tt.created_at > now() - interval '24 hours'), 0)::numeric / 1e9 AS volume_24h_sol,

    -- Composite trending score
    -- Weights: recent trades (10x), 24h trades (2x), likes (3x), comments (5x), new token bonus (50)
    (
        COUNT(tt.id) FILTER (WHERE tt.created_at > now() - interval '1 hour') * 10 +
        COUNT(tt.id) FILTER (WHERE tt.created_at > now() - interval '24 hours') * 2 +
        COALESCE(p.likes_count, 0) * 3 +
        COALESCE(p.comments_count, 0) * 5 +
        CASE WHEN t.created_at > now() - interval '24 hours' THEN 50 ELSE 0 END +
        -- Volume bonus (normalized)
        LEAST(COALESCE(SUM(tt.quote_amount) FILTER (WHERE tt.created_at > now() - interval '1 hour'), 0)::numeric / 1e9, 100) * 5
    )::integer AS trending_score,

    -- Price change (if we have historical data)
    0::numeric AS price_change_1h_pct,
    0::numeric AS price_change_24h_pct,

    now() AS calculated_at

FROM tokens t
LEFT JOIN token_trades tt ON tt.mint_address = t.mint_address
LEFT JOIN users u ON u.wallet_address = t.creator_wallet
LEFT JOIN posts p ON p.id = t.post_id
WHERE t.is_tradable = true
GROUP BY
    t.id, t.mint_address, t.symbol, t.name, t.display_name, t.description,
    t.image_uri, t.is_verified, t.is_tradable, t.market_cap, t.price_sol,
    t.price_usd, t.volume_24h, t.volume_total, t.holders_count, t.trades_count,
    t.creator_wallet, t.pool_address, t.created_at,
    u.id, u.username, u.display_name, u.avatar_url, u.twitter_verified, u.success_tier,
    p.id, p.title, p.likes_count, p.comments_count
ORDER BY trending_score DESC
LIMIT 200;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_cached_id ON trending_tokens_cached(id);
CREATE INDEX IF NOT EXISTS idx_trending_cached_score ON trending_tokens_cached(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_cached_mint ON trending_tokens_cached(mint_address);
CREATE INDEX IF NOT EXISTS idx_trending_cached_creator ON trending_tokens_cached(creator_wallet);

-- ============================================================================
-- 2. Top Gainers View (tokens with highest price increase)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS top_gainers_cached;

CREATE MATERIALIZED VIEW top_gainers_cached AS
SELECT
    t.id,
    t.mint_address,
    t.symbol,
    t.display_name,
    t.image_uri,
    t.is_verified,
    t.market_cap,
    t.price_sol,
    t.price_usd,
    t.volume_24h,
    t.creator_wallet,
    u.username AS creator_username,
    u.avatar_url AS creator_avatar,

    -- Calculate price change based on first and last trade prices
    COALESCE(
        (
            (SELECT price_per_token FROM token_trades
             WHERE mint_address = t.mint_address
             ORDER BY created_at DESC LIMIT 1) -
            (SELECT price_per_token FROM token_trades
             WHERE mint_address = t.mint_address
               AND created_at > now() - interval '24 hours'
             ORDER BY created_at ASC LIMIT 1)
        ) / NULLIF(
            (SELECT price_per_token FROM token_trades
             WHERE mint_address = t.mint_address
               AND created_at > now() - interval '24 hours'
             ORDER BY created_at ASC LIMIT 1), 0
        ) * 100,
        0
    )::numeric AS price_change_24h_pct,

    now() AS calculated_at

FROM tokens t
LEFT JOIN users u ON u.wallet_address = t.creator_wallet
WHERE t.is_tradable = true
  AND EXISTS (
      SELECT 1 FROM token_trades tt
      WHERE tt.mint_address = t.mint_address
        AND tt.created_at > now() - interval '24 hours'
  )
ORDER BY price_change_24h_pct DESC
LIMIT 50;

CREATE UNIQUE INDEX IF NOT EXISTS idx_top_gainers_id ON top_gainers_cached(id);

-- ============================================================================
-- 3. New Tokens View (recently created tokens)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS new_tokens_cached;

CREATE MATERIALIZED VIEW new_tokens_cached AS
SELECT
    t.id,
    t.mint_address,
    t.symbol,
    t.display_name,
    t.description,
    t.image_uri,
    t.is_verified,
    t.market_cap,
    t.price_sol,
    t.price_usd,
    t.volume_24h,
    t.holders_count,
    t.creator_wallet,
    t.pool_address,
    t.created_at AS token_created_at,

    u.username AS creator_username,
    u.display_name AS creator_display_name,
    u.avatar_url AS creator_avatar,
    u.twitter_verified AS creator_verified,

    p.title AS post_title,
    p.id AS post_id,

    -- Time since creation
    EXTRACT(EPOCH FROM (now() - t.created_at)) / 3600 AS hours_since_creation,

    now() AS calculated_at

FROM tokens t
LEFT JOIN users u ON u.wallet_address = t.creator_wallet
LEFT JOIN posts p ON p.id = t.post_id
WHERE t.is_tradable = true
  AND t.created_at > now() - interval '7 days'
ORDER BY t.created_at DESC
LIMIT 100;

CREATE UNIQUE INDEX IF NOT EXISTS idx_new_tokens_id ON new_tokens_cached(id);
CREATE INDEX IF NOT EXISTS idx_new_tokens_created ON new_tokens_cached(token_created_at DESC);

-- ============================================================================
-- 4. Hot Tokens View (high volume in last hour)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS hot_tokens_cached;

CREATE MATERIALIZED VIEW hot_tokens_cached AS
SELECT
    t.id,
    t.mint_address,
    t.symbol,
    t.display_name,
    t.image_uri,
    t.is_verified,
    t.market_cap,
    t.price_sol,
    t.price_usd,
    t.creator_wallet,

    u.username AS creator_username,
    u.avatar_url AS creator_avatar,

    COUNT(tt.id) AS trades_1h,
    SUM(tt.quote_amount)::numeric / 1e9 AS volume_1h_sol,

    now() AS calculated_at

FROM tokens t
JOIN token_trades tt ON tt.mint_address = t.mint_address
    AND tt.created_at > now() - interval '1 hour'
LEFT JOIN users u ON u.wallet_address = t.creator_wallet
WHERE t.is_tradable = true
GROUP BY t.id, t.mint_address, t.symbol, t.display_name, t.image_uri,
         t.is_verified, t.market_cap, t.price_sol, t.price_usd, t.creator_wallet,
         u.username, u.avatar_url
HAVING COUNT(tt.id) >= 3  -- At least 3 trades in last hour
ORDER BY volume_1h_sol DESC
LIMIT 50;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hot_tokens_id ON hot_tokens_cached(id);

-- ============================================================================
-- 5. Refresh Functions
-- ============================================================================

-- Function to refresh all trending views
CREATE OR REPLACE FUNCTION refresh_trending_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_tokens_cached;
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_gainers_cached;
    REFRESH MATERIALIZED VIEW CONCURRENTLY new_tokens_cached;
    REFRESH MATERIALIZED VIEW CONCURRENTLY hot_tokens_cached;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh only the main trending view (faster, for more frequent refresh)
CREATE OR REPLACE FUNCTION refresh_trending_tokens()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_tokens_cached;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. API-friendly View combining all trending categories
-- ============================================================================

CREATE OR REPLACE VIEW trending_feed AS
SELECT
    'trending' AS category,
    id,
    mint_address,
    symbol,
    display_name,
    image_uri,
    is_verified,
    market_cap,
    price_sol,
    price_usd,
    creator_username,
    creator_avatar,
    trending_score AS score,
    calculated_at
FROM trending_tokens_cached
LIMIT 20

UNION ALL

SELECT
    'hot' AS category,
    id,
    mint_address,
    symbol,
    display_name,
    image_uri,
    is_verified,
    market_cap,
    price_sol,
    price_usd,
    creator_username,
    creator_avatar,
    (volume_1h_sol * 100)::integer AS score,
    calculated_at
FROM hot_tokens_cached
LIMIT 10

UNION ALL

SELECT
    'new' AS category,
    id,
    mint_address,
    symbol,
    display_name,
    image_uri,
    is_verified,
    market_cap,
    price_sol,
    price_usd,
    creator_username,
    creator_avatar,
    (1000 - hours_since_creation)::integer AS score,
    calculated_at
FROM new_tokens_cached
LIMIT 10;

-- ============================================================================
-- 7. Grants
-- ============================================================================

GRANT SELECT ON trending_tokens_cached TO authenticated;
GRANT SELECT ON top_gainers_cached TO authenticated;
GRANT SELECT ON new_tokens_cached TO authenticated;
GRANT SELECT ON hot_tokens_cached TO authenticated;
GRANT SELECT ON trending_feed TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_trending_views TO service_role;
GRANT EXECUTE ON FUNCTION refresh_trending_tokens TO service_role;

-- ============================================================================
-- 8. Comments
-- ============================================================================

COMMENT ON MATERIALIZED VIEW trending_tokens_cached IS 'Pre-computed trending tokens with composite scoring. Refresh every 2 minutes.';
COMMENT ON MATERIALIZED VIEW top_gainers_cached IS 'Tokens with highest 24h price increase. Refresh every 5 minutes.';
COMMENT ON MATERIALIZED VIEW new_tokens_cached IS 'Recently created tokens. Refresh every 5 minutes.';
COMMENT ON MATERIALIZED VIEW hot_tokens_cached IS 'Tokens with high volume in last hour. Refresh every 2 minutes.';
COMMENT ON VIEW trending_feed IS 'Combined feed of trending, hot, and new tokens for the explore page.';

-- ============================================================================
-- End of Trending Tokens Schema
-- ============================================================================
