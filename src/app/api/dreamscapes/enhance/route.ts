import { NextRequest, NextResponse } from 'next/server'
import { openaiAdapter } from '@/lib/adapters/openai'
import { mockAdapter } from '@/lib/adapters/mock'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { hasCreditsForAction, debitCredits } from '@/lib/billing/credits'
import type { EnhanceDreamscapeParams } from '@/lib/types'

/**
 * POST /api/dreamscapes/enhance
 * Enhance existing dreamscape chunks
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    let userId: string | null = null
    if (env.features.enableAuth) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'auth_required' },
          { status: 401 }
        )
      }
      userId = user.id

      // Credit pre-check
      const check = await hasCreditsForAction(userId, 'enhance')
      if (!check.hasCredits) {
        return NextResponse.json(
          { error: 'Insufficient credits', code: 'insufficient_credits', required: check.required, balance: check.balance },
          { status: 402 }
        )
      }
    }

    const params: EnhanceDreamscapeParams = await request.json()

    const adapter = env.features.useMockAdapter ? mockAdapter : openaiAdapter
    const result = await adapter.enhanceDreamscape(params)

    // Debit credits after successful enhancement
    if (userId) {
      const debitResult = await debitCredits({
        userId,
        actionType: 'enhance',
      })
      if (!debitResult.success) {
        console.error('Credit debit failed after enhancement:', debitResult.error)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('API error enhancing dreamscape:', error)
    return NextResponse.json(
      { error: 'Failed to enhance dreamscape' },
      { status: 500 }
    )
  }
}
