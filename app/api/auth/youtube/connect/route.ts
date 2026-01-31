import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/youtube/connect
 *
 * Initiates YouTube/Google OAuth 2.0 flow for channel verification
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

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`;

    if (!clientId) {
      console.error('[YOUTUBE CONNECT] Missing GOOGLE_CLIENT_ID');
      return NextResponse.json({
        success: false,
        error: 'YouTube OAuth not configured. Please add GOOGLE_CLIENT_ID to environment variables.',
      }, { status: 500 });
    }

    // Generate state token with wallet address
    const state = Buffer.from(JSON.stringify({
      wallet: walletAddress,
      nonce: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
    })).toString('base64url');

    // Google OAuth 2.0 authorization URL
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    console.log('[YOUTUBE CONNECT] Redirecting to Google OAuth:', {
      wallet: walletAddress.substring(0, 8) + '...',
      redirectUri,
    });

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
    });

  } catch (error) {
    console.error('[YOUTUBE CONNECT] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate YouTube connection',
    }, { status: 500 });
  }
}
