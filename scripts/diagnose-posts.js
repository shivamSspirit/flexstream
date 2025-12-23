/**
 * Diagnostic Script: Check Posts in Database
 *
 * Run with: node scripts/diagnose-posts.js
 *
 * This script checks:
 * 1. Total posts in database
 * 2. Total users in database
 * 3. User-post relationships
 * 4. Duplicate users (same wallet)
 * 5. Posts without users
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || envVars.SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found in environment variables!');
  console.error('Make sure .env.local has:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log('🔍 FlexStream Database Diagnostic');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Check total posts
  console.log('📊 1. POSTS COUNT');
  console.log('──────────────────────────────────────────────────────');
  const { count: postsCount, error: postsError } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  if (postsError) {
    console.error('❌ Error fetching posts count:', postsError.message);
  } else {
    console.log(`✅ Total Posts: ${postsCount}`);
  }
  console.log('');

  // 2. Check total users
  console.log('👥 2. USERS COUNT');
  console.log('──────────────────────────────────────────────────────');
  const { count: usersCount, error: usersError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (usersError) {
    console.error('❌ Error fetching users count:', usersError.message);
  } else {
    console.log(`✅ Total Users: ${usersCount}`);
  }
  console.log('');

  // 3. Get sample posts with user info
  if (postsCount > 0) {
    console.log('📝 3. RECENT POSTS (Last 5)');
    console.log('──────────────────────────────────────────────────────');
    const { data: posts, error: postsListError } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        title,
        created_at,
        users!inner (
          id,
          username,
          wallet_address
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (postsListError) {
      console.error('❌ Error fetching posts:', postsListError.message);
    } else {
      posts.forEach((post, idx) => {
        console.log(`\n${idx + 1}. "${post.title}"`);
        console.log(`   Post ID: ${post.id}`);
        console.log(`   Post user_id: ${post.user_id}`);
        console.log(`   User ID: ${post.users.id}`);
        console.log(`   Username: ${post.users.username}`);
        console.log(`   Wallet: ${post.users.wallet_address?.substring(0, 16)}...`);
        console.log(`   Created: ${new Date(post.created_at).toLocaleString()}`);
        console.log(`   IDs Match: ${post.user_id === post.users.id ? '✅ YES' : '❌ NO'}`);
      });
    }
    console.log('');
  }

  // 4. Check for duplicate users (same wallet)
  console.log('🔍 4. DUPLICATE USERS CHECK');
  console.log('──────────────────────────────────────────────────────');
  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('id, username, wallet_address, created_at')
    .order('created_at', { ascending: false });

  if (allUsersError) {
    console.error('❌ Error fetching users:', allUsersError.message);
  } else {
    // Group by wallet address
    const walletGroups = {};
    allUsers.forEach(user => {
      const wallet = user.wallet_address;
      if (!walletGroups[wallet]) {
        walletGroups[wallet] = [];
      }
      walletGroups[wallet].push(user);
    });

    // Find duplicates
    const duplicates = Object.values(walletGroups).filter(group => group.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate users found');
    } else {
      console.log(`⚠️  Found ${duplicates.length} wallet(s) with multiple user profiles:`);
      duplicates.forEach((group, idx) => {
        console.log(`\n   ${idx + 1}. Wallet: ${group[0].wallet_address?.substring(0, 16)}...`);
        group.forEach((user, userIdx) => {
          console.log(`      ${userIdx + 1}. User ID: ${user.id}`);
          console.log(`         Username: ${user.username}`);
          console.log(`         Created: ${new Date(user.created_at).toLocaleString()}`);
        });
      });

      console.log('\n⚠️  ISSUE DETECTED: Multiple user profiles exist for the same wallet!');
      console.log('   This causes posts to be associated with different user IDs.');
      console.log('   Solution: Merge duplicate users or ensure consistent user lookup.');
    }
  }
  console.log('');

  // 5. User-Post relationships
  if (usersCount > 0 && postsCount > 0) {
    console.log('🔗 5. USER-POST RELATIONSHIPS');
    console.log('──────────────────────────────────────────────────────');
    const { data: userPostCounts, error: relationError } = await supabase.rpc(
      'get_user_post_counts',
      {},
      { count: 'exact' }
    ).catch(async () => {
      // Fallback if RPC doesn't exist
      const { data: users } = await supabase
        .from('users')
        .select(`
          id,
          username,
          wallet_address
        `);

      const results = [];
      for (const user of users) {
        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (count > 0) {
          results.push({
            username: user.username,
            wallet: user.wallet_address,
            post_count: count
          });
        }
      }
      return { data: results };
    });

    if (userPostCounts && userPostCounts.length > 0) {
      console.log('Users with posts:');
      userPostCounts
        .sort((a, b) => b.post_count - a.post_count)
        .forEach((user, idx) => {
          console.log(`   ${idx + 1}. ${user.username} (${user.wallet?.substring(0, 16)}...)`);
          console.log(`      Posts: ${user.post_count}`);
        });
    } else {
      console.log('⚠️  No users found with posts');
    }
  }
  console.log('');

  // 6. Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Posts: ${postsCount}`);
  console.log(`Total Users: ${usersCount}`);
  console.log(`Duplicate Users: ${duplicates ? duplicates.length : 0}`);

  if (postsCount === 0) {
    console.log('\n❌ NO POSTS IN DATABASE');
    console.log('   Posts aren\'t showing because none have been created yet.');
    console.log('   Create your first post at /create');
  } else if (duplicates && duplicates.length > 0) {
    console.log('\n⚠️  USER DUPLICATION ISSUE');
    console.log('   Posts exist but might be associated with wrong user IDs');
    console.log('   due to duplicate user profiles.');
  } else {
    console.log('\n✅ Database looks healthy!');
    console.log('   If posts still aren\'t showing, check:');
    console.log('   1. Browser console for API errors');
    console.log('   2. Network tab for failed requests');
    console.log('   3. React Query DevTools for cache issues');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

diagnose().catch(console.error);
