import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PublicKey } from '@solana/web3.js';

/**
 * API Route: Ensure User Exists
 * Creates user record when wallet connects (if not exists)
 * New users get a temporary username and must complete profile setup
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address is required'
      }, { status: 400 });
    }

    // Validate wallet address format
    try {
      new PublicKey(walletAddress);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid wallet address'
      }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingUser) {
      console.log('✅ User already exists:', existingUser.username);

      // Check if profile setup is needed (no username or profile not completed)
      const needsProfileSetup = !existingUser.profile_completed ||
        !existingUser.username ||
        existingUser.username.match(/^user[a-z0-9]{10,}$/);

      return NextResponse.json({
        success: true,
        user: existingUser,
        isNewUser: false,
        needsProfileSetup
      });
    }

    // User doesn't exist - create new user with temporary username
    console.log('🆕 Creating new user for wallet:', walletAddress);

    // Generate temporary username (will be changed during profile setup)
    const timestamp = Date.now().toString(36).toLowerCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toLowerCase();
    const tempUsername = `user${timestamp}${randomSuffix}`;

    // Generate display name from wallet prefix
    const walletPrefix = walletAddress.substring(0, 4);
    const displayName = `User ${walletPrefix}`;

    // Generate UUID
    const { v4: uuidv4 } = await import('uuid');
    const newUserId = uuidv4();

    // Generate default avatar
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`;

    // Create user with profile_completed = false
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: newUserId,
        wallet_address: walletAddress,
        username: tempUsername,
        display_name: displayName,
        bio: '',
        avatar_url: avatarUrl,
        profile_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error('❌ Failed to create user:', userError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create user',
        details: userError?.message
      }, { status: 500 });
    }

    console.log('✅ Successfully created new user (needs profile setup):', newUser.username);

    return NextResponse.json({
      success: true,
      user: newUser,
      isNewUser: true,
      needsProfileSetup: true
    });

  } catch (error) {
    console.error('❌ Error in ensure user API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
