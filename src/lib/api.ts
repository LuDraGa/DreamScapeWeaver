import type {
  GenerateDreamscapesParams,
  EnhanceDreamscapeParams,
  EnhanceDreamscapeResult,
  GenerateOutputsParams,
  Dreamscape,
  OutputVariant,
  ReviewOutputParams,
  AIReviewResult,
} from '@/lib/types'

/**
 * API interface - client-side wrapper for server-side API routes
 *
 * All OpenAI operations happen server-side via Next.js API routes.
 * This prevents exposing API keys to the browser.
 */

async function generateDreamscapes(params: GenerateDreamscapesParams): Promise<Dreamscape[]> {
  const response = await fetch('/api/dreamscapes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error('Failed to generate dreamscapes')
  }

  const data = await response.json()
  return data.dreamscapes
}

async function enhanceDreamscape(
  params: EnhanceDreamscapeParams
): Promise<EnhanceDreamscapeResult> {
  const response = await fetch('/api/dreamscapes/enhance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error('Failed to enhance dreamscape')
  }

  return await response.json()
}

async function generateOutputs(params: GenerateOutputsParams): Promise<OutputVariant[]> {
  const response = await fetch('/api/outputs/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error('Failed to generate outputs')
  }

  const data = await response.json()
  return data.outputs
}

async function reviewOutput(params: ReviewOutputParams): Promise<AIReviewResult> {
  const response = await fetch('/api/outputs/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to review output')
  }

  const data = await response.json()
  return data.review
}

export const api = {
  dreamscapes: {
    generate: generateDreamscapes,
    enhance: enhanceDreamscape,
  },
  outputs: {
    generate: generateOutputs,
    review: reviewOutput,
  },
}
