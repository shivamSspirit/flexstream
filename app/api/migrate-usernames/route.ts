import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: Migrate Usernames
 * POST /api/migrate-usernames
 *
 * Fixes all existing users with old username formats (containing underscores)
 * and updates them to clean, URL-friendly usernames.
 *
 * IMPORTANT: This is a one-time migration. Run it once to fix all existing users.
 */
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 [MIGRATION] Starting username migration...');

    // Fetch all users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, username, wallet_address, display_name');

    if (fetchError) {
      console.error('❌ [MIGRATION] Error fetching users:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users',
        details: fetchError.message
      }, { status: 500 });
    }

    console.log(`✅ [MIGRATION] Found ${users.length} users`);

    // Find users with underscores or long usernames
    const usersToMigrate = users.filter(user =>
      user.username.includes('_') || user.username.length > 25
    );

    if (usersToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All usernames are already clean! No migration needed.',
        stats: {
          totalUsers: users.length,
          migrated: 0,
          skipped: users.length
        }
      });
    }

    console.log(`📊 [MIGRATION] Found ${usersToMigrate.length} users to migrate`);

    const migrations = [];
    let successCount = 0;
    let failCount = 0;

    // Migrate each user
    for (const user of usersToMigrate) {
      const oldUsername = user.username;

      // Generate new clean username
      const timestamp = Date.now().toString(36).toLowerCase();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toLowerCase();
      let newUsername = `user${timestamp}${randomSuffix}`;

      // Ensure uniqueness
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
          const newRandom = Math.random().toString(36).substring(2, 6).toLowerCase();
          newUsername = `user${timestamp}${newRandom}`;
          attempts++;
        }
      }

      if (!isUnique) {
        console.error(`❌ [MIGRATION] Failed to generate unique username for ${oldUsername}`);
        failCount++;
        continue;
      }

      // Update the user
      const { error: updateError } = await supabase
        .from('users')
        .update({ username: newUsername })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ [MIGRATION] Failed to migrate ${oldUsername}:`, updateError.message);
        failCount++;
      } else {
        console.log(`✅ [MIGRATION] Migrated: ${oldUsername} → ${newUsername}`);
        migrations.push({
          oldUsername,
          newUsername,
          wallet: user.wallet_address.substring(0, 8) + '...',
          displayName: user.display_name
        });
        successCount++;
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ [MIGRATION] Migration complete!');
    console.log(`📊 [MIGRATION] Success: ${successCount}, Failed: ${failCount}`);

    return NextResponse.json({
      success: true,
      message: 'Username migration completed successfully!',
      stats: {
        totalUsers: users.length,
        usersToMigrate: usersToMigrate.length,
        migrated: successCount,
        failed: failCount
      },
      migrations: migrations.slice(0, 10), // Return first 10 for preview
      note: migrations.length > 10 ? `Showing first 10 of ${migrations.length} migrations` : null
    });

  } catch (error) {
    console.error('❌ [MIGRATION] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check migration status
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all users
    const { data: users, error } = await supabase
      .from('users')
      .select('username');

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users'
      }, { status: 500 });
    }

    const usersWithUnderscores = users.filter(u => u.username.includes('_'));
    const usersWithLongNames = users.filter(u => u.username.length > 25);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: users.length,
        usersWithUnderscores: usersWithUnderscores.length,
        usersWithLongNames: usersWithLongNames.length,
        needsMigration: new Set([...usersWithUnderscores, ...usersWithLongNames]).size,
        cleanUsernames: users.length - new Set([...usersWithUnderscores, ...usersWithLongNames]).size
      },
      needsMigration: new Set([...usersWithUnderscores, ...usersWithLongNames]).size > 0,
      message: new Set([...usersWithUnderscores, ...usersWithLongNames]).size > 0
        ? 'Migration needed - some users have old username format'
        : 'All usernames are clean!'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
