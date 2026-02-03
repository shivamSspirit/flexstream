-- Flexit Database Migration Script
-- Run this in your Supabase SQL Editor to ensure all columns exist

-- Add social_link column to posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'social_link'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN social_link TEXT;
        RAISE NOTICE 'Added social_link column to posts table';
    ELSE
        RAISE NOTICE 'social_link column already exists in posts table';
    END IF;
END $$;

-- Add media_urls column to posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'media_urls'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN media_urls TEXT[];
        RAISE NOTICE 'Added media_urls column to posts table';
    ELSE
        RAISE NOTICE 'media_urls column already exists in posts table';
    END IF;
END $$;

-- Add earnings_amount column to posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'earnings_amount'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN earnings_amount DECIMAL;
        RAISE NOTICE 'Added earnings_amount column to posts table';
    ELSE
        RAISE NOTICE 'earnings_amount column already exists in posts table';
    END IF;
END $$;

-- Add token_address column to posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'token_address'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN token_address TEXT;
        RAISE NOTICE 'Added token_address column to posts table';
    ELSE
        RAISE NOTICE 'token_address column already exists in posts table';
    END IF;
END $$;

-- Add verified column to posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'verified'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added verified column to posts table';
    ELSE
        RAISE NOTICE 'verified column already exists in posts table';
    END IF;
END $$;

-- Add likes_count column to posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'likes_count'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN likes_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added likes_count column to posts table';
    ELSE
        RAISE NOTICE 'likes_count column already exists in posts table';
    END IF;
END $$;

-- Add comments_count column to posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'comments_count'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN comments_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added comments_count column to posts table';
    ELSE
        RAISE NOTICE 'comments_count column already exists in posts table';
    END IF;
END $$;

-- Add shares_count column to posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'shares_count'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE posts ADD COLUMN shares_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added shares_count column to posts table';
    ELSE
        RAISE NOTICE 'shares_count column already exists in posts table';
    END IF;
END $$;

-- Verify all columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;