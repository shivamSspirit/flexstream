/**
 * Script to get Pump.fun JWT token using wallet authentication
 * 
 * Usage:
 * 1. Install dependencies: npm install @solana/web3.js
 * 2. Update WALLET_ADDRESS with your Solana wallet address
 * 3. Run: node scripts/get-pump-fun-token.js
 */

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const crypto = require('crypto');

// Configuration
const PUMP_FUN_API_BASE = 'https://frontend-api-v3.pump.fun';
const WALLET_ADDRESS = 'YOUR_SOLANA_WALLET_ADDRESS_HERE'; // Replace with your wallet address

async function getPumpFunToken() {
  try {
    console.log('🔑 Getting Pump.fun JWT Token...\n');

    // Step 1: Get nonce
    console.log('Step 1: Requesting nonce...');
    const nonceResponse = await fetch(`${PUMP_FUN_API_BASE}/user/nonce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: WALLET_ADDRESS
      })
    });

    if (!nonceResponse.ok) {
      throw new Error(`Failed to get nonce: ${nonceResponse.status} ${nonceResponse.statusText}`);
    }

    const nonceData = await nonceResponse.json();
    const nonce = nonceData.nonce;
    console.log(`✅ Nonce received: ${nonce}\n`);

    // Step 2: Create message to sign
    const message = `I'm signing my one-time nonce: ${nonce}`;
    console.log('Step 2: Message to sign:');
    console.log(`"${message}"\n`);

    // Step 3: Manual signature required
    console.log('⚠️  MANUAL STEP REQUIRED:');
    console.log('1. Open your Solana wallet (Phantom, Solflare, etc.)');
    console.log('2. Sign the message above');
    console.log('3. Copy the signature and paste it below\n');

    // In a real implementation, you would use the wallet to sign
    // For now, we'll show the process
    console.log('📝 Next steps:');
    console.log('1. Sign the message in your wallet');
    console.log('2. Copy the signature');
    console.log('3. Use the signature in the verification step\n');

    // Example of what the verification would look like:
    console.log('Step 3: Verify signature (example):');
    console.log(`curl -X POST "${PUMP_FUN_API_BASE}/user/verify" \\
  -H "Content-Type: application/json" \\
  -d '{
    "wallet_address": "${WALLET_ADDRESS}",
    "signature": "YOUR_SIGNATURE_HERE",
    "nonce": "${nonce}"
  }'`);

    console.log('\n🎉 After verification, you\'ll receive your JWT token!');
    console.log('Add it to your .env.local file as:');
    console.log('PUMP_FUN_JWT_TOKEN=your_jwt_token_here');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (WALLET_ADDRESS === 'YOUR_SOLANA_WALLET_ADDRESS_HERE') {
  console.log('❌ Please update WALLET_ADDRESS in the script with your actual Solana wallet address');
  process.exit(1);
}

getPumpFunToken();
