import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { MeteoraDBCClient } from '@/lib/meteora-dbc';
import { DBC_CONFIG } from '@/lib/dbc-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/creators/activate-coin
 *
 * Activates a creator's coin using Meteora DBC
 * Reuses the same token creation logic as posts but with CREATOR config
 */
export async function POST(request: NextRequest) {
  console.log('[CREATOR COIN] Starting creator coin activation');

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase not configured');
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured. Please check your environment variables.',
      }, { status: 500 });
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Initialize Solana connection
    const connection = new Connection(DBC_CONFIG.RPC_URL, 'confirmed');

    const body = await request.json();

    // Extract creator data
    const { walletAddress, username, displayName, bio, avatarUrl } = body;

    // Validate required fields
    if (!walletAddress || !username || !displayName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: walletAddress, username, displayName',
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

    // Check if user exists
    console.log('Finding user by wallet...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, creator_coin_enabled')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Check if creator coin already activated
    if (user.creator_coin_enabled) {
      return NextResponse.json({
        success: false,
        error: 'Creator coin already activated',
      }, { status: 400 });
    }

    // Initialize DBC client
    const dbcClient = new MeteoraDBCClient(connection);

    // Generate unique symbol for the creator token
    const uniqueSymbol = dbcClient.generateUniqueSymbol();

    console.log('Creator coin details:', {
      username,
      displayName,
      uniqueSymbol,
      walletAddress
    });

    // 1. Upload token metadata (use avatar as token image)
    console.log('Uploading token metadata...');

    const tokenImage = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    const tokenDescription = bio || `${displayName}'s creator token. Support ${displayName} by holding $${username.toUpperCase()}!`;

    const metadataUri = await dbcClient.uploadMetadata({
      name: `${displayName} Token`,
      symbol: uniqueSymbol, // Use unique symbol for metadata
      description: tokenDescription,
      image: tokenImage,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://flexstream.app'}/profile/${username}`
    }, supabase);

    console.log('Metadata uploaded:', metadataUri);

    // 2. Create DBC token and pool with CREATOR config
    console.log('Creating creator token and pool...');

    const tokenResult = await dbcClient.createToken({
      name: `${displayName} Token`,
      symbol: uniqueSymbol, // Auto-generated unique symbol
      displayName: username.toUpperCase(), // Username as display name
      description: tokenDescription,
      imageUri: metadataUri,
      tokenType: 'creator', // Use CREATOR config (10B supply, 1% fee)
    });

    console.log('Creator token created successfully:', {
      mint: tokenResult.mint.toBase58(),
      pool: tokenResult.pool.toBase58(),
      signature: tokenResult.signature
    });

    // 3. Update user record with creator coin info
    console.log('Updating user with creator coin data...');

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        creator_coin_enabled: true,
        creator_coin_mint: tokenResult.mint.toBase58(),
        creator_coin_pool: tokenResult.pool.toBase58(),
        creator_coin_metadata_uri: metadataUri,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update user with creator coin data',
      }, { status: 500 });
    }

    console.log('✅ Creator coin activated successfully!');

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        token: {
          mint: tokenResult.mint.toBase58(),
          pool: tokenResult.pool.toBase58(),
          symbol: uniqueSymbol,
          displayName: username.toUpperCase(),
          metadataUri,
          signature: tokenResult.signature,
        }
      },
      message: 'Creator coin activated successfully!'
    });

  } catch (error) {
    console.error('❌ [CREATOR COIN] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
