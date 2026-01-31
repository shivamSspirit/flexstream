import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { FLEX_REWARDS, type FlexAction } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface EarnRequest {
  userId: string
  action: FlexAction
  metadata?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const body: EarnRequest = await request.json()
    const { userId, action, metadata = {} } = body

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    // Validate action
    if (!FLEX_REWARDS[action]) {
      return NextResponse.json(
        { success: false, error: 'Invalid action type' },
        { status: 400 }
      )
    }

    const reward = FLEX_REWARDS[action]
    const today = new Date().toISOString().split('T')[0]

    // Check daily limit for this action
    const { data: todayActions } = await supabase
      .from('flex_transactions')
      .select('final_amount')
      .eq('user_id', userId)
      .eq('action', action)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`)

    const todayTotal = todayActions?.reduce(
      (sum, tx) => sum + (tx.final_amount || 0),
      0
    ) || 0

    if (reward.max_daily > 0 && todayTotal >= reward.max_daily) {
      return NextResponse.json({
        success: false,
        error: 'Daily limit reached for this action',
        data: { earned: 0, daily_limit: reward.max_daily, today_total: todayTotal },
      })
    }

    // Get or create flex points record
    let { data: flexPoints } = await supabase
      .from('flex_points')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!flexPoints) {
      const { data: newRecord } = await supabase
        .from('flex_points')
        .insert({
          user_id: userId,
          total_flex: 0,
          available_flex: 0,
          period_flex: 0,
          current_streak: 0,
          longest_streak: 0,
          last_active_date: today,
        })
        .select()
        .single()

      flexPoints = newRecord
    }

    // Check and update streak
    let currentStreak = flexPoints?.current_streak || 0
    let longestStreak = flexPoints?.longest_streak || 0
    const lastActiveDate = flexPoints?.last_active_date

    if (lastActiveDate) {
      const lastDate = new Date(lastActiveDate)
      const todayDate = new Date(today)
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (diffDays === 1) {
        // Consecutive day
        currentStreak += 1
      } else if (diffDays > 1) {
        // Streak broken
        currentStreak = 1
      }
      // Same day = no streak change
    } else {
      currentStreak = 1
    }

    longestStreak = Math.max(longestStreak, currentStreak)

    // Calculate multipliers
    const now = new Date().toISOString()
    const { data: multipliers } = await supabase
      .from('flex_multipliers')
      .select('multiplier')
      .eq('active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)

    const eventMultiplier = multipliers?.reduce(
      (max, m) => Math.max(max, Number(m.multiplier)),
      1
    ) || 1

    // Streak multiplier: 10% per day, max 70%
    const streakMultiplier = 1 + Math.min(currentStreak * 0.1, 0.7)

    const totalMultiplier = eventMultiplier * streakMultiplier
    const baseAmount = reward.base
    const finalAmount = Math.floor(baseAmount * totalMultiplier)

    // Check if final amount would exceed daily limit
    const remainingDaily = reward.max_daily - todayTotal
    const earnedAmount = Math.min(finalAmount, remainingDaily > 0 ? remainingDaily : 0)

    if (earnedAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Daily limit reached',
        data: { earned: 0, daily_limit: reward.max_daily, today_total: todayTotal },
      })
    }

    // Record transaction
    const { error: txError } = await supabase.from('flex_transactions').insert({
      user_id: userId,
      action,
      amount: baseAmount,
      multiplier: totalMultiplier,
      final_amount: earnedAmount,
      metadata,
    })

    if (txError) {
      console.error('[FLEX] Transaction error:', txError)
      return NextResponse.json(
        { success: false, error: 'Failed to record transaction' },
        { status: 500 }
      )
    }

    // Update flex points (including period_flex for airdrop tracking)
    const { error: updateError } = await supabase
      .from('flex_points')
      .update({
        total_flex: (flexPoints?.total_flex || 0) + earnedAmount,
        available_flex: (flexPoints?.available_flex || 0) + earnedAmount,
        period_flex: (flexPoints?.period_flex || 0) + earnedAmount,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: today,
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('[FLEX] Update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update balance' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        earned: earnedAmount,
        base_amount: baseAmount,
        multiplier: totalMultiplier,
        streak_multiplier: streakMultiplier,
        event_multiplier: eventMultiplier,
        current_streak: currentStreak,
        new_total: (flexPoints?.total_flex || 0) + earnedAmount,
        period_total: (flexPoints?.period_flex || 0) + earnedAmount,
        action,
      },
    })
  } catch (error) {
    console.error('[FLEX] Earn error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
