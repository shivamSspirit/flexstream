import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUser, setCachedUser } from '@/lib/cache';
import type { CachedUser } from '@/lib/redis';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/users/by-wallet
 *
 * Fetches a user by their wallet address
 * Uses Redis cache for fast lookups (5min TTL)
 */
export async function GET(request: NextRequest) {
  try {
    // Get wallet address from query params
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address is required',
      }, { status: 400 });
    }

    // Try Redis cache first
    const cached = await getCachedUser(wallet);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: {
          id: cached.id,
          username: cached.username,
          display_name: cached.displayName,
          avatar_url: cached.avatarUrl,
          wallet_address: cached.walletAddress,
        },
        cached: true,
      });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user by wallet address
    // Use maybeSingle() to handle the case where no user exists gracefully
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, wallet_address, success_tier, twitter_verified, creator_coin_enabled')
      .eq('wallet_address', wallet)
      .maybeSingle();

    if (error) {
      console.error('[GET USER BY WALLET] Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
      }, { status: 500 });
    }

    // User not found - return 404 without logging an error (this is expected for new wallets)
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Cache the user for future requests (fire and forget)
    const cacheData: CachedUser = {
      id: user.id,
      walletAddress: user.wallet_address,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      successTier: user.success_tier || 'bronze',
      twitterVerified: user.twitter_verified || false,
      creatorCoinEnabled: user.creator_coin_enabled || false,
      updatedAt: Date.now(),
    };
    setCachedUser(cacheData).catch(() => {}); // Fire and forget

    return NextResponse.json({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error('[GET USER BY WALLET] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
