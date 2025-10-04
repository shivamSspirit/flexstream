import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateSolanaWallet } from '@/lib/solana-wallet';

export async function POST(request: NextRequest) {
  console.log('🧪 [Test] Simple wallet generation test');
  
  try {
    // Test 1: Check authentication
    const { userId } = await auth();
    console.log('🔐 [Test] Auth result:', { userId, hasUserId: !!userId });
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user',
        step: 'authentication'
      }, { status: 401 });
    }

    // Test 2: Generate wallet
    console.log('🔑 [Test] Generating wallet...');
    const wallet = generateSolanaWallet();
    console.log('✅ [Test] Wallet generated:', {
      publicKey: wallet.publicKey.slice(0, 8) + '...' + wallet.publicKey.slice(-8),
      hasPrivateKey: !!wallet.privateKey,
      privateKeyLength: wallet.privateKey.length
    });

    return NextResponse.json({
      success: true,
      step: 'wallet_generation',
      wallet: {
        publicKey: wallet.publicKey,
        // Don't return private key for security
      },
      message: 'Wallet generation test successful'
    });

  } catch (error) {
    console.error('❌ [Test] Error in simple wallet test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'error_handling'
    }, { status: 500 });
  }
}
