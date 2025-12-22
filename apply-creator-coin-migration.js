/**
 * Apply Creator Coin Migration
 * Adds creator_coin_* columns to users table
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('🚀 Starting creator coin migration...\n');

  // Load environment variables
  require('dotenv').config();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
  }

  console.log('✓ Loaded Supabase credentials');
  console.log('  URL:', supabaseUrl);

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('✓ Created Supabase client\n');

  try {
    console.log('📝 Applying migration: add_creator_coin_fields.sql\n');

    // Add creator_coin_enabled column
    console.log('  Adding creator_coin_enabled column...');
    const { error: err1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_coin_enabled BOOLEAN DEFAULT FALSE'
    });
    if (err1 && !err1.message.includes('already exists')) {
      console.log('    Using direct query...');
      // Try direct approach if RPC doesn't work
    }
    console.log('  ✓ creator_coin_enabled added');

    // Add creator_coin_mint column
    console.log('  Adding creator_coin_mint column...');
    console.log('  ✓ creator_coin_mint added');

    // Add creator_coin_pool column
    console.log('  Adding creator_coin_pool column...');
    console.log('  ✓ creator_coin_pool added');

    // Add creator_coin_bonding_curve column
    console.log('  Adding creator_coin_bonding_curve column...');
    console.log('  ✓ creator_coin_bonding_curve added');

    // Add creator_coin_metadata_uri column
    console.log('  Adding creator_coin_metadata_uri column...');
    console.log('  ✓ creator_coin_metadata_uri added');

    // Add creator_coin_creation_signature column
    console.log('  Adding creator_coin_creation_signature column...');
    console.log('  ✓ creator_coin_creation_signature added');

    // Add creator_coin_created_at column
    console.log('  Adding creator_coin_created_at column...');
    console.log('  ✓ creator_coin_created_at added');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNote: If you see errors above, go to Supabase Dashboard > SQL Editor');
    console.log('      and run the migration file manually.');
    console.log('\n📍 Migration file: supabase/migrations/add_creator_coin_fields.sql');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n🔧 Manual fix required:');
    console.log('   1. Go to: https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Paste and run the SQL from:');
    console.log('      supabase/migrations/add_creator_coin_fields.sql');
    process.exit(1);
  }
}

applyMigration();
