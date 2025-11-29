# Jupiter Schema Migration Guide

## Problem Fixed ✅

**Original Error:**
```
ERROR: 42601: syntax error at or near "DESC"
LINE 42: INDEX idx_jupiter_swaps_created_at (created_at DESC)
```

**Root Cause:** PostgreSQL doesn't support inline `INDEX` declarations inside `CREATE TABLE` statements. Indexes must be created separately.

## Solution

Use the corrected schema file: **`supabase-jupiter-schema-fixed.sql`**

### Key Changes

1. **Separated Index Creation** ✅
   - Removed inline `INDEX` declarations from table definitions
   - Created all indexes separately after table creation
   - Added `IF NOT EXISTS` for safety

2. **Fixed RLS Policies** ✅
   - Simplified service role policies to use `USING (true)`
   - Added explicit INSERT policies for authenticated users
   - Added DROP statements to prevent conflicts on re-run

3. **Added Safety Features** ✅
   - Added `IF NOT EXISTS` to all CREATE statements
   - Added `DROP TRIGGER IF EXISTS` before creating triggers
   - Added `DROP POLICY IF EXISTS` before creating policies
   - Schema can now be run multiple times safely

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Go to SQL Editor:**
   https://supabase.com/dashboard/project/aopxbpvxwqfqqamkprfo/sql/new

2. **Copy the entire contents of:** `supabase-jupiter-schema-fixed.sql`

3. **Paste and Run**

4. **Verify Success:**
   Look for this message:
   ```
   ✅ Jupiter schema migration completed successfully!
   📊 Created 4 tables: jupiter_swaps, jupiter_quotes, jupiter_fee_distributions, jupiter_fee_claims
   📈 Created 1 view: creator_earnings_dashboard
   🔐 Configured RLS policies for all tables
   ⚡ Added indexes for optimal query performance
   ```

### Option 2: Command Line (If psql is installed)

```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@db.aopxbpvxwqfqqamkprfo.supabase.co:5432/postgres" \
  -f supabase-jupiter-schema-fixed.sql
```

## What This Migration Creates

### Tables

1. **`jupiter_swaps`** - Tracks all Jupiter swap transactions
   - Stores swap details (input/output amounts, tokens)
   - Fee information per swap
   - Links to posts and creators

2. **`jupiter_quotes`** - Analytics for quote requests
   - Tracks quote requests before execution
   - Helps analyze conversion rates
   - Links quotes to executed swaps

3. **`jupiter_fee_distributions`** - Creator earnings aggregation
   - Aggregates fees per creator and token
   - Tracks pending distributions
   - Shows total collected vs distributed

4. **`jupiter_fee_claims`** - Fee payout transactions
   - Individual claim/payout records
   - Transaction signatures
   - Status tracking (pending, confirmed, failed)

### Views

- **`creator_earnings_dashboard`** - Ready-to-use earnings view
  - Joins fees with user data
  - Shows pending distributions
  - Ordered by pending amount

### Indexes Created

**Performance optimized queries on:**
- User wallet lookups
- Creator wallet lookups
- Post references
- Transaction signatures
- Time-based queries (descending order)
- Execution status

### Functions & Triggers

1. **`update_fee_distribution_on_swap()`**
   - Auto-updates fee distributions when swaps occur
   - Aggregates fees by creator and token

2. **`mark_quote_executed()`**
   - Links executed swaps back to their quotes
   - Updates quote status automatically

## Testing the Migration

After running the migration, verify with these queries:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'jupiter%';

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename LIKE 'jupiter%';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'jupiter%';

-- Check policies exist
SELECT tablename, policyname FROM pg_policies
WHERE tablename LIKE 'jupiter%';
```

Expected Results:
- ✅ 4 tables created
- ✅ 14 indexes created
- ✅ RLS enabled on all tables
- ✅ Multiple policies per table

## Common Issues & Solutions

### Issue: "relation already exists"
**Solution:** The fixed schema handles this with `IF NOT EXISTS`. Just re-run it.

### Issue: "policy already exists"
**Solution:** The fixed schema drops existing policies first. Safe to re-run.

### Issue: RLS blocking inserts
**Solution:** The schema now includes INSERT policies for authenticated users.

### Issue: Service role can't access data
**Solution:** Service role policies use `USING (true)` which allows full access.

## Integration with Your App

After migration, you can:

1. **Track swaps:**
   ```typescript
   await supabase.from('jupiter_swaps').insert({
     signature: tx.signature,
     user_wallet: wallet.publicKey.toBase58(),
     creator_wallet: post.creator_wallet,
     // ... other fields
   });
   ```

2. **Query creator earnings:**
   ```typescript
   const { data } = await supabase
     .from('creator_earnings_dashboard')
     .select('*')
     .eq('creator_wallet', creatorWallet);
   ```

3. **Check pending distributions:**
   ```typescript
   const { data } = await supabase
     .from('jupiter_fee_distributions')
     .select('*')
     .eq('creator_wallet', wallet)
     .gt('pending_distribution', 0);
   ```

## Files Reference

- ✅ `supabase-jupiter-schema-fixed.sql` - Corrected schema (USE THIS)
- ❌ `supabase-jupiter-schema.sql` - Original with errors (DON'T USE)
- 📄 `JUPITER_MIGRATION_GUIDE.md` - This guide

## Next Steps

1. ✅ Apply the migration using the fixed SQL file
2. ✅ Verify all tables/indexes/policies are created
3. ✅ Test with a sample swap insert
4. ✅ Integrate Jupiter swap tracking in your app
5. ✅ Build creator earnings dashboard

## Need Help?

If you encounter any issues:
1. Check Supabase logs in the dashboard
2. Verify you're using `supabase-jupiter-schema-fixed.sql` (not the old one)
3. Make sure you have the necessary permissions
4. Check if the `posts` and `users` tables exist (required for foreign keys)

---

**Ready to go!** 🚀 Just copy the fixed SQL and run it in Supabase SQL Editor.
