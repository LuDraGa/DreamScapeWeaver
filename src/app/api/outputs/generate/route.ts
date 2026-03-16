import { NextRequest, NextResponse } from 'next/server'
import { openaiAdapter } from '@/lib/adapters/openai'
import { mockAdapter } from '@/lib/adapters/mock'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { hasCreditsForAction, debitCredits } from '@/lib/billing/credits'
import { getCreditCost } from '@/lib/billing/config'
import type { GenerateOutputsParams } from '@/lib/types'

/**
 * POST /api/outputs/generate
 * Generate full story outputs with dial parameters.
 * CoT templates (with characterSystemPrompt) trigger a two-call flow and extra credit debit.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    let userId: string | null = null
    const isCoT = Boolean((await request.clone().json()).characterSystemPrompt)

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

      // Credit pre-check — CoT templates cost output + character credits
      const outputCost = getCreditCost('output_generation')
      const characterCost = isCoT ? getCreditCost('character_generation') : 0
      const totalRequired = outputCost + characterCost

      const check = await hasCreditsForAction(userId, 'output')
      if (!check.balance || (check.balance.subscriptionCredits + check.balance.topupCredits) < totalRequired) {
        return NextResponse.json(
          { error: 'Insufficient credits', code: 'insufficient_credits', required: totalRequired, balance: check.balance },
          { status: 402 }
        )
      }
    }

    const params: GenerateOutputsParams = await request.json()

    const adapter = env.features.useMockAdapter ? mockAdapter : openaiAdapter
    const outputs = await adapter.generateOutputs(params)

    // Debit credits after successful generation
    if (userId) {
      const outputResult = await debitCredits({
        userId,
        actionType: 'output',
      })
      if (!outputResult.success) {
        console.error('Credit debit failed after output generation:', outputResult.error)
      }

      // Extra debit for CoT character generation step
      if (isCoT) {
        const charResult = await debitCredits({
          userId,
          actionType: 'character',
          model: 'gpt-5-mini',
        })
        if (!charResult.success) {
          console.error('Credit debit failed after character generation:', charResult.error)
        }
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
