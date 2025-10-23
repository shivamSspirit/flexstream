-- ============================================
-- FlexStream Database Verification Script
-- Run this in Supabase SQL Editor to verify your schema
-- ============================================

-- Step 1: Check if posts table exists
SELECT
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'posts'
  ) AS posts_table_exists;

-- Step 2: Check all columns in posts table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'posts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check if tokens table exists
SELECT
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'tokens'
  ) AS tokens_table_exists;

-- Step 4: Check all columns in tokens table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tokens'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 5: Reload schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Schema cache reloaded!' AS status;

-- ============================================
-- Expected Output
-- ============================================
-- posts_table_exists should be: true
-- posts columns should include: id, user_id, type, title, content, media_urls,
--   token_mint, token_symbol, token_name, pool_address, etc.
--
-- tokens_table_exists should be: true
-- tokens columns should include: id, mint_address, symbol, name, pool_address, etc.
--
-- If tables don't exist or columns are missing,
-- run the migration: supabase/migrations/run_all_migrations.sql
-- ============================================
