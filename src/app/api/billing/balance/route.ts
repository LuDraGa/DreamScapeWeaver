import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBalance } from '@/lib/billing/credits'

/**
 * GET /api/billing/balance
 * Returns current credit balance for authenticated user.
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

    const balance = await getBalance(user.id)

    // Also fetch active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, status, current_period_start, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    return NextResponse.json({
      balance: balance ?? { subscriptionCredits: 0, topupCredits: 0 },
      subscription: subscription ?? null,
    })
  } catch (error) {
    console.error('API error fetching balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}
