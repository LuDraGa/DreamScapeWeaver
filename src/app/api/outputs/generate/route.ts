import { NextRequest, NextResponse } from 'next/server'
import { openaiAdapter } from '@/lib/adapters/openai'
import { mockAdapter } from '@/lib/adapters/mock'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { hasCreditsForAction, debitCredits } from '@/lib/billing/credits'
import type { GenerateOutputsParams } from '@/lib/types'

/**
 * POST /api/outputs/generate
 * Generate full story outputs with dial parameters
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
      const check = await hasCreditsForAction(userId, 'output')
      if (!check.hasCredits) {
        return NextResponse.json(
          { error: 'Insufficient credits', code: 'insufficient_credits', required: check.required, balance: check.balance },
          { status: 402 }
        )
      }
    }

    const params: GenerateOutputsParams = await request.json()

    const adapter = env.features.useMockAdapter ? mockAdapter : openaiAdapter
    const outputs = await adapter.generateOutputs(params)

    // Debit credits after successful generation
    if (userId) {
      const result = await debitCredits({
        userId,
        actionType: 'output',
      })
      if (!result.success) {
        console.error('Credit debit failed after output generation:', result.error)
      }
    }

    return NextResponse.json({ outputs })
  } catch (error) {
    console.error('API error generating outputs:', error)
    return NextResponse.json(
      { error: 'Failed to generate outputs' },
      { status: 500 }
    )
  }
}
