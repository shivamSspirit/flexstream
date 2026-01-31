import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { MeteoraDBCClient } from '@/lib/meteora-dbc';
import { DBC_CONFIG } from '@/lib/dbc-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Check if a creator is verified based on:
 * 1. Custom avatar (not a default DiceBear)
 * 2. X/Twitter OAuth verification
 */
function checkCreatorVerified(user: {
  avatar_url?: string | null;
  twitter_verified?: boolean | null;
}): boolean {
  // Must have a custom avatar (not default DiceBear)
  const hasCustomAvatar = Boolean(
    user.avatar_url &&
    !user.avatar_url.includes('dicebear.com') &&
    !user.avatar_url.includes('api.dicebear')
  );

  // Must have X/Twitter OAuth verification
  const hasXVerification = user.twitter_verified === true;

  return hasCustomAvatar && hasXVerification;
}

/**
 * POST /api/posts/create-signed
 *
 * Creates an unsigned transaction for post token creation.
 * Used when user has exceeded 10 free gasless launches.
 * Returns a partially-signed transaction that the user must sign with their wallet.
 */
export async function POST(request: NextRequest) {
  console.log('[POST CREATE-SIGNED] Starting signed post creation flow');

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

    const formData = await request.formData();

    // Extract post data
    const title = formData.get('title') as string;
    const displayName = formData.get('ticker') as string;
    const content = formData.get('content') as string;
    const walletAddress = formData.get('wallet') as string;
    const username = formData.get('username') as string;

    // Get media files
    const mediaFiles = formData.getAll('media') as File[];

    // Validate required fields
    if (!title || !content || !walletAddress || !displayName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: title, content, wallet, ticker',
      }, { status: 400 });
    }

    if (mediaFiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one media file is required',
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

    // Initialize DBC client
    const dbcClient = new MeteoraDBCClient(connection);

    // Generate unique symbol
    const uniqueSymbol = dbcClient.generateUniqueSymbol();

    console.log('[POST CREATE-SIGNED] Post details:', {
      title,
      displayName,
      uniqueSymbol,
      walletAddress
    });

    // 1. Find or create user
    console.log('[POST CREATE-SIGNED] Finding or creating user...');
    let userId: string;
    let postLaunchCount = 0;

    const { data: existingUser } = await supabase
      .from('users')
      .select('id, post_launch_count, avatar_url, twitter_verified')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingUser) {
      userId = existingUser.id;
      postLaunchCount = existingUser.post_launch_count || 0;
      console.log('[POST CREATE-SIGNED] Found user:', userId, 'Launch count:', postLaunchCount);
    } else {
      // Create new user
      const timestamp = Date.now().toString(36).toLowerCase();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toLowerCase();
      const generatedUsername = `user${timestamp}${randomSuffix}`;
      const walletPrefix = walletAddress.substring(0, 4);

      const { v4: uuidv4 } = await import('uuid');
      const newUserId = uuidv4();

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          wallet_address: walletAddress,
          username: generatedUsername,
          display_name: username || displayName || `User ${walletPrefix}`,
        })
        .select('id, post_launch_count')
        .single();

      if (userError || !newUser) {
        console.error('[POST CREATE-SIGNED] Failed to create user:', userError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create user account',
          details: userError?.message,
        }, { status: 500 });
      }

      userId = newUser.id;
      postLaunchCount = 0;
      console.log('[POST CREATE-SIGNED] Created new user:', userId);
    }

    // Check creator verification status (custom avatar + X OAuth)
    // For new users, they're not verified yet (no avatar/X connection)
    const isCreatorVerified = existingUser ? checkCreatorVerified(existingUser) : false;
    console.log('[POST CREATE-SIGNED] Creator verification check:', {
      hasExistingUser: !!existingUser,
      isCreatorVerified
    });

    // 2. Upload media files
    console.log('[POST CREATE-SIGNED] Uploading media files...');
    const mediaUrls: string[] = [];

    for (const file of mediaFiles) {
      try {
        const fileName = file.name || 'unknown';
        const fileExt = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error } = await supabase.storage
          .from('post-media')
          .upload(uniqueFileName, buffer, {
            contentType: file.type || 'image/png',
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw new Error(`Failed to upload ${fileName}: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-media')
          .getPublicUrl(uniqueFileName);

        mediaUrls.push(publicUrl);
      } catch (fileError) {
        console.error('[POST CREATE-SIGNED] Error uploading file:', fileError);
        throw fileError;
      }
    }

    console.log('[POST CREATE-SIGNED] Media uploaded:', mediaUrls);

    // 3. Upload token metadata
    console.log('[POST CREATE-SIGNED] Uploading token metadata...');

    const metadataUri = await dbcClient.uploadMetadata({
      name: title,
      symbol: uniqueSymbol,
      description: content,
      image: mediaUrls[0],
      external_url: `${process.env.NEXT_PUBLIC_APP_URL}/post/`
    }, supabase);

    console.log('[POST CREATE-SIGNED] Metadata uploaded:', metadataUri);

    // 4. Create unsigned transaction for user to sign
    console.log('[POST CREATE-SIGNED] Creating unsigned transaction...');

    const { unsignedTransaction, baseMintSecretKey } = await dbcClient.createTokenTransactionForSigning({
      name: title,
      symbol: uniqueSymbol,
      displayName: displayName.toUpperCase(),
      description: content,
      imageUri: metadataUri,
      tokenType: 'post',
      creatorWallet,
    });

    console.log('[POST CREATE-SIGNED] Unsigned transaction created:', {
      mint: unsignedTransaction.baseMintPublicKey,
      blockhash: unsignedTransaction.blockhash.substring(0, 20) + '...'
    });

    // 5. Check if display_name is already taken (for verification status)
    const { data: existingTokens } = await supabase
      .from('tokens')
      .select('id, display_name')
      .ilike('display_name', displayName.toUpperCase())
      .limit(1);

    const isFirstWithDisplayName = !existingTokens || existingTokens.length === 0;

    // 6. Return the unsigned transaction and metadata for frontend to sign
    return NextResponse.json({
      success: true,
      data: {
        unsignedTransaction,
        // Store this data for the confirm endpoint
        pendingPost: {
          userId,
          title,
          content,
          displayName: displayName.toUpperCase(),
          uniqueSymbol,
          mediaUrls,
          metadataUri,
          walletAddress,
          isVerified: isFirstWithDisplayName, // Token name verification (anti-rug)
          isCreatorVerified, // Creator profile verification (avatar + X OAuth)
          postLaunchCount,
          baseMintSecretKey, // Needed for recovery if something goes wrong
        },
        message: 'Transaction created. Please sign with your wallet.',
        launchInfo: {
          currentCount: postLaunchCount,
          isGasless: false,
          requiresSignature: true
        }
      }
    });

  } catch (error) {
    console.error('[POST CREATE-SIGNED] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
