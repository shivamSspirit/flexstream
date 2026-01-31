import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { FlexTransaction } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get transaction history
    const { data: transactions, error } = await supabase
      .from('flex_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[FLEX] History error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch history' },
        { status: 500 }
      )
    }

    // Get total count
    const { count } = await supabase
      .from('flex_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Group by date for summary
    const today = new Date().toISOString().split('T')[0]
    const { data: todayStats } = await supabase
      .from('flex_transactions')
      .select('action, final_amount')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`)

    const todaySummary = todayStats?.reduce(
      (acc, tx) => {
        acc.total += tx.final_amount || 0
        acc.byAction[tx.action] = (acc.byAction[tx.action] || 0) + (tx.final_amount || 0)
        return acc
      },
      { total: 0, byAction: {} as Record<string, number> }
    ) || { total: 0, byAction: {} }

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions as FlexTransaction[],
        total: count || 0,
        limit,
        offset,
        today_summary: todaySummary,
      },
    })
  } catch (error) {
    console.error('[FLEX] History error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
