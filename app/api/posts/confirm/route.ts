import { NextRequest, NextResponse } from 'next/server';
import { Connection, Transaction, Keypair } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { DBC_CONFIG } from '@/lib/dbc-config';

/**
 * POST /api/posts/confirm
 *
 * This endpoint is called AFTER the user signs the token creation transaction.
 * It submits the signed transaction to Solana and saves the post/token to database.
 */
export async function POST(request: NextRequest) {
  console.log('🔐 [POST CONFIRM] Starting post confirmation after user signature');

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const connection = new Connection(DBC_CONFIG.RPC_URL, 'confirmed');

    const body = await request.json();

    // Extract data from request
    const {
      signedTransaction,
      title,
      content,
      mediaUrls,
      walletAddress,
      ticker,
      mint,
      pool,
      metadataUri,
      baseMintKeypair,
    } = body;

    // Validate required fields
    if (!signedTransaction || !title || !content || !walletAddress || !ticker || !mint || !pool || !baseMintKeypair) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
      }, { status: 400 });
    }

    console.log('📝 Confirming post:', { title, ticker, mint, pool });

    // 1. Deserialize the user-signed transaction and add baseMint signature
    console.log('📡 Preparing transaction with both signatures...');

    const transactionBuffer = Buffer.from(signedTransaction, 'base64');
    const transaction = Transaction.from(transactionBuffer);

    // Reconstruct the baseMint keypair from the secret key
    const baseMintSecretKey = Buffer.from(baseMintKeypair, 'base64');
    const baseMintKeypairObj = Keypair.fromSecretKey(baseMintSecretKey);

    console.log('🔐 Adding baseMint signature to user-signed transaction...');
    console.log('📊 Signatures before baseMint:', transaction.signatures.map(s => ({
      pubkey: s.publicKey?.toBase58(),
      signature: s.signature ? 'present' : 'null'
    })));

    // Add the baseMint signature to the transaction that already has the user's signature
    transaction.partialSign(baseMintKeypairObj);

    console.log('✅ Transaction now has both signatures (user + baseMint)');
    console.log('📊 Signatures after baseMint:', transaction.signatures.map(s => ({
      pubkey: s.publicKey?.toBase58(),
      signature: s.signature ? 'present' : 'null'
    })));

    let signature: string;
    try {
      // Serialize the transaction - it should now have both signatures
      const serializedTx = transaction.serialize();
      console.log('📦 Serialized transaction size:', serializedTx.length, 'bytes');

      signature = await connection.sendRawTransaction(serializedTx, {
        skipPreflight: false,
        maxRetries: 3,
      });

      console.log('✅ Transaction sent:', signature);

      // 2. Wait for confirmation
      console.log('⏳ Waiting for transaction confirmation...');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('✅ Transaction confirmed!');

    } catch (txError) {
      console.error('❌ Transaction error:', txError);
      throw new Error(`Failed to submit transaction: ${txError instanceof Error ? txError.message : 'Unknown error'}`);
    }

    // 3. Find or create user by wallet address
    console.log('👤 Finding or creating user...');
    let userId: string;

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingUser) {
      userId = existingUser.id;
      console.log('✅ Found existing user:', userId);
    } else {
      // Create new user with wallet address
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress,
          username: `user_${walletAddress.substring(0, 8)}`,
          display_name: `User ${walletAddress.substring(0, 8)}`,
        })
        .select('id')
        .single();

      if (userError || !newUser) {
        console.error('❌ Failed to create user:', userError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create user account',
        }, { status: 500 });
      }

      userId = newUser.id;
      console.log('✅ Created new user:', userId);
    }

    // 4. Save post to database
    console.log('💾 Saving post to database...');

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,  // Use UUID instead of wallet address
        type: 'trading_journey',
        title: title,
        content: content,
        media_urls: mediaUrls,

        // Token fields
        token_mint: mint,
        token_symbol: ticker.toUpperCase(),
        token_name: title,
        pool_address: pool,
        bonding_curve_address: pool,
        token_metadata_uri: metadataUri,
        token_signature: signature,
        is_token_tradable: true,

        verified: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (postError) {
      console.error('❌ Database error:', postError);
      // Transaction is already confirmed on-chain, so we log the error but don't fail
      return NextResponse.json({
        success: true,
        warning: 'Transaction confirmed but database save failed',
        data: {
          signature,
          mint,
          pool,
          error: postError.message
        }
      });
    }

    console.log('✅ Post saved:', post.id);

    // 5. Save token data to tokens table
    console.log('💾 Saving token data...');

    const { error: tokenError } = await supabase
      .from('tokens')
      .insert({
        mint_address: mint,
        symbol: ticker.toUpperCase(),
        name: title,
        description: content,
        image_uri: mediaUrls[0],
        metadata_uri: metadataUri,
        creator_wallet: walletAddress,
        post_id: post.id,
        pool_address: pool,
        bonding_curve_address: pool,
        config_key: DBC_CONFIG.CONFIG_KEY.toBase58(),
        initial_supply: 1_000_000_000,
        is_tradable: true,
        creation_signature: signature,
        created_at: new Date().toISOString(),
      });

    if (tokenError) {
      console.error('❌ Token table error:', tokenError);
      // Don't throw - post is already created
    }

    console.log('✅ Token data saved');

    // 6. Return success response
    return NextResponse.json({
      success: true,
      data: {
        signature,
        post: {
          id: post.id,
          title: post.title,
          content: post.content,
          media_urls: post.media_urls,
          created_at: post.created_at,
        },
        token: {
          mint,
          symbol: ticker.toUpperCase(),
          name: title,
          pool,
          metadataUri,
        },
        message: 'Post and token created successfully!',
        explorerUrl: `https://explorer.solana.com/tx/${signature}${DBC_CONFIG.RPC_URL.includes('devnet') ? '?cluster=devnet' : ''}`,
      }
    });

  } catch (error) {
    console.error('❌ [POST CONFIRM] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
