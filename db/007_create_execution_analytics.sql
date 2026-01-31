-- ============================================
-- FlexIt Execution Analytics Schema
-- ============================================
-- Tracks execution performance, routing decisions, and success rates

-- Create execution_logs table
CREATE TABLE IF NOT EXISTS execution_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now() NOT NULL,

    -- User & Token Info
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    token_mint text NOT NULL,
    pool_address text,
    direction text NOT NULL CHECK (direction IN ('BUY', 'SELL')),

    -- Routing
    route text NOT NULL CHECK (route IN ('DIRECT_DBC', 'JUPITER', 'HYBRID')),
    routing_reason text,
    use_jito boolean DEFAULT false,
    priority text DEFAULT 'NORMAL',

    -- Amounts
    amount_in numeric NOT NULL,
    amount_in_usd numeric,
    amount_out numeric,
    amount_out_usd numeric,
    expected_amount_out numeric,

    -- Execution
    success boolean NOT NULL DEFAULT false,
    execution_time_ms integer NOT NULL,
    signature text,
    bundle_id text,
    block_number bigint,

    -- Costs
    gas_fee bigint DEFAULT 0,
    jito_tip bigint DEFAULT 0,
    platform_fee bigint DEFAULT 0,
    total_cost bigint DEFAULT 0,

    -- Performance Metrics
    price_impact_bps integer,
    slippage_bps integer,
    slippage_exceeded boolean DEFAULT false,

    -- Error Info
    error text,
    error_code text,

    -- Indexes for common queries
    CONSTRAINT execution_logs_token_mint_idx_check CHECK (length(token_mint) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS execution_logs_created_at_idx ON execution_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS execution_logs_user_id_idx ON execution_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS execution_logs_token_mint_idx ON execution_logs(token_mint);
CREATE INDEX IF NOT EXISTS execution_logs_success_idx ON execution_logs(success);
CREATE INDEX IF NOT EXISTS execution_logs_route_idx ON execution_logs(route);
CREATE INDEX IF NOT EXISTS execution_logs_signature_idx ON execution_logs(signature) WHERE signature IS NOT NULL;

-- Create composite index for analytics queries
CREATE INDEX IF NOT EXISTS execution_logs_analytics_idx
ON execution_logs(created_at DESC, success, route)
WHERE success = true;

-- ============================================
-- Execution Metrics Materialized View
-- For fast dashboard queries
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS execution_metrics_hourly AS
SELECT
    date_trunc('hour', created_at) as hour,
    route,
    COUNT(*) as total_swaps,
    COUNT(*) FILTER (WHERE success = true) as successful_swaps,
    COUNT(*) FILTER (WHERE success = false) as failed_swaps,
    ROUND(AVG(execution_time_ms) FILTER (WHERE success = true))::integer as avg_execution_ms,
    ROUND(AVG(price_impact_bps) FILTER (WHERE success = true))::integer as avg_price_impact_bps,
    SUM(amount_in_usd) FILTER (WHERE success = true) as total_volume_usd,
    SUM(total_cost) FILTER (WHERE success = true) as total_fees_lamports,
    COUNT(*) FILTER (WHERE use_jito = true) as jito_count,
    ROUND(AVG(execution_time_ms) FILTER (WHERE success = true AND use_jito = true))::integer as avg_jito_execution_ms,
    ROUND(AVG(execution_time_ms) FILTER (WHERE success = true AND use_jito = false))::integer as avg_no_jito_execution_ms
FROM execution_logs
GROUP BY date_trunc('hour', created_at), route;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS execution_metrics_hourly_idx
ON execution_metrics_hourly(hour DESC, route);

-- ============================================
-- Route Performance View
-- Compare DBC vs Jupiter
-- ============================================

CREATE OR REPLACE VIEW route_performance AS
SELECT
    route,
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE success = true) as successful_executions,
    ROUND(100.0 * COUNT(*) FILTER (WHERE success = true) / COUNT(*), 2) as success_rate_percent,
    ROUND(AVG(execution_time_ms) FILTER (WHERE success = true))::integer as avg_execution_ms,
    ROUND(AVG(price_impact_bps) FILTER (WHERE success = true))::integer as avg_price_impact_bps,
    SUM(amount_in_usd) FILTER (WHERE success = true) as total_volume_usd,
    SUM(total_cost) FILTER (WHERE success = true) as total_fees_lamports,
    MIN(execution_time_ms) FILTER (WHERE success = true) as fastest_execution_ms,
    MAX(execution_time_ms) FILTER (WHERE success = true) as slowest_execution_ms,
    -- Last 24 hours
    COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as executions_24h,
    COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours' AND success = true) as successful_24h
FROM execution_logs
GROUP BY route;

-- ============================================
-- Token Performance View
-- Track which tokens are most traded
-- ============================================

CREATE OR REPLACE VIEW token_performance AS
SELECT
    token_mint,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE success = true) as successful_trades,
    ROUND(100.0 * COUNT(*) FILTER (WHERE success = true) / COUNT(*), 2) as success_rate_percent,
    SUM(amount_in_usd) FILTER (WHERE success = true) as total_volume_usd,
    ROUND(AVG(execution_time_ms) FILTER (WHERE success = true))::integer as avg_execution_ms,
    ROUND(AVG(price_impact_bps) FILTER (WHERE success = true))::integer as avg_price_impact_bps,
    MAX(created_at) as last_trade_at,
    -- Preferred route for this token
    mode() WITHIN GROUP (ORDER BY route) as preferred_route
FROM execution_logs
WHERE created_at > now() - interval '7 days'
GROUP BY token_mint
HAVING COUNT(*) >= 10
ORDER BY total_volume_usd DESC NULLS LAST;

-- ============================================
-- User Performance View
-- Track user trading patterns
-- ============================================

CREATE OR REPLACE VIEW user_performance AS
SELECT
    user_id,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE success = true) as successful_trades,
    ROUND(100.0 * COUNT(*) FILTER (WHERE success = true) / COUNT(*), 2) as success_rate_percent,
    SUM(amount_in_usd) FILTER (WHERE success = true) as total_volume_usd,
    SUM(total_cost) FILTER (WHERE success = true) as total_fees_paid_lamports,
    ROUND(AVG(execution_time_ms) FILTER (WHERE success = true))::integer as avg_execution_ms,
    MAX(created_at) as last_trade_at,
    MIN(created_at) as first_trade_at,
    -- Preferred settings
    mode() WITHIN GROUP (ORDER BY route) as preferred_route,
    mode() WITHIN GROUP (ORDER BY use_jito) as prefers_jito,
    mode() WITHIN GROUP (ORDER BY priority) as preferred_priority
FROM execution_logs
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) >= 5
ORDER BY total_volume_usd DESC NULLS LAST;

-- ============================================
-- Error Analysis View
-- Track common errors
-- ============================================

CREATE OR REPLACE VIEW error_analysis AS
SELECT
    error,
    error_code,
    route,
    COUNT(*) as occurrences,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage,
    MAX(created_at) as last_occurrence,
    -- Most common token causing this error
    mode() WITHIN GROUP (ORDER BY token_mint) as most_affected_token
FROM execution_logs
WHERE success = false AND created_at > now() - interval '7 days'
GROUP BY error, error_code, route
ORDER BY occurrences DESC;

-- ============================================
-- Functions for Analytics
-- ============================================

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_execution_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY execution_metrics_hourly;
END;
$$;

-- Function to get real-time stats
CREATE OR REPLACE FUNCTION get_execution_stats(time_period text DEFAULT '24h')
RETURNS json
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    interval_val interval;
    result json;
BEGIN
    -- Parse time period
    CASE time_period
        WHEN '1h' THEN interval_val := '1 hour';
        WHEN '24h' THEN interval_val := '24 hours';
        WHEN '7d' THEN interval_val := '7 days';
        WHEN '30d' THEN interval_val := '30 days';
        ELSE interval_val := '24 hours';
    END CASE;

    -- Get stats
    SELECT json_build_object(
        'period', time_period,
        'total_swaps', COUNT(*),
        'successful_swaps', COUNT(*) FILTER (WHERE success = true),
        'failed_swaps', COUNT(*) FILTER (WHERE success = false),
        'success_rate', ROUND(100.0 * COUNT(*) FILTER (WHERE success = true) / COUNT(*), 2),
        'avg_execution_ms', ROUND(AVG(execution_time_ms) FILTER (WHERE success = true)),
        'avg_price_impact_bps', ROUND(AVG(price_impact_bps) FILTER (WHERE success = true)),
        'total_volume_usd', SUM(amount_in_usd) FILTER (WHERE success = true),
        'total_fees_lamports', SUM(total_cost) FILTER (WHERE success = true),
        'dbc_count', COUNT(*) FILTER (WHERE route = 'DIRECT_DBC' AND success = true),
        'jupiter_count', COUNT(*) FILTER (WHERE route = 'JUPITER' AND success = true),
        'jito_count', COUNT(*) FILTER (WHERE use_jito = true AND success = true),
        'updated_at', extract(epoch from now())
    )
    INTO result
    FROM execution_logs
    WHERE created_at > now() - interval_val;

    RETURN result;
END;
$$;

-- ============================================
-- Row Level Security
-- ============================================

-- Enable RLS
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own logs
CREATE POLICY execution_logs_view_own
ON execution_logs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can view all logs
CREATE POLICY execution_logs_view_admin
ON execution_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Policy: Service role can insert logs
CREATE POLICY execution_logs_insert_service
ON execution_logs FOR INSERT
WITH CHECK (true);

-- ============================================
-- Triggers
-- ============================================

-- Auto-refresh materialized view every hour
-- (You'd set this up with pg_cron or external scheduler)

-- ============================================
-- Initial Data & Comments
-- ============================================

COMMENT ON TABLE execution_logs IS 'Tracks all swap executions for analytics and monitoring';
COMMENT ON MATERIALIZED VIEW execution_metrics_hourly IS 'Hourly aggregated execution metrics for fast dashboard queries';
COMMENT ON VIEW route_performance IS 'Compare performance between DBC and Jupiter routing';
COMMENT ON VIEW token_performance IS 'Track trading volume and performance per token';
COMMENT ON VIEW user_performance IS 'Track user trading patterns and preferences';
COMMENT ON VIEW error_analysis IS 'Analyze common execution errors';

-- Grant permissions
GRANT SELECT ON execution_logs TO authenticated;
GRANT SELECT ON execution_metrics_hourly TO authenticated;
GRANT SELECT ON route_performance TO authenticated;
GRANT SELECT ON token_performance TO authenticated;
GRANT SELECT ON user_performance TO authenticated;
GRANT SELECT ON error_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_execution_stats TO authenticated;
