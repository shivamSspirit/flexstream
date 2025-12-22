/**
 * MIGRATION SCRIPT: Clean Up Old Usernames
 *
 * This script fixes all existing users with old username formats (containing underscores)
 * and updates them to clean, URL-friendly usernames.
 *
 * Run this with: node scripts/migrate-usernames.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Generate clean, URL-friendly username
 */
function generateCleanUsername() {
  const timestamp = Date.now().toString(36).toLowerCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toLowerCase();
  return `user${timestamp}${randomSuffix}`;
}

/**
 * Check if username needs migration (has underscores or problematic characters)
 */
function needsMigration(username) {
  // Check for underscores or multiple consecutive characters that might cause issues
  return username.includes('_') || username.length > 25;
}

/**
 * Main migration function
 */
async function migrateUsernames() {
  console.log('🚀 Starting username migration...\n');

  try {
    // Fetch all users
    console.log('📋 Fetching all users from database...');
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, username, wallet_address, display_name');

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return;
    }

    console.log(`✅ Found ${users.length} users\n`);

    // Find users that need migration
    const usersToMigrate = users.filter(user => needsMigration(user.username));

    if (usersToMigrate.length === 0) {
      console.log('✅ All usernames are already clean! No migration needed.');
      return;
    }

    console.log(`📊 Found ${usersToMigrate.length} users with old username format:\n`);

    // Show preview
    usersToMigrate.slice(0, 5).forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.username} (wallet: ${user.wallet_address.substring(0, 8)}...)`);
    });
    if (usersToMigrate.length > 5) {
      console.log(`   ... and ${usersToMigrate.length - 5} more\n`);
    }

    console.log('\n🔄 Starting migration...\n');

    let successCount = 0;
    let failCount = 0;
    const migrations = [];

    // Migrate each user
    for (const user of usersToMigrate) {
      const oldUsername = user.username;
      let newUsername = generateCleanUsername();

      // Ensure uniqueness - keep trying until we get a unique username
      let attempts = 0;
      let isUnique = false;

      while (!isUnique && attempts < 10) {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('username', newUsername)
          .single();

        if (!existing) {
          isUnique = true;
        } else {
          newUsername = generateCleanUsername();
          attempts++;
        }
      }

      if (!isUnique) {
        console.error(`❌ Failed to generate unique username for ${oldUsername}`);
        failCount++;
        continue;
      }

      // Update the user
      const { error: updateError } = await supabase
        .from('users')
        .update({ username: newUsername })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Failed to migrate ${oldUsername}:`, updateError.message);
        failCount++;
      } else {
        console.log(`✅ Migrated: ${oldUsername} → ${newUsername}`);
        migrations.push({ oldUsername, newUsername, wallet: user.wallet_address });
        successCount++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${successCount} users`);
    console.log(`❌ Failed: ${failCount} users`);
    console.log(`📝 Total processed: ${usersToMigrate.length} users`);
    console.log('='.repeat(60) + '\n');

    // Save migration log
    if (migrations.length > 0) {
      const fs = require('fs');
      const logPath = './username-migration-log.json';
      fs.writeFileSync(logPath, JSON.stringify(migrations, null, 2));
      console.log(`📄 Migration log saved to: ${logPath}\n`);
    }

    console.log('🎉 Migration complete!\n');
    console.log('📋 Next steps:');
    console.log('   1. All users with old usernames have been updated');
    console.log('   2. Users can now access their profiles at /profile/{new-username}');
    console.log('   3. Users can customize their username in Edit Profile\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         USERNAME MIGRATION TOOL - FLEXSTREAM               ║');
console.log('║  Fixes old usernames with underscores to clean format     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

migrateUsernames()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
