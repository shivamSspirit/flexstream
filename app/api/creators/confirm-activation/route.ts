import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { MeteoraDBCClient } from '@/lib/meteora-dbc';
import { DBC_CONFIG } from '@/lib/dbc-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/creators/confirm-activation
 *
 * Confirms creator coin activation after user has signed and submitted the transaction.
 * Verifies the transaction on-chain and updates the user's creator coin data.
 */
export async function POST(request: NextRequest) {
  console.log('[CREATOR CONFIRM] Starting creator coin confirmation');

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
    const { signature, pendingActivation } = body;

    if (!signature || !pendingActivation) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: signature, pendingActivation',
      }, { status: 400 });
    }

    const {
      userId,
      username,
      displayName,
      uniqueSymbol,
      metadataUri,
      walletAddress,
    } = pendingActivation;

    // Validate pending activation data
    if (!userId || !username || !walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pendingActivation data',
      }, { status: 400 });
    }

    // Get the mint address from the unsigned transaction
    const mintAddress = pendingActivation.unsignedTransaction?.baseMintPublicKey;
    if (!mintAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing mint address in pending activation data',
      }, { status: 400 });
    }

    console.log('[CREATOR CONFIRM] Verifying transaction:', signature);
    console.log('[CREATOR CONFIRM] Expected mint:', mintAddress);

    // 1. Verify the transaction on-chain
    const verificationResult = await dbcClient.verifyTokenCreation(
      signature,
      mintAddress,
      'creator'
    );

    console.log('[CREATOR CONFIRM] Transaction verified:', verificationResult);

    // 2. Update user record with creator coin info
    console.log('[CREATOR CONFIRM] Updating user with creator coin data...');

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        creator_coin_enabled: true,
        creator_coin_mint: verificationResult.mint,
        creator_coin_pool: verificationResult.pool,
        creator_coin_bonding_curve: verificationResult.pool,
        creator_coin_metadata_uri: metadataUri,
        creator_coin_creation_signature: signature,
        creator_coin_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('[CREATOR CONFIRM] Failed to update user:', updateError);
      // Token was created on-chain, return with warning
      return NextResponse.json({
        success: true,
        warning: 'Token created but failed to update user record',
        data: {
          signature,
          mint: verificationResult.mint,
          pool: verificationResult.pool,
          error: updateError.message,
        }
      });
    }

    console.log('[CREATOR CONFIRM] User updated successfully');

    // 3. Return success response
    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        token: {
          mint: verificationResult.mint,
          pool: verificationResult.pool,
          symbol: uniqueSymbol,
          displayName: username.toUpperCase(),
          metadataUri,
          signature,
          jupiterUrl: dbcClient.getJupiterTradeUrl(verificationResult.mint, DBC_CONFIG.NETWORK as 'devnet' | 'mainnet'),
          meteoraUrl: dbcClient.getMeteoraTradeUrl(verificationResult.pool, DBC_CONFIG.NETWORK as 'devnet' | 'mainnet'),
        },
        message: 'Creator coin activated successfully!',
        explorerUrl: `https://explorer.solana.com/tx/${signature}${DBC_CONFIG.RPC_URL.includes('devnet') ? '?cluster=devnet' : ''}`,
        tokenExplorerUrl: `https://explorer.solana.com/address/${verificationResult.mint}${DBC_CONFIG.RPC_URL.includes('devnet') ? '?cluster=devnet' : ''}`,
      }
    });

  } catch (error) {
    console.error('[CREATOR CONFIRM] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
