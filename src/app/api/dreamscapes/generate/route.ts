import { NextRequest, NextResponse } from 'next/server'
import { openaiAdapter } from '@/lib/adapters/openai'
import { mockAdapter } from '@/lib/adapters/mock'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { hasCreditsForAction, debitCredits } from '@/lib/billing/credits'
import type { GenerateDreamscapesParams } from '@/lib/types'

/**
 * POST /api/dreamscapes/generate
 * Generate story seed ideas (Dreamscapes)
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check — require login when auth is enabled
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
      const check = await hasCreditsForAction(userId, 'seed')
      if (!check.hasCredits) {
        return NextResponse.json(
          { error: 'Insufficient credits', code: 'insufficient_credits', required: check.required, balance: check.balance },
          { status: 402 }
        )
      }
    }

    const body = await request.json()
    const params: GenerateDreamscapesParams = {
      count: body.count,
      vibe: body.vibe,
      detailLevel: body.detailLevel,
      seedPrompt: body.seedPrompt,
      templateId: body.templateId,
      templateContext: body.templateContext,
    }

    // Use mock adapter if flag is set, otherwise OpenAI
    const adapter = env.features.useMockAdapter ? mockAdapter : openaiAdapter
    const dreamscapes = await adapter.generateDreamscapes(params)

    // Debit credits after successful generation
    if (userId) {
      const result = await debitCredits({
        userId,
        actionType: 'seed',
      })
      if (!result.success) {
        console.error('Credit debit failed after generation:', result.error)
      }
    }

    return NextResponse.json({ dreamscapes })
  } catch (error) {
    console.error('API error generating dreamscapes:', error)
    return NextResponse.json(
      { error: 'Failed to generate dreamscapes' },
      { status: 500 }
    )
  }
}
