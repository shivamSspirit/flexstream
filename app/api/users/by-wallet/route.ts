import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/users/by-wallet
 *
 * Fetches a user by their wallet address
 */
export async function GET(request: NextRequest) {
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get wallet address from query params
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address is required',
      }, { status: 400 });
    }

    // Fetch user by wallet address
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, wallet_address')
      .eq('wallet_address', wallet)
      .single();

    if (error) {
      console.error('❌ Error fetching user:', error);
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
      },
    });

  } catch (error) {
    console.error('❌ [GET USER BY WALLET] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
