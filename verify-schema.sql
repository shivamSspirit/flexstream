-- Quick verification script to check if social link columns exist
-- Run this in Supabase SQL Editor to check your current schema

-- Check what columns exist in the users table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Specifically check for social link columns
DO $$
DECLARE
    has_twitter BOOLEAN;
    has_instagram BOOLEAN;
    has_website BOOLEAN;
    has_cover_url BOOLEAN;
BEGIN
    -- Check each column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'twitter'
    ) INTO has_twitter;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'instagram'
    ) INTO has_instagram;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'website'
    ) INTO has_website;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'cover_url'
    ) INTO has_cover_url;

    -- Report results
    RAISE NOTICE '=================================';
    RAISE NOTICE 'SOCIAL LINKS SCHEMA CHECK';
    RAISE NOTICE '=================================';

    IF has_twitter THEN
        RAISE NOTICE '✅ twitter column exists';
    ELSE
        RAISE NOTICE '❌ twitter column MISSING - run fix-social-links-schema.sql';
    END IF;

    IF has_instagram THEN
        RAISE NOTICE '✅ instagram column exists';
    ELSE
        RAISE NOTICE '❌ instagram column MISSING - run fix-social-links-schema.sql';
    END IF;

    IF has_website THEN
        RAISE NOTICE '✅ website column exists';
    ELSE
        RAISE NOTICE '❌ website column MISSING - run fix-social-links-schema.sql';
    END IF;

    IF has_cover_url THEN
        RAISE NOTICE '✅ cover_url column exists';
    ELSE
        RAISE NOTICE '❌ cover_url column MISSING - run fix-social-links-schema.sql';
    END IF;

    RAISE NOTICE '=================================';

    IF has_twitter AND has_instagram AND has_website AND has_cover_url THEN
        RAISE NOTICE '✅ ALL REQUIRED COLUMNS EXIST!';
        RAISE NOTICE '✅ Social links should work correctly';
    ELSE
        RAISE NOTICE '⚠️  MISSING COLUMNS DETECTED!';
        RAISE NOTICE '⚠️  Please run fix-social-links-schema.sql to add missing columns';
    END IF;
END $$;
