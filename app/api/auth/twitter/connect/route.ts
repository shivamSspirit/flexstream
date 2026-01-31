import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/twitter/connect
 *
 * Initiates Twitter OAuth 2.0 flow for account verification
 * Uses PKCE (Proof Key for Code Exchange) for security
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address is required',
      }, { status: 400 });
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`;

    if (!clientId) {
      console.error('[TWITTER CONNECT] Missing TWITTER_CLIENT_ID');
      return NextResponse.json({
        success: false,
        error: 'Twitter OAuth not configured. Please add TWITTER_CLIENT_ID to environment variables.',
      }, { status: 500 });
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Generate state token with wallet address for security
    const state = Buffer.from(JSON.stringify({
      wallet: walletAddress,
      nonce: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
    })).toString('base64url');

    // Store verifier in a short-lived way (we'll pass it via state for simplicity)
    // In production, use Redis or database
    const stateWithVerifier = Buffer.from(JSON.stringify({
      wallet: walletAddress,
      verifier: codeVerifier,
      nonce: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
    })).toString('base64url');

    // Twitter OAuth 2.0 authorization URL
    const scopes = ['tweet.read', 'users.read', 'follows.read'].join('%20');
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', stateWithVerifier);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    console.log('[TWITTER CONNECT] Redirecting to Twitter OAuth:', {
      wallet: walletAddress.substring(0, 8) + '...',
      redirectUri,
    });

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
    });

  } catch (error) {
    console.error('[TWITTER CONNECT] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate Twitter connection',
    }, { status: 500 });
  }
}
