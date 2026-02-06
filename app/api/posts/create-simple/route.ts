import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/posts/create-simple
 *
 * Creates a normal post WITHOUT a token.
 * Accepts media + text content. No on-chain interaction.
 */
export async function POST(request: NextRequest) {
  console.log('[POST CREATE-SIMPLE] Starting simple post creation (no token)');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured.',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const formData = await request.formData();

    const content = formData.get('content') as string;
    const walletAddress = formData.get('wallet') as string;
    const title = (formData.get('title') as string) || null;
    const mediaFiles = formData.getAll('media') as File[];

    // Validate required fields
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: wallet',
      }, { status: 400 });
    }

    if (!content && mediaFiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Post must have either text content or media',
      }, { status: 400 });
    }

    // Validate wallet address
    try {
      new PublicKey(walletAddress);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid wallet address format',
      }, { status: 400 });
    }

    // 1. Find or create user by wallet address
    let userId: string;

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
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
          display_name: `User ${walletPrefix}`,
        })
        .select('id')
        .single();

      if (userError || !newUser) {
        console.error('[CREATE-SIMPLE] Failed to create user:', userError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create user account',
        }, { status: 500 });
      }

      userId = newUser.id;
    }

    // 2. Upload media files to Supabase Storage
    const mediaUrls: string[] = [];

    for (const file of mediaFiles) {
      const fileName = file.name || 'unknown';
      const fileExt = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let uploadError: unknown = null;
      let retries = 3;

      while (retries > 0) {
        const { error } = await supabase.storage
          .from('post-media')
          .upload(uniqueFileName, buffer, {
            contentType: file.type || 'image/png',
            cacheControl: '3600',
            upsert: false,
          });

        uploadError = error;
        if (!error) break;

        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (uploadError) {
        const errMsg = uploadError instanceof Error ? uploadError.message : 'Unknown error';
        throw new Error(`Failed to upload ${fileName}: ${errMsg}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(uniqueFileName);

      mediaUrls.push(publicUrl);
    }

    // 3. Insert post into database (NO token fields)
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        type: 'lifestyle',
        title,
        content: content || '',
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
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

    if (postError || !post) {
      console.error('[CREATE-SIMPLE] Database error:', postError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save post',
      }, { status: 500 });
    }

    console.log('[CREATE-SIMPLE] Post created:', post.id);

    return NextResponse.json({
      success: true,
      data: {
        post,
        message: 'Post created successfully!',
      },
    });
  } catch (error) {
    console.error('[CREATE-SIMPLE] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
