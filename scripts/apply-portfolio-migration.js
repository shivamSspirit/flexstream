#!/usr/bin/env node

/**
 * Apply Portfolio Migration
 *
 * This script applies the user portfolio tables migration to add:
 * - user_token_holdings table
 * - user_trading_history table
 * - Portfolio views and functions
 *
 * Usage: node scripts/apply-portfolio-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Starting Portfolio Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '005_add_user_portfolio_tables.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Error: Migration file not found at', migrationPath);
      process.exit(1);
    }

    console.log('📄 Reading migration file...');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📊 Applying migration to database...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct execution (less safe)
      console.log('⚠️  exec_sql function not found, trying direct execution...');

      // Split by statement and execute individually
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: execError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (execError) {
          console.error('❌ Error executing statement:', execError);
          console.error('Statement:', statement.substring(0, 100) + '...');
          throw execError;
        }
      }
    }

    console.log('✅ Migration applied successfully!\n');

    // Verify the migration
    console.log('🔍 Verifying migration...\n');

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['user_token_holdings', 'user_trading_history']);

    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError);
    } else {
      console.log('✓ Tables created:', tables?.map(t => t.table_name).join(', '));
    }

    const { data: views, error: viewsError } = await supabase
      .from('information_schema.views')
      .select('table_name')
      .in('table_name', ['user_portfolio_summary', 'user_created_tokens']);

    if (viewsError) {
      console.error('❌ Error verifying views:', viewsError);
    } else {
      console.log('✓ Views created:', views?.map(v => v.table_name).join(', '));
    }

    console.log('\n✨ Migration complete! Portfolio features are now available.\n');
    console.log('Next steps:');
    console.log('1. Test the portfolio tabs in the UI');
    console.log('2. Add some test trading data');
    console.log('3. Verify P&L calculations are working\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\nPlease apply the migration manually using the Supabase dashboard:');
    console.error('1. Go to https://app.supabase.com');
    console.error('2. Navigate to SQL Editor');
    console.error('3. Copy and paste the contents of supabase/migrations/005_add_user_portfolio_tables.sql');
    console.error('4. Click "Run"\n');
    process.exit(1);
  }
}

// Run the migration
applyMigration();
