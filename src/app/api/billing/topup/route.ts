import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createTopupOrder } from '@/lib/billing/cashfree'
import { getBillingConfig, getDiscountedTopupPrice } from '@/lib/billing/config'

/**
 * POST /api/billing/topup
 * Initiate a top-up credit purchase via Cashfree.
 * Returns payment_session_id for frontend checkout.
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
    const { packId } = body as { packId: string }

    if (!packId) {
      return NextResponse.json(
        { error: 'packId is required' },
        { status: 400 }
      )
    }

    const config = getBillingConfig()
    const pack = config.topup_packs[packId]
    if (!pack) {
      return NextResponse.json(
        { error: `Unknown pack: ${packId}` },
        { status: 400 }
      )
    }

    // Check if user has an active subscription (for discount)
    const serviceClient = createServiceClient()
    const { data: activeSub } = await serviceClient
      .from('subscriptions')
      .select('plan_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const activePlanId = activeSub?.plan_id ?? null
    const amountPaise = getDiscountedTopupPrice(packId, activePlanId)
    const discountPct = activePlanId
      ? (config.subscriptions[activePlanId]?.topup_discount_pct ?? 0)
      : 0

    // Create credit_purchases row (pending)
    const { data: purchase, error: purchaseError } = await serviceClient
      .from('credit_purchases')
      .insert({
        user_id: user.id,
        pack_id: packId,
        credits_granted: 0, // granted on payment success
        amount_paid_paise: amountPaise,
        discount_pct: discountPct,
        status: 'pending',
      })
      .select('id')
      .single()

    if (purchaseError || !purchase) {
      console.error('Failed to create purchase row:', purchaseError)
      return NextResponse.json(
        { error: 'Failed to initiate purchase' },
        { status: 500 }
      )
    }

    // Create Cashfree order
    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || 'https://dream-scape-weaver.vercel.app'
    const order = await createTopupOrder({
      userId: user.id,
      email: user.email ?? '',
      packId,
      activePlanId,
      purchaseId: purchase.id,
      origin,
    })

    // Update purchase with order ID
    await serviceClient
      .from('credit_purchases')
      .update({ cashfree_order_id: order.orderId })
      .eq('id', purchase.id)

    return NextResponse.json({
      purchaseId: purchase.id,
      orderId: order.orderId,
      paymentSessionId: order.paymentSessionId,
      orderAmount: order.orderAmount,
      credits: pack.credits,
    })
  } catch (error: unknown) {
    const axiosErr = error as { response?: { data?: unknown, status?: number } }
    if (axiosErr.response) {
      console.error('Topup order error:', axiosErr.response.status, JSON.stringify(axiosErr.response.data))
    } else {
      console.error('Topup order error:', error)
    }
    return NextResponse.json(
      { error: 'Failed to create top-up order' },
      { status: 500 }
    )
  }
}
