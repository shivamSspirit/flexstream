const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gtaadivvasxndgafszxb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YWFkaXZ2YXN4bmRnYWZzenhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc4NzY0MiwiZXhwIjoyMDc5MzYzNjQyfQ.jCa0Srh0n-DkaR4xD523lVExDcx1eIgi9GUAwgxkJL8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBuckets() {
  console.log('Setting up storage buckets...\n');

  // Create post-media bucket
  const { data: postMediaBucket, error: postMediaError } = await supabase.storage.createBucket('post-media', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
  });

  if (postMediaError) {
    if (postMediaError.message.includes('already exists')) {
      console.log('✅ post-media bucket already exists');
    } else {
      console.error('❌ Error creating post-media bucket:', postMediaError.message);
    }
  } else {
    console.log('✅ Created post-media bucket');
  }

  // Create flexstream bucket (for token metadata)
  const { data: flexstreamBucket, error: flexstreamError } = await supabase.storage.createBucket('flexstream', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['application/json', 'text/plain', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  });

  if (flexstreamError) {
    if (flexstreamError.message.includes('already exists')) {
      console.log('✅ flexstream bucket already exists');
    } else {
      console.error('❌ Error creating flexstream bucket:', flexstreamError.message);
    }
  } else {
    console.log('✅ Created flexstream bucket');
  }

  // List buckets to confirm
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (!listError) {
    console.log('\n📦 Available buckets:');
    buckets.forEach(b => console.log(`  - ${b.name} (public: ${b.public})`));
  }

  console.log('\n✅ Storage setup complete!');
}

setupStorageBuckets().catch(console.error);
