-- ============================================================================
-- BROADCAST FROM DATABASE - Realtime Triggers
-- ============================================================================
-- Purpose: Replace postgres_changes with scalable Broadcast from Database
-- Part of DB-FLEX-ARC-RECOMMENDED.md Phase 2 implementation
--
-- Supabase benchmarks:
-- - Broadcast: 224,000 msgs/sec, 6ms median latency
-- - Broadcast from DB: 10,000 msgs/sec, 46ms median latency
-- - Postgres Changes: Bottlenecked by RLS checks (current implementation)
-- ============================================================================

-- ============================================================================
-- 1. Posts Broadcast Trigger
-- Broadcasts to: feed:global, feed:user:{user_id}
-- ============================================================================

CREATE OR REPLACE FUNCTION public.broadcast_post_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    payload jsonb;
BEGIN
    -- Build minimal payload (clients fetch full details from cache)
    payload := jsonb_build_object(
        'id', COALESCE(NEW.id, OLD.id),
        'user_id', COALESCE(NEW.user_id, OLD.user_id),
        'title', NEW.title,
        'token_mint', NEW.token_mint,
        'created_at', COALESCE(NEW.created_at, OLD.created_at),
        'event_type', TG_OP
    );

    -- Broadcast to global feed channel
    PERFORM realtime.broadcast_changes(
        'feed:global'::text,
        TG_OP::text,
        TG_OP::text,
        TG_TABLE_NAME::text,
        TG_TABLE_SCHEMA::text,
        NEW,
        OLD
    );

    -- Broadcast to user-specific feed channel
    IF NEW.user_id IS NOT NULL THEN
        PERFORM realtime.broadcast_changes(
            'feed:user:' || NEW.user_id::text,
            TG_OP::text,
            TG_OP::text,
            TG_TABLE_NAME::text,
            TG_TABLE_SCHEMA::text,
            NEW,
            OLD
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS broadcast_post_changes_trigger ON public.posts;
CREATE TRIGGER broadcast_post_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_post_changes();

-- ============================================================================
-- 2. Notifications Broadcast Trigger
-- Broadcasts to: notify:{user_id} (private channel)
-- ============================================================================

-- First, check if notifications table exists and create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TABLE public.notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL,
            from_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
            post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
            message TEXT,
            read BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE INDEX idx_notifications_user_id ON notifications(user_id, created_at DESC);
        CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = false;

        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.broadcast_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Broadcast to user's private notification channel
    PERFORM realtime.broadcast_changes(
        'notify:' || NEW.user_id::text,
        TG_OP::text,
        TG_OP::text,
        TG_TABLE_NAME::text,
        TG_TABLE_SCHEMA::text,
        NEW,
        OLD
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS broadcast_notification_trigger ON public.notifications;
CREATE TRIGGER broadcast_notification_trigger
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_notification();

-- ============================================================================
-- 3. Trade Activity Broadcast Trigger
-- Broadcasts to: trade:{token_mint}, trade:global
-- ============================================================================

CREATE OR REPLACE FUNCTION public.broadcast_trade()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    payload jsonb;
BEGIN
    -- Build trade payload
    payload := jsonb_build_object(
        'id', NEW.id,
        'mint_address', NEW.mint_address,
        'trader_wallet', NEW.trader_wallet,
        'trade_type', NEW.trade_type,
        'base_amount', NEW.base_amount,
        'quote_amount', NEW.quote_amount,
        'price_per_token', NEW.price_per_token,
        'created_at', NEW.created_at
    );

    -- Broadcast to token-specific trade channel
    PERFORM realtime.broadcast_changes(
        'trade:' || NEW.mint_address,
        TG_OP::text,
        TG_OP::text,
        TG_TABLE_NAME::text,
        TG_TABLE_SCHEMA::text,
        NEW,
        OLD
    );

    -- Broadcast to global trade channel (for activity feed)
    PERFORM realtime.broadcast_changes(
        'trade:global'::text,
        TG_OP::text,
        TG_OP::text,
        TG_TABLE_NAME::text,
        TG_TABLE_SCHEMA::text,
        NEW,
        OLD
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS broadcast_trade_trigger ON public.token_trades;
CREATE TRIGGER broadcast_trade_trigger
    AFTER INSERT ON public.token_trades
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_trade();

-- ============================================================================
-- 4. Token Updates Broadcast Trigger
-- Broadcasts to: token:{mint_address}
-- ============================================================================

CREATE OR REPLACE FUNCTION public.broadcast_token_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Only broadcast significant changes (price, volume, holders)
    IF (
        OLD.price_sol IS DISTINCT FROM NEW.price_sol OR
        OLD.price_usd IS DISTINCT FROM NEW.price_usd OR
        OLD.market_cap IS DISTINCT FROM NEW.market_cap OR
        OLD.volume_24h IS DISTINCT FROM NEW.volume_24h OR
        OLD.holders_count IS DISTINCT FROM NEW.holders_count
    ) THEN
        PERFORM realtime.broadcast_changes(
            'token:' || NEW.mint_address,
            TG_OP::text,
            TG_OP::text,
            TG_TABLE_NAME::text,
            TG_TABLE_SCHEMA::text,
            NEW,
            OLD
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS broadcast_token_update_trigger ON public.tokens;
CREATE TRIGGER broadcast_token_update_trigger
    AFTER UPDATE ON public.tokens
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_token_update();

-- ============================================================================
-- 5. Likes Broadcast Trigger
-- Broadcasts to: post:{post_id}:engagement
-- ============================================================================

CREATE OR REPLACE FUNCTION public.broadcast_like()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_post_id UUID;
BEGIN
    v_post_id := COALESCE(NEW.post_id, OLD.post_id);

    PERFORM realtime.broadcast_changes(
        'post:' || v_post_id::text || ':engagement',
        TG_OP::text,
        TG_OP::text,
        TG_TABLE_NAME::text,
        TG_TABLE_SCHEMA::text,
        NEW,
        OLD
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS broadcast_like_trigger ON public.likes;
CREATE TRIGGER broadcast_like_trigger
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_like();

-- ============================================================================
-- 6. Comments Broadcast Trigger
-- Broadcasts to: post:{post_id}:comments
-- ============================================================================

CREATE OR REPLACE FUNCTION public.broadcast_comment()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_post_id UUID;
BEGIN
    v_post_id := COALESCE(NEW.post_id, OLD.post_id);

    PERFORM realtime.broadcast_changes(
        'post:' || v_post_id::text || ':comments',
        TG_OP::text,
        TG_OP::text,
        TG_TABLE_NAME::text,
        TG_TABLE_SCHEMA::text,
        NEW,
        OLD
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS broadcast_comment_trigger ON public.comments;
CREATE TRIGGER broadcast_comment_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_comment();

-- ============================================================================
-- 7. Follows Broadcast Trigger
-- Broadcasts to: user:{user_id}:followers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.broadcast_follow()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_following_id TEXT;
BEGIN
    v_following_id := COALESCE(NEW.following_id, OLD.following_id);

    -- Notify the user being followed
    PERFORM realtime.broadcast_changes(
        'user:' || v_following_id || ':followers',
        TG_OP::text,
        TG_OP::text,
        TG_TABLE_NAME::text,
        TG_TABLE_SCHEMA::text,
        NEW,
        OLD
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS broadcast_follow_trigger ON public.follows;
CREATE TRIGGER broadcast_follow_trigger
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_follow();

-- ============================================================================
-- 8. Creator Revenue Broadcast Trigger
-- Broadcasts to: revenue:{creator_id}
-- ============================================================================

CREATE OR REPLACE FUNCTION public.broadcast_revenue()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM realtime.broadcast_changes(
        'revenue:' || NEW.creator_id::text,
        TG_OP::text,
        TG_OP::text,
        TG_TABLE_NAME::text,
        TG_TABLE_SCHEMA::text,
        NEW,
        OLD
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS broadcast_revenue_trigger ON public.creator_revenue;
CREATE TRIGGER broadcast_revenue_trigger
    AFTER INSERT OR UPDATE ON public.creator_revenue
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_revenue();

-- ============================================================================
-- 9. Leaderboard Changes Broadcast
-- Custom function to broadcast leaderboard updates
-- ============================================================================

CREATE OR REPLACE FUNCTION public.broadcast_leaderboard_update(
    p_timeframe TEXT,
    p_metric TEXT,
    p_changes jsonb
)
RETURNS void AS $$
BEGIN
    -- This function is called by pg_cron after leaderboard recalculation
    -- It broadcasts rank changes to interested clients
    PERFORM pg_notify(
        'leaderboard:' || p_timeframe || ':' || p_metric,
        p_changes::text
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. Channel Documentation
-- ============================================================================

COMMENT ON FUNCTION broadcast_post_changes IS 'Broadcasts post changes to feed:global and feed:user:{id}';
COMMENT ON FUNCTION broadcast_notification IS 'Broadcasts notifications to notify:{user_id}';
COMMENT ON FUNCTION broadcast_trade IS 'Broadcasts trades to trade:{mint} and trade:global';
COMMENT ON FUNCTION broadcast_token_update IS 'Broadcasts token updates to token:{mint}';
COMMENT ON FUNCTION broadcast_like IS 'Broadcasts likes to post:{id}:engagement';
COMMENT ON FUNCTION broadcast_comment IS 'Broadcasts comments to post:{id}:comments';
COMMENT ON FUNCTION broadcast_follow IS 'Broadcasts follows to user:{id}:followers';
COMMENT ON FUNCTION broadcast_revenue IS 'Broadcasts revenue updates to revenue:{creator_id}';
COMMENT ON FUNCTION broadcast_leaderboard_update IS 'Broadcasts leaderboard rank changes';

-- ============================================================================
-- Channel Reference:
-- ============================================================================
-- feed:global              - All new posts (public)
-- feed:user:{user_id}      - Specific user's posts
-- notify:{user_id}         - Private notifications
-- trade:{token_mint}       - Trades for specific token
-- trade:global             - All trades (for activity feed)
-- token:{mint_address}     - Token price/stats updates
-- post:{post_id}:engagement - Likes on a post
-- post:{post_id}:comments  - Comments on a post
-- user:{user_id}:followers - Follow/unfollow events
-- revenue:{creator_id}     - Creator revenue updates
-- leaderboard:{timeframe}:{metric} - Rank changes
-- ============================================================================

-- ============================================================================
-- End of Broadcast Triggers
-- ============================================================================
