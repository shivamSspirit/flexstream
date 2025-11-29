import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { MeteoraDBCClient } from '@/lib/meteora-dbc';
import { DBC_CONFIG } from '@/lib/dbc-config';

/**
 * POST /api/creators/activate
 *
 * Launches a creator-level token when user activates their profile
 * - Uses CREATOR_POOL_CONFIG_KEY (10B supply, 1% fees, vesting)
 * - Backend-only (no wallet signature required)
 * - One token per creator
 */
export async function POST(request: NextRequest) {
  console.log('[CREATOR ACTIVATE] Starting creator token launch');

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Initialize Solana connection
    const connection = new Connection(DBC_CONFIG.RPC_URL, 'confirmed');

    // Get request data
    const body = await request.json();
    const { userId, walletAddress, username, displayName, bio, avatarUrl } = body;

    // Validate required fields
    if (!userId || !walletAddress || !username) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userId, walletAddress, username',
      }, { status: 400 });
    }

    // Validate wallet address
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid wallet address format',
      }, { status: 400 });
    }

    console.log('[CREATOR ACTIVATE] Activating for user:', { userId, username, walletAddress });

    // 1. Check if creator already has a token
    const { data: existingToken } = await supabase
      .from('tokens')
      .select('id, mint_address, symbol, display_name')
      .eq('creator_wallet', walletAddress)
      .eq('config_key', DBC_CONFIG.CREATOR.CONFIG_KEY.toBase58())
      .single();

    if (existingToken) {
      return NextResponse.json({
        success: false,
        error: 'Creator token already exists',
        data: {
          token: existingToken
        }
      }, { status: 400 });
    }

    // 2. Generate token details
    const dbcClient = new MeteoraDBCClient(connection);

    // Creator ticker: @USERNAME (e.g., @alice)
    const displayTicker = `@${username}`.toUpperCase();

    // Unique symbol for blockchain
    const uniqueSymbol = dbcClient.generateUniqueSymbol();

    console.log('[CREATOR ACTIVATE] Token details:', {
      displayTicker,
      uniqueSymbol,
      tokenName: displayName || `${username}'s Token`
    });

    // 3. Upload token metadata
    console.log('[CREATOR ACTIVATE] Uploading token metadata...');

    const tokenName = displayName || `${username}'s Creator Token`;
    const tokenDescription = bio || `Official creator token for ${displayName || username}`;

    const metadataUri = await dbcClient.uploadMetadata({
      name: tokenName,
      symbol: uniqueSymbol,
      description: tokenDescription,
      image: avatarUrl || `https://ui-avatars.com/api/?name=${username}&size=400&background=random`,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${username}`
    }, supabase);

    console.log('[CREATOR ACTIVATE] Metadata uploaded:', metadataUri);

    // 4. Create creator token (backend-only, no signature required)
    console.log('[CREATOR ACTIVATE] Creating creator token on-chain...');

    const tokenResult = await dbcClient.createToken({
      name: tokenName,
      symbol: uniqueSymbol,
      displayName: displayTicker,
      description: tokenDescription,
      imageUri: metadataUri,
      tokenType: 'creator', // Use CREATOR_POOL_CONFIG_KEY
    });

    console.log('[CREATOR ACTIVATE] Token created successfully:', {
      mint: tokenResult.mint.toBase58(),
      pool: tokenResult.pool.toBase58(),
      signature: tokenResult.signature
    });

    // 5. Check if display_name is already taken (anti-rug mechanism)
    const { data: existingDisplayName } = await supabase
      .from('tokens')
      .select('id, display_name')
      .ilike('display_name', displayTicker)
      .limit(1);

    const isFirstWithDisplayName = !existingDisplayName || existingDisplayName.length === 0;

    console.log('[CREATOR ACTIVATE] Anti-rug check:', {
      displayName: displayTicker,
      existingCount: existingDisplayName?.length || 0,
      willBeVerified: isFirstWithDisplayName
    });

    // 6. Save token to database
    console.log('[CREATOR ACTIVATE] Saving token to database...');

    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .insert({
        mint_address: tokenResult.mint.toBase58(),
        symbol: uniqueSymbol,
        display_name: displayTicker,
        name: tokenName,
        description: tokenDescription,
        image_uri: avatarUrl || `https://ui-avatars.com/api/?name=${username}&size=400&background=random`,
        metadata_uri: metadataUri,
        creator_wallet: walletAddress,
        post_id: null, // No post - this is a creator token
        pool_address: tokenResult.pool.toBase58(),
        bonding_curve_address: tokenResult.pool.toBase58(),
        config_key: DBC_CONFIG.CREATOR.CONFIG_KEY.toBase58(),
        initial_supply: 10_000_000_000, // 10B for creator tokens
        is_tradable: true,
        is_verified: isFirstWithDisplayName,
        creation_signature: tokenResult.signature,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tokenError) {
      console.error('[CREATOR ACTIVATE] Failed to save token:', tokenError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save token to database',
        details: tokenError.message
      }, { status: 500 });
    }

    // 7. Update user profile to mark as activated
    const { error: updateError } = await supabase
      .from('users')
      .update({
        creator_token_mint: tokenResult.mint.toBase58(),
        creator_activated: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[CREATOR ACTIVATE] Failed to update user:', updateError);
      // Don't fail - token is created, just log the error
    }

    console.log('[CREATOR ACTIVATE] ✅ Creator token activated successfully');

    // 8. Return success response
    return NextResponse.json({
      success: true,
      data: {
        token: {
          id: token.id,
          mint: tokenResult.mint.toBase58(),
          symbol: uniqueSymbol,
          displayName: displayTicker,
          isVerified: isFirstWithDisplayName,
          name: tokenName,
          pool: tokenResult.pool.toBase58(),
          metadataUri: metadataUri,
          signature: tokenResult.signature,
          jupiterUrl: dbcClient.getJupiterTradeUrl(tokenResult.mint.toBase58(), DBC_CONFIG.NETWORK as 'devnet' | 'mainnet'),
          meteoraUrl: dbcClient.getMeteoraTradeUrl(tokenResult.pool.toBase58(), DBC_CONFIG.NETWORK as 'devnet' | 'mainnet'),
        },
        message: `Creator token ${displayTicker} launched successfully!`,
        explorerUrl: `https://explorer.solana.com/tx/${tokenResult.signature}${DBC_CONFIG.RPC_URL.includes('devnet') ? '?cluster=devnet' : ''}`,
        tokenExplorerUrl: `https://explorer.solana.com/address/${tokenResult.mint.toBase58()}${DBC_CONFIG.RPC_URL.includes('devnet') ? '?cluster=devnet' : ''}`
      }
    });

  } catch (error) {
    console.error('[CREATOR ACTIVATE] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
