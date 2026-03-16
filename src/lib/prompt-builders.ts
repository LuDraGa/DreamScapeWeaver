import type { Preset, DialState, DreamscapeChunk } from './types'
import seedGenPrompt from '@/config/prompts/seed-generation.json'

export interface PromptMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  variables: Record<string, any>
}

export interface PromptData {
  step: string
  messages: PromptMessage[]
  fullPrompt: string
}

export function buildPresetPrompt({
  preset,
  platform,
  format,
  genres,
  tone,
  wordCount,
}: {
  preset: Preset
  platform: string
  format: string
  genres: string[]
  tone: string
  wordCount: number
}): PromptData {
  const systemPrompt = `You are a creative story generator optimized for ${platform}.`

  const userPrompt = `Preview of story generation settings:

Preset: ${preset.name} (${preset.subtitle})
Platform: ${platform}
Format: ${format}
Word Count: ~${wordCount} words
Tone: ${tone}
Genres: ${genres.length > 0 ? genres.join(', ') : 'Not specified'}

This prompt will be used when you click "Generate" in Step 1.`

  return {
    step: 'Preset (Setup)',
    messages: [
      { role: 'system', content: systemPrompt, variables: { platform } },
      {
        role: 'user',
        content: userPrompt,
        variables: {
          preset: preset.name,
          platform,
          format,
          genres,
          tone,
          wordCount,
        },
      },
    ],
    fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
  }
}

/**
 * Build the seed generation prompt — shared by both the API (openai.ts) and
 * the prompt inspector so they always show the same thing.
 *
 * Priority:
 * 1. Template's own seedPrompt (if present)
 * 2. Generic XML prompt (with optional templateContext for tailoring)
 */
export function buildSeedPrompt({
  count,
  vibe,
  seedPrompt,
  templateContext,
}: {
  count: number
  vibe: string
  seedPrompt?: { system: string; user: string }
  templateContext?: { displayName: string; category: string; description: string }
}): PromptData {
  let systemPrompt: string
  let userPrompt: string

  if (seedPrompt) {
    // Template has its own seed prompt — use it directly
    systemPrompt = seedPrompt.system
    userPrompt = seedPrompt.user.replace('{count}', String(count))
  } else {
    // Generic XML prompt
    const { system, user } = buildGenericSeedPrompt({ count, vibe, templateContext })
    systemPrompt = system
    userPrompt = user
  }

  return {
    step: 'Dreamscape Generation (Step A)',
    messages: [
      { role: 'system', content: systemPrompt, variables: {} },
      { role: 'user', content: userPrompt, variables: { count, vibe } },
    ],
    fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
  }
}

/**
 * Build the generic (no-template) seed generation prompt using XML framework.
 * Reads from src/config/prompts/seed-generation.json and resolves placeholders.
 *
 * Placeholders:
 *   {templateContext} — conditional block injected when a template is selected
 *   {count}           — number of seeds to generate
 *   {vibe}            — optional vibe/direction instruction
 */
export function buildGenericSeedPrompt({
  count,
  vibe,
  templateContext,
}: {
  count: number
  vibe?: string
  templateContext?: { displayName: string; category: string; description: string }
}): { system: string; user: string } {
  const templateContextBlock = templateContext
    ? `\n<template_context>\nYou are generating seeds specifically for: ${templateContext.displayName} (${templateContext.category})\nTemplate description: ${templateContext.description}\nTailor every seed to fit this content type — the tone, structure, and subject matter should match what this template produces.\n</template_context>`
    : ''

  const vibeBlock = vibe
    ? `\n\nMatch this vibe/direction: "${vibe}"`
    : ''

  const system = seedGenPrompt.system
    .replace('{templateContext}', templateContextBlock)

  const user = seedGenPrompt.user
    .replace('{count}', String(count))
    .replace('{vibe}', vibeBlock)

  return { system, user }
}

export function buildEnhancementPrompt({
  chunks,
  goalPreset,
  customGoal,
  avoidPhrases,
}: {
  chunks: DreamscapeChunk[]
  goalPreset: string
  customGoal?: string
  avoidPhrases: string[]
}): PromptData {
  const systemPrompt = `You are a story enhancement specialist.`

  const enhancementGoals: Record<string, string> = {
    vivid: 'Add vivid sensory details and imagery',
    conflict: 'Introduce or heighten conflict',
    believable: 'Make the story more grounded and believable',
    stitch: 'Combine multiple chunks into a cohesive narrative',
    'less-ai': 'Remove AI-sounding phrases and make it more human',
    custom: customGoal || 'Custom enhancement',
  }

  const userPrompt = `Enhancement goal: ${enhancementGoals[goalPreset]}

Story chunks to enhance:
${chunks.map((c, i) => `Chunk ${i + 1}:\n${c.text}`).join('\n\n---\n\n')}

Avoid these phrases: ${avoidPhrases.join(', ')}`

  return {
    step: 'Enhance (Step 2)',
    messages: [
      { role: 'system', content: systemPrompt, variables: {} },
      {
        role: 'user',
        content: userPrompt,
        variables: { goalPreset, chunkCount: chunks.length, avoidPhrases },
      },
    ],
    fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
  }
}

export function buildOutputPrompt({
  dreamscape,
  platform,
  format,
  wordCount,
  tone,
  genres,
  avoidPhrases,
}: {
  dreamscape: { id: string; chunks: DreamscapeChunk[] }
  platform: string
  format: string
  wordCount: number
  tone: string
  genres: string[]
  avoidPhrases: string[]
}): PromptData {
  const systemPrompt = `You are a master storyteller creating ${platform} content.`

  const userPrompt = `Create a ${wordCount}-word story for ${platform} (${format} format).

Story seed:
${dreamscape.chunks.map((c) => c.text).join('\n\n')}

Genre(s): ${genres.join(', ')}
Tone: ${tone}
Word count: ~${wordCount} words

Avoid these phrases: ${avoidPhrases.join(', ')}

Generate 3 variants:
1. Balanced (as-is)
2. More Intense (dial everything up)
3. More Believable (more grounded, realistic)`

  return {
    step: 'Output (Step 3)',
    messages: [
      { role: 'system', content: systemPrompt, variables: { platform } },
      {
        role: 'user',
        content: userPrompt,
        variables: {
          dreamscape: dreamscape.id,
          platform,
          format,
          wordCount,
          tone,
          genres,
          avoidPhrases,
          variantCount: 3,
        },
      },
    ],
    fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
  }
}
