import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * GET /api/cron/billing-sweep
 * Called by Vercel Cron daily. Sweeps expired subscription credits.
 * Protected by CRON_SECRET header check.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase.rpc('sweep_expired_credits')

    if (error) {
      console.error('Billing sweep RPC error:', error)
      return NextResponse.json(
        { error: 'Sweep failed', details: error.message },
        { status: 500 }
      )
    }

    const sweptCount = data as number
    console.log(`Billing sweep complete: ${sweptCount} users swept`)

    return NextResponse.json({
      success: true,
      sweptCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Billing sweep error:', error)
    return NextResponse.json(
      { error: 'Sweep failed' },
      { status: 500 }
    )
  }
}
