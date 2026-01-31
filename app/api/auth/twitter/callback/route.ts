import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/twitter/callback
 * also make them proper comments
 *
 * Handles Twitter OAuth 2.0 callback
 * Exchanges code for tokens and fetches user data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('[TWITTER CALLBACK] OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Missing+authorization+code`
      );
    }

    // Decode state to get wallet and verifier
    let stateData: { wallet: string; verifier: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Invalid+state+parameter`
      );
    }

    // Verify state isn't too old (5 minutes max)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Authorization+expired`
      );
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Twitter+OAuth+not+configured`
      );
    }

    // Exchange code for access token
    console.log('[TWITTER CALLBACK] Exchanging code for token...');

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: stateData.verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[TWITTER CALLBACK] Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Failed+to+verify+Twitter+account`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch Twitter user data
    console.log('[TWITTER CALLBACK] Fetching user data...');

    const userResponse = await fetch(
      'https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url,description',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!userResponse.ok) {
      console.error('[TWITTER CALLBACK] Failed to fetch user data');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Failed+to+fetch+Twitter+profile`
      );
    }

    const userData = await userResponse.json();
    const twitterUser = userData.data;

    console.log('[TWITTER CALLBACK] Twitter user verified:', {
      id: twitterUser.id,
      username: twitterUser.username,
      followers: twitterUser.public_metrics?.followers_count,
    });

    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Database+not+configured`
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update user record with Twitter verification
    const { error: updateError } = await supabase
      .from('users')
      .update({
        twitter: twitterUser.username,
        twitter_verified: true,
        twitter_followers: twitterUser.public_metrics?.followers_count || 0,
        twitter_user_id: twitterUser.id,
        twitter_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', stateData.wallet);

    if (updateError) {
      console.error('[TWITTER CALLBACK] Failed to update user:', updateError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Failed+to+save+verification`
      );
    }

    // Store verification record
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', stateData.wallet)
      .single();

    if (user) {
      await supabase
        .from('social_verifications')
        .upsert({
          user_id: user.id,
          platform: 'twitter',
          platform_user_id: twitterUser.id,
          platform_username: twitterUser.username,
          platform_display_name: twitterUser.name,
          platform_avatar_url: twitterUser.profile_image_url,
          followers_count: twitterUser.public_metrics?.followers_count || 0,
          access_token: accessToken,
          refresh_token: tokenData.refresh_token,
          token_expires_at: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
          verified_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
          is_active: true,
        }, {
          onConflict: 'user_id,platform',
        });
    }

    console.log('[TWITTER CALLBACK] Twitter verification complete for:', stateData.wallet);

    // Redirect back to profile edit with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?twitter_verified=true&followers=${twitterUser.public_metrics?.followers_count || 0}`
    );

  } catch (error) {
    console.error('[TWITTER CALLBACK] Error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Verification+failed`
    );
  }
}
