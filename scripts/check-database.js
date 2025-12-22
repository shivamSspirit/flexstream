const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gtaadivvasxndgafszxb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YWFkaXZ2YXN4bmRnYWZzenhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc4NzY0MiwiZXhwIjoyMDc5MzYzNjQyfQ.jCa0Srh0n-DkaR4xD523lVExDcx1eIgi9GUAwgxkJL8'
);

async function checkDatabase() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          DATABASE CHECK - FINDING THE ISSUE              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Check for the specific problematic username
  console.log('═══════════════════════════════════════════════════════════');
  console.log('STEP 1: Looking for username: 6vwmrd_mivowlfm_v87xpz');
  console.log('═══════════════════════════════════════════════════════════');

  const { data: specificUser, error: error1 } = await supabase
    .from('users')
    .select('*')
    .eq('username', '6vwmrd_mivowlfm_v87xpz')
    .single();

  if (specificUser) {
    console.log('✅ USER EXISTS!');
    console.log('');
    console.log('User Details:');
    console.log('  ID:', specificUser.id);
    console.log('  Username:', specificUser.username);
    console.log('  Display Name:', specificUser.display_name);
    console.log('  Wallet:', specificUser.wallet_address);
    console.log('  Created:', specificUser.created_at);
    console.log('');
    console.log('🎯 ROOT CAUSE: User EXISTS in database!');
    console.log('   The routing issue is NOT a database problem.');
    console.log('   Issue must be in the frontend/React code.');
    console.log('');
  } else {
    console.log('❌ USER DOES NOT EXIST');
    console.log('');
    console.log('Error Details:');
    console.log('  Message:', error1?.message);
    console.log('  Code:', error1?.code);
    console.log('');
    console.log('🎯 ROOT CAUSE: User with username "6vwmrd_mivowlfm_v87xpz" NOT in database!');
    console.log('   This is why the profile route fails and redirects to explore.');
    console.log('');
  }

  // Check all users
  console.log('═══════════════════════════════════════════════════════════');
  console.log('STEP 2: Checking ALL users in database:');
  console.log('═══════════════════════════════════════════════════════════');

  const { data: allUsers, error: error2 } = await supabase
    .from('users')
    .select('username, wallet_address, display_name, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error2) {
    console.error('❌ Error fetching users:', error2.message);
    return;
  }

  if (!allUsers || allUsers.length === 0) {
    console.log('❌ NO USERS IN DATABASE!');
    console.log('');
    console.log('🎯 ROOT CAUSE: Database is EMPTY!');
    console.log('   No users have been created yet.');
    console.log('');
    console.log('💡 SOLUTION:');
    console.log('   1. Connect your wallet in the app');
    console.log('   2. The useEnsureUser hook should auto-create your user');
    console.log('   3. If it does not work, check browser console for errors');
    return;
  }

  console.log('Found ' + allUsers.length + ' users:\n');

  allUsers.forEach((user, index) => {
    const num = index + 1;
    console.log(num + '. Username: ' + user.username);
    console.log('   Display: ' + user.display_name);
    console.log('   Wallet: ' + (user.wallet_address ? user.wallet_address.substring(0, 8) + '...' + user.wallet_address.substring(user.wallet_address.length - 6) : 'N/A'));
    console.log('   Has underscores: ' + (user.username.includes('_') ? '⚠️  YES' : '✅ NO'));
    console.log('   Created: ' + new Date(user.created_at).toLocaleString());
    console.log('');
  });

  // Summary
  const usersWithUnderscores = allUsers.filter(u => u.username.includes('_'));
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SUMMARY:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Total users:', allUsers.length);
  console.log('Users with underscores:', usersWithUnderscores.length);
  console.log('Clean users:', allUsers.length - usersWithUnderscores.length);
  console.log('');

  if (specificUser) {
    console.log('🎯 CONCLUSION: Your user EXISTS but profile route still fails.');
    console.log('   → Check browser console for React/routing errors');
    console.log('   → Check if Next.js dev server is running');
    console.log('   → Try hard refresh (Ctrl+Shift+R)');
    console.log('   → Clear browser cache');
  } else {
    console.log('🎯 CONCLUSION: User "6vwmrd_mivowlfm_v87xpz" does NOT exist.');
    console.log('   → Connect wallet to auto-create user');
    console.log('   → Or run: pnpm migrate:usernames');
  }
}

checkDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
