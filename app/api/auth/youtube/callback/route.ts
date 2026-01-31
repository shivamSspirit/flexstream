import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/youtube/callback
 *
 * Handles YouTube/Google OAuth 2.0 callback
 * Exchanges code for tokens and fetches channel data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('[YOUTUBE CALLBACK] OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Missing+authorization+code`
      );
    }

    // Decode state to get wallet
    let stateData: { wallet: string; timestamp: number };
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

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=YouTube+OAuth+not+configured`
      );
    }

    // Exchange code for access token
    console.log('[YOUTUBE CALLBACK] Exchanging code for token...');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[YOUTUBE CALLBACK] Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Failed+to+verify+YouTube+account`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch YouTube channel data
    console.log('[YOUTUBE CALLBACK] Fetching channel data...');

    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!channelResponse.ok) {
      console.error('[YOUTUBE CALLBACK] Failed to fetch channel data');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Failed+to+fetch+YouTube+channel`
      );
    }

    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=No+YouTube+channel+found`
      );
    }

    const channel = channelData.items[0];
    const subscriberCount = parseInt(channel.statistics?.subscriberCount || '0', 10);

    console.log('[YOUTUBE CALLBACK] YouTube channel verified:', {
      id: channel.id,
      title: channel.snippet?.title,
      subscribers: subscriberCount,
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

    // Update user record with YouTube verification
    const { error: updateError } = await supabase
      .from('users')
      .update({
        youtube_verified: true,
        youtube_subscribers: subscriberCount,
        youtube_channel_id: channel.id,
        youtube_channel_name: channel.snippet?.title,
        youtube_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', stateData.wallet);

    if (updateError) {
      console.error('[YOUTUBE CALLBACK] Failed to update user:', updateError);
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
          platform: 'youtube',
          platform_user_id: channel.id,
          platform_username: channel.snippet?.customUrl || channel.id,
          platform_display_name: channel.snippet?.title,
          platform_avatar_url: channel.snippet?.thumbnails?.default?.url,
          followers_count: subscriberCount,
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

    console.log('[YOUTUBE CALLBACK] YouTube verification complete for:', stateData.wallet);

    // Redirect back to profile edit with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?youtube_verified=true&subscribers=${subscriberCount}`
    );

  } catch (error) {
    console.error('[YOUTUBE CALLBACK] Error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile/edit?error=Verification+failed`
    );
  }
}
