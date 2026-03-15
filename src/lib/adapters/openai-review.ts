import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import type { AIReviewResult, ReviewOutputParams } from '@/lib/types'
import { env } from '@/lib/env'
import { startLangfuseGeneration } from '@/lib/billing/langfuse'
import { buildReviewSystemPrompt, buildReviewUserPrompt } from './review-prompts'

// Re-export prompt builders for backward compatibility
export { buildReviewSystemPrompt, buildReviewUserPrompt }

/**
 * OpenAI adapter for AI-powered content review (admin-only)
 * Uses GPT-5.4 — the most capable model — for analytical quality assessment
 *
 * Prompt builders are in review-prompts.ts (client-safe, no OpenAI SDK dependency)
 */

const openai = new OpenAI({
  apiKey: env.openai.apiKey,
})

// ========================================
// Zod Schema for Structured Review Output
// ========================================

const RubricAnalysisSchema = z.object({
  rubric: z.string().describe('Name of the quality dimension being assessed'),
  score: z.number().describe('Score from 1-10 for this rubric'),
  analysis: z.string().describe('Detailed assessment with specific evidence quoted from the story. 2-4 sentences explaining the score.'),
})

const RubricScoreSchema = z.object({
  rubric: z.string().describe('Name of the quality dimension'),
  score: z.number().describe('Score from 1-10'),
})

const ReviewResponseSchema = z.object({
  rubricAnalyses: z.array(RubricAnalysisSchema).describe('Detailed rubric-by-rubric analysis with evidence'),
  overallGrade: z.string().describe('Overall letter grade A-F'),
  verdict: z.string().describe('One concise sentence summarizing the overall quality'),
  rubricScores: z.array(RubricScoreSchema).describe('Crisp rubric name + score pairs for at-a-glance scanning'),
  weaknesses: z.array(z.string()).describe('Top weaknesses to address via prompt enhancement — specific and actionable'),
  strengths: z.array(z.string()).describe('Top strengths to preserve when modifying prompts — specific and evidence-based'),
  promptSuggestions: z.array(z.string()).describe('Specific, actionable prompt modifications the admin could make to improve output quality'),
  additionalNotes: z.array(z.string()).describe('Any other observations valuable to an admin reviewer — edge cases, patterns, or meta-observations'),
})

// ========================================
// Core Review Function
// ========================================

export async function reviewOutput(params: ReviewOutputParams): Promise<AIReviewResult> {
  const systemPrompt = buildReviewSystemPrompt(params)
  const userPrompt = buildReviewUserPrompt(params)

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ]

  const lt = startLangfuseGeneration('admin-review', messages, { reasoning_effort: 'high' }, {
    model: 'gpt-5.4', metadata: { templateName: params.templateName },
  })

  const completion = await openai.beta.chat.completions.parse({
    model: 'gpt-5.4',
    messages,
    response_format: zodResponseFormat(ReviewResponseSchema, 'review'),
    reasoning_effort: 'high',
  })

  await lt.end(completion)

  const result = completion.choices[0].message.parsed
  if (!result) {
    throw new Error('Failed to parse review response')
  }

  return result
}

export const reviewAdapter = {
  reviewOutput,
}
