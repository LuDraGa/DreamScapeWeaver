import { NextRequest, NextResponse } from 'next/server'
import { openaiAdapter } from '@/lib/adapters/openai'
import { mockAdapter } from '@/lib/adapters/mock'
import { env } from '@/lib/env'
import type { EnhanceDreamscapeParams } from '@/lib/types'

/**
 * POST /api/dreamscapes/enhance
 * Enhance existing dreamscape chunks
 */
export async function POST(request: NextRequest) {
  try {
    const params: EnhanceDreamscapeParams = await request.json()

    // Use mock adapter if flag is set, otherwise OpenAI
    const adapter = env.features.useMockAdapter ? mockAdapter : openaiAdapter
    const result = await adapter.enhanceDreamscape(params)

    return NextResponse.json(result)
  } catch (error) {
    console.error('API error enhancing dreamscape:', error)
    return NextResponse.json(
      { error: 'Failed to enhance dreamscape' },
      { status: 500 }
    )
  }
}
