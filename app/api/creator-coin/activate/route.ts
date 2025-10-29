import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { MeteoraDBCClient } from '@/lib/meteora-dbc';
import { DBC_CONFIG } from '@/lib/dbc-config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    console.log('🪙 [CREATOR COIN] Activation request received');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const connection = new Connection(DBC_CONFIG.RPC_URL, 'confirmed');
    const dbcClient = new MeteoraDBCClient(connection);

    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address is required',
      }, { status: 400 });
    }

    console.log('👤 [CREATOR COIN] Wallet:', walletAddress);

    // 1. Fetch user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      console.error('❌ [CREATOR COIN] User not found:', userError);
      return NextResponse.json({
        success: false,
        error: 'User profile not found',
      }, { status: 404 });
    }

    console.log('✅ [CREATOR COIN] User found:', user.username);

    // 2. Validate profile requirements
    if (!user.username) {
      return NextResponse.json({
        success: false,
        error: 'Username is required. Please update your profile first.',
      }, { status: 400 });
    }

    if (!user.avatar_url) {
      return NextResponse.json({
        success: false,
        error: 'Profile avatar is required. Please update your profile first.',
      }, { status: 400 });
    }

    // 3. Check if creator coin already exists
    if (user.creator_coin_enabled) {
      return NextResponse.json({
        success: false,
        error: 'Creator coin is already activated',
        data: {
          mint: user.creator_coin_mint,
          pool: user.creator_coin_pool,
        }
      }, { status: 400 });
    }

    console.log('✅ [CREATOR COIN] Profile validation passed');

    // 4. Create creator coin using Meteora DBC
    console.log('🏭 [CREATOR COIN] Creating token with Meteora DBC...');

    const creatorPublicKey = new PublicKey(walletAddress);

    // Token details from profile
    const tokenName = `${user.display_name || user.username} Creator Coin`;
    const tokenSymbol = user.username.toUpperCase().substring(0, 10); // Max 10 chars for ticker
    const tokenDescription = user.bio || `Official creator coin for ${user.display_name || user.username}`;
    const tokenImageUri = user.avatar_url;

    console.log('📋 [CREATOR COIN] Token Details:', {
      name: tokenName,
      symbol: tokenSymbol,
      description: tokenDescription,
      imageUri: tokenImageUri
    });

    // Create token
    const tokenResult = await dbcClient.createToken({
      name: tokenName,
      symbol: tokenSymbol,
      description: tokenDescription,
      imageUri: tokenImageUri,
      creator: creatorPublicKey,
      initialSupply: 1_000_000_000, // 1 billion tokens
    });

    console.log('✅ [CREATOR COIN] Token created:', {
      mint: tokenResult.mint.toBase58(),
      pool: tokenResult.pool.toBase58(),
      metadataUri: tokenResult.metadataUri
    });

    // 5. Sign transaction with baseMint keypair
    console.log('🔐 [CREATOR COIN] Signing transaction with baseMint...');
    tokenResult.transaction.partialSign(tokenResult.baseMintKeypair);

    // 6. Serialize transaction for frontend
    const serializedTransaction = tokenResult.transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });
    const transactionBase64 = Buffer.from(serializedTransaction).toString('base64');

    console.log('✅ [CREATOR COIN] Transaction prepared for user signature');

    // 7. Return transaction for user to sign
    return NextResponse.json({
      success: true,
      requiresSignature: true,
      data: {
        transaction: transactionBase64,
        token: {
          mint: tokenResult.mint.toBase58(),
          symbol: tokenSymbol,
          name: tokenName,
          pool: tokenResult.pool.toBase58(),
          bondingCurve: tokenResult.pool.toBase58(),
          metadataUri: tokenResult.metadataUri,
          jupiterUrl: dbcClient.getJupiterTradeUrl(tokenResult.mint.toBase58()),
          meteoraUrl: dbcClient.getMeteoraTradeUrl(tokenResult.pool.toBase58()),
        },
        message: 'Creator coin created! Please sign the transaction to activate it.'
      }
    });

  } catch (error) {
    console.error('❌ [CREATOR COIN] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create creator coin',
    }, { status: 500 });
  }
}
