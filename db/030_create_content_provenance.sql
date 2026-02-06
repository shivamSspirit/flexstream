-- ============================================================================
-- CONTENT PROVENANCE - Creator Ownership On-Chain
-- ============================================================================
-- Purpose: Track content hashes, on-chain anchors, and permanent storage URIs
-- Part of DB-FLEX-ARC-RECOMMENDED.md Phase 4 implementation
-- Note: Arweave/IPFS uploads require API keys (handled separately)
-- ============================================================================

-- ============================================================================
-- 1. Content Provenance Table
-- Stores proof of content creation and ownership
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_provenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_wallet TEXT NOT NULL,

    -- Content fingerprint
    content_hash TEXT NOT NULL,              -- SHA-256 of (title + content + media_hashes)
    media_hashes TEXT[],                     -- SHA-256 of each media file
    metadata_hash TEXT,                      -- SHA-256 of full metadata JSON

    -- On-chain anchor (Solana memo instruction)
    anchor_tx_signature TEXT,                -- Solana tx that recorded this hash
    anchor_slot BIGINT,                      -- Solana slot number
    anchor_block_time TIMESTAMPTZ,           -- block timestamp (proof of existence)
    anchor_status TEXT DEFAULT 'pending' CHECK (anchor_status IN (
        'pending',    -- not yet anchored
        'submitted',  -- tx submitted, waiting confirmation
        'confirmed',  -- tx confirmed on-chain
        'failed'      -- anchoring failed
    )),

    -- Permanent storage URIs (requires Arweave/IPFS setup)
    arweave_tx_id TEXT,                      -- Arweave transaction (permanent)
    ipfs_cid TEXT,                           -- IPFS CID (redundant copy)
    storage_status TEXT DEFAULT 'local_only' CHECK (storage_status IN (
        'local_only',    -- only in Supabase
        'uploading',     -- upload in progress
        'permanent',     -- stored on Arweave/IPFS
        'failed'         -- upload failed
    )),

    -- Ownership proof
    creator_signature TEXT,                  -- Creator's wallet signature of content_hash
    ownership_verified BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_provenance_post ON content_provenance(post_id);
CREATE INDEX IF NOT EXISTS idx_provenance_creator ON content_provenance(creator_id);
CREATE INDEX IF NOT EXISTS idx_provenance_hash ON content_provenance(content_hash);
CREATE INDEX IF NOT EXISTS idx_provenance_arweave ON content_provenance(arweave_tx_id) WHERE arweave_tx_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_provenance_anchor_status ON content_provenance(anchor_status) WHERE anchor_status != 'confirmed';

-- ============================================================================
-- 2. Auto-create provenance record on post insert
-- ============================================================================

CREATE OR REPLACE FUNCTION create_content_provenance()
RETURNS TRIGGER AS $$
DECLARE
    v_user_wallet TEXT;
    v_content_hash TEXT;
BEGIN
    -- Get creator wallet
    SELECT wallet_address INTO v_user_wallet
    FROM users WHERE id = NEW.user_id;

    -- Create content hash (SHA-256 of title + content)
    -- Note: In production, this should include media hashes
    v_content_hash := encode(
        sha256(
            (COALESCE(NEW.title, '') || '|' || COALESCE(NEW.content, '') || '|' || NEW.id::text)::bytea
        ),
        'hex'
    );

    -- Insert provenance record
    INSERT INTO content_provenance (
        post_id,
        creator_id,
        creator_wallet,
        content_hash,
        anchor_status,
        storage_status
    ) VALUES (
        NEW.id,
        NEW.user_id,
        v_user_wallet,
        v_content_hash,
        'pending',
        'local_only'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only for new posts, not updates)
DROP TRIGGER IF EXISTS trigger_create_content_provenance ON posts;
CREATE TRIGGER trigger_create_content_provenance
    AFTER INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION create_content_provenance();

-- ============================================================================
-- 3. Update timestamp trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_provenance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_provenance_timestamp ON content_provenance;
CREATE TRIGGER trigger_update_provenance_timestamp
    BEFORE UPDATE ON content_provenance
    FOR EACH ROW
    EXECUTE FUNCTION update_provenance_timestamp();

-- ============================================================================
-- 4. Row Level Security
-- ============================================================================

ALTER TABLE content_provenance ENABLE ROW LEVEL SECURITY;

-- Anyone can view provenance (it's public proof)
CREATE POLICY "Provenance is publicly readable"
    ON content_provenance FOR SELECT
    USING (true);

-- Only service role can modify
CREATE POLICY "Service role full access to provenance"
    ON content_provenance FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function to verify content hash matches stored content
CREATE OR REPLACE FUNCTION verify_content_hash(p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_post RECORD;
    v_provenance RECORD;
    v_computed_hash TEXT;
BEGIN
    -- Get post and provenance
    SELECT * INTO v_post FROM posts WHERE id = p_post_id;
    SELECT * INTO v_provenance FROM content_provenance WHERE post_id = p_post_id;

    IF v_post IS NULL OR v_provenance IS NULL THEN
        RETURN false;
    END IF;

    -- Compute hash
    v_computed_hash := encode(
        sha256(
            (COALESCE(v_post.title, '') || '|' || COALESCE(v_post.content, '') || '|' || v_post.id::text)::bytea
        ),
        'hex'
    );

    RETURN v_computed_hash = v_provenance.content_hash;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to mark content as anchored on-chain
CREATE OR REPLACE FUNCTION mark_content_anchored(
    p_post_id UUID,
    p_tx_signature TEXT,
    p_slot BIGINT,
    p_block_time TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE content_provenance
    SET
        anchor_tx_signature = p_tx_signature,
        anchor_slot = p_slot,
        anchor_block_time = p_block_time,
        anchor_status = 'confirmed'
    WHERE post_id = p_post_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to mark content as stored permanently
CREATE OR REPLACE FUNCTION mark_content_permanent(
    p_post_id UUID,
    p_arweave_tx_id TEXT DEFAULT NULL,
    p_ipfs_cid TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE content_provenance
    SET
        arweave_tx_id = COALESCE(p_arweave_tx_id, arweave_tx_id),
        ipfs_cid = COALESCE(p_ipfs_cid, ipfs_cid),
        storage_status = 'permanent'
    WHERE post_id = p_post_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. View for content with provenance status
-- ============================================================================

CREATE OR REPLACE VIEW posts_with_provenance AS
SELECT
    p.*,
    cp.content_hash,
    cp.anchor_status,
    cp.anchor_tx_signature,
    cp.anchor_block_time,
    cp.storage_status,
    cp.arweave_tx_id,
    cp.ipfs_cid,
    cp.ownership_verified,
    CASE
        WHEN cp.anchor_status = 'confirmed' AND cp.storage_status = 'permanent' THEN 'fully_verified'
        WHEN cp.anchor_status = 'confirmed' THEN 'on_chain_only'
        WHEN cp.storage_status = 'permanent' THEN 'permanent_only'
        ELSE 'pending'
    END AS provenance_status
FROM posts p
LEFT JOIN content_provenance cp ON cp.post_id = p.id;

-- ============================================================================
-- 7. Backfill existing posts (run once)
-- ============================================================================

-- Insert provenance records for existing posts that don't have one
INSERT INTO content_provenance (
    post_id,
    creator_id,
    creator_wallet,
    content_hash,
    anchor_status,
    storage_status
)
SELECT
    p.id,
    p.user_id,
    u.wallet_address,
    encode(
        sha256(
            (COALESCE(p.title, '') || '|' || COALESCE(p.content, '') || '|' || p.id::text)::bytea
        ),
        'hex'
    ),
    'pending',
    'local_only'
FROM posts p
JOIN users u ON u.id = p.user_id
WHERE NOT EXISTS (
    SELECT 1 FROM content_provenance cp WHERE cp.post_id = p.id
);

-- ============================================================================
-- 8. Comments
-- ============================================================================

COMMENT ON TABLE content_provenance IS 'Tracks content hashes and ownership proofs for creator content';
COMMENT ON COLUMN content_provenance.content_hash IS 'SHA-256 hash of post title + content';
COMMENT ON COLUMN content_provenance.anchor_tx_signature IS 'Solana transaction signature anchoring content hash on-chain';
COMMENT ON COLUMN content_provenance.arweave_tx_id IS 'Arweave transaction ID for permanent storage';
COMMENT ON FUNCTION verify_content_hash IS 'Verifies that content hash matches current post content';
COMMENT ON FUNCTION mark_content_anchored IS 'Updates provenance record when content is anchored on-chain';
COMMENT ON FUNCTION mark_content_permanent IS 'Updates provenance record when content is stored permanently';

-- ============================================================================
-- End of Content Provenance Schema
-- ============================================================================
