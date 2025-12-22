import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Debug endpoint to check user status
 * GET /api/users/debug?wallet=YOUR_WALLET_ADDRESS
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address required. Use: /api/users/debug?wallet=YOUR_WALLET'
      }, { status: 400 });
    }

    console.log('🔍 DEBUG: Checking user for wallet:', walletAddress);

    // Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      console.log('❌ DEBUG: User not found:', error.code);
      return NextResponse.json({
        success: true,
        userExists: false,
        error: error.message,
        errorCode: error.code,
        message: 'User does not exist in database',
        nextSteps: [
          '1. User will be auto-created when you connect wallet',
          '2. Check browser console for "✅ New user created:" message',
          '3. Wait 2-3 seconds after connecting wallet',
          '4. Then try accessing your profile'
        ]
      });
    }

    console.log('✅ DEBUG: User found:', user.username);

    return NextResponse.json({
      success: true,
      userExists: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        wallet_address: user.wallet_address,
        created_at: user.created_at,
        avatar_url: user.avatar_url,
      },
      profileUrl: `/profile/${user.username}`,
      message: 'User exists! You can access your profile at the URL above',
      hasOldUsername: user.username.includes('_'), // Check if has old format with underscores
      recommendation: user.username.includes('_')
        ? 'Your username has underscores (old format). Consider updating it in Edit Profile to avoid routing issues.'
        : 'Username looks good!'
    });

  } catch (error) {
    console.error('❌ DEBUG: Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
