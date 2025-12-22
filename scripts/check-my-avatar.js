const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gtaadivvasxndgafszxb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YWFkaXZ2YXN4bmRnYWZzenhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc4NzY0MiwiZXhwIjoyMDc5MzYzNjQyfQ.jCa0Srh0n-DkaR4xD523lVExDcx1eIgi9GUAwgxkJL8'
);

async function checkMyAvatar() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       FIND YOUR AVATAR - COPY YOUR WALLET ADDRESS       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('Open your app, connect wallet, and copy the wallet address from:');
  console.log('  • Browser console logs');
  console.log('  • Wallet UI');
  console.log('  • Or use the wallet address you see in the app\n');

  // If you know your wallet, replace this:
  const MY_WALLET = process.argv[2]; // Pass as command line argument

  if (!MY_WALLET) {
    console.log('Usage: node check-my-avatar.js YOUR_WALLET_ADDRESS\n');
    console.log('OR just look at this list and find yourself:\n');

    // Show all users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error.message);
      return;
    }

    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.display_name} (@${user.username})`);
      console.log(`   Wallet: ${user.wallet_address}`);
      console.log(`   Avatar: ${user.avatar_url || 'NOT SET'}`);
      console.log('');
    });

    return;
  }

  // Look up specific user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', MY_WALLET)
    .single();

  if (error) {
    console.error('❌ User not found:', error.message);
    return;
  }

  console.log('✅ FOUND YOUR PROFILE:\n');
  console.log(`Display Name: ${user.display_name}`);
  console.log(`Username: @${user.username}`);
  console.log(`Wallet: ${user.wallet_address}`);
  console.log(`\nAvatar URL: ${user.avatar_url || 'NOT SET'}\n`);

  if (!user.avatar_url) {
    console.log('❌ PROBLEM: You have NO avatar set in database!');
    console.log('\n💡 SOLUTION:');
    console.log('   1. Go to /profile/edit in your app');
    console.log('   2. Click the camera icon on your profile picture');
    console.log('   3. Select an image');
    console.log('   4. Click "Save Changes"');
    console.log('   5. Check browser console for any upload errors\n');
  } else if (user.avatar_url.includes('dicebear')) {
    console.log('⚠️  PROBLEM: You have a DICEBEAR (dummy) avatar!');
    console.log('   This is the auto-generated avatar.\n');
    console.log('💡 SOLUTION: Upload a custom image:');
    console.log('   1. Go to /profile/edit');
    console.log('   2. Upload a new image\n');
  } else if (user.avatar_url.includes('supabase')) {
    console.log('✅ You have a CUSTOM avatar uploaded!');
    console.log(`   URL: ${user.avatar_url}`);
    console.log('\nTesting if image is accessible...');

    // Try to fetch the image
    try {
      const response = await fetch(user.avatar_url);
      if (response.ok) {
        console.log('✅ Image is accessible!');
        console.log(`   Size: ${(parseInt(response.headers.get('content-length')) / 1024).toFixed(2)} KB`);
        console.log(`   Type: ${response.headers.get('content-type')}`);
        console.log('\n🎯 Your avatar should be showing! If not:');
        console.log('   • Hard refresh browser (Cmd+Shift+R)');
        console.log('   • Clear browser cache');
        console.log('   • Check browser console for errors');
      } else {
        console.log(`❌ Image NOT accessible! HTTP ${response.status}`);
        console.log('   The URL exists in DB but image cannot be loaded');
        console.log('\n💡 SOLUTION: Re-upload your avatar');
      }
    } catch (fetchError) {
      console.log('❌ Cannot fetch image:', fetchError.message);
    }
  }
}

checkMyAvatar()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
