-- ============================================
-- DEBUG PROFILE POSTS ISSUE
-- ============================================
-- This helps identify why posts aren't showing on profile
-- Copy the output and share it to help debug
-- ============================================

-- Step 1: Check if there are ANY posts in the database
SELECT
    COUNT(*) as total_posts,
    COUNT(DISTINCT user_id) as unique_users_with_posts
FROM posts;

-- Step 2: Show all users and their post counts
SELECT
    u.id as user_id,
    u.username,
    u.display_name,
    u.wallet_address,
    u.created_at as user_created_at,
    COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
GROUP BY u.id, u.username, u.display_name, u.wallet_address, u.created_at
ORDER BY u.created_at DESC;

-- Step 3: Check for orphaned posts (posts with no matching user)
SELECT
    p.id as post_id,
    p.user_id,
    p.title,
    p.created_at as post_created_at,
    CASE
        WHEN u.id IS NULL THEN '❌ ORPHANED (no user found)'
        ELSE '✅ Has user'
    END as status
FROM posts p
LEFT JOIN users u ON u.id = p.user_id
ORDER BY p.created_at DESC;

-- Step 4: Check if there are still duplicate users
SELECT
    wallet_address,
    COUNT(*) as user_count,
    ARRAY_AGG(id ORDER BY created_at ASC) as user_ids,
    ARRAY_AGG(username ORDER BY created_at ASC) as usernames
FROM users
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- Step 5: For the most recent wallet, show detailed info
DO $$
DECLARE
    recent_wallet TEXT;
    user_record RECORD;
    post_record RECORD;
BEGIN
    -- Get most recent wallet address
    SELECT wallet_address INTO recent_wallet
    FROM users
    ORDER BY created_at DESC
    LIMIT 1;

    RAISE NOTICE '';
    RAISE NOTICE '🔍 DEBUGGING MOST RECENT USER';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Wallet: %', recent_wallet;
    RAISE NOTICE '';

    -- Show all users for this wallet
    RAISE NOTICE '👤 USERS FOR THIS WALLET:';
    FOR user_record IN
        SELECT id, username, display_name, created_at
        FROM users
        WHERE wallet_address = recent_wallet
        ORDER BY created_at ASC
    LOOP
        RAISE NOTICE '   User ID: % | Username: % | Created: %',
            user_record.id, user_record.username, user_record.created_at;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '📝 POSTS BY USER_ID:';
    -- Show posts for each user ID of this wallet
    FOR user_record IN
        SELECT id FROM users WHERE wallet_address = recent_wallet
    LOOP
        FOR post_record IN
            SELECT id, title, created_at
            FROM posts
            WHERE user_id = user_record.id
            ORDER BY created_at DESC
        LOOP
            RAISE NOTICE '   Post ID: % | Title: % | User ID: % | Created: %',
                post_record.id, post_record.title, user_record.id, post_record.created_at;
        END LOOP;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '🔍 CHECKING POSTS API QUERY:';
    -- Simulate what the profile page query does
    FOR user_record IN
        SELECT id FROM users WHERE wallet_address = recent_wallet LIMIT 1
    LOOP
        RAISE NOTICE '   Profile would use user_id: %', user_record.id;
        RAISE NOTICE '   Posts found for this user_id:';
        FOR post_record IN
            SELECT id, title FROM posts WHERE user_id = user_record.id
        LOOP
            RAISE NOTICE '      - %', post_record.title;
        END LOOP;
    END LOOP;

END $$;

-- ============================================
-- LOOK FOR THESE ISSUES:
-- ============================================
-- 1. If "total_posts" is 0 → No posts exist at all
-- 2. If posts exist but "post_count" is 0 for your user → User ID mismatch
-- 3. If "ORPHANED" posts exist → Posts reference deleted user
-- 4. If duplicate users still exist → Migration didn't work
-- ============================================
