import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/waitlist/join
 *
 * Join the waitlist with viral referral mechanics
 * Nikita Bier Strategy: Make it easy to join, hard to ignore referrals
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Service not configured',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { email, referralCode } = body;

    // Validate email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({
        success: false,
        error: 'Valid email is required',
      }, { status: 400 });
    }

    console.log('🎯 [WAITLIST] New signup:', { email, referralCode });

    // Generate unique referral code
    const newReferralCode = generateReferralCode();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('waitlist_signups')
      .select('id, email, referral_code, position')
      .eq('email', email)
      .single();

    if (existing) {
      console.log('⚠️ [WAITLIST] Email already registered:', email);
      return NextResponse.json({
        success: true,
        data: {
          alreadyRegistered: true,
          referralCode: existing.referral_code,
          position: existing.position || 0,
          message: 'You\'re already on the list!',
        },
      });
    }

    // Validate referral code if provided
    let referredBy = null;
    if (referralCode) {
      const { data: referrer } = await supabase
        .from('waitlist_signups')
        .select('referral_code')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (referrer) {
        referredBy = referralCode.toUpperCase();
        console.log('✅ [WAITLIST] Valid referral code:', referredBy);
      }
    }

    // Insert new signup
    const { data: signup, error } = await supabase
      .from('waitlist_signups')
      .insert({
        email: email.toLowerCase(),
        referral_code: newReferralCode,
        referred_by: referredBy,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [WAITLIST] Insert error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to join waitlist',
      }, { status: 500 });
    }

    // Calculate position in queue
    const { count } = await supabase
      .from('waitlist_signups')
      .select('id', { count: 'exact', head: true });

    const position = count || 1;

    // Update position
    await supabase
      .from('waitlist_signups')
      .update({ position })
      .eq('id', signup.id);

    console.log('🎉 [WAITLIST] Signup successful:', {
      email,
      referralCode: newReferralCode,
      position,
    });

    return NextResponse.json({
      success: true,
      data: {
        referralCode: newReferralCode,
        position,
        referralUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/waitlist?ref=${newReferralCode}`,
        message: 'You\'re on the list! Share your link to move up.',
      },
    });

  } catch (error) {
    console.error('❌ [WAITLIST] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

/**
 * GET /api/waitlist/join
 *
 * Get waitlist stats
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Service not configured',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get total signups
    const { count } = await supabase
      .from('waitlist_signups')
      .select('id', { count: 'exact', head: true });

    const totalSignups = count || 0;
    const betaSlots = 100;
    const slotsRemaining = Math.max(0, betaSlots - totalSignups);

    return NextResponse.json({
      success: true,
      data: {
        totalSignups,
        betaSlots,
        slotsRemaining,
        slotsClaimed: totalSignups,
        percentageFilled: Math.min(100, Math.round((totalSignups / betaSlots) * 100)),
      },
    });

  } catch (error) {
    console.error('❌ [WAITLIST] Stats error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stats',
    }, { status: 500 });
  }
}

// Helper function to generate referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
