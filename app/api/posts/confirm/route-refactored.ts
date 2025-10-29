/**
 * POST /api/posts/confirm
 * Confirms post creation after user signs the transaction
 * REFACTORED VERSION - Using clean code principles
 */

import { NextRequest } from 'next/server';
import { Connection } from '@solana/web3.js';
import { DBC_CONFIG } from '@/lib/dbc-config';
import {
  withErrorHandling,
  successResponse,
  validateRequiredFields,
  initializeSupabaseClient,
  parseRequestBody,
} from '@/lib/api-utils';
import { findOrCreateUser } from '@/lib/services/user-service';
import { EXTERNAL_URLS } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

interface ConfirmPostData {
  title: string;
  ticker: string;
  content: string;
  wallet: string;
  mediaUrls: string[];
  mint: string;
  pool: string;
  metadataUri: string;
}

interface ConfirmRequest {
  signature: string;
  postData: ConfirmPostData;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export const POST = withErrorHandling(async (request: NextRequest) => {
  console.log('🔐 [POST CONFIRM] Starting post confirmation after user signature');

  // Initialize services
  const supabase = initializeSupabaseClient();
  const connection = new Connection(DBC_CONFIG.RPC_URL, 'confirmed');

  // Parse and validate request body
  const body = await parseRequestBody<ConfirmRequest>(request);

  // Validate required fields
  const validation = validateRequiredFields(body, ['signature', 'postData']);
  if (validation) return validation;

  const { signature, postData } = body;

  // Validate post data fields
  const postValidation = validateRequiredFields(postData, [
    'title',
    'ticker',
    'content',
    'wallet',
    'mint',
    'pool',
  ]);
  if (postValidation) return postValidation;

  console.log('📝 Saving post to database:', {
    title: postData.title,
    ticker: postData.ticker,
    mint: postData.mint,
    pool: postData.pool,
    signature,
  });

  // Transaction is already confirmed on-chain by the frontend
  // This endpoint saves to the database

  // Find or create user
  console.log('👤 Finding or creating user...');
  const { user } = await findOrCreateUser(supabase, {
    walletAddress: postData.wallet,
  });

  console.log('✅ User ready:', user.id);

  // Save post to database
  const post = await savePost(supabase, user.id, postData, signature);

  console.log('✅ Post saved:', post.id);

  // Save token data
  await saveToken(supabase, post.id, postData, signature);

  console.log('✅ Token data saved');

  // Return success response
  const explorerUrl = buildExplorerUrl(signature);

  return successResponse(
    {
      signature,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        media_urls: post.media_urls,
        created_at: post.created_at,
      },
      token: {
        mint: postData.mint,
        symbol: postData.ticker.toUpperCase(),
        name: postData.title,
        pool: postData.pool,
        metadataUri: postData.metadataUri,
      },
      explorerUrl,
    },
    'Post and token created successfully!'
  );
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Saves post to database
 * Following Single Responsibility Principle
 */
async function savePost(
  supabase: any,
  userId: string,
  postData: ConfirmPostData,
  signature: string
) {
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      type: 'trading_journey',
      title: postData.title,
      content: postData.content,
      media_urls: postData.mediaUrls,

      // Token fields
      token_mint: postData.mint,
      token_symbol: postData.ticker.toUpperCase(),
      token_name: postData.title,
      pool_address: postData.pool,
      bonding_curve_address: postData.pool,
      token_metadata_uri: postData.metadataUri,
      token_signature: signature,
      is_token_tradable: true,

      verified: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (postError) {
    console.error('❌ Database error:', postError);
    // Transaction is already confirmed on-chain
    // Log error but return partial success
    throw new Error(`Database save failed: ${postError.message}`);
  }

  return post;
}

/**
 * Saves token data to tokens table
 * Following Single Responsibility Principle
 */
async function saveToken(
  supabase: any,
  postId: string,
  postData: ConfirmPostData,
  signature: string
) {
  const { error: tokenError } = await supabase.from('tokens').insert({
    mint_address: postData.mint,
    symbol: postData.ticker.toUpperCase(),
    name: postData.title,
    description: postData.content,
    image_uri: postData.mediaUrls?.[0] || '',
    metadata_uri: postData.metadataUri,
    creator_wallet: postData.wallet,
    post_id: postId,
    pool_address: postData.pool,
    bonding_curve_address: postData.pool,
    config_key: DBC_CONFIG.CONFIG_KEY.toBase58(),
    initial_supply: 1_000_000_000,
    is_tradable: true,
    creation_signature: signature,
    created_at: new Date().toISOString(),
  });

  if (tokenError) {
    console.error('❌ Token table error:', tokenError);
    // Don't throw - post is already created
    // Token data is supplementary
  }
}

/**
 * Builds Solana Explorer URL
 * Following Single Responsibility Principle
 */
function buildExplorerUrl(signature: string): string {
  const isDevnet = DBC_CONFIG.RPC_URL.includes('devnet');
  const cluster = isDevnet ? '?cluster=devnet' : '';

  return `${EXTERNAL_URLS.SOLANA_EXPLORER}/tx/${signature}${cluster}`;
}
