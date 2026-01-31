import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/users/update-profile
 *
 * Updates user profile information
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[UPDATE PROFILE] Supabase not configured');
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const {
      walletAddress,
      displayName,
      username,
      bio,
      website,
      twitter,
      instagram,
      avatarUrl,
      coverUrl
    } = body;

    console.log('[UPDATE PROFILE] Request received:', {
      walletAddress: walletAddress?.substring(0, 8) + '...',
      displayName,
      username,
      hasBio: !!bio,
      hasWebsite: !!website,
      hasTwitter: !!twitter,
      hasInstagram: !!instagram,
      hasAvatar: !!avatarUrl,
      hasCover: !!coverUrl
    });

    // Validate required fields
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address is required',
      }, { status: 400 });
    }

    if (!displayName || !displayName.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Display name is required',
      }, { status: 400 });
    }

    if (!username || !username.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Username is required',
      }, { status: 400 });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        success: false,
        error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
      }, { status: 400 });
    }

    // Check if username is taken by another user
    console.log('[UPDATE PROFILE] Checking username availability:', username);
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('username', username)
      .neq('wallet_address', walletAddress)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[UPDATE PROFILE] Error checking username:', checkError);
      // Continue anyway, this is just a check
    }

    if (existingUser) {
      console.log('[UPDATE PROFILE] Username taken by:', existingUser.wallet_address);
      return NextResponse.json({
        success: false,
        error: 'Username is already taken',
      }, { status: 409 });
    }

    console.log('[UPDATE PROFILE] Username available');

    // Build update object - only include fields that exist in DB
    const updateData: Record<string, any> = {
      display_name: displayName,
      username: username,
      avatar_url: avatarUrl || '',
      profile_completed: true, // Mark profile as completed when user saves
      updated_at: new Date().toISOString(),
    };

    // Only add optional fields if they have values
    if (bio) updateData.bio = bio;
    if (website) updateData.website = website;
    if (twitter) updateData.twitter = twitter;
    if (instagram) updateData.instagram = instagram;
    if (coverUrl) updateData.cover_url = coverUrl;

    console.log('[UPDATE PROFILE] Updating profile:', {
      walletAddress: walletAddress.substring(0, 8) + '...',
      fields: Object.keys(updateData),
      values: updateData
    });

    // Update user profile
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('wallet_address', walletAddress)
      .select();

    if (updateError) {
      console.error('[UPDATE PROFILE] Update error:', updateError);
      console.error('[UPDATE PROFILE] Error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });

      // If error is about unknown columns, provide helpful error message
      if (updateError.message?.includes('column') || updateError.code === '42703') {
        console.error('[UPDATE PROFILE] Database schema error - missing columns!');
        console.error('[UPDATE PROFILE] Please run the fix-social-links-schema.sql migration');

        return NextResponse.json({
          success: false,
          error: 'Database schema needs to be updated. Please run the social links migration script.',
          details: 'Missing columns in users table. Contact your administrator to run fix-social-links-schema.sql',
        }, { status: 500 });
      }

      return NextResponse.json({
        success: false,
        error: updateError.message || 'Failed to update profile',
      }, { status: 500 });
    }

    if (!updateResult || updateResult.length === 0) {
      console.log('[UPDATE PROFILE] No existing user found, creating new user...');

      // Create new user if they don't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress,
          display_name: displayName,
          username: username,
          bio: bio || '',
          avatar_url: avatarUrl || '',
          profile_completed: true, // Mark as completed since user is setting up profile
          ...(website && { website }),
          ...(twitter && { twitter }),
          ...(instagram && { instagram }),
          ...(coverUrl && { cover_url: coverUrl }),
        })
        .select();

      if (createError) {
        console.error('[UPDATE PROFILE] Error creating user:', createError);
        return NextResponse.json({
          success: false,
          error: createError.message || 'Failed to create user profile',
        }, { status: 500 });
      }

      console.log('[UPDATE PROFILE] User created successfully:', newUser[0].id);
      return NextResponse.json({
        success: true,
        data: newUser[0],
      });
    }

    console.log('[UPDATE PROFILE] Profile updated successfully:', {
      userId: updateResult[0].id,
      username: updateResult[0].username
    });

    return NextResponse.json({
      success: true,
      data: updateResult[0],
    });

  } catch (error) {
    console.error('[UPDATE PROFILE] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
