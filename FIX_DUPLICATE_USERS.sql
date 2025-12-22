-- ============================================
-- FIX DUPLICATE USERS MIGRATION
-- ============================================
-- This fixes duplicate user accounts for the same wallet address
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Find and log duplicate users
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT wallet_address
        FROM users
        GROUP BY wallet_address
        HAVING COUNT(*) > 1
    ) AS duplicates;

    RAISE NOTICE '🔍 Found % wallet addresses with duplicate user accounts', duplicate_count;
END $$;

-- Step 2: For each duplicate wallet, keep the OLDEST user and merge posts to it
DO $$
DECLARE
    duplicate_wallet RECORD;
    oldest_user_id UUID;
    duplicate_user_ids UUID[];
    post_count INTEGER;
BEGIN
    -- Loop through each wallet address that has duplicates
    FOR duplicate_wallet IN
        SELECT wallet_address
        FROM users
        GROUP BY wallet_address
        HAVING COUNT(*) > 1
    LOOP
        -- Get the oldest user ID for this wallet (the one we'll keep)
        SELECT id INTO oldest_user_id
        FROM users
        WHERE wallet_address = duplicate_wallet.wallet_address
        ORDER BY created_at ASC
        LIMIT 1;

        -- Get all other user IDs for this wallet (the duplicates we'll remove)
        SELECT ARRAY_AGG(id) INTO duplicate_user_ids
        FROM users
        WHERE wallet_address = duplicate_wallet.wallet_address
        AND id != oldest_user_id;

        RAISE NOTICE '';
        RAISE NOTICE '👤 Processing wallet: %', duplicate_wallet.wallet_address;
        RAISE NOTICE '   Keeping user ID: %', oldest_user_id;
        RAISE NOTICE '   Removing % duplicate(s)', ARRAY_LENGTH(duplicate_user_ids, 1);

        -- Move all posts from duplicate users to the oldest user
        UPDATE posts
        SET user_id = oldest_user_id
        WHERE user_id = ANY(duplicate_user_ids);

        GET DIAGNOSTICS post_count = ROW_COUNT;
        IF post_count > 0 THEN
            RAISE NOTICE '   ✅ Moved % posts to oldest user', post_count;
        END IF;

        -- Delete the duplicate user records
        DELETE FROM users
        WHERE id = ANY(duplicate_user_ids);

        RAISE NOTICE '   ✅ Deleted % duplicate user record(s)', ARRAY_LENGTH(duplicate_user_ids, 1);
    END LOOP;
END $$;

-- Step 3: Add UNIQUE constraint to prevent future duplicates
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_wallet_address_unique'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_wallet_address_unique UNIQUE (wallet_address);
        RAISE NOTICE '✅ Added UNIQUE constraint on wallet_address';
    ELSE
        RAISE NOTICE 'ℹ️  UNIQUE constraint already exists on wallet_address';
    END IF;
END $$;

-- Step 4: Verify the fix
DO $$
DECLARE
    remaining_duplicates INTEGER;
    total_users INTEGER;
    total_posts INTEGER;
BEGIN
    -- Check for remaining duplicates
    SELECT COUNT(*) INTO remaining_duplicates
    FROM (
        SELECT wallet_address
        FROM users
        GROUP BY wallet_address
        HAVING COUNT(*) > 1
    ) AS duplicates;

    -- Get totals
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO total_posts FROM posts;

    RAISE NOTICE '';
    RAISE NOTICE '📊 FINAL STATUS:';
    RAISE NOTICE '   Total users: %', total_users;
    RAISE NOTICE '   Total posts: %', total_posts;
    RAISE NOTICE '   Remaining duplicates: %', remaining_duplicates;

    IF remaining_duplicates = 0 THEN
        RAISE NOTICE '✅ SUCCESS! No duplicate users remaining';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Still have % duplicate(s)', remaining_duplicates;
    END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- After running this:
-- 1. All posts are now linked to one user per wallet
-- 2. Duplicate user accounts have been removed
-- 3. Future duplicates are prevented by UNIQUE constraint
-- 4. Your profile should now show all your posts!
-- ============================================
