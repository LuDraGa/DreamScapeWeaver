import { NextRequest, NextResponse } from 'next/server'
import { openaiAdapter } from '@/lib/adapters/openai'
import { mockAdapter } from '@/lib/adapters/mock'
import { env } from '@/lib/env'
import type { GenerateDreamscapesParams } from '@/lib/types'

/**
 * POST /api/dreamscapes/generate
 * Generate story seed ideas (Dreamscapes)
 */
export async function POST(request: NextRequest) {
  try {
    const params: GenerateDreamscapesParams = await request.json()

    // Use mock adapter if flag is set, otherwise OpenAI
    const adapter = env.features.useMockAdapter ? mockAdapter : openaiAdapter
    const dreamscapes = await adapter.generateDreamscapes(params)

    return NextResponse.json({ dreamscapes })
  } catch (error) {
    console.error('API error generating dreamscapes:', error)
    return NextResponse.json(
      { error: 'Failed to generate dreamscapes' },
      { status: 500 }
    )
  }
}
