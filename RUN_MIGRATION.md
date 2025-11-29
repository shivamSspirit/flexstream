# How to Apply the Anti-Rug Migration

## Quick Start

The migration is ready in: `apply-anti-rug-migration.sql`

This combined migration will:
1. ✅ Create the `tokens` table (if it doesn't exist)
2. ✅ Add anti-rug columns (`display_name`, `is_verified`)
3. ✅ Set up automatic verification triggers
4. ✅ Update views for token leaderboards

## Option 1: Supabase Dashboard (Easiest)

1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the contents of `apply-anti-rug-migration.sql`
5. Paste into the editor
6. Click **Run**
7. You should see a verification table showing ✓ for all components

## Option 2: Using psql CLI

```bash
# Set your database URL (get from Supabase project settings)
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"

# Run the migration
psql "$DATABASE_URL" -f apply-anti-rug-migration.sql
```

## Option 3: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

## Verification

After running the migration, you should see output like:

```
object               | status
---------------------|----------
Tokens table         | ✓ Created
display_name column  | ✓ Added
is_verified column   | ✓ Added
Anti-rug trigger     | ✓ Created
```

## Test the Anti-Rug System

### 1. Start your dev server
```bash
pnpm dev
```

### 2. Create first token
- Go to create a post
- Enter ticker: "MOON"
- Submit
- **Result:** Token should show ✓ Verified badge

### 3. Create duplicate token
- Create another post
- Enter ticker: "MOON" (same name)
- Submit
- **Result:** Token should show ⚠️ Unverified warning

### 4. Verify in database
```sql
SELECT
  display_name,
  symbol,
  is_verified,
  created_at
FROM tokens
ORDER BY created_at DESC;
```

You should see:
- First "MOON" has `is_verified = true`
- Second "MOON" has `is_verified = false`
- Both have different `symbol` values

## Troubleshooting

### Error: "relation tokens does not exist"
- ✅ Fixed! Use the combined migration file `apply-anti-rug-migration.sql`

### Error: "column already exists"
- This is OK! The migration uses `IF NOT EXISTS` so it's safe to run multiple times

### Migration runs but no data shows
- Check if posts table exists: `SELECT * FROM posts LIMIT 1;`
- Check if users table exists: `SELECT * FROM users LIMIT 1;`
- These should have been created in earlier migrations

## What Changed

### Database Tables:

**tokens table:**
```sql
+ display_name TEXT          -- User's chosen name (e.g., "PEPE")
+ is_verified BOOLEAN        -- True if first with this display_name
```

**posts table:**
```sql
+ token_display_name TEXT    -- Denormalized for performance
+ token_is_verified BOOLEAN  -- Denormalized for performance
```

### Automatic Features:
- ✅ Trigger auto-verifies first token with each display_name
- ✅ Case-insensitive display_name matching
- ✅ Updated leaderboard views include verification status

## Next Steps

After migration succeeds:

1. ✅ Test creating tokens with duplicate names
2. ✅ Verify badges show in UI
3. ✅ Check token symbols are unique
4. ✅ Confirm verification badges display correctly

## Need Help?

Check these files:
- `ANTI_RUG_IMPLEMENTATION_COMPLETE.md` - Full implementation details
- `apply-anti-rug-migration.sql` - The migration SQL
- `supabase/migrations/003_add_anti_rug_mechanism.sql` - Just the anti-rug part

---

**Ready to apply?** Run the migration using Option 1 (Supabase Dashboard) - it's the easiest! 🚀
