import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Get current airdrop stats and upcoming distribution
export async function GET() {
  try {
    // Get total period points across all users
    const { data: stats } = await supabase
      .from('flex_points')
      .select('period_flex')

    const totalPeriodPoints = stats?.reduce(
      (sum, u) => sum + (u.period_flex || 0),
      0
    ) || 0

    const participantsCount = stats?.filter(u => (u.period_flex || 0) > 0).length || 0

    // Get last airdrop
    const { data: lastAirdrop } = await supabase
      .from('flex_airdrops')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get top earners this period
    const { data: topEarners } = await supabase
      .from('flex_points')
      .select(`
        user_id,
        period_flex,
        users!inner (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .gt('period_flex', 0)
      .order('period_flex', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      data: {
        total_period_points: totalPeriodPoints,
        participants_count: participantsCount,
        last_airdrop: lastAirdrop,
        top_earners: topEarners,
      },
    })
  } catch (error) {
    console.error('[AIRDROP] Stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch airdrop stats' },
      { status: 500 }
    )
  }
}

// POST: Execute airdrop (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokens_to_mint, admin_key } = body

    // Simple admin auth (replace with proper auth in production)
    if (admin_key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!tokens_to_mint || tokens_to_mint <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid token amount' },
        { status: 400 }
      )
    }

    // Get all users with period_flex > 0
    const { data: users } = await supabase
      .from('flex_points')
      .select('user_id, period_flex')
      .gt('period_flex', 0)

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users with points to airdrop' },
        { status: 400 }
      )
    }

    // Calculate total points
    const totalPoints = users.reduce((sum, u) => sum + (u.period_flex || 0), 0)
    const conversionRate = tokens_to_mint / totalPoints

    // Create airdrop record
    const now = new Date()
    const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days

    const { data: airdrop, error: airdropError } = await supabase
      .from('flex_airdrops')
      .insert({
        period_start: periodStart.toISOString(),
        period_end: now.toISOString(),
        total_points_distributed: totalPoints,
        total_tokens_minted: tokens_to_mint,
        conversion_rate: conversionRate,
        participants_count: users.length,
        status: 'processing',
      })
      .select()
      .single()

    if (airdropError || !airdrop) {
      console.error('[AIRDROP] Create error:', airdropError)
      return NextResponse.json(
        { success: false, error: 'Failed to create airdrop' },
        { status: 500 }
      )
    }

    // Create claims for each user
    const claims = users.map(user => ({
      airdrop_id: airdrop.id,
      user_id: user.user_id,
      points_snapshot: user.period_flex,
      tokens_received: Math.floor(user.period_flex * conversionRate),
    }))

    const { error: claimsError } = await supabase
      .from('flex_airdrop_claims')
      .insert(claims)

    if (claimsError) {
      console.error('[AIRDROP] Claims error:', claimsError)
      // Update airdrop status to failed
      await supabase
        .from('flex_airdrops')
        .update({ status: 'failed' })
        .eq('id', airdrop.id)

      return NextResponse.json(
        { success: false, error: 'Failed to create claims' },
        { status: 500 }
      )
    }

    // Reset period_flex for all users
    const { error: resetError } = await supabase
      .from('flex_points')
      .update({
        period_flex: 0,
        last_airdrop_at: now.toISOString(),
      })
      .gt('period_flex', 0)

    if (resetError) {
      console.error('[AIRDROP] Reset error:', resetError)
    }

    // Mark airdrop as completed
    await supabase
      .from('flex_airdrops')
      .update({
        status: 'completed',
        completed_at: now.toISOString(),
      })
      .eq('id', airdrop.id)

    return NextResponse.json({
      success: true,
      data: {
        airdrop_id: airdrop.id,
        total_points: totalPoints,
        tokens_minted: tokens_to_mint,
        conversion_rate: conversionRate,
        participants: users.length,
        claims: claims.map(c => ({
          user_id: c.user_id,
          points: c.points_snapshot,
          tokens: c.tokens_received,
        })),
      },
    })
  } catch (error) {
    console.error('[AIRDROP] Execute error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
