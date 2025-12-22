/**
 * Export Waitlist to CSV for Beta Launch
 *
 * Run: node scripts/export-waitlist.js
 *
 * Outputs: waitlist-export.csv with columns:
 * - email
 * - referral_code
 * - position
 * - referrals_count
 * - created_at
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function exportWaitlist() {
  console.log('🚀 Exporting waitlist for beta launch...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch all waitlist signups
  const { data: signups, error } = await supabase
    .from('waitlist_signups')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching waitlist:', error);
    process.exit(1);
  }

  if (!signups || signups.length === 0) {
    console.log('⚠️  No signups found in waitlist');
    process.exit(0);
  }

  console.log(`📊 Found ${signups.length} signups\n`);

  // Calculate referral counts
  const referralCounts = {};
  signups.forEach(signup => {
    if (signup.referred_by) {
      referralCounts[signup.referred_by] = (referralCounts[signup.referred_by] || 0) + 1;
    }
  });

  // Enrich data with referral counts
  const enrichedData = signups.map(signup => ({
    email: signup.email,
    referral_code: signup.referral_code,
    position: signup.position || 0,
    referrals_count: referralCounts[signup.referral_code] || 0,
    created_at: signup.created_at,
  }));

  // Sort by referrals (descending) - these are your power users!
  enrichedData.sort((a, b) => b.referrals_count - a.referrals_count);

  // Create CSV
  const csvHeader = 'email,referral_code,position,referrals_count,created_at\n';
  const csvRows = enrichedData.map(row =>
    `${row.email},${row.referral_code},${row.position},${row.referrals_count},${row.created_at}`
  ).join('\n');

  const csv = csvHeader + csvRows;

  // Save to file
  const filename = 'waitlist-export.csv';
  fs.writeFileSync(filename, csv);

  console.log(`✅ Exported ${signups.length} signups to ${filename}\n`);

  // Show top 10 referrers (your power users!)
  console.log('🏆 TOP 10 POWER USERS (Most Referrals):\n');
  enrichedData.slice(0, 10).forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} - ${user.referrals_count} referrals`);
  });

  console.log('\n📧 LAUNCH STRATEGY:');
  console.log('1. Email top 50 power users first (highest referrals)');
  console.log('2. Give them early access + 10 invite codes each');
  console.log('3. Email next 50 users 24 hours later');
  console.log('4. Email final batch 48 hours later\n');

  // Create segments
  const top50 = enrichedData.slice(0, 50);
  const next50 = enrichedData.slice(50, 100);
  const remaining = enrichedData.slice(100);

  // Save segments
  fs.writeFileSync('top-50-power-users.csv',
    csvHeader + top50.map(r =>
      `${r.email},${r.referral_code},${r.position},${r.referrals_count},${r.created_at}`
    ).join('\n')
  );

  fs.writeFileSync('next-50-users.csv',
    csvHeader + next50.map(r =>
      `${r.email},${r.referral_code},${r.position},${r.referrals_count},${r.created_at}`
    ).join('\n')
  );

  if (remaining.length > 0) {
    fs.writeFileSync('remaining-users.csv',
      csvHeader + remaining.map(r =>
        `${r.email},${r.referral_code},${r.position},${r.referrals_count},${r.created_at}`
      ).join('\n')
    );
  }

  console.log('✅ Created launch segments:');
  console.log(`   - top-50-power-users.csv (${top50.length} users)`);
  console.log(`   - next-50-users.csv (${next50.length} users)`);
  if (remaining.length > 0) {
    console.log(`   - remaining-users.csv (${remaining.length} users)`);
  }

  console.log('\n🚀 Ready to launch! Use these CSVs with your email tool.\n');
}

exportWaitlist().catch(console.error);
