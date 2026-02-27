import type { Preset, DialState, DreamscapeChunk, IntensityValues } from './types'
import { DIALS } from './config'

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
  intensity,
  genres,
  tone,
  wordCount,
}: {
  preset: Preset
  platform: string
  format: string
  intensity: IntensityValues
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

Intensity settings (from advanced options):
${Object.entries(intensity)
  .map(([k, v]) => `  ${DIALS[k as keyof typeof DIALS].label}: ${v}/10`)
  .join('\n')}

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
          intensity,
          genres,
          tone,
          wordCount,
        },
      },
    ],
    fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
  }
}

export function buildDreamscapePrompt({
  count,
  vibe,
  intensity,
}: {
  count: number
  vibe: string
  intensity: IntensityValues
}): PromptData {
  const systemPrompt = `You are a creative story generator.`

  const userPrompt = `Generate ${count} unique story seeds${vibe ? ` with a ${vibe} vibe` : ''}.

Intensity settings:
${Object.entries(intensity)
  .map(([k, v]) => `  ${DIALS[k as keyof typeof DIALS].label}: ${v}/10`)
  .join('\n')}

Return engaging story seeds.`

  return {
    step: 'Dreamscape Generation (Step A)',
    messages: [
      { role: 'system', content: systemPrompt, variables: {} },
      { role: 'user', content: userPrompt, variables: { count, vibe, intensity } },
    ],
    fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
  }
}

export function buildEnhancementPrompt({
  chunks,
  goalPreset,
  intensity,
  avoidPhrases,
}: {
  chunks: DreamscapeChunk[]
  goalPreset: string
  intensity: IntensityValues
  avoidPhrases: string[]
}): PromptData {
  const systemPrompt = `You are a story enhancement specialist.`

  const enhancementGoals: Record<string, string> = {
    vivid: 'Add vivid sensory details and imagery',
    conflict: 'Introduce or heighten conflict',
    believable: 'Make the story more grounded and believable',
    stitch: 'Combine multiple chunks into a cohesive narrative',
    'less-ai': 'Remove AI-sounding phrases and make it more human',
  }

  const userPrompt = `Enhancement goal: ${enhancementGoals[goalPreset]}

Story chunks to enhance:
${chunks.map((c, i) => `Chunk ${i + 1}:\n${c.text}`).join('\n\n---\n\n')}

Avoid these phrases: ${avoidPhrases.join(', ')}

Apply intensity settings:
${Object.entries(intensity)
  .map(([k, v]) => `  ${DIALS[k as keyof typeof DIALS].label}: ${v}/10`)
  .join('\n')}`

  return {
    step: 'Enhance (Step 2)',
    messages: [
      { role: 'system', content: systemPrompt, variables: {} },
      {
        role: 'user',
        content: userPrompt,
        variables: { goalPreset, chunkCount: chunks.length, intensity, avoidPhrases },
      },
    ],
    fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
  }
}

export function buildOutputPrompt({
  dreamscape,
  intensity,
  platform,
  format,
  wordCount,
  tone,
  genres,
  avoidPhrases,
}: {
  dreamscape: { id: string; chunks: DreamscapeChunk[] }
  intensity: IntensityValues
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

Intensity settings:
${Object.entries(intensity)
  .map(([k, v]) => `  ${DIALS[k as keyof typeof DIALS].label}: ${v}/10`)
  .join('\n')}

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
          intensity,
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
