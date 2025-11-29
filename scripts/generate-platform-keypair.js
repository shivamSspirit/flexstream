/**
 * Generate Platform Keypair for Backend DBC Token Creation
 *
 * This script generates a new Solana keypair that will be used by your platform
 * to automatically create DBC tokens without requiring user signatures.
 *
 * Usage:
 *   node scripts/generate-platform-keypair.js
 *
 * The keypair will be used to:
 * - Pay transaction fees for token creation
 * - Act as the pool creator for all DBC pools
 * - Sign transactions on behalf of users
 */

const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

console.log('\n🔑 Generating Platform Keypair for Backend DBC Token Creation\n');

// Generate new keypair
const keypair = Keypair.generate();
const publicKey = keypair.publicKey.toBase58();
const secretKey = Array.from(keypair.secretKey);

// Display information
console.log('✅ Keypair generated successfully!\n');
console.log('═══════════════════════════════════════════════════════════');
console.log('📋 PLATFORM WALLET INFO');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`Public Key:  ${publicKey}\n`);
console.log('─────────────────────────────────────────────────────────────');
console.log('🔐 SECRET KEY (Keep this safe!)');
console.log('─────────────────────────────────────────────────────────────\n');
console.log('JSON Array Format (for .env):');
console.log(`PLATFORM_KEYPAIR_SECRET=${JSON.stringify(secretKey)}\n`);

// Save to file
const keypairPath = path.join(__dirname, '..', 'platform-keypair.json');
const envPath = path.join(__dirname, '..', '.env.local');

try {
  // Save keypair to JSON file
  fs.writeFileSync(keypairPath, JSON.stringify(secretKey, null, 2));
  console.log(`✅ Keypair saved to: ${keypairPath}\n`);
} catch (error) {
  console.error(`❌ Error saving keypair file: ${error.message}\n`);
}

// Check if .env.local exists and update it
if (fs.existsSync(envPath)) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📝 NEXT STEPS');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('1. Add this to your .env.local file:\n');
  console.log(`   PLATFORM_KEYPAIR_SECRET=${JSON.stringify(secretKey)}\n`);
  console.log('2. Fund the platform wallet with SOL:\n');
  console.log('   For DEVNET:');
  console.log(`   solana airdrop 2 ${publicKey} --url devnet\n`);
  console.log('   For MAINNET:');
  console.log(`   Transfer SOL to: ${publicKey}\n`);
  console.log('3. Verify the balance:');
  console.log(`   solana balance ${publicKey} --url devnet\n`);
  console.log('4. Restart your Next.js server\n');
} else {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📝 NEXT STEPS');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('1. Create .env.local file and add:\n');
  console.log(`   PLATFORM_KEYPAIR_SECRET=${JSON.stringify(secretKey)}\n`);
  console.log('2. Fund the platform wallet with SOL (see above)\n');
  console.log('3. Start your Next.js server\n');
}

console.log('═══════════════════════════════════════════════════════════');
console.log('⚠️  SECURITY WARNING');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('• NEVER commit platform-keypair.json to git');
console.log('• NEVER share the secret key publicly');
console.log('• Add platform-keypair.json to .gitignore');
console.log('• Use different keypairs for dev/staging/production');
console.log('• Store production keys securely (AWS Secrets Manager, etc.)');
console.log('• Monitor wallet balance and transaction activity\n');
console.log('═══════════════════════════════════════════════════════════\n');
