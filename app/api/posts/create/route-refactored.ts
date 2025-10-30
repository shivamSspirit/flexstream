/**
 * POST /api/posts/create
 * Creates a new post with DBC token launch
 * REFACTORED VERSION - Using clean code principles
 */

import { NextRequest } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { MeteoraDBCClient } from '@/lib/meteora-dbc';
import { DBC_CONFIG } from '@/lib/dbc-config';
import {
  withErrorHandling,
  successResponse,
  validationError,
  initializeSupabaseClient,
  getFormData,
} from '@/lib/api-utils';
import { findOrCreateUser } from '@/lib/services/user-service';
import { ERROR_MESSAGES } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

interface CreatePostFormData {
  title: string;
  ticker: string;
  content: string;
  walletAddress: string;
  username: string;
  mediaFiles: File[];
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export const POST = withErrorHandling(async (request: NextRequest) => {
  console.log('🚀 [POST CREATE] Starting post creation with DBC token launch');

  // Initialize services
  const supabase = initializeSupabaseClient();
  const connection = new Connection(DBC_CONFIG.RPC_URL, 'confirmed');

  // Parse and validate form data
  const formData = await parseFormData(request);

  // Find or create user
  console.log('👤 Finding or creating user...');
  const { user } = await findOrCreateUser(supabase, {
    walletAddress: formData.walletAddress,
    username: formData.username,
  });

  console.log('✅ User ready:', user.id);

  // Upload media files
  console.log('📤 Uploading media files...');
  const mediaUrls = await uploadMediaFiles(supabase, formData.mediaFiles);

  console.log('✅ Media uploaded:', mediaUrls);

  // Upload token metadata
  console.log('📋 Creating token metadata...');
  const metadataUri = await uploadTokenMetadata(supabase, {
    name: formData.title,
    symbol: formData.ticker,
    description: formData.content,
    image: mediaUrls[0], // Use first media as token image
  });

  console.log('✅ Metadata uploaded:', metadataUri);

  // Create DBC token
  console.log('🪙 Creating DBC token...');
  const dbcClient = new MeteoraDBCClient(connection);

  const tokenResult = await dbcClient.createToken({
    name: formData.title,
    symbol: formData.ticker,
    description: formData.content || formData.title,
    imageUri: mediaUrls[0] || '',
    creator: new PublicKey(formData.walletAddress),
  });

  console.log('✅ Token created:', {
    mint: tokenResult.mint.toBase58(),
    pool: tokenResult.pool.toBase58(),
  });

  // Prepare response
  const responseData = {
    post: {
      user_id: user.id,
      title: formData.title,
      content: formData.content,
      media_urls: mediaUrls,
    },
    token: {
      mint: tokenResult.mint.toBase58(),
      pool: tokenResult.pool.toBase58(),
      bondingCurve: tokenResult.pool.toBase58(), // bonding curve is the same as pool
      metadataUri,
      transaction: tokenResult.transaction.serialize().toString('base64'),
    },
  };

  console.log('✅ Post creation prepared successfully');

  return successResponse(responseData, undefined, 200);
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parses and validates form data
 * Following Single Responsibility Principle
 */
async function parseFormData(request: NextRequest): Promise<CreatePostFormData> {
  const formData = await getFormData(request);

  // Extract fields
  const title = formData.get('title') as string;
  const ticker = formData.get('ticker') as string;
  const content = formData.get('content') as string;
  const walletAddress = formData.get('wallet') as string;
  const username = formData.get('username') as string;
  const mediaFiles = formData.getAll('media') as File[];

  // Validate required fields
  if (!title || !content || !walletAddress || !ticker) {
    throw validationError(
      'Missing required fields: title, content, wallet, ticker'
    );
  }

  if (mediaFiles.length === 0) {
    throw validationError('At least one media file is required');
  }

  // Validate wallet address format
  try {
    new PublicKey(walletAddress);
  } catch (error) {
    throw validationError('Invalid wallet address format');
  }

  // Validate ticker format
  const tickerRegex = /^[A-Z0-9]{3,10}$/;
  if (!tickerRegex.test(ticker.toUpperCase())) {
    throw validationError(ERROR_MESSAGES.TICKER_INVALID_FORMAT);
  }

  return {
    title,
    ticker: ticker.toUpperCase(),
    content,
    walletAddress,
    username: username || `user_${walletAddress.substring(0, 8)}`,
    mediaFiles,
  };
}

/**
 * Uploads media files to Supabase Storage
 * Following Single Responsibility Principle
 */
async function uploadMediaFiles(
  supabase: any,
  mediaFiles: File[]
): Promise<string[]> {
  const mediaUrls: string[] = [];

  for (const file of mediaFiles) {
    const fileName = file.name || 'unknown';
    const fileExt = fileName.includes('.')
      ? fileName.split('.').pop()
      : 'bin';
    const uniqueFileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    console.log(`📁 Uploading: ${fileName}`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(uniqueFileName, file, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw new Error(`Failed to upload ${fileName}: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('post-media')
      .getPublicUrl(uniqueFileName);

    if (!urlData?.publicUrl) {
      throw new Error(`Failed to get public URL for ${fileName}`);
    }

    mediaUrls.push(urlData.publicUrl);
    console.log(`✅ Uploaded: ${uniqueFileName}`);
  }

  return mediaUrls;
}

/**
 * Uploads token metadata to Supabase Storage
 * Following Single Responsibility Principle
 */
async function uploadTokenMetadata(
  supabase: any,
  metadata: {
    name: string;
    symbol: string;
    description: string;
    image: string;
  }
): Promise<string> {
  const metadataJson = {
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description,
    image: metadata.image,
    attributes: [],
    properties: {
      files: [
        {
          uri: metadata.image,
          type: 'image',
        },
      ],
      category: 'image',
    },
  };

  const metadataFileName = `metadata-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.json`;

  const { error: metadataError } = await supabase.storage
    .from('token-metadata')
    .upload(metadataFileName, JSON.stringify(metadataJson), {
      contentType: 'application/json',
      cacheControl: '3600',
      upsert: false,
    });

  if (metadataError) {
    console.error('❌ Metadata upload error:', metadataError);
    throw new Error(`Failed to upload metadata: ${metadataError.message}`);
  }

  const { data: metadataUrlData } = supabase.storage
    .from('token-metadata')
    .getPublicUrl(metadataFileName);

  if (!metadataUrlData?.publicUrl) {
    throw new Error('Failed to get metadata public URL');
  }

  return metadataUrlData.publicUrl;
}
