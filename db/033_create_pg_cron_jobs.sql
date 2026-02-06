-- ============================================================================
-- PG_CRON SCHEDULED JOBS
-- ============================================================================
-- Purpose: Automated maintenance, view refresh, and data archival
-- Part of DB-FLEX-ARC-RECOMMENDED.md Phase 5 implementation
--
-- IMPORTANT: pg_cron must be enabled in your Supabase project
-- Go to: Database > Extensions > Enable pg_cron
-- ============================================================================

-- Enable pg_cron extension (if not already enabled)
-- Note: This requires Supabase Pro plan or local development
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================================================
-- 1. Trending Views Refresh (Every 2 minutes)
-- Most critical for user experience
-- ============================================================================

SELECT cron.schedule(
    'refresh-trending-tokens',
    '*/2 * * * *',  -- Every 2 minutes
    $$
    SELECT refresh_trending_tokens();
    $$
);

-- ============================================================================
-- 2. All Trending Views Refresh (Every 5 minutes)
-- Includes gainers, new tokens, hot tokens
-- ============================================================================

SELECT cron.schedule(
    'refresh-all-trending-views',
    '*/5 * * * *',  -- Every 5 minutes
    $$
    SELECT refresh_trending_views();
    $$
);

-- ============================================================================
-- 3. Leaderboard Refresh (Every 5 minutes)
-- ============================================================================

SELECT cron.schedule(
    'refresh-leaderboard',
    '*/5 * * * *',  -- Every 5 minutes
    $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_traders_volume_24h;
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_traders_profit_7d;
    $$
);

-- ============================================================================
-- 4. Execution Metrics Refresh (Every hour)
-- ============================================================================

SELECT cron.schedule(
    'refresh-execution-metrics',
    '0 * * * *',  -- Top of every hour
    $$
    SELECT refresh_execution_metrics();
    $$
);

-- ============================================================================
-- 5. Archive Old Execution Logs (Weekly - Sunday 3 AM)
-- Move logs older than 90 days to archive table
-- ============================================================================

-- First, create archive table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'execution_logs_archive') THEN
        CREATE TABLE execution_logs_archive (LIKE execution_logs INCLUDING ALL);
        COMMENT ON TABLE execution_logs_archive IS 'Archive of execution logs older than 90 days';
    END IF;
END $$;

SELECT cron.schedule(
    'archive-execution-logs',
    '0 3 * * 0',  -- Sunday 3 AM UTC
    $$
    -- Move old logs to archive
    INSERT INTO execution_logs_archive
    SELECT * FROM execution_logs
    WHERE created_at < now() - interval '90 days';

    -- Delete archived logs from main table
    DELETE FROM execution_logs
    WHERE created_at < now() - interval '90 days';
    $$
);

-- ============================================================================
-- 6. Archive Old Trades (Weekly - Sunday 4 AM)
-- Move trades older than 180 days to archive table
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'token_trades_archive') THEN
        CREATE TABLE token_trades_archive (LIKE token_trades INCLUDING ALL);
        COMMENT ON TABLE token_trades_archive IS 'Archive of token trades older than 180 days';
    END IF;
END $$;

SELECT cron.schedule(
    'archive-old-trades',
    '0 4 * * 0',  -- Sunday 4 AM UTC
    $$
    -- Move old trades to archive
    INSERT INTO token_trades_archive
    SELECT * FROM token_trades
    WHERE created_at < now() - interval '180 days';

    -- Delete archived trades from main table
    DELETE FROM token_trades
    WHERE created_at < now() - interval '180 days';
    $$
);

-- ============================================================================
-- 7. Calculate Creator Revenue (Every 10 minutes)
-- Process pending trades and calculate revenue
-- ============================================================================

-- First, create a function to process pending revenue
CREATE OR REPLACE FUNCTION calculate_pending_creator_revenue()
RETURNS integer AS $$
DECLARE
    v_processed integer := 0;
    v_trade RECORD;
    v_token RECORD;
    v_creator_id TEXT;
    v_fee_amount DECIMAL;
BEGIN
    -- Find trades that haven't been processed for revenue yet
    FOR v_trade IN
        SELECT tt.*
        FROM token_trades tt
        WHERE NOT EXISTS (
            SELECT 1 FROM creator_revenue cr
            WHERE cr.trade_id = tt.id
        )
        AND tt.created_at > now() - interval '24 hours'
        ORDER BY tt.created_at
        LIMIT 100  -- Process in batches
    LOOP
        -- Get token and creator info
        SELECT t.*, u.id AS creator_user_id
        INTO v_token
        FROM tokens t
        LEFT JOIN users u ON u.wallet_address = t.creator_wallet
        WHERE t.mint_address = v_trade.mint_address;

        IF v_token IS NOT NULL AND v_token.creator_user_id IS NOT NULL THEN
            -- Calculate fee (assuming 1% trading fee)
            v_fee_amount := (v_trade.quote_amount::decimal / 1e9) * 0.01;

            -- Record revenue
            PERFORM record_trade_revenue(
                v_token.creator_user_id,
                v_token.creator_wallet,
                v_trade.mint_address,
                v_trade.id,
                v_fee_amount,
                v_trade.signature
            );

            v_processed := v_processed + 1;
        END IF;
    END LOOP;

    RETURN v_processed;
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule(
    'calculate-creator-revenue',
    '*/10 * * * *',  -- Every 10 minutes
    $$
    SELECT calculate_pending_creator_revenue();
    $$
);

-- ============================================================================
-- 8. Update Token Stats (Every minute)
-- Aggregate 24h volume, holders count, etc.
-- ============================================================================

CREATE OR REPLACE FUNCTION update_token_stats()
RETURNS integer AS $$
DECLARE
    v_updated integer := 0;
BEGIN
    -- Update 24h volume for all active tokens
    UPDATE tokens t
    SET
        volume_24h = COALESCE((
            SELECT SUM(quote_amount)::decimal / 1e9
            FROM token_trades tt
            WHERE tt.mint_address = t.mint_address
              AND tt.created_at > now() - interval '24 hours'
        ), 0),
        trades_count = COALESCE((
            SELECT COUNT(*)
            FROM token_trades tt
            WHERE tt.mint_address = t.mint_address
        ), 0),
        updated_at = now()
    WHERE t.is_tradable = true
      AND t.created_at > now() - interval '30 days';  -- Only update recent tokens

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule(
    'update-token-stats',
    '* * * * *',  -- Every minute
    $$
    SELECT update_token_stats();
    $$
);

-- ============================================================================
-- 9. Recalculate Trust Scores (Every 6 hours)
-- Update user trust scores based on activity
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_trust_scores()
RETURNS integer AS $$
DECLARE
    v_updated integer := 0;
BEGIN
    -- Simple trust score based on:
    -- - Profile completion
    -- - Twitter verification
    -- - Post count
    -- - Trade activity
    UPDATE users u
    SET success_tier = CASE
        WHEN u.twitter_verified AND u.profile_completed AND (
            SELECT COUNT(*) FROM posts WHERE user_id = u.id
        ) >= 10 AND (
            SELECT COUNT(*) FROM token_trades WHERE trader_wallet = u.wallet_address
        ) >= 50 THEN 'diamond'
        WHEN u.twitter_verified AND u.profile_completed AND (
            SELECT COUNT(*) FROM posts WHERE user_id = u.id
        ) >= 5 THEN 'gold'
        WHEN u.twitter_verified OR u.profile_completed THEN 'silver'
        ELSE 'bronze'
    END
    WHERE u.updated_at > now() - interval '24 hours'
       OR u.created_at > now() - interval '7 days';

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule(
    'recalculate-trust-scores',
    '0 */6 * * *',  -- Every 6 hours
    $$
    SELECT recalculate_trust_scores();
    $$
);

-- ============================================================================
-- 10. Clean Up Old Realtime Messages (Daily at 2 AM)
-- ============================================================================

SELECT cron.schedule(
    'cleanup-realtime-messages',
    '0 2 * * *',  -- Daily 2 AM UTC
    $$
    DELETE FROM realtime.messages
    WHERE inserted_at < now() - interval '3 days';
    $$
);

-- ============================================================================
-- 11. Update Creator Earnings Tier (Daily at 1 AM)
-- Promote/demote creators based on earnings
-- ============================================================================

SELECT cron.schedule(
    'update-creator-tiers',
    '0 1 * * *',  -- Daily 1 AM UTC
    $$
    UPDATE users u
    SET success_tier = CASE
        WHEN (SELECT COALESCE(SUM(amount_sol), 0) FROM creator_revenue WHERE creator_id = u.id) >= 100 THEN 'diamond'
        WHEN (SELECT COALESCE(SUM(amount_sol), 0) FROM creator_revenue WHERE creator_id = u.id) >= 50 THEN 'gold'
        WHEN (SELECT COALESCE(SUM(amount_sol), 0) FROM creator_revenue WHERE creator_id = u.id) >= 10 THEN 'silver'
        ELSE 'bronze'
    END
    WHERE u.creator_coin_enabled = true
       OR EXISTS (SELECT 1 FROM tokens t WHERE t.creator_wallet = u.wallet_address);
    $$
);

-- ============================================================================
-- 12. Vacuum and Analyze (Weekly - Saturday 5 AM)
-- Maintain database performance
-- ============================================================================

SELECT cron.schedule(
    'vacuum-analyze-tables',
    '0 5 * * 6',  -- Saturday 5 AM UTC
    $$
    VACUUM ANALYZE posts;
    VACUUM ANALYZE tokens;
    VACUUM ANALYZE token_trades;
    VACUUM ANALYZE users;
    VACUUM ANALYZE creator_revenue;
    $$
);

-- ============================================================================
-- Job Management Functions
-- ============================================================================

-- Function to list all scheduled jobs
CREATE OR REPLACE FUNCTION list_cron_jobs()
RETURNS TABLE (
    jobid bigint,
    schedule text,
    command text,
    nodename text,
    nodeport integer,
    database text,
    username text,
    active boolean
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM cron.job;
END;
$$ LANGUAGE plpgsql;

-- Function to disable a job
CREATE OR REPLACE FUNCTION disable_cron_job(p_job_name text)
RETURNS boolean AS $$
BEGIN
    UPDATE cron.job SET active = false WHERE jobname = p_job_name;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to enable a job
CREATE OR REPLACE FUNCTION enable_cron_job(p_job_name text)
RETURNS boolean AS $$
BEGIN
    UPDATE cron.job SET active = true WHERE jobname = p_job_name;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION calculate_pending_creator_revenue IS 'Processes trades and calculates creator revenue share';
COMMENT ON FUNCTION update_token_stats IS 'Updates 24h volume and trade counts for tokens';
COMMENT ON FUNCTION recalculate_trust_scores IS 'Updates user trust scores and tiers';
COMMENT ON FUNCTION list_cron_jobs IS 'Lists all scheduled pg_cron jobs';
COMMENT ON FUNCTION disable_cron_job IS 'Disables a pg_cron job by name';
COMMENT ON FUNCTION enable_cron_job IS 'Enables a pg_cron job by name';

-- ============================================================================
-- Job Schedule Reference:
-- ============================================================================
-- */2 * * * *   - refresh-trending-tokens (every 2 min)
-- */5 * * * *   - refresh-all-trending-views (every 5 min)
-- */5 * * * *   - refresh-leaderboard (every 5 min)
-- 0 * * * *     - refresh-execution-metrics (hourly)
-- */10 * * * *  - calculate-creator-revenue (every 10 min)
-- * * * * *     - update-token-stats (every minute)
-- 0 */6 * * *   - recalculate-trust-scores (every 6 hours)
-- 0 2 * * *     - cleanup-realtime-messages (daily 2 AM)
-- 0 1 * * *     - update-creator-tiers (daily 1 AM)
-- 0 3 * * 0     - archive-execution-logs (Sunday 3 AM)
-- 0 4 * * 0     - archive-old-trades (Sunday 4 AM)
-- 0 5 * * 6     - vacuum-analyze-tables (Saturday 5 AM)
-- ============================================================================

-- ============================================================================
-- End of pg_cron Jobs
-- ============================================================================
