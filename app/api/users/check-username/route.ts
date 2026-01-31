import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/users/check-username
 *
 * Check if a username is available
 * Returns { available: boolean, suggestion?: string }
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const currentWallet = searchParams.get('wallet'); // To exclude current user

    if (!username) {
      return NextResponse.json({
        success: false,
        error: 'Username is required'
      }, { status: 400 });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        success: true,
        available: false,
        reason: 'invalid_format',
        message: 'Username must be 3-20 characters with only letters, numbers, and underscores'
      });
    }

    // Check reserved usernames
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'support', 'help',
      'flexstream', 'flexit', 'official', 'verified', 'mod', 'moderator',
      'api', 'www', 'mail', 'email', 'ftp', 'blog', 'shop', 'store',
      'null', 'undefined', 'anonymous', 'user', 'guest'
    ];

    if (reservedUsernames.includes(username.toLowerCase())) {
      return NextResponse.json({
        success: true,
        available: false,
        reason: 'reserved',
        message: 'This username is reserved'
      });
    }

    // Build query to check if username exists
    let query = supabase
      .from('users')
      .select('id, wallet_address')
      .ilike('username', username);

    // Exclude current user if wallet is provided
    if (currentWallet) {
      query = query.neq('wallet_address', currentWallet);
    }

    const { data: existingUser, error } = await query.maybeSingle();

    if (error) {
      console.error('[CHECK USERNAME] Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to check username'
      }, { status: 500 });
    }

    if (existingUser) {
      // Username is taken, suggest alternatives
      const suggestions = await generateSuggestions(supabase, username);

      return NextResponse.json({
        success: true,
        available: false,
        reason: 'taken',
        message: 'This username is already taken',
        suggestions
      });
    }

    return NextResponse.json({
      success: true,
      available: true,
      message: 'Username is available'
    });

  } catch (error) {
    console.error('[CHECK USERNAME] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Generate username suggestions when the requested one is taken
 */
async function generateSuggestions(
  supabase: ReturnType<typeof createClient<any>>,
  baseUsername: string
): Promise<string[]> {
  const suggestions: string[] = [];
  const maxSuggestions = 3;

  // Try adding numbers
  for (let i = 1; i <= 99 && suggestions.length < maxSuggestions; i++) {
    const candidate = `${baseUsername}${i}`;
    if (candidate.length <= 20) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .ilike('username', candidate)
        .maybeSingle();

      if (!data) {
        suggestions.push(candidate);
      }
    }
  }

  // Try adding underscores with numbers
  if (suggestions.length < maxSuggestions) {
    for (let i = 1; i <= 99 && suggestions.length < maxSuggestions; i++) {
      const candidate = `${baseUsername}_${i}`;
      if (candidate.length <= 20) {
        const { data } = await supabase
          .from('users')
          .select('id')
          .ilike('username', candidate)
          .maybeSingle();

        if (!data) {
          suggestions.push(candidate);
        }
      }
    }
  }

  return suggestions;
}
