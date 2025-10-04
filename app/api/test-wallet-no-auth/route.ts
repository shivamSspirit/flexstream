import { NextRequest, NextResponse } from 'next/server';
import { generateSolanaWallet } from '@/lib/solana-wallet';

export async function POST(request: NextRequest) {
  console.log('🧪 [Test] No-auth wallet generation test');
  
  try {
    // Test 1: Generate wallet without authentication
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
      message: 'Wallet generation test successful (no auth)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Test] Error in no-auth wallet test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'error_handling',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'No-auth wallet test endpoint is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: 'Test wallet generation without authentication',
      GET: 'Check if endpoint is working'
    }
  });
}
