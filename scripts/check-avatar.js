const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gtaadivvasxndgafszxb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YWFkaXZ2YXN4bmRnYWZzenhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc4NzY0MiwiZXhwIjoyMDc5MzYzNjQyfQ.jCa0Srh0n-DkaR4xD523lVExDcx1eIgi9GUAwgxkJL8'
);

async function checkAvatars() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          CHECKING AVATAR URLs IN DATABASE               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Get all users and their avatars
  const { data: users, error } = await supabase
    .from('users')
    .select('username, display_name, wallet_address, avatar_url')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching users:', error.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log('❌ NO USERS IN DATABASE!');
    return;
  }

  console.log(`Found ${users.length} users:\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.display_name} (@${user.username})`);
    console.log(`   Wallet: ${user.wallet_address.substring(0, 8)}...${user.wallet_address.substring(user.wallet_address.length - 6)}`);
    console.log(`   Avatar URL: ${user.avatar_url || 'NULL'}`);

    if (!user.avatar_url) {
      console.log('   ⚠️  NO AVATAR SET - Will show fallback');
    } else if (user.avatar_url.includes('dicebear')) {
      console.log('   ⚠️  USING DICEBEAR (default/dummy avatar)');
    } else if (user.avatar_url.includes('supabase')) {
      console.log('   ✅ USING CUSTOM AVATAR from Supabase storage');
    } else {
      console.log('   🔗 USING EXTERNAL URL');
    }
    console.log('');
  });

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║          TESTING STORAGE BUCKET                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Try to list files in the storage bucket
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

  if (bucketError) {
    console.error('❌ Error listing buckets:', bucketError.message);
    return;
  }

  console.log('Available storage buckets:');
  buckets.forEach(bucket => {
    console.log(`  - ${bucket.name} (${bucket.public ? 'PUBLIC' : 'PRIVATE'})`);
  });

  const flexstreamBucket = buckets.find(b => b.name === 'flexstream');
  if (!flexstreamBucket) {
    console.log('\n❌ ERROR: "flexstream" bucket NOT FOUND!');
    console.log('   This is why avatar uploads are failing!');
    console.log('\n💡 SOLUTION: Create the "flexstream" bucket in Supabase:');
    console.log('   1. Go to Supabase Dashboard > Storage');
    console.log('   2. Click "New bucket"');
    console.log('   3. Name: flexstream');
    console.log('   4. Make it PUBLIC');
    console.log('   5. Save');
  } else {
    console.log(`\n✅ "flexstream" bucket exists (${flexstreamBucket.public ? 'PUBLIC' : 'PRIVATE'})`);

    if (!flexstreamBucket.public) {
      console.log('   ⚠️  WARNING: Bucket is PRIVATE - uploaded images won\'t be accessible!');
      console.log('   💡 Make it PUBLIC in Supabase Dashboard > Storage > flexstream > Settings');
    }

    // Try to list files in avatars folder
    const { data: files, error: filesError } = await supabase.storage
      .from('flexstream')
      .list('avatars', {
        limit: 10,
        offset: 0,
      });

    if (filesError) {
      console.log(`\n⚠️  Could not list files in avatars folder: ${filesError.message}`);
    } else if (files && files.length > 0) {
      console.log(`\n✅ Found ${files.length} files in avatars folder:`);
      files.forEach(file => {
        console.log(`   - ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`);
      });
    } else {
      console.log('\n⚠️  No files found in avatars folder yet');
    }
  }
}

checkAvatars()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
