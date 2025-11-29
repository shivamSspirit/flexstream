/**
 * Jupiter Fee Claiming Script
 *
 * This script claims accumulated fees from Jupiter swaps and optionally
 * distributes them to content creators.
 *
 * Features:
 * - Claims all accumulated fees from Jupiter referral account
 * - Views current fee balances
 * - Optionally distributes fees to creators based on their earnings
 *
 * Usage:
 *   # View current fees
 *   npx ts-node scripts/claim-jupiter-fees.ts --view
 *
 *   # Claim all fees
 *   npx ts-node scripts/claim-jupiter-fees.ts --claim
 *
 *   # Claim and distribute to creators (50/50 split)
 *   npx ts-node scripts/claim-jupiter-fees.ts --claim --distribute
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { useReferral } from '@jup-ag/referral-sdk';
import bs58 from 'bs58';

// Jupiter project public key (constant)
const JUPITER_PROJECT_PUBKEY = new PublicKey('DkiqsTrw1u1bYFumumC7sCG2S8K25qc2vemJFHyW2wJc');

interface FeesOwed {
  [mint: string]: bigint;
}

async function viewFees(
  connection: Connection,
  referralAccountPubKey: PublicKey
): Promise<FeesOwed> {
  console.log('💰 Checking fees owed...\n');

  try {
    const referralProvider = useReferral(connection);

    // Get all token accounts for this referral account
    const { tokenAccounts, token2022Accounts } = await referralProvider.getReferralTokenAccountsV2(
      referralAccountPubKey.toString()
    );

    const feesOwed: FeesOwed = {};

    // Calculate fees from token accounts
    for (const account of [...tokenAccounts, ...token2022Accounts]) {
      if (account.account.amount > BigInt(0)) {
        feesOwed[account.account.mint.toString()] = account.account.amount;
      }
    }

    console.log('Fees owed by token:');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (Object.keys(feesOwed).length === 0) {
      console.log('   No fees accumulated yet.\n');
      return {};
    }

    const TOKEN_NAMES: Record<string, string> = {
      'So11111111111111111111111111111111111111112': 'SOL (WSOL)',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT'
    };

    let totalUSD = 0;

    for (const [mint, amount] of Object.entries(feesOwed)) {
      const amountNum = Number(amount);
      const tokenName = TOKEN_NAMES[mint] || `${mint.slice(0, 4)}...${mint.slice(-4)}`;

      // Convert to human-readable amounts (assuming 6-9 decimals)
      let readableAmount: number;
      let decimals: number;

      if (mint === 'So11111111111111111111111111111111111111112') {
        decimals = 9; // SOL has 9 decimals
        readableAmount = amountNum / 1e9;
      } else {
        decimals = 6; // USDC/USDT have 6 decimals
        readableAmount = amountNum / 1e6;
      }

      console.log(`   ${tokenName}`);
      console.log(`   Amount: ${readableAmount.toFixed(decimals)} (${amountNum} lamports)`);

      // Rough USD estimate (you'd want to fetch real prices from an oracle)
      let estimatedUSD = 0;
      if (tokenName.includes('SOL')) {
        estimatedUSD = readableAmount * 100; // Assume $100/SOL
      } else if (tokenName.includes('USDC') || tokenName.includes('USDT')) {
        estimatedUSD = readableAmount;
      }

      totalUSD += estimatedUSD;
      console.log(`   ~$${estimatedUSD.toFixed(2)} USD\n`);
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total estimated value: ~$${totalUSD.toFixed(2)} USD\n`);

    return feesOwed;

  } catch (error) {
    console.error('Error fetching fees:', error);
    return {};
  }
}

async function claimFees(
  connection: Connection,
  platformWallet: Keypair,
  referralAccountPubKey: PublicKey
): Promise<boolean> {
  console.log('🔄 Claiming fees...\n');

  try {
    const referralProvider = useReferral(connection);

    // Get all claim transactions
    const claimTxs = await referralProvider.claimAllV2({
      payerPubKey: platformWallet.publicKey,
      referralAccountPubKey
    });

    if (claimTxs.length === 0) {
      console.log('   No transactions needed (no fees to claim)\n');
      return true;
    }

    console.log(`   Created ${claimTxs.length} claim transaction(s)\n`);

    // Sign and send all transactions
    for (let i = 0; i < claimTxs.length; i++) {
      console.log(`   Sending transaction ${i + 1}/${claimTxs.length}...`);

      // Sign the versioned transaction
      claimTxs[i].sign([platformWallet]);

      const signature = await connection.sendTransaction(claimTxs[i]);
      console.log(`   Transaction sent: ${signature}`);

      await connection.confirmTransaction(signature, 'confirmed');
      console.log(`   ✅ Transaction ${i + 1} confirmed!`);
      console.log(`   View on explorer: https://solscan.io/tx/${signature}\n`);
    }

    return true;

  } catch (error) {
    console.error('Error claiming fees:', error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldView = args.includes('--view');
  const shouldClaim = args.includes('--claim');
  const shouldDistribute = args.includes('--distribute');

  if (!shouldView && !shouldClaim) {
    console.log('Jupiter Fee Management Script\n');
    console.log('Usage:');
    console.log('  npx ts-node scripts/claim-jupiter-fees.ts --view           View current fees');
    console.log('  npx ts-node scripts/claim-jupiter-fees.ts --claim          Claim all fees');
    console.log('  npx ts-node scripts/claim-jupiter-fees.ts --claim --distribute  Claim and distribute to creators\n');
    process.exit(0);
  }

  console.log('🚀 Jupiter Fee Management\n');

  // Load environment variables
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const walletSecret = process.env.PLATFORM_WALLET_SECRET;
  const referralAccount = process.env.JUPITER_REFERRAL_ACCOUNT;

  if (!walletSecret) {
    console.error('❌ Error: PLATFORM_WALLET_SECRET not found');
    process.exit(1);
  }

  if (!referralAccount) {
    console.error('❌ Error: JUPITER_REFERRAL_ACCOUNT not found');
    console.error('Please run setup-jupiter-referral.ts first\n');
    process.exit(1);
  }

  // Initialize connection and wallet
  const connection = new Connection(rpcUrl, 'confirmed');
  const platformWallet = Keypair.fromSecretKey(bs58.decode(walletSecret));
  const referralAccountPubKey = new PublicKey(referralAccount);

  console.log(`Platform wallet: ${platformWallet.publicKey.toString()}`);
  console.log(`Referral account: ${referralAccountPubKey.toString()}\n`);

  // View fees
  const feesOwed = await viewFees(connection, referralAccountPubKey);

  // Claim if requested
  if (shouldClaim) {
    if (Object.keys(feesOwed).length === 0) {
      console.log('⚠️  No fees to claim\n');
      return;
    }

    const confirmed = true; // In production, you might want to add a confirmation prompt

    if (confirmed) {
      const success = await claimFees(connection, platformWallet, referralAccountPubKey);

      if (success && shouldDistribute) {
        console.log('📤 Distributing fees to creators...\n');
        console.log('   ⚠️  Creator distribution not yet implemented.');
        console.log('   You can manually distribute from the platform wallet.');
        console.log('   Or implement the distribution logic using your database.\n');

        // TODO: Implement creator distribution
        // 1. Query database for creator earnings
        // 2. Calculate 50/50 split or custom split
        // 3. Send tokens to creator wallets
        // 4. Update database with distribution records
      }
    }
  }

  console.log('✅ Done!\n');
}

// Run the script
main().catch(console.error);
