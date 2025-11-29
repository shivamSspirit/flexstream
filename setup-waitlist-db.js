/**
 * Setup script to create waitlist database table
 * Run with: node setup-waitlist-db.js
 */

const https = require('https');
const fs = require('fs');

const supabaseUrl = 'https://aopxbpvxwqfqqamkprfo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcHhicHZ4d3FmcXFhbWtwcmZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcwMjM0MSwiZXhwIjoyMDc0Mjc4MzQxfQ.MYLsyF9bycOJWCPypfBh4STfmDg03-vCd6iwoYo-3NE';

// Read the SQL schema file
const sqlSchema = fs.readFileSync('./supabase-waitlist-schema.sql', 'utf8');

// Split SQL into individual statements
const statements = sqlSchema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log('🚀 Setting up waitlist database...');
console.log(`📝 Found ${statements.length} SQL statements to execute`);

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: 'aopxbpvxwqfqqamkprfo.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: responseData });
        } else {
          reject({ success: false, error: responseData, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function setupDatabase() {
  console.log('\n⚠️  Note: This script uses Supabase REST API.');
  console.log('📌 If you have access to Supabase dashboard, you can also:');
  console.log('   1. Go to SQL Editor in your Supabase dashboard');
  console.log('   2. Copy contents of supabase-waitlist-schema.sql');
  console.log('   3. Paste and run the query\n');

  console.log('📋 SQL Schema Preview:');
  console.log('─'.repeat(60));
  console.log(sqlSchema.substring(0, 500) + '...\n');
  console.log('─'.repeat(60));

  console.log('\n✅ Schema file is ready!');
  console.log('\n🔧 SETUP OPTIONS:\n');
  console.log('Option 1 (Recommended): Manual Setup via Supabase Dashboard');
  console.log('  1. Visit: https://supabase.com/dashboard/project/aopxbpvxwqfqqamkprfo/editor');
  console.log('  2. Click "SQL Editor" in the left sidebar');
  console.log('  3. Click "New Query"');
  console.log('  4. Copy contents from supabase-waitlist-schema.sql');
  console.log('  5. Paste into SQL editor');
  console.log('  6. Click "Run" button\n');

  console.log('Option 2: Command Line (if you have psql installed)');
  console.log('  psql "$DATABASE_URL" < supabase-waitlist-schema.sql\n');

  console.log('📍 After setup, test with:');
  console.log('  curl -X POST http://localhost:3000/api/waitlist/join \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"email":"test@example.com"}\'');
  console.log('\n✨ You should see a success response with referral code!');
}

setupDatabase().catch(err => {
  console.error('❌ Setup error:', err);
  process.exit(1);
});
