/**
 * ROOT CAUSE DIAGNOSTIC SCRIPT
 * This will show EXACTLY why the profile route is failing
 *
 * Run: node scripts/debug-profile-route.js YOUR_WALLET_ADDRESS
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugProfileRoute(walletAddress) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           PROFILE ROUTE ROOT CAUSE DEBUGGER                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('🔍 Wallet Address:', walletAddress);
  console.log('');

  // Step 1: Check if user exists by wallet
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: Looking up user by wallet address...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const { data: userByWallet, error: walletError } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (walletError) {
    console.error('❌ FAILED: User not found by wallet address');
    console.error('Error code:', walletError.code);
    console.error('Error message:', walletError.message);
    console.log('');
    console.log('🔍 ROOT CAUSE: No user exists with this wallet address in the database');
    console.log('');
    console.log('💡 SOLUTION:');
    console.log('   1. Connect your wallet in the app');
    console.log('   2. Wait 3 seconds for auto-creation');
    console.log('   3. Check console for "✅ New user created:" message');
    console.log('   4. If not created, run: fetch(\'/api/users/ensure\', {method: \'POST\', headers: {\'Content-Type\': \'application/json\'}, body: JSON.stringify({walletAddress: \'' + walletAddress + '\'})}).then(r=>r.json()).then(console.log)');
    return;
  }

  console.log('✅ SUCCESS: User found by wallet address');
  console.log('');
  console.log('📊 User Data:');
  console.log('   ID:', userByWallet.id);
  console.log('   Username:', userByWallet.username);
  console.log('   Display Name:', userByWallet.display_name);
  console.log('   Created:', new Date(userByWallet.created_at).toLocaleString());
  console.log('');

  const username = userByWallet.username;

  // Step 2: Check username format
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 2: Analyzing username format...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const hasUnderscores = username.includes('_');
  const usernameLength = username.length;
  const isClean = !hasUnderscores && usernameLength <= 20;

  console.log('   Username:', username);
  console.log('   Length:', usernameLength);
  console.log('   Has underscores:', hasUnderscores ? '⚠️ YES' : '✅ NO');
  console.log('   Is URL-friendly:', isClean ? '✅ YES' : '⚠️ NO');
  console.log('');

  if (hasUnderscores) {
    console.log('⚠️ WARNING: Username contains underscores (old format)');
    console.log('   This CAN work in URLs, but might cause issues');
    console.log('');
  }

  // Step 3: Test profile URL
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 3: Testing profile URL...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const profileUrl = `/profile/${username}`;
  const encodedUrl = `/profile/${encodeURIComponent(username)}`;

  console.log('   Profile URL:', `http://localhost:3000${profileUrl}`);
  console.log('   Encoded URL:', `http://localhost:3000${encodedUrl}`);
  console.log('');

  // Step 4: Test database lookup (simulate what the route does)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 4: Simulating profile route database lookup...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 1: Direct lookup
  console.log('🔍 Test 1: Direct username lookup...');
  const { data: test1, error: error1 } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (test1) {
    console.log('   ✅ SUCCESS: Found user with direct lookup');
  } else {
    console.log('   ❌ FAILED:', error1?.message);
  }

  // Test 2: Decoded lookup (what the route should do)
  const decodedUsername = decodeURIComponent(username);
  console.log('🔍 Test 2: Decoded username lookup...');
  console.log('   Original:', username);
  console.log('   Decoded:', decodedUsername);

  const { data: test2, error: error2 } = await supabase
    .from('users')
    .select('*')
    .eq('username', decodedUsername)
    .single();

  if (test2) {
    console.log('   ✅ SUCCESS: Found user with decoded lookup');
  } else {
    console.log('   ❌ FAILED:', error2?.message);
  }

  // Test 3: Case-insensitive lookup
  console.log('🔍 Test 3: Case-insensitive lookup...');
  const { data: test3, error: error3 } = await supabase
    .from('users')
    .select('*')
    .ilike('username', username)
    .single();

  if (test3) {
    console.log('   ✅ SUCCESS: Found user with case-insensitive lookup');
  } else {
    console.log('   ❌ FAILED:', error3?.message);
  }

  console.log('');

  // Step 5: ROOT CAUSE ANALYSIS
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 5: ROOT CAUSE ANALYSIS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (test1 && test2 && test3) {
    console.log('✅ ALL LOOKUPS SUCCESSFUL!');
    console.log('');
    console.log('🎯 ROOT CAUSE: The database lookup is working perfectly.');
    console.log('   The issue must be in the frontend routing or React component.');
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('   1. Check browser console for errors when visiting:', profileUrl);
    console.log('   2. Look for any error messages in the toast notifications');
    console.log('   3. Check if the page is redirecting before the profile loads');
    console.log('   4. Clear browser cache and try again');
    console.log('');
    console.log('📋 DEBUGGING COMMANDS (run in browser console):');
    console.log(`   localStorage.clear()`);
    console.log(`   sessionStorage.clear()`);
    console.log(`   location.reload()`);
  } else {
    console.log('❌ DATABASE LOOKUP FAILED!');
    console.log('');
    console.log('🎯 ROOT CAUSE: The username in the database doesn\'t match the URL.');
    console.log('');
    console.log('💡 SOLUTION: Update username to clean format');
    console.log('');
    console.log('Run this command:');
    console.log(`   pnpm migrate:usernames`);
    console.log('');
    console.log('Or run this in browser console:');
    console.log(`   fetch('/api/migrate-usernames', {method: 'POST'}).then(r=>r.json()).then(console.log)`);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('User exists:', userByWallet ? '✅ YES' : '❌ NO');
  console.log('Username:', username);
  console.log('Profile URL:', `http://localhost:3000${profileUrl}`);
  console.log('Database lookup works:', (test1 || test2 || test3) ? '✅ YES' : '❌ NO');
  console.log('Clean username:', isClean ? '✅ YES' : '⚠️ NO (has underscores)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Get wallet address from command line
const walletAddress = process.argv[2];

if (!walletAddress) {
  console.error('❌ Please provide a wallet address!');
  console.error('');
  console.error('Usage: node scripts/debug-profile-route.js YOUR_WALLET_ADDRESS');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/debug-profile-route.js 6vwmrd1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z');
  process.exit(1);
}

debugProfileRoute(walletAddress)
  .then(() => {
    console.log('');
    console.log('✅ Diagnostic complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
