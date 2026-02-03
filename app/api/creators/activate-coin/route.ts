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
 * Creates an unsigned transaction for creator coin activation.
 * Creator-level coins ALWAYS require the creator to sign the transaction.
 * Returns a partially-signed transaction that the user must sign with their wallet.
 */
export async function POST(request: NextRequest) {
  console.log('[CREATOR COIN] Starting creator coin activation (signed flow)');

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
    let creatorWallet: PublicKey;
    try {
      creatorWallet = new PublicKey(walletAddress);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid wallet address format',
      }, { status: 400 });
    }

    // Find or create user by wallet address
    console.log('[CREATOR COIN] Finding or creating user...');
    let userId: string;
    let existingUser: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      creator_coin_enabled: boolean;
    } | null = null;

    const { data: foundUser } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, creator_coin_enabled')
      .eq('wallet_address', walletAddress)
      .single();

    if (foundUser) {
      // User exists - check if coin already activated
      if (foundUser.creator_coin_enabled) {
        return NextResponse.json({
          success: false,
          error: 'Creator coin already activated',
        }, { status: 400 });
      }

      userId = foundUser.id;
      existingUser = foundUser;
      console.log('[CREATOR COIN] Found existing user:', userId);
    } else {
      // User doesn't exist - create new user with wallet address
      console.log('[CREATOR COIN] User not found, creating new user...');

      const timestamp = Date.now().toString(36);
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const walletPrefix = walletAddress.substring(0, 6).toLowerCase();
      const generatedUsername = username || `${walletPrefix}_${timestamp}_${randomSuffix}`;

      const { v4: uuidv4 } = await import('uuid');
      const newUserId = uuidv4();

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          wallet_address: walletAddress,
          username: generatedUsername,
          display_name: displayName || `User ${walletPrefix}`,
          bio: bio || '',
          avatar_url: avatarUrl || null,
          verified_earnings: 0,
          success_tier: 'bronze',
          total_followers: 0,
          total_following: 0,
        })
        .select('id, username, display_name, avatar_url, creator_coin_enabled')
        .single();

      if (createError || !newUser) {
        console.error('[CREATOR COIN] Failed to create user:', createError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create user account',
          details: createError?.message || 'Unknown error',
        }, { status: 500 });
      }

      userId = newUser.id;
      existingUser = newUser;
      console.log('[CREATOR COIN] Created new user:', userId);
    }

    // Initialize DBC client
    const dbcClient = new MeteoraDBCClient(connection);

    // Generate unique symbol for the creator token
    const uniqueSymbol = dbcClient.generateUniqueSymbol();

    console.log('[CREATOR COIN] Creator coin details:', {
      username,
      displayName,
      uniqueSymbol,
      walletAddress
    });

    // 1. Upload token metadata (use avatar as token image)
    console.log('[CREATOR COIN] Uploading token metadata...');

    const tokenImage = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    const tokenDescription = bio || `${displayName}'s creator token. Support ${displayName} by holding $${username.toUpperCase()}!`;

    const metadataUri = await dbcClient.uploadMetadata({
      name: `${displayName} Token`,
      symbol: uniqueSymbol,
      description: tokenDescription,
      image: tokenImage,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://flexit.app'}/profile/${username}`
    }, supabase);

    console.log('[CREATOR COIN] Metadata uploaded:', metadataUri);

    // 2. Create unsigned transaction for creator to sign
    console.log('[CREATOR COIN] Creating unsigned transaction for signing...');

    const { unsignedTransaction, baseMintSecretKey } = await dbcClient.createTokenTransactionForSigning({
      name: `${displayName} Token`,
      symbol: uniqueSymbol,
      displayName: username.toUpperCase(),
      description: tokenDescription,
      imageUri: metadataUri,
      tokenType: 'creator', // Use CREATOR config (10B supply, 1% fee)
      creatorWallet,
    });

    console.log('[CREATOR COIN] Unsigned transaction created:', {
      mint: unsignedTransaction.baseMintPublicKey,
      blockhash: unsignedTransaction.blockhash.substring(0, 20) + '...'
    });

    // 3. Return the unsigned transaction for frontend to sign
    return NextResponse.json({
      success: true,
      requiresSignature: true,
      data: {
        unsignedTransaction,
        pendingActivation: {
          userId,
          username: existingUser?.username || username,
          displayName,
          uniqueSymbol,
          metadataUri,
          walletAddress,
          baseMintSecretKey, // For recovery if needed
        },
        message: 'Transaction created. Please sign with your wallet to activate your creator coin.',
      }
    });

  } catch (error) {
    console.error('[CREATOR COIN] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
