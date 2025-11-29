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
  console.log('[POST CONFIRM] Starting post confirmation after user signature');

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
    const { signature, postData } = body;

    // Validate required fields
    if (!signature || !postData) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: signature or postData',
      }, { status: 400 });
    }

    const { title, ticker, content, wallet, mediaUrls, mint, pool, metadataUri } = postData;

    if (!title || !content || !wallet || !ticker || !mint || !pool) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields in postData',
      }, { status: 400 });
    }

    console.log('Saving post to database:', { title, ticker, mint, pool, signature });

    // Transaction is already confirmed on-chain by the frontend
    // This endpoint just saves to the database

    // 1. Find or create user by wallet address
    console.log('Finding or creating user...');
    let userId: string;

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', wallet)
      .single();

    if (existingUser) {
      userId = existingUser.id;
      console.log('[POST CONFIRM] Found existing user for wallet:', {
        userId: userId,
        wallet: wallet.substring(0, 10) + '...',
        fullWallet: wallet
      });
    } else {
      // Create new user with wallet address
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          wallet_address: wallet,
          username: `user_${wallet.substring(0, 8)}`,
          display_name: `User ${wallet.substring(0, 8)}`,
        })
        .select('id')
        .single();

      if (userError || !newUser) {
        console.error('Failed to create user:', userError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create user account',
        }, { status: 500 });
      }

      userId = newUser.id;
      console.log('[POST CONFIRM] Created NEW user for wallet:', {
        userId: userId,
        wallet: wallet.substring(0, 10) + '...',
        fullWallet: wallet,
        username: `user_${wallet.substring(0, 8)}`
      });
    }

    // 2. Get user data for response
    console.log('Fetching user data for response...');
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, wallet_address')
      .eq('id', userId)
      .single();

    if (userFetchError || !userData) {
      console.error('Failed to fetch user data:', userFetchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user data',
      }, { status: 500 });
    }

    // 3. Save post to database
    console.log('Saving post to database...');

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
      console.error('Database error:', postError);
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

    console.log('[POST CONFIRM] Post saved successfully:', {
      postId: post.id,
      userId: userId,
      wallet: wallet.substring(0, 10) + '...',
      fullWallet: wallet,
      title: post.title,
      tokenMint: post.token_mint,
      createdAt: post.created_at
    });

    console.log('[POST CONFIRM] MAPPING: Wallet → User → Post:', {
      walletAddress: wallet,
      userId: userId,
      postId: post.id,
      postTitle: post.title
    });

    // 3. Save token data to tokens table
    console.log('[POST CONFIRM] Saving token data...');

    const { error: tokenError } = await supabase
      .from('tokens')
      .insert({
        mint_address: mint,
        symbol: ticker.toUpperCase(),
        name: title,
        description: content,
        image_uri: mediaUrls?.[0] || '',
        metadata_uri: metadataUri,
        creator_wallet: wallet,
        post_id: post.id,
        pool_address: pool,
        bonding_curve_address: pool,
        config_key: DBC_CONFIG.POST.CONFIG_KEY.toBase58(),
        initial_supply: 1_000_000_000,
        is_tradable: true,
        creation_signature: signature,
        created_at: new Date().toISOString(),
      });

    if (tokenError) {
      console.error('Token table error:', tokenError);
      // Don't throw - post is already created
    }

    console.log('Token data saved');

    // 4. Return success response with full post and user data
    return NextResponse.json({
      success: true,
      data: {
        signature,
        post: {
          id: post.id,
          user_id: post.user_id,
          type: post.type,
          title: post.title,
          content: post.content,
          media_urls: post.media_urls,
          token_mint: post.token_mint,
          token_symbol: post.token_symbol,
          token_name: post.token_name,
          pool_address: post.pool_address,
          bonding_curve_address: post.bonding_curve_address,
          token_metadata_uri: post.token_metadata_uri,
          token_signature: post.token_signature,
          is_token_tradable: post.is_token_tradable,
          verified: post.verified,
          created_at: post.created_at,
          users: {
            id: userData.id,
            username: userData.username,
            display_name: userData.display_name,
            avatar_url: userData.avatar_url,
            wallet_address: userData.wallet_address,
          },
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
    console.error('[POST CONFIRM] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
