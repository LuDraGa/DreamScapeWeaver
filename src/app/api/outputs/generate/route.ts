import { NextRequest, NextResponse } from 'next/server'
import { openaiAdapter } from '@/lib/adapters/openai'
import { mockAdapter } from '@/lib/adapters/mock'
import { env } from '@/lib/env'
import type { GenerateOutputsParams } from '@/lib/types'

/**
 * POST /api/outputs/generate
 * Generate full story outputs with dial parameters
 */
export async function POST(request: NextRequest) {
  try {
    const params: GenerateOutputsParams = await request.json()

    // Use mock adapter if flag is set, otherwise OpenAI
    const adapter = env.features.useMockAdapter ? mockAdapter : openaiAdapter
    const outputs = await adapter.generateOutputs(params)

    return NextResponse.json({ outputs })
  } catch (error) {
    console.error('API error generating outputs:', error)
    return NextResponse.json(
      { error: 'Failed to generate outputs' },
      { status: 500 }
    )
  }
}
