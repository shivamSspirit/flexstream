-- ============================================
-- FIX PROFILE ROUTE ISSUE - USERNAME CLEANUP
-- ============================================
-- This SQL fixes usernames with underscores that cause routing issues
--
-- STEP 1: Go to Supabase Dashboard > SQL Editor
-- STEP 2: Copy and paste this ENTIRE file
-- STEP 3: Click RUN
-- ============================================

-- First, let's see what we're dealing with
-- This shows all users with problematic usernames
SELECT
    id,
    username,
    display_name,
    wallet_address,
    created_at,
    CASE
        WHEN username LIKE '%\_%' THEN '⚠️ HAS UNDERSCORES - NEEDS FIX'
        WHEN LENGTH(username) > 25 THEN '⚠️ TOO LONG - NEEDS FIX'
        ELSE '✅ CLEAN'
    END as status
FROM users
WHERE username LIKE '%\_%' OR LENGTH(username) > 25
ORDER BY created_at DESC;

-- ============================================
-- OPTION 1: FIX A SPECIFIC USER
-- ============================================
-- Replace 'YOUR_OLD_USERNAME' with your actual username (e.g., 6vwmrd_mivowlfm_v87xpz)
-- Replace 'NEW_CLEAN_USERNAME' with what you want (e.g., yourname or user123abc)
--
-- Uncomment the lines below (remove the --) and replace the values:

-- UPDATE users
-- SET username = 'NEW_CLEAN_USERNAME'
-- WHERE username = 'YOUR_OLD_USERNAME';

-- Example:
-- UPDATE users
-- SET username = 'user123abc'
-- WHERE username = '6vwmrd_mivowlfm_v87xpz';


-- ============================================
-- OPTION 2: AUTO-FIX ALL USERS (RECOMMENDED)
-- ============================================
-- This automatically generates clean usernames for ALL users with underscores
--
-- Uncomment this section to run it:

/*
DO $$
DECLARE
    user_record RECORD;
    new_username TEXT;
    random_suffix TEXT;
BEGIN
    -- Loop through all users with underscores
    FOR user_record IN
        SELECT id, username, wallet_address
        FROM users
        WHERE username LIKE '%\_%' OR LENGTH(username) > 25
    LOOP
        -- Generate clean username: user + timestamp + random
        random_suffix := substr(md5(random()::text || user_record.wallet_address), 1, 6);
        new_username := 'user' || EXTRACT(EPOCH FROM NOW())::bigint || random_suffix;

        -- Ensure uniqueness (try up to 5 times)
        FOR i IN 1..5 LOOP
            IF NOT EXISTS (SELECT 1 FROM users WHERE username = new_username) THEN
                EXIT;
            END IF;
            random_suffix := substr(md5(random()::text || i::text), 1, 6);
            new_username := 'user' || EXTRACT(EPOCH FROM NOW())::bigint || random_suffix;
        END LOOP;

        -- Update the user
        UPDATE users
        SET username = new_username
        WHERE id = user_record.id;

        RAISE NOTICE 'Updated: % → %', user_record.username, new_username;
    END LOOP;
END $$;
*/


-- ============================================
-- OPTION 3: QUICK FIX FOR YOUR SPECIFIC USER
-- ============================================
-- If you know your wallet address, use this:
-- Replace 'YOUR_WALLET_ADDRESS' with your actual wallet address
-- Replace 'YOUR_NEW_USERNAME' with what you want
--
-- Uncomment the lines below:

-- UPDATE users
-- SET username = 'YOUR_NEW_USERNAME'
-- WHERE wallet_address = 'YOUR_WALLET_ADDRESS';

-- Example:
-- UPDATE users
-- SET username = 'myawesomeusername'
-- WHERE wallet_address = '6vwmrd1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z';


-- ============================================
-- AFTER RUNNING: VERIFY THE FIX
-- ============================================
-- Run this to see all users and their new clean usernames:

SELECT
    username,
    display_name,
    wallet_address,
    created_at,
    CASE
        WHEN username LIKE '%\_%' THEN '❌ STILL HAS UNDERSCORES'
        WHEN LENGTH(username) > 25 THEN '❌ STILL TOO LONG'
        ELSE '✅ CLEAN - READY TO USE'
    END as status
FROM users
ORDER BY created_at DESC
LIMIT 20;


-- ============================================
-- YOUR NEW PROFILE URL
-- ============================================
-- After fixing, your profile will be at:
-- http://localhost:3000/profile/YOUR_NEW_USERNAME
--
-- To find your new username, run this with your wallet:

-- SELECT
--     username,
--     'http://localhost:3000/profile/' || username as profile_url
-- FROM users
-- WHERE wallet_address = 'YOUR_WALLET_ADDRESS';


-- ============================================
-- EMERGENCY: FIND MY WALLET ADDRESS
-- ============================================
-- If you don't know your wallet address, it's shown in:
-- 1. Browser console when connected
-- 2. Your wallet app
-- 3. Any transaction you've made
--
-- Or run this to see ALL users:

-- SELECT
--     username,
--     display_name,
--     LEFT(wallet_address, 8) || '...' || RIGHT(wallet_address, 8) as wallet_preview,
--     created_at
-- FROM users
-- ORDER BY created_at DESC
-- LIMIT 10;
