import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { MeteoraDBCClient } from '@/lib/meteora-dbc';
import { DBC_CONFIG } from '@/lib/dbc-config';

export async function POST(request: NextRequest) {
  console.log('🚀 [POST CREATE] Starting post creation with DBC token launch');

  try {
    // Initialize Supabase client inside the function to ensure env vars are loaded
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔍 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      urlPreview: supabaseUrl?.substring(0, 30) + '...',
      keyPreview: supabaseServiceKey?.substring(0, 20) + '...'
    });

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase not configured!', {
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

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Solana connection
    const connection = new Connection(DBC_CONFIG.RPC_URL, 'confirmed');

    const formData = await request.formData();
    
    // Extract post data
    const title = formData.get('title') as string;
    const ticker = formData.get('ticker') as string;
    const content = formData.get('content') as string;
    const walletAddress = formData.get('wallet') as string;
    const username = formData.get('username') as string;
    
    // Get media files
    const mediaFiles = formData.getAll('media') as File[];
    
    // Validate required fields
    if (!title || !content || !walletAddress || !ticker) {
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

    console.log('📝 Post details:', { title, ticker, walletAddress });

    // 1. Find or create user by wallet address
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

    // 2. Upload media files to Supabase Storage
    console.log('📤 Uploading media files...');
    const mediaUrls: string[] = [];

    for (const file of mediaFiles) {
      try {
        const fileName = file.name || 'unknown';
        const fileExt = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        console.log(`📁 Processing: ${fileName}`);

        // Next.js 14 FormData File handling - direct upload without conversion
        // Supabase accepts File objects directly
        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(`${uniqueFileName}`, file, {
            contentType: file.type || 'application/octet-stream',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Upload error:', uploadError);
          throw new Error(`Failed to upload ${fileName}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('post-media')
          .getPublicUrl(`${uniqueFileName}`);

        console.log(`✅ Uploaded: ${uniqueFileName}`);
        mediaUrls.push(publicUrl);

      } catch (fileError) {
        console.error('❌ Error processing file:', fileError);
        throw fileError;
      }
    }

    console.log('✅ All media uploaded:', mediaUrls);

    // 2. Upload token metadata
    console.log('📤 Uploading token metadata...');
    const dbcClient = new MeteoraDBCClient(connection);

    const metadataUri = await dbcClient.uploadMetadata({
      name: title,
      symbol: ticker.toUpperCase(),
      description: content,
      image: mediaUrls[0],
      external_url: `${process.env.NEXT_PUBLIC_APP_URL}/post/`
    }, supabase);

    console.log('✅ Metadata uploaded:', metadataUri);

    // 3. Create DBC token and pool transaction (NOT YET SUBMITTED)
    console.log('🪙 Creating DBC token and pool transaction...');

    const tokenResult = await dbcClient.createToken({
      name: title,
      symbol: ticker.toUpperCase(),
      description: content,
      imageUri: metadataUri,
      creator: new PublicKey(walletAddress),
      initialSupply: 1_000_000_000 // 1 billion tokens
    });

    console.log('✅ Token transaction prepared:', {
      mint: tokenResult.mint.toBase58(),
      pool: tokenResult.pool.toBase58()
    });

    // 4. Serialize transaction for frontend signing
    // IMPORTANT: Transaction is NOT signed yet - user signs first, then backend adds baseMint signature
    const serializedTransaction = tokenResult.transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });
    const transactionBase64 = Buffer.from(serializedTransaction).toString('base64');

    // Serialize the baseMint keypair to pass to confirm endpoint
    const baseMintKeypairBase64 = Buffer.from(tokenResult.baseMintKeypair.secretKey).toString('base64');

    console.log('📦 Transaction serialized for frontend signing');

    // 5. Return transaction to frontend for user signing
    // Database save happens AFTER user confirms the transaction
    return NextResponse.json({
      success: true,
      requiresSignature: true,
      data: {
        // Temporary post data (not yet saved to database)
        post: {
          title: title,
          content: content,
          media_urls: mediaUrls,
        },
        // Token data
        token: {
          mint: tokenResult.mint.toBase58(),
          symbol: ticker.toUpperCase(),
          name: title,
          pool: tokenResult.pool.toBase58(),
          metadataUri: metadataUri,
          transaction: transactionBase64,
          baseMintKeypair: baseMintKeypairBase64,  // Send to frontend to pass to confirm endpoint
          jupiterUrl: dbcClient.getJupiterTradeUrl(tokenResult.mint.toBase58()),
          meteoraUrl: dbcClient.getMeteoraTradeUrl(tokenResult.pool.toBase58()),
        },
        message: 'Transaction prepared! Please sign in your wallet to create the token.'
      }
    });

  } catch (error) {
    console.error('❌ [POST CREATE] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorCode = (error as any)?.code;

    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: errorCode,
    }, { status: 500 });
  }
}