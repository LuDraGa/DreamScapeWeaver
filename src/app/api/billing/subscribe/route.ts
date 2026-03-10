import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createSubscription } from '@/lib/billing/cashfree'
import { getBillingConfig } from '@/lib/billing/config'

/**
 * POST /api/billing/subscribe
 * Create a new subscription via Cashfree.
 * Returns payment URL for the user to authorize recurring payments.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'auth_required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planId } = body as { planId: string }

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      )
    }

    const config = getBillingConfig()
    const plan = config.subscriptions[planId]
    if (!plan) {
      return NextResponse.json(
        { error: `Unknown plan: ${planId}` },
        { status: 400 }
      )
    }

    if (!plan.cashfree_plan_id) {
      return NextResponse.json(
        { error: 'Plan not yet available for subscription' },
        { status: 400 }
      )
    }

    // Check for existing active subscription
    const serviceClient = createServiceClient()
    const { data: existingSub } = await serviceClient
      .from('subscriptions')
      .select('id, plan_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSub) {
      return NextResponse.json(
        { error: 'You already have an active subscription. Cancel it first to switch plans.', code: 'already_subscribed' },
        { status: 409 }
      )
    }

    // Create Cashfree subscription
    const cfSub = await createSubscription({
      userId: user.id,
      email: user.email ?? '',
      planId,
    })

    // Create subscriptions row (initialized — activated on payment success via webhook)
    const periodStart = new Date()
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const { error: insertError } = await serviceClient
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'initialized',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cashfree_subscription_id: cfSub.cfSubscriptionId || cfSub.subscriptionId,
        cashfree_plan_id: plan.cashfree_plan_id,
      })

    if (insertError) {
      console.error('Failed to create subscription row:', insertError)
      return NextResponse.json(
        { error: 'Failed to create subscription record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      subscriptionId: cfSub.subscriptionId,
      sessionId: cfSub.sessionId,
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
