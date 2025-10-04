import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';
import { generateSolanaWallet, encryptPrivateKey } from '@/lib/solana-wallet';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('🔑 [API] Wallet generation request received');
  
  try {
    // Get the authenticated user from header (no Clerk)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      console.log('❌ [API] No authenticated user found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    console.log('✅ [API] Authenticated user:', userId);

    // Check if user already has a wallet
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('wallet_address, encrypted_private_key')
      .eq('clerk_user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ [API] Error fetching user:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing wallet'
      }, { status: 500 });
    }

    if (existingUser?.wallet_address) {
      console.log('⚠️ [API] User already has a wallet:', existingUser.wallet_address.slice(0, 8) + '...');
      return NextResponse.json({
        success: false,
        error: 'User already has a wallet',
        wallet: {
          publicKey: existingUser.wallet_address
        }
      }, { status: 400 });
    }

    // Generate new Solana wallet
    console.log('🔑 [API] Generating new wallet for user:', userId);
    const wallet = generateSolanaWallet();
    
    // Encrypt the private key using user ID as password
    const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey, userId);
    
    console.log('🔐 [API] Private key encrypted, storing in database...');

    // Store wallet in database
    const { error: insertError } = await supabase
      .from('users')
      .upsert({
        clerk_user_id: userId,
        wallet_address: wallet.publicKey,
        encrypted_private_key: encryptedPrivateKey,
        wallet_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ [API] Error storing wallet:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to store wallet'
      }, { status: 500 });
    }

    console.log('✅ [API] Wallet stored successfully for user:', userId);

    return NextResponse.json({
      success: true,
      wallet: {
        publicKey: wallet.publicKey,
        // Don't return private key to client for security
      },
      message: 'Wallet generated and stored successfully'
    });

  } catch (error) {
    console.error('❌ [API] Error generating wallet:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate wallet'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('🔍 [API] Wallet status check request received');
  
  try {
    // Get the authenticated user from header (no Clerk)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Check if user has a wallet
    const { data: user, error } = await supabase
      .from('users')
      .select('wallet_address, wallet_created_at')
      .eq('clerk_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [API] Error fetching user wallet:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to check wallet status'
      }, { status: 500 });
    }

    const hasWallet = !!user?.wallet_address;

    return NextResponse.json({
      success: true,
      hasWallet,
      wallet: hasWallet ? {
        publicKey: user.wallet_address,
        createdAt: user.wallet_created_at
      } : null
    });

  } catch (error) {
    console.error('❌ [API] Error checking wallet status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check wallet status'
    }, { status: 500 });
  }
}
