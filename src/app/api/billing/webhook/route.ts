import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyWebhook } from '@/lib/billing/cashfree'
import { createServiceClient } from '@/lib/supabase/service'
import { getBillingConfig } from '@/lib/billing/config'

/**
 * POST /api/billing/webhook
 * Handles Cashfree payment webhooks for both top-ups and subscriptions.
 *
 * Cashfree retries on non-200 responses, so we always return 200
 * after verification — even if processing fails (we log the error).
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-webhook-signature') ?? ''
    const timestamp = request.headers.get('x-webhook-timestamp') ?? ''

    // Verify signature (skip if no webhook secret configured — dev mode)
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET
    if (webhookSecret) {
      const valid = verifyWebhook(signature, rawBody, timestamp)
      if (!valid) {
        console.error('Webhook signature verification failed')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(rawBody)
    const eventType = event.type as string
    const data = event.data as Record<string, unknown>

    console.log(`Cashfree webhook: ${eventType}`, JSON.stringify(data).slice(0, 500))

    // Route to handler based on event type
    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || eventType === 'PAYMENT_SUCCESS') {
      await handlePaymentSuccess(data)
    } else if (eventType === 'PAYMENT_FAILED_WEBHOOK' || eventType === 'PAYMENT_FAILED') {
      await handlePaymentFailed(data)
    } else if (eventType === 'SUBSCRIPTION_PAYMENT_SUCCESS') {
      await handleSubscriptionPaymentSuccess(data)
    } else if (eventType === 'SUBSCRIPTION_PAYMENT_FAILED') {
      await handleSubscriptionPaymentFailed(data)
    } else if (eventType === 'SUBSCRIPTION_STATUS_CHANGE') {
      await handleSubscriptionStatusChange(data)
    } else {
      console.log(`Unhandled webhook event: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Return 200 to prevent Cashfree retries on parse/processing errors
    return NextResponse.json({ received: true, error: 'Processing failed' })
  }
}

// ---------------------------------------------------------------------------
// Top-up payment handlers
// ---------------------------------------------------------------------------

async function handlePaymentSuccess(data: Record<string, unknown>) {
  const order = data.order as Record<string, unknown> | undefined
  const orderId = (order?.order_id ?? data.order_id) as string | undefined
  if (!orderId) {
    console.error('Payment success webhook missing order_id')
    return
  }

  // Only process top-up orders (our order IDs start with sw_topup_)
  if (!orderId.startsWith('sw_topup_')) return

  const supabase = createServiceClient()
  const config = getBillingConfig()

  // Find the purchase row by cashfree_order_id
  const { data: purchase, error } = await supabase
    .from('credit_purchases')
    .select('id, user_id, pack_id, status')
    .eq('cashfree_order_id', orderId)
    .single()

  if (error || !purchase) {
    console.error('Purchase not found for order:', orderId, error)
    return
  }

  // Idempotent: skip if already completed
  if (purchase.status === 'completed') return

  const pack = config.topup_packs[purchase.pack_id]
  if (!pack) {
    console.error('Unknown pack_id on purchase:', purchase.pack_id)
    return
  }

  const paymentId = (data.payment as Record<string, unknown>)?.cf_payment_id as string ?? null

  // Grant credits via RPC
  const { data: grantResult, error: grantError } = await supabase.rpc('grant_credits', {
    p_user_id: purchase.user_id,
    p_amount: pack.credits,
    p_type: 'topup_purchase',
    p_bucket: 'topup',
    p_reference_id: purchase.id,
  })

  if (grantError) {
    console.error('Failed to grant topup credits:', grantError)
    return
  }

  // Update purchase row
  await supabase
    .from('credit_purchases')
    .update({
      status: 'completed',
      credits_granted: pack.credits,
      cashfree_payment_id: paymentId,
    })
    .eq('id', purchase.id)

  console.log(`Top-up granted: ${pack.credits} credits to user ${purchase.user_id} (order: ${orderId})`)
}

async function handlePaymentFailed(data: Record<string, unknown>) {
  const order = data.order as Record<string, unknown> | undefined
  const orderId = (order?.order_id ?? data.order_id) as string | undefined
  if (!orderId?.startsWith('sw_topup_')) return

  const supabase = createServiceClient()

  await supabase
    .from('credit_purchases')
    .update({ status: 'failed' })
    .eq('cashfree_order_id', orderId)
    .eq('status', 'pending')

  console.log(`Top-up payment failed: ${orderId}`)
}

// ---------------------------------------------------------------------------
// Subscription payment handlers
// ---------------------------------------------------------------------------

async function handleSubscriptionPaymentSuccess(data: Record<string, unknown>) {
  const cfSubscriptionId = data.cf_subscription_id as string ?? data.subscription_id as string
  if (!cfSubscriptionId) {
    console.error('Subscription payment success missing subscription_id')
    return
  }

  const supabase = createServiceClient()
  const config = getBillingConfig()

  // Find subscription row
  const { data: sub, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_id, status')
    .eq('cashfree_subscription_id', cfSubscriptionId)
    .single()

  if (error || !sub) {
    console.error('Subscription not found:', cfSubscriptionId, error)
    return
  }

  const plan = config.subscriptions[sub.plan_id]
  if (!plan) {
    console.error('Unknown plan_id on subscription:', sub.plan_id)
    return
  }

  // Update subscription status + period
  const periodStart = new Date()
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq('id', sub.id)

  // Grant monthly credits
  const { error: grantError } = await supabase.rpc('grant_credits', {
    p_user_id: sub.user_id,
    p_amount: plan.monthly_credits,
    p_type: 'subscription_grant',
    p_bucket: 'subscription',
    p_reference_id: sub.id,
  })

  if (grantError) {
    console.error('Failed to grant subscription credits:', grantError)
    return
  }

  console.log(`Subscription credits granted: ${plan.monthly_credits} to user ${sub.user_id} (plan: ${sub.plan_id})`)
}

async function handleSubscriptionPaymentFailed(data: Record<string, unknown>) {
  const cfSubscriptionId = data.cf_subscription_id as string ?? data.subscription_id as string
  if (!cfSubscriptionId) return

  const supabase = createServiceClient()

  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('cashfree_subscription_id', cfSubscriptionId)
    .in('status', ['active', 'initialized'])

  console.log(`Subscription payment failed: ${cfSubscriptionId}`)
}

async function handleSubscriptionStatusChange(data: Record<string, unknown>) {
  const cfSubscriptionId = data.cf_subscription_id as string ?? data.subscription_id as string
  const newStatus = data.subscription_status as string
  if (!cfSubscriptionId || !newStatus) return

  const supabase = createServiceClient()

  // Map Cashfree status to our status
  const statusMap: Record<string, string> = {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    COMPLETED: 'cancelled',
    PAUSED: 'past_due',
  }

  const mappedStatus = statusMap[newStatus]
  if (!mappedStatus) return

  await supabase
    .from('subscriptions')
    .update({ status: mappedStatus })
    .eq('cashfree_subscription_id', cfSubscriptionId)

  console.log(`Subscription status change: ${cfSubscriptionId} → ${mappedStatus}`)
}
