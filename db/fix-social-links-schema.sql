-- Fix Social Links Schema
-- This migration adds the missing social link columns to the users table
-- Run this in your Supabase SQL Editor

-- Add social media columns if they don't exist
DO $$
BEGIN
    -- Add twitter column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'twitter'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN twitter TEXT;
        RAISE NOTICE 'Added twitter column to users table';
    ELSE
        RAISE NOTICE 'twitter column already exists in users table';
    END IF;

    -- Add instagram column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'instagram'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN instagram TEXT;
        RAISE NOTICE 'Added instagram column to users table';
    ELSE
        RAISE NOTICE 'instagram column already exists in users table';
    END IF;

    -- Add website column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'website'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN website TEXT;
        RAISE NOTICE 'Added website column to users table';
    ELSE
        RAISE NOTICE 'website column already exists in users table';
    END IF;

    -- Add cover_url column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'cover_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD COLUMN cover_url TEXT;
        RAISE NOTICE 'Added cover_url column to users table';
    ELSE
        RAISE NOTICE 'cover_url column already exists in users table';
    END IF;
END $$;

-- Add column comments for documentation
COMMENT ON COLUMN users.twitter IS 'Twitter/X username (without @)';
COMMENT ON COLUMN users.instagram IS 'Instagram username (without @)';
COMMENT ON COLUMN users.website IS 'Personal website URL (full URL with https://)';
COMMENT ON COLUMN users.cover_url IS 'URL to cover/banner image stored in Supabase Storage';

-- Create indexes for faster lookups (only where values exist)
CREATE INDEX IF NOT EXISTS idx_users_twitter ON users(twitter) WHERE twitter IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_instagram ON users(instagram) WHERE instagram IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_website ON users(website) WHERE website IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_cover_url ON users(cover_url) WHERE cover_url IS NOT NULL;

-- Verify all columns were added successfully
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
AND column_name IN ('twitter', 'instagram', 'website', 'cover_url', 'bio', 'avatar_url')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Social links schema migration completed successfully!';
    RAISE NOTICE '✅ You can now save Twitter, Instagram, and Website links to user profiles';
END $$;
