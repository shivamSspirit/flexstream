import { NextRequest, NextResponse } from 'next/server';
import { generateTokenForClerkUser } from '@/lib/jwt';
import { auth as serverAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Resolve authenticated user via Clerk (server) or headers
    const { userId } = await serverAuth(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to generate a token.',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured',
        code: 'DB_NOT_CONFIGURED'
      }, { status: 500 });
    }

    // Ensure 1:1 wallet mapping exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, wallet_address')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found. Complete onboarding first.',
        code: 'PROFILE_NOT_FOUND'
      }, { status: 400 });
    }

    if (!profile.wallet_address) {
      return NextResponse.json({
        success: false,
        error: 'Wallet not linked. Connect your wallet to continue.',
        code: 'WALLET_MISSING'
      }, { status: 400 });
    }

    // For now, we'll use a placeholder email since Clerk doesn't expose it directly in server components
    // In a real implementation, you might want to store this in your database
    const email = `user-${userId}@flexstream.app`;

    // Generate JWT token for Pump.fun API
    const token = generateTokenForClerkUser(userId, email, profile.wallet_address || undefined);

    return NextResponse.json({
      success: true,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      userId,
      walletAddress: profile.wallet_address,
      message: 'Token generated successfully for Pump.fun API access'
    });

  } catch (error) {
    console.error('Error generating Pump.fun token:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate authentication token',
      code: 'TOKEN_GENERATION_ERROR'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from header (no Clerk)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to access this endpoint.',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // Return token information without generating a new one
    return NextResponse.json({
      success: true,
      authenticated: true,
      userId,
      message: 'User is authenticated. Use POST to generate a new token.'
    });

  } catch (error) {
    console.error('Error checking authentication:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check authentication status',
      code: 'AUTH_CHECK_ERROR'
    }, { status: 500 });
  }
}
