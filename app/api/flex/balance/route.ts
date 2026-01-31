import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { FlexBalance } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get or create flex points record
    let { data: flexPoints, error } = await supabase
      .from('flex_points')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // No record exists, create one
      const { data: newRecord, error: insertError } = await supabase
        .from('flex_points')
        .insert({
          user_id: userId,
          total_flex: 0,
          available_flex: 0,
          current_streak: 0,
          longest_streak: 0,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[FLEX] Error creating record:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to create flex record' },
          { status: 500 }
        )
      }

      flexPoints = newRecord
    } else if (error) {
      console.error('[FLEX] Error fetching balance:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch flex balance' },
        { status: 500 }
      )
    }

    // Get today's earned amount
    const today = new Date().toISOString().split('T')[0]
    const { data: todayTransactions } = await supabase
      .from('flex_transactions')
      .select('final_amount')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`)

    const todayEarned = todayTransactions?.reduce(
      (sum, tx) => sum + (tx.final_amount || 0),
      0
    ) || 0

    // Get user's rank
    const { data: rankings } = await supabase
      .from('flex_points')
      .select('user_id')
      .order('total_flex', { ascending: false })

    const rank = rankings?.findIndex((r) => r.user_id === userId) ?? -1

    // Check for active multipliers
    const now = new Date().toISOString()
    const { data: multipliers } = await supabase
      .from('flex_multipliers')
      .select('multiplier')
      .eq('active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)

    const activeMultiplier = multipliers?.reduce(
      (max, m) => Math.max(max, Number(m.multiplier)),
      1
    ) || 1

    // Calculate streak multiplier (10% per day, max 70%)
    const streakMultiplier = 1 + Math.min((flexPoints?.current_streak || 0) * 0.1, 0.7)

    const balance: FlexBalance & { period_flex: number } = {
      total_flex: flexPoints?.total_flex || 0,
      available_flex: flexPoints?.available_flex || 0,
      period_flex: flexPoints?.period_flex || 0,
      current_streak: flexPoints?.current_streak || 0,
      longest_streak: flexPoints?.longest_streak || 0,
      today_earned: todayEarned,
      rank: rank + 1,
      active_multiplier: activeMultiplier * streakMultiplier,
    }

    return NextResponse.json({ success: true, data: balance })
  } catch (error) {
    console.error('[FLEX] Balance error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
