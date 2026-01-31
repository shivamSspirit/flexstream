import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { MeteoraDBCClient } from '@/lib/meteora-dbc';
import { DBC_CONFIG } from '@/lib/dbc-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/posts/confirm-post
 *
 * Confirms a post after the user has signed and submitted the token creation transaction.
 * Verifies the transaction on-chain and saves the post to the database.
 */
export async function POST(request: NextRequest) {
  console.log('[POST CONFIRM] Starting post confirmation');

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase not configured');
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Initialize Solana connection
    const connection = new Connection(DBC_CONFIG.RPC_URL, 'confirmed');
    const dbcClient = new MeteoraDBCClient(connection);

    const body = await request.json();

    // Extract confirmation data
    const {
      signature,
      pendingPost
    } = body;

    if (!signature || !pendingPost) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: signature, pendingPost',
      }, { status: 400 });
    }

    const {
      userId,
      title,
      content,
      displayName,
      uniqueSymbol,
      mediaUrls,
      metadataUri,
      walletAddress,
      isVerified,
      isCreatorVerified,
      postLaunchCount,
    } = pendingPost;

    // Validate pending post data
    if (!userId || !title || !uniqueSymbol || !walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pendingPost data',
      }, { status: 400 });
    }

    console.log('[POST CONFIRM] Verifying transaction:', signature);
    console.log('[POST CONFIRM] Expected mint:', pendingPost.unsignedTransaction?.baseMintPublicKey);

    // 1. Verify the transaction on-chain
    const mintAddress = pendingPost.unsignedTransaction?.baseMintPublicKey;
    if (!mintAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing mint address in pending post data',
      }, { status: 400 });
    }

    const verificationResult = await dbcClient.verifyTokenCreation(
      signature,
      mintAddress,
      'post'
    );

    console.log('[POST CONFIRM] Transaction verified:', verificationResult);

    // 2. Save token to database
    console.log('[POST CONFIRM] Saving token to database...');

    const { error: tokenError } = await supabase
      .from('tokens')
      .insert({
        mint_address: verificationResult.mint,
        symbol: uniqueSymbol,
        display_name: displayName,
        name: title,
        description: content,
        image_uri: mediaUrls?.[0] || '',
        metadata_uri: metadataUri,
        creator_wallet: walletAddress,
        post_id: null, // Will be updated after post creation
        pool_address: verificationResult.pool,
        bonding_curve_address: verificationResult.pool,
        config_key: DBC_CONFIG.POST.CONFIG_KEY.toBase58(),
        initial_supply: 1_000_000_000,
        is_tradable: true,
        is_verified: isVerified,
        creation_signature: signature,
        created_at: new Date().toISOString(),
      });

    if (tokenError) {
      console.error('[POST CONFIRM] Failed to save token:', tokenError);
      // Token was created on-chain, return with warning
      return NextResponse.json({
        success: true,
        warning: 'Token created but failed to save to database',
        data: {
          signature,
          mint: verificationResult.mint,
          pool: verificationResult.pool,
          error: tokenError.message,
        }
      });
    }

    console.log('[POST CONFIRM] Token saved to database');

    // 3. Save post to database
    console.log('[POST CONFIRM] Saving post to database...');

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        type: 'trading_journey',
        title: title,
        content: content,
        media_urls: mediaUrls,
        token_mint: verificationResult.mint,
        token_symbol: uniqueSymbol,
        token_display_name: displayName,
        token_is_verified: isVerified, // Token name verification (anti-rug)
        creator_is_verified: isCreatorVerified || false, // Creator profile verification (avatar + X OAuth)
        token_name: title,
        pool_address: verificationResult.pool,
        bonding_curve_address: verificationResult.pool,
        token_metadata_uri: metadataUri,
        token_signature: signature,
        is_token_tradable: true,
        verified: false,
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        users!inner (
          id,
          username,
          display_name,
          avatar_url,
          wallet_address
        )
      `)
      .single();

    if (postError) {
      console.error('[POST CONFIRM] Failed to save post:', postError);
      return NextResponse.json({
        success: true,
        warning: 'Token created but post save failed',
        data: {
          signature,
          mint: verificationResult.mint,
          pool: verificationResult.pool,
          error: postError.message,
        }
      });
    }

    console.log('[POST CONFIRM] Post saved:', post.id);

    // 4. Update token with post_id
    const { error: updateError } = await supabase
      .from('tokens')
      .update({ post_id: post.id })
      .eq('mint_address', verificationResult.mint);

    if (updateError) {
      console.error('[POST CONFIRM] Failed to link token to post:', updateError);
    }

    // 5. Increment user's post_launch_count
    console.log('[POST CONFIRM] Incrementing post_launch_count...');
    const { error: countError } = await supabase
      .from('users')
      .update({
        post_launch_count: (postLaunchCount || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (countError) {
      console.error('[POST CONFIRM] Failed to increment count:', countError);
    } else {
      console.log('[POST CONFIRM] Launch count incremented');
    }

    // 6. Return success response
    return NextResponse.json({
      success: true,
      data: {
        signature,
        post,
        token: {
          mint: verificationResult.mint,
          symbol: uniqueSymbol,
          displayName,
          isVerified,
          name: title,
          pool: verificationResult.pool,
          metadataUri,
          jupiterUrl: dbcClient.getJupiterTradeUrl(verificationResult.mint, DBC_CONFIG.NETWORK as 'devnet' | 'mainnet'),
          meteoraUrl: dbcClient.getMeteoraTradeUrl(verificationResult.pool, DBC_CONFIG.NETWORK as 'devnet' | 'mainnet'),
        },
        message: 'Post and token confirmed successfully!',
        explorerUrl: `https://explorer.solana.com/tx/${signature}${DBC_CONFIG.RPC_URL.includes('devnet') ? '?cluster=devnet' : ''}`,
        tokenExplorerUrl: `https://explorer.solana.com/address/${verificationResult.mint}${DBC_CONFIG.RPC_URL.includes('devnet') ? '?cluster=devnet' : ''}`,
        launchInfo: {
          currentCount: (postLaunchCount || 0) + 1,
          isGasless: false
        }
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
