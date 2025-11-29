/**
 * Meteora DBC Pool Config Setup
 *
 * This script helps you create and configure a DBC pool config key
 * for automated token creation on FlexIt.
 *
 * Run: node scripts/setup-dbc-config.js
 */

const { Connection, Keypair, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

const DBC_PROGRAM_ID = new PublicKey('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN');

console.log('\n🎯 Meteora DBC Pool Config Setup\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('⚠️  .env file not found, will create one\n');
}

// Parse existing env variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

console.log('📋 Current Configuration:\n');

// Check POOL_CONFIG_KEY
if (envVars.POOL_CONFIG_KEY) {
  console.log(`  ✅ POOL_CONFIG_KEY: ${envVars.POOL_CONFIG_KEY}`);
} else {
  console.log('  ❌ POOL_CONFIG_KEY: Not set');
}

// Check PLATFORM_KEYPAIR_SECRET
const platformSecret = envVars.PLATFORM_KEYPAIR_SECRET || envVars.PLATFORM_WALLET_SECRET;
if (platformSecret) {
  console.log(`  ✅ PLATFORM_KEYPAIR_SECRET: Set (${platformSecret.substring(0, 20)}...)`);
} else {
  console.log('  ❌ PLATFORM_KEYPAIR_SECRET: Not set');
}

console.log('\n═══════════════════════════════════════════════════════════\n');

// Network selection
const network = envVars.NEXT_PUBLIC_METEORA_NETWORK || 'devnet';
const rpcUrl = envVars.NEXT_PUBLIC_METEORA_RPC_URL ||
  (network === 'mainnet' ? 'https://api.mainnet-beta.solana.com' : 'https://api.devnet.solana.com');

console.log(`🌐 Network: ${network.toUpperCase()}`);
console.log(`📡 RPC: ${rpcUrl}\n`);

console.log('═══════════════════════════════════════════════════════════\n');
console.log('📚 About DBC Pool Config:\n');
console.log('A Pool Config Key defines:');
console.log('  • Bonding curve parameters (how price changes)');
console.log('  • Fee structure (trading fees)');
console.log('  • Migration settings (when/how to migrate to permanent pools)');
console.log('  • Quote token (SOL, USDC, etc.)\n');
console.log('You can use the same config for ALL tokens on your platform!\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('🛠️  Setup Options:\n');
console.log('OPTION 1: Use Existing Config (Recommended for Testing)');
console.log('─────────────────────────────────────────────────────────');
console.log('Use a pre-configured Meteora config key:');
console.log('  • Devnet: GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF');
console.log('  • No setup required, works immediately');
console.log('  • Good for testing and development\n');

console.log('OPTION 2: Create Your Own Config (Production)');
console.log('─────────────────────────────────────────────────────────');
console.log('Create a custom config with your own parameters:');
console.log('  1. Use Meteora Studio (https://launch.meteora.ag)');
console.log('  2. Or use the Meteora DBC SDK');
console.log('  3. Customize bonding curve, fees, migration');
console.log('  4. Get your unique config key\n');

console.log('OPTION 3: Use Meteora Studio (Web Interface)');
console.log('─────────────────────────────────────────────────────────');
console.log('  1. Visit: https://launch.meteora.ag');
console.log('  2. Connect your wallet');
console.log('  3. Click "Create New Config"');
console.log('  4. Configure your parameters:');
console.log('     • Bonding curve type (Linear, Exponential, etc.)');
console.log('     • Initial virtual reserves');
console.log('     • Migration thresholds');
console.log('     • Trading fees');
console.log('  5. Copy the generated config key');
console.log('  6. Add to your .env file\n');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('🔧 Recommended Setup for FlexIt:\n');

const recommendedConfig = {
  POOL_CONFIG_KEY: envVars.POOL_CONFIG_KEY || 'GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF',
  PLATFORM_KEYPAIR_SECRET: platformSecret || '[GENERATE_NEW_KEYPAIR]',
  NEXT_PUBLIC_METEORA_NETWORK: network,
  NEXT_PUBLIC_METEORA_RPC_URL: rpcUrl
};

console.log('.env Configuration:');
console.log('─────────────────────────────────────────────────────────');
Object.entries(recommendedConfig).forEach(([key, value]) => {
  if (key === 'PLATFORM_KEYPAIR_SECRET' && value === '[GENERATE_NEW_KEYPAIR]') {
    console.log(`${key}=[GENERATE WITH: node scripts/generate-platform-keypair.js]`);
  } else {
    console.log(`${key}=${value}`);
  }
});

console.log('\n═══════════════════════════════════════════════════════════\n');
console.log('✅ Next Steps:\n');

if (!platformSecret) {
  console.log('1. Generate Platform Keypair:');
  console.log('   node scripts/generate-platform-keypair.js\n');
} else {
  console.log('✓ Platform keypair already configured\n');
}

if (!envVars.POOL_CONFIG_KEY) {
  console.log('2. Add Pool Config Key to .env:');
  console.log('   POOL_CONFIG_KEY=GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF\n');
} else {
  console.log('✓ Pool config key already set\n');
}

console.log('3. Fund your platform wallet (for devnet):');
if (platformSecret) {
  try {
    // Try to load and show the public key
    let secretArray;
    if (platformSecret.startsWith('[')) {
      secretArray = JSON.parse(platformSecret);
    } else {
      const bs58 = require('bs58');
      secretArray = Array.from(bs58.decode(platformSecret));
    }
    const keypair = Keypair.fromSecretKey(new Uint8Array(secretArray));
    console.log(`   solana airdrop 2 ${keypair.publicKey.toBase58()} --url devnet\n`);
  } catch (error) {
    console.log('   solana airdrop 2 YOUR_PLATFORM_WALLET --url devnet\n');
  }
} else {
  console.log('   (Run after generating keypair)\n');
}

console.log('4. Test token creation:');
console.log('   Create a post and verify token launches automatically!\n');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('📖 Resources:\n');
console.log('  • Meteora Docs: https://docs.meteora.ag');
console.log('  • DBC Guide: https://docs.meteora.ag/developer-guide/guides/dbc/overview');
console.log('  • Studio: https://launch.meteora.ag');
console.log('  • Support: https://discord.gg/meteora\n');

console.log('═══════════════════════════════════════════════════════════\n');
