-- ============================================
-- QUICK FIX - Copy and Run in Supabase
-- ============================================
-- This will fix YOUR username RIGHT NOW
-- Just replace YOUR_WALLET_ADDRESS with your actual wallet
-- ============================================

-- STEP 1: Find your current username
-- Replace YOUR_WALLET_ADDRESS with your wallet from the browser
SELECT
    '🔍 YOUR CURRENT INFO:' as info,
    username as old_username,
    display_name,
    wallet_address,
    'http://localhost:3000/profile/' || username as broken_url
FROM users
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';

-- Example:
-- WHERE wallet_address = '6vwmrd1a2b3c4d5e...';


-- STEP 2: Fix it with a clean username
-- Choose a new username (only letters, numbers, no underscores)
UPDATE users
SET username = 'myusername'  -- <-- CHANGE THIS to what you want
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';  -- <-- PUT YOUR WALLET HERE

-- Example:
-- SET username = 'shivam'
-- WHERE wallet_address = '6vwmrd1a2b3c4d5e...';


-- STEP 3: Verify it worked
SELECT
    '✅ FIXED! YOUR NEW INFO:' as info,
    username as new_username,
    'http://localhost:3000/profile/' || username as new_working_url
FROM users
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';


-- ============================================
-- OR USE THIS AUTO-FIX (No thinking required)
-- ============================================
-- This generates a clean username automatically
-- Just put your wallet address:

UPDATE users
SET username = 'user' || substr(md5(wallet_address), 1, 10)
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';

-- Then check:
SELECT username, 'http://localhost:3000/profile/' || username as profile_url
FROM users
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
