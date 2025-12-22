import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PublicKey } from '@solana/web3.js';

/**
 * API Route: Ensure User Exists
 * Auto-creates user record when wallet connects
 * Prevents redirect issues when accessing profile
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
    } catch (error) {
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
      return NextResponse.json({
        success: true,
        user: existingUser,
        isNewUser: false
      });
    }

    // User doesn't exist - create new user
    console.log('🆕 Creating new user for wallet:', walletAddress);

    // Generate clean, URL-friendly username (no underscores, no spaces)
    // Format: user{timestamp}{random} - example: user1a2b3c4d5e
    const timestamp = Date.now().toString(36).toLowerCase(); // Convert to base36 for shorter string
    const randomSuffix = Math.random().toString(36).substring(2, 6).toLowerCase(); // 4 chars
    const generatedUsername = `user${timestamp}${randomSuffix}`;

    // Generate display name from wallet prefix
    const walletPrefix = walletAddress.substring(0, 4);
    const displayName = `User ${walletPrefix}`;

    // Generate UUID
    const { v4: uuidv4 } = await import('uuid');
    const newUserId = uuidv4();

    // Generate default avatar
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`;

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: newUserId,
        wallet_address: walletAddress,
        username: generatedUsername,
        display_name: displayName,
        bio: '',
        avatar_url: avatarUrl,
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

    console.log('✅ Successfully created new user:', newUser.username);

    return NextResponse.json({
      success: true,
      user: newUser,
      isNewUser: true
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
