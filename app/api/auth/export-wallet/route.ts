import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';
import { decryptPrivateKey } from '@/lib/solana-wallet';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('🔐 [API] Wallet export request received');
  
  try {
    // Get the authenticated user from request headers
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      console.log('❌ [API] No authenticated user found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    console.log('✅ [API] Authenticated user:', userId);

    // Get user's encrypted private key from database
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('wallet_address, encrypted_private_key')
      .eq('clerk_user_id', userId)
      .single();

    if (fetchError) {
      console.error('❌ [API] Error fetching user wallet:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'No wallet found for this user'
      }, { status: 404 });
    }

    if (!user?.encrypted_private_key) {
      return NextResponse.json({
        success: false,
        error: 'No encrypted private key found'
      }, { status: 404 });
    }

    // Decrypt the private key using user ID as password
    console.log('🔓 [API] Decrypting private key for user:', userId);
    const privateKey = decryptPrivateKey(user.encrypted_private_key, userId);
    
    console.log('✅ [API] Private key decrypted successfully');

    return NextResponse.json({
      success: true,
      wallet: {
        publicKey: user.wallet_address,
        privateKey: privateKey
      },
      message: 'Private key retrieved successfully'
    });

  } catch (error) {
    console.error('❌ [API] Error exporting wallet:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to export wallet'
    }, { status: 500 });
  }
}
