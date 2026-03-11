import { Cashfree, CFEnvironment } from 'cashfree-pg'
import { env } from '@/lib/env'
import { getBillingConfig, getDiscountedTopupPrice } from '@/lib/billing/config'

/**
 * Cashfree SDK wrapper for StoryWeaver billing.
 * Handles payment orders (top-ups) and subscriptions.
 * Server-side only — never import from client components.
 */

let _client: Cashfree | null = null

function getCashfreeClient(): Cashfree {
  if (_client) return _client

  const cfEnv = env.cashfree.environment === 'production'
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX

  _client = new Cashfree(cfEnv, env.cashfree.appId, env.cashfree.secretKey)
  return _client
}

// ---------------------------------------------------------------------------
// Top-up Orders (one-time payments via Payment Gateway)
// ---------------------------------------------------------------------------

/**
 * Create a Cashfree payment order for a top-up pack purchase.
 * Returns payment_session_id for frontend checkout (Cashfree Drop-in JS).
 */
export async function createTopupOrder(params: {
  userId: string
  email: string
  packId: string
  activePlanId: string | null
  purchaseId: string
  origin: string
}): Promise<{
  orderId: string
  paymentSessionId: string
  orderAmount: number
}> {
  const cf = getCashfreeClient()
  const config = getBillingConfig()
  const pack = config.topup_packs[params.packId]
  if (!pack) throw new Error(`Unknown pack: ${params.packId}`)

  const amountPaise = getDiscountedTopupPrice(params.packId, params.activePlanId)
  const amountInr = amountPaise / 100

  const orderId = `sw_topup_${params.userId.slice(0, 8)}_${Date.now()}`

  const response = await cf.PGCreateOrder({
    order_id: orderId,
    order_amount: amountInr,
    order_currency: 'INR',
    customer_details: {
      customer_id: params.userId.slice(0, 50), // Cashfree max 50 chars
      customer_email: params.email,
      customer_phone: '9999999999', // placeholder — Cashfree requires phone
    },
    order_meta: {
      return_url: `${params.origin}/app/billing?order_id={order_id}&status={order_status}`,
    },
    order_note: `StoryWeaver ${pack.name} — ${pack.credits} credits`,
    order_tags: {
      purchase_id: params.purchaseId,
      pack_id: params.packId,
      user_id: params.userId,
    },
  })

  const data = response.data
  if (!data?.payment_session_id) {
    throw new Error('Cashfree order creation failed — no payment_session_id returned')
  }

  return {
    orderId: data.order_id ?? orderId,
    paymentSessionId: data.payment_session_id,
    orderAmount: amountInr,
  }
}

/**
 * Fetch order status from Cashfree.
 */
export async function fetchOrder(orderId: string) {
  const cf = getCashfreeClient()
  const response = await cf.PGFetchOrder(orderId)
  return response.data
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

/**
 * Create a Cashfree subscription for a user.
 * Requires the plan to exist in Cashfree (created via sync script).
 */
export async function createSubscription(params: {
  userId: string
  email: string
  planId: string
}): Promise<{
  subscriptionId: string
  cfSubscriptionId: string
  sessionId: string | null
}> {
  const cf = getCashfreeClient()
  const config = getBillingConfig()
  const plan = config.subscriptions[params.planId]
  if (!plan) throw new Error(`Unknown plan: ${params.planId}`)
  if (!plan.cashfree_plan_id) throw new Error(`Plan ${params.planId} has no Cashfree plan_id configured`)

  const subscriptionId = `sw_sub_${params.userId.slice(0, 8)}_${params.planId}_${Date.now()}`

  // Expiry: 5 years from now (effectively unlimited for monthly)
  const expiry = new Date()
  expiry.setFullYear(expiry.getFullYear() + 5)

  const response = await cf.SubsCreateSubscription({
    subscription_id: subscriptionId,
    customer_details: {
      customer_name: params.email.split('@')[0],
      customer_email: params.email,
      customer_phone: '9999999999', // placeholder
    },
    plan_details: {
      plan_id: plan.cashfree_plan_id,
    },
    subscription_expiry_time: expiry.toISOString(),
    subscription_meta: {
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/billing?subscription=success`,
    },
  })

  const data = response.data
  if (!data) {
    throw new Error('Cashfree subscription creation failed')
  }

  return {
    subscriptionId: data.subscription_id ?? subscriptionId,
    cfSubscriptionId: data.cf_subscription_id ?? '',
    sessionId: data.subscription_session_id ?? null,
  }
}

/**
 * Cancel a Cashfree subscription.
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const cf = getCashfreeClient()
  await cf.SubsManageSubscription(subscriptionId, {
    subscription_id: subscriptionId,
    action: 'CANCEL',
  })
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

/**
 * Verify Cashfree webhook signature.
 * Must be called with raw (unparsed) request body.
 */
export function verifyWebhook(signature: string, rawBody: string, timestamp: string): boolean {
  const cf = getCashfreeClient()
  try {
    cf.PGVerifyWebhookSignature(signature, rawBody, timestamp)
    return true
  } catch {
    return false
  }
}
