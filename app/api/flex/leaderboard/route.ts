import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

    // Get top flex earners
    const { data: rankings, error } = await supabase
      .from('flex_points')
      .select('user_id, total_flex, current_streak, period_flex')
      .order('total_flex', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[FLEX] Leaderboard error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leaderboard' },
        { status: 500 }
      )
    }

    // Get user details for each ranking
    const userIds = rankings?.map(r => r.user_id) || []
    const { data: users } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, verified, success_tier')
      .in('id', userIds)

    const userMap = new Map(users?.map(u => [u.id, u]) || [])

    const leaderboard = rankings?.map((entry, index) => ({
      user: userMap.get(entry.user_id) || {
        id: entry.user_id,
        username: 'unknown',
        display_name: 'Unknown User',
      },
      total_flex: entry.total_flex,
      period_flex: entry.period_flex,
      current_streak: entry.current_streak,
      rank: offset + index + 1,
    })) || []

    // Get total count for pagination
    const { count } = await supabase
      .from('flex_points')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('[FLEX] Leaderboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
