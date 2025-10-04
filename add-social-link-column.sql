-- Add social_link column to posts table if it doesn't exist
-- Run this in your Supabase SQL Editor

-- Check if the column exists and add it if it doesn't
DO $$ 
BEGIN
    -- Check if the social_link column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'social_link'
        AND table_schema = 'public'
    ) THEN
        -- Add the social_link column
        ALTER TABLE posts ADD COLUMN social_link TEXT;
        RAISE NOTICE 'Added social_link column to posts table';
    ELSE
        RAISE NOTICE 'social_link column already exists in posts table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;