-- ============================================
-- FIX ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- This fixes RLS policies that might be blocking post reads
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Check current RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('posts', 'users');

-- Step 2: Disable RLS on posts table (since we use service role key)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS but make it permissive:
-- Step 3: Create permissive policies for posts
DROP POLICY IF EXISTS "Allow all reads on posts" ON posts;
CREATE POLICY "Allow all reads on posts"
ON posts FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow all inserts on posts" ON posts;
CREATE POLICY "Allow all inserts on posts"
ON posts FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all updates on posts" ON posts;
CREATE POLICY "Allow all updates on posts"
ON posts FOR UPDATE
USING (true);

-- Step 4: Create permissive policies for users
DROP POLICY IF EXISTS "Allow all reads on users" ON users;
CREATE POLICY "Allow all reads on users"
ON users FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow all inserts on users" ON users;
CREATE POLICY "Allow all inserts on users"
ON users FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all updates on users" ON users;
CREATE POLICY "Allow all updates on users"
ON users FOR UPDATE
USING (true);

-- Step 5: Verify policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('posts', 'users')
ORDER BY tablename, policyname;

-- Step 6: Test query (should return your posts now)
SELECT
    p.id,
    p.title,
    p.user_id,
    u.username
FROM posts p
LEFT JOIN users u ON u.id = p.user_id
WHERE p.user_id = '8f493b96-1894-44bd-a760-9f59931bebeb'
ORDER BY p.created_at DESC;

-- ============================================
-- EXPECTED RESULT:
-- ============================================
-- You should see 2 posts: BULLMA and MFLEX
-- If you don't see them, RLS is still blocking
-- ============================================
