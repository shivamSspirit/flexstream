/**
 * Jupiter Referral Account Setup Script
 *
 * This script creates your Jupiter referral account and initializes token accounts
 * for collecting platform fees. Run this ONCE when setting up the platform.
 *
 * Prerequisites:
 * 1. Set PLATFORM_WALLET_SECRET in .env.local (base58 encoded private key)
 * 2. Ensure wallet has at least 0.1 SOL for account creation fees
 *
 * Usage:
 *   npx ts-node scripts/setup-jupiter-referral.ts
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { useReferral } from '@jup-ag/referral-sdk';
import bs58 from 'bs58';

// Jupiter project public key (constant)
const JUPITER_PROJECT_PUBKEY = new PublicKey('DkiqsTrw1u1bYFumumC7sCG2S8K25qc2vemJFHyW2wJc');

// Common token mints for fee collection
const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
};

async function setupJupiterReferral() {
  console.log('🚀 Jupiter Referral Account Setup\n');

  // Load environment variables
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const walletSecret = process.env.PLATFORM_WALLET_SECRET;

  if (!walletSecret) {
    console.error('❌ Error: PLATFORM_WALLET_SECRET not found in environment variables');
    console.error('Please add your platform wallet secret key to .env.local');
    console.error('Example: PLATFORM_WALLET_SECRET=your_base58_encoded_secret_key\n');
    process.exit(1);
  }

  // Initialize connection and wallet
  const connection = new Connection(rpcUrl, 'confirmed');
  let platformWallet: Keypair;

  try {
    platformWallet = Keypair.fromSecretKey(bs58.decode(walletSecret));
    console.log('✅ Platform wallet loaded');
    console.log(`   Address: ${platformWallet.publicKey.toString()}\n`);
  } catch (error) {
    console.error('❌ Error: Invalid PLATFORM_WALLET_SECRET format');
    console.error('Secret key must be base58 encoded\n');
    process.exit(1);
  }

  // Check wallet balance
  const balance = await connection.getBalance(platformWallet.publicKey);
  const solBalance = balance / 1e9;

  console.log(`💰 Wallet Balance: ${solBalance.toFixed(4)} SOL`);

  if (solBalance < 0.1) {
    console.error('❌ Error: Insufficient balance');
    console.error('You need at least 0.1 SOL to create referral accounts\n');
    process.exit(1);
  }

  console.log('✅ Sufficient balance for setup\n');

  try {
    // Initialize referral provider
    const referralProvider = useReferral(connection);

    // Step 1: Create referral account
    console.log('📝 Step 1: Creating referral account...');

    const { tx: referralTx, referralAccountPubKey } = await referralProvider.initializeReferralAccountWithName({
      projectPubKey: JUPITER_PROJECT_PUBKEY,
      partnerPubKey: platformWallet.publicKey,
      payerPubKey: platformWallet.publicKey,
      name: 'FlexStream'
    });

    const referralSig = await connection.sendTransaction(referralTx, [platformWallet]);
    console.log(`   Transaction: ${referralSig}`);

    await connection.confirmTransaction(referralSig, 'confirmed');
    console.log(`✅ Referral account created!`);
    console.log(`   Address: ${referralAccountPubKey.toString()}\n`);

    // Step 2: Initialize token accounts for fee collection
    console.log('💰 Step 2: Initializing token accounts for fee collection...\n');

    const tokenAccounts: Record<string, string> = {};

    // Initialize SOL token account
    console.log('   Creating SOL (WSOL) token account...');
    const { tx: solTx, tokenAccount: solAccount } =
      await referralProvider.initializeReferralTokenAccountV2({
        payerPubKey: platformWallet.publicKey,
        referralAccountPubKey,
        mint: new PublicKey(TOKEN_MINTS.SOL)
      });

    const solSig = await connection.sendTransaction(solTx, [platformWallet]);
    await connection.confirmTransaction(solSig, 'confirmed');
    tokenAccounts['SOL'] = solAccount.toString();
    console.log(`   ✅ SOL token account: ${solAccount.toString()}`);

    // Initialize USDC token account
    console.log('   Creating USDC token account...');
    const { tx: usdcTx, tokenAccount: usdcAccount } =
      await referralProvider.initializeReferralTokenAccountV2({
        payerPubKey: platformWallet.publicKey,
        referralAccountPubKey,
        mint: new PublicKey(TOKEN_MINTS.USDC)
      });

    const usdcSig = await connection.sendTransaction(usdcTx, [platformWallet]);
    await connection.confirmTransaction(usdcSig, 'confirmed');
    tokenAccounts['USDC'] = usdcAccount.toString();
    console.log(`   ✅ USDC token account: ${usdcAccount.toString()}`);

    // Initialize USDT token account
    console.log('   Creating USDT token account...');
    const { tx: usdtTx, tokenAccount: usdtAccount } =
      await referralProvider.initializeReferralTokenAccountV2({
        payerPubKey: platformWallet.publicKey,
        referralAccountPubKey,
        mint: new PublicKey(TOKEN_MINTS.USDT)
      });

    const usdtSig = await connection.sendTransaction(usdtTx, [platformWallet]);
    await connection.confirmTransaction(usdtSig, 'confirmed');
    tokenAccounts['USDT'] = usdtAccount.toString();
    console.log(`   ✅ USDT token account: ${usdtAccount.toString()}\n`);

    // Print summary
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                 ✅ SETUP COMPLETE!                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('📋 Add these to your .env.local file:\n');
    console.log(`JUPITER_REFERRAL_ACCOUNT=${referralAccountPubKey.toString()}`);
    console.log(`JUPITER_REFERRAL_FEE_BPS=100  # 1% platform fee`);
    console.log('');
    console.log('Token accounts created:');
    Object.entries(tokenAccounts).forEach(([token, account]) => {
      console.log(`  ${token}: ${account}`);
    });
    console.log('');
    console.log('🎉 You can now start collecting fees from swaps!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Add JUPITER_REFERRAL_ACCOUNT to .env.local');
    console.log('  2. Restart your development server');
    console.log('  3. Test a swap to verify fee collection');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during setup:', error);

    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
    }

    console.error('\nIf the account already exists, you can skip this step.');
    console.error('Check the blockchain explorer to verify account creation.\n');
    process.exit(1);
  }
}

// Run the setup
setupJupiterReferral().catch(console.error);
