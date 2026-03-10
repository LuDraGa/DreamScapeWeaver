import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/billing/history
 * Returns recent credit ledger entries for authenticated user.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'auth_required' },
        { status: 401 }
      )
    }

    const { data: entries, error } = await supabase
      .from('credit_ledger')
      .select('id, amount, type, credit_bucket, reference_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching ledger:', error)
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: 500 }
      )
    }

    // Also fetch usage stats for current period
    const { data: usageStats } = await supabase
      .from('generation_events')
      .select('action_type, credits_charged')
      .eq('user_id', user.id)

    const totalUsed = usageStats?.reduce((sum, e) => sum + e.credits_charged, 0) ?? 0
    const actionCounts = usageStats?.reduce((acc, e) => {
      acc[e.action_type] = (acc[e.action_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) ?? {}

    return NextResponse.json({
      entries: entries ?? [],
      usage: { totalCreditsUsed: totalUsed, actionCounts },
    })
  } catch (error) {
    console.error('API error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
