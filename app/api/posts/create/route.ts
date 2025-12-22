import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { MeteoraDBCClient } from '@/lib/meteora-dbc';
import { DBC_CONFIG } from '@/lib/dbc-config';

export async function POST(request: NextRequest) {
  console.log('[POST CREATE] Starting post creation with DBC token launch');

  try {
    // Initialize Supabase client inside the function to ensure env vars are loaded
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      urlPreview: supabaseUrl?.substring(0, 30) + '...',
      keyPreview: supabaseServiceKey?.substring(0, 20) + '...'
    });

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase not configured!', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      });
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured. Please check your environment variables.',
        debug: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseServiceKey
        }
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

    const formData = await request.formData();
    
    // Extract post data
    const title = formData.get('title') as string;
    const displayName = formData.get('ticker') as string; // User's chosen display name (can be duplicate)
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
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid wallet address format',
      }, { status: 400 });
    }

    // Initialize DBC client for symbol generation
    const dbcClient = new MeteoraDBCClient(connection);

    // Generate unique symbol for anti-rug mechanism
    const uniqueSymbol = dbcClient.generateUniqueSymbol();

    console.log('Post details:', {
      title,
      displayName,
      uniqueSymbol,
      walletAddress
    });

    // 1. Find or create user by wallet address
    console.log('Finding or creating user...');
    let userId: string;

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingUser) {
      userId = existingUser.id;
      console.log('Found existing user:', userId);
    } else {
      // Create new user with wallet address
      // Generate clean, URL-friendly username (no underscores, no spaces)
      const timestamp = Date.now().toString(36).toLowerCase();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toLowerCase();
      const generatedUsername = `user${timestamp}${randomSuffix}`;

      const walletPrefix = walletAddress.substring(0, 4);

      console.log('Creating new user with clean username:', {
        wallet: walletAddress,
        generatedUsername,
        displayName: username || displayName || `User ${walletPrefix}`
      });

      // Generate UUID for the user
      const { v4: uuidv4 } = await import('uuid');
      const newUserId = uuidv4();

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          wallet_address: walletAddress,
          username: generatedUsername, // Clean, URL-friendly username
          display_name: username || displayName || `User ${walletPrefix}`, // User's choice for display
        })
        .select('id')
        .single();

      if (userError || !newUser) {
        console.error('Failed to create user:', {
          message: userError?.message,
          details: userError?.details,
          hint: userError?.hint,
          code: userError?.code,
          walletAddress,
          attemptedUsername: generatedUsername
        });
        return NextResponse.json({
          success: false,
          error: 'Failed to create user account',
          details: userError?.message || 'Unknown error',
          hint: userError?.hint,
          code: userError?.code,
        }, { status: 500 });
      }

      userId = newUser.id;
      console.log('✅ Created new user:', {
        userId,
        username: generatedUsername,
        displayName: username || displayName || `User ${walletPrefix}`,
        wallet: walletAddress.substring(0, 8) + '...'
      });
    }

    // 2. Upload media files to Supabase Storage
    console.log('Uploading media files...');
    const mediaUrls: string[] = [];

    for (const file of mediaFiles) {
      try {
        const fileName = file.name || 'unknown';
        const fileExt = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        console.log(`📤 Processing file: ${fileName} (${file.size} bytes, type: ${file.type})`);

        // Convert File to ArrayBuffer for better compatibility
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`✅ File converted to buffer, uploading to Supabase storage...`);

        // Upload to Supabase Storage with retry logic
        let uploadError: any = null;
        let retries = 3;

        while (retries > 0) {
          const { error } = await supabase.storage
            .from('post-media')
            .upload(uniqueFileName, buffer, {
              contentType: file.type || 'image/png',
              cacheControl: '3600',
              upsert: false
            });

          uploadError = error;

          if (!error) {
            console.log(`✅ Successfully uploaded: ${uniqueFileName}`);
            break;
          }

          retries--;
          if (retries > 0) {
            console.log(`⚠️ Upload failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (uploadError) {
          console.error('❌ Upload error after retries:', {
            message: uploadError.message,
            name: uploadError.name,
            cause: uploadError.cause,
            fileName,
            fileSize: file.size,
            fileType: file.type
          });
          throw new Error(`Failed to upload ${fileName}: ${uploadError.message || 'Unknown error'}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('post-media')
          .getPublicUrl(`${uniqueFileName}`);

        console.log(`Uploaded: ${uniqueFileName}`);
        mediaUrls.push(publicUrl);

      } catch (fileError) {
        console.error('Error processing file:', fileError);
        throw fileError;
      }
    }

    console.log('All media uploaded:', mediaUrls);

    // 2. Upload token metadata
    console.log('Uploading token metadata...');

    const metadataUri = await dbcClient.uploadMetadata({
      name: title,
      symbol: uniqueSymbol, // Use unique symbol for metadata
      description: content,
      image: mediaUrls[0],
      external_url: `${process.env.NEXT_PUBLIC_APP_URL}/post/`
    }, supabase);

    console.log('Metadata uploaded:', metadataUri);

    // 3. Create DBC token and pool (BACKEND-ONLY, NO USER SIGNATURE REQUIRED)
    console.log('Creating DBC token and pool from backend...');
    console.log('Anti-rug mechanism:', {
      uniqueSymbol,
      displayName: displayName.toUpperCase(),
      note: 'Symbol is unique, display name can be duplicate'
    });

    const tokenResult = await dbcClient.createToken({
      name: title,
      symbol: uniqueSymbol, // Auto-generated unique symbol
      displayName: displayName.toUpperCase(), // User's chosen display name
      description: content,
      imageUri: metadataUri,
      tokenType: 'post', // Post-level token
      // No creator needed - platform creates on behalf of user
      // initialSupply will be set automatically from POST_TOKEN_CONFIG (1B tokens)
    });

    console.log('Token created successfully:', {
      mint: tokenResult.mint.toBase58(),
      pool: tokenResult.pool.toBase58(),
      signature: tokenResult.signature
    });

    // 4. Check if this display_name is already taken (Anti-Rug Mechanism)
    console.log('Checking display_name for anti-rug verification...');
    const { data: existingTokens } = await supabase
      .from('tokens')
      .select('id, display_name')
      .ilike('display_name', displayName.toUpperCase())
      .limit(1);

    const isFirstWithDisplayName = !existingTokens || existingTokens.length === 0;

    console.log('Anti-rug check:', {
      displayName: displayName.toUpperCase(),
      existingCount: existingTokens?.length || 0,
      willBeVerified: isFirstWithDisplayName
    });

    // 5. Get user data for response
    console.log('Fetching user data for response...');
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, wallet_address')
      .eq('id', userId)
      .single();

    if (userFetchError || !userData) {
      console.error('Failed to fetch user data:', userFetchError);
      // Continue anyway - token is already created
    }

    // 6. Save post to database WITH user data (for cache)
    console.log('Saving post to database...');

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        type: 'trading_journey',
        title: title,
        content: content,
        media_urls: mediaUrls,

        // Token fields - use unique symbol and display name
        token_mint: tokenResult.mint.toBase58(),
        token_symbol: uniqueSymbol, // Auto-generated unique symbol
        token_display_name: displayName.toUpperCase(), // User's chosen display name
        token_is_verified: isFirstWithDisplayName, // Verification status
        token_name: title,
        pool_address: tokenResult.pool.toBase58(),
        bonding_curve_address: tokenResult.pool.toBase58(),
        token_metadata_uri: metadataUri,
        token_signature: tokenResult.signature,
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
      console.error('Database error:', postError);
      // Token is already created on-chain, so we return success with warning
      return NextResponse.json({
        success: true,
        warning: 'Token created but database save failed',
        data: {
          signature: tokenResult.signature,
          mint: tokenResult.mint.toBase58(),
          pool: tokenResult.pool.toBase58(),
          error: postError.message,
          explorerUrl: `https://explorer.solana.com/tx/${tokenResult.signature}${DBC_CONFIG.RPC_URL.includes('devnet') ? '?cluster=devnet' : ''}`
        }
      });
    }

    console.log('✅ Post saved successfully:', {
      postId: post.id,
      userId: userId,
      userIdMatch: post.user_id === userId,
      wallet: walletAddress.substring(0, 10) + '...',
      title: post.title,
      tokenMint: post.token_mint,
      createdAt: post.created_at
    });

    // Verify user exists
    const { data: verifyUser } = await supabase
      .from('users')
      .select('id, username, wallet_address')
      .eq('id', userId)
      .single();

    console.log('✅ User verification:', {
      userId,
      userExists: !!verifyUser,
      username: verifyUser?.username,
      wallet: verifyUser?.wallet_address?.substring(0, 10) + '...'
    });

    // 7. Save token data to tokens table with anti-rug mechanism
    console.log('Saving token data with anti-rug mechanism...');

    const { error: tokenError } = await supabase
      .from('tokens')
      .insert({
        mint_address: tokenResult.mint.toBase58(),
        symbol: uniqueSymbol, // Auto-generated unique symbol
        display_name: displayName.toUpperCase(), // User's chosen display name
        name: title,
        description: content,
        image_uri: mediaUrls?.[0] || '',
        metadata_uri: metadataUri,
        creator_wallet: walletAddress,
        post_id: post.id,
        pool_address: tokenResult.pool.toBase58(),
        bonding_curve_address: tokenResult.pool.toBase58(),
        config_key: DBC_CONFIG.POST.CONFIG_KEY.toBase58(),
        initial_supply: 1_000_000_000,
        is_tradable: true,
        is_verified: isFirstWithDisplayName, // First token with this display_name is verified
        creation_signature: tokenResult.signature,
        created_at: new Date().toISOString(),
      });

    if (tokenError) {
      console.error('Token table error:', tokenError);
      // Don't throw - post is already created
    }

    console.log('Token data saved with verification:', {
      symbol: uniqueSymbol,
      displayName: displayName.toUpperCase(),
      isVerified: isFirstWithDisplayName
    });

    // 8. Return success response with FULL post data (including users)
    return NextResponse.json({
      success: true,
      data: {
        signature: tokenResult.signature,
        post: post, // Return the complete post object with users field included from the join
        token: {
          mint: tokenResult.mint.toBase58(),
          symbol: uniqueSymbol, // Unique auto-generated symbol
          displayName: displayName.toUpperCase(), // User's chosen display name
          isVerified: isFirstWithDisplayName, // Verification status
          name: title,
          pool: tokenResult.pool.toBase58(),
          metadataUri: metadataUri,
          jupiterUrl: dbcClient.getJupiterTradeUrl(tokenResult.mint.toBase58(), DBC_CONFIG.NETWORK as 'devnet' | 'mainnet'),
          meteoraUrl: dbcClient.getMeteoraTradeUrl(tokenResult.pool.toBase58(), DBC_CONFIG.NETWORK as 'devnet' | 'mainnet'),
        },
        message: 'Post and token created successfully!',
        explorerUrl: `https://explorer.solana.com/tx/${tokenResult.signature}${DBC_CONFIG.RPC_URL.includes('devnet') ? '?cluster=devnet' : ''}`,
        tokenExplorerUrl: `https://explorer.solana.com/address/${tokenResult.mint.toBase58()}${DBC_CONFIG.RPC_URL.includes('devnet') ? '?cluster=devnet' : ''}`
      }
    });

  } catch (error) {
    console.error('[POST CREATE] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorCode = (error as any)?.code;

    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: errorCode,
    }, { status: 500 });
  }
}