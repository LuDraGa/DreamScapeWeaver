import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import type {
  GenerateDreamscapesParams,
  EnhanceDreamscapeParams,
  EnhanceDreamscapeResult,
  GenerateOutputsParams,
  Dreamscape,
  OutputVariant,
  IntensityValues,
  DialState,
} from '@/lib/types'
import { uid } from '@/lib/utils'
import { env } from '@/lib/env'
import { buildEnhancementPrompt } from '@/lib/prompt-builders'
import { startLangfuseGeneration } from '@/lib/billing/langfuse'

/**
 * OpenAI adapter for story generation with structured outputs
 * Uses Zod schemas for type-safe, guaranteed JSON responses
 */

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.openai.apiKey,
})

// ========================================
// Zod Schemas for Structured Outputs
// ========================================

const DreamscapeSeedSchema = z.object({
  text: z.string().describe('A 1-2 sentence story premise with clear conflict and intrigue'),
})

const DreamscapesResponseSchema = z.object({
  seeds: z.array(DreamscapeSeedSchema).describe('Array of story seed ideas'),
})

const EnhancedChunkSchema = z.object({
  text: z.string().describe('The enhanced story seed text'),
})

const EnhancedChunksResponseSchema = z.object({
  chunks: z.array(EnhancedChunkSchema).describe('Array of enhanced story chunks'),
})

const StitchedSeedResponseSchema = z.object({
  stitchedSeed: z.string().describe('Combined story seed with connecting narrative'),
})

const StoryOutputSchema = z.object({
  text: z.string().describe('The complete story output'),
})

// ========================================
// Helper Functions
// ========================================

/**
 * Convert intensity dial values to descriptive text for prompts
 */
function buildIntensityPrompt(intensity: IntensityValues): string {
  const getLevel = (value: number): string => {
    if (value <= 3) return 'low'
    if (value <= 7) return 'medium'
    return 'high'
  }

  const stakesDesc = {
    low: 'minimal stakes with everyday consequences',
    medium: 'moderate stakes with meaningful personal impact',
    high: 'extremely high stakes with life-changing or catastrophic consequences',
  }[getLevel(intensity.stakes)]

  const darknessDesc = {
    low: 'light and upbeat tone with minimal negativity',
    medium: 'balanced tone with some darker elements',
    high: 'dark, intense, and morally complex tone',
  }[getLevel(intensity.darkness)]

  const paceDesc = {
    low: 'slow-burn, contemplative pacing',
    medium: 'steady, measured pacing',
    high: 'fast-paced and urgent, events unfold rapidly',
  }[getLevel(intensity.pace)]

  const twistDesc = {
    low: 'straightforward and predictable',
    medium: 'some unexpected developments',
    high: 'shocking twists and revelations',
  }[getLevel(intensity.twist)]

  const realismDesc = {
    low: 'heightened reality, dramatic and stylized',
    medium: 'plausible with some dramatic license',
    high: 'deeply realistic with mundane details and authenticity',
  }[getLevel(intensity.realism)]

  const catharsisDesc = {
    low: 'unresolved, ambiguous ending',
    medium: 'partial resolution with mixed feelings',
    high: 'deeply satisfying emotional release and resolution',
  }[getLevel(intensity.catharsis)]

  const moralDesc = {
    low: 'morally ambiguous, complex ethical landscape',
    medium: 'nuanced moral questions',
    high: 'clear moral framework with definitive right and wrong',
  }[getLevel(intensity.moralClarity)]

  return `
INTENSITY SETTINGS:
- Stakes: ${stakesDesc}
- Tone/Darkness: ${darknessDesc}
- Pacing: ${paceDesc}
- Twist Factor: ${twistDesc}
- Realism: ${realismDesc}
- Emotional Catharsis: ${catharsisDesc}
- Moral Clarity: ${moralDesc}
`
}

/**
 * Build comprehensive system prompt from dial state
 */
function buildSystemPrompt(dialState: DialState): string {
  const platformSpecs = {
    reddit:
      'Write in a casual, conversational Reddit post style. Use first-person POV, natural language, and Reddit conventions like AITA, TL;DR, etc.',
    reels:
      'Write a short, punchy script for a video reel. Include hook, narrative beats, and strong ending.',
    tiktok:
      'Write a viral TikTok-style story script. Fast-paced, engaging, with text overlay moments.',
    blog: 'Write in a polished blog post style with narrative flow and reflection.',
  }

  const formatSpecs = {
    'reddit-post':
      'Structure as a Reddit post with optional title, body text, and optional TL;DR at the end.',
    'reel-script': 'Structure as a video script with scene descriptions and voiceover text.',
    'short-story': 'Structure as a traditional short story with clear beginning, middle, and end.',
    series: 'Structure as the first part of a serialized story, ending with a hook for continuation.',
  }

  const toneGuidance = {
    narrative: 'Use third-person narrative storytelling with descriptive prose.',
    dialogue: 'Focus heavily on character dialogue and interaction.',
    script: 'Write in screenplay/script format with action lines and dialogue.',
    mixed: 'Blend narrative, dialogue, and internal thoughts naturally.',
  }

  let prompt = `You are an expert creative writer specializing in ${dialState.platform} content.

PLATFORM: ${platformSpecs[dialState.platform]}

OUTPUT FORMAT: ${formatSpecs[dialState.outputFormat]}

TONE: ${toneGuidance[dialState.tone]}

${buildIntensityPrompt(dialState.intensity)}

CONSTRAINTS:
- Target word count: ~${dialState.wordCount} words (±10% is acceptable)
${dialState.genres && dialState.genres.length > 0 ? `- Genres: ${dialState.genres.join(', ')}` : ''}
${dialState.avoidPhrases.length > 0 ? `- NEVER use these phrases: ${dialState.avoidPhrases.join(', ')}` : ''}
- Write naturally and authentically
- Avoid obviously AI-generated language patterns
- Match the platform's typical content style

COHESION: ${dialState.cohesionStrictness >= 7 ? 'Stay very close to the seed premise' : dialState.cohesionStrictness >= 4 ? 'Balance seed elements with creative expansion' : 'Use the seed as loose inspiration, take creative liberties'}
`

  return prompt
}

/**
 * Adjust intensity values for variants
 */
function adjustIntensity(
  dialState: DialState,
  type: 'intense' | 'believable'
): DialState {
  const clamp = (val: number) => Math.max(1, Math.min(10, val))

  if (type === 'intense') {
    return {
      ...dialState,
      intensity: {
        ...dialState.intensity,
        stakes: clamp(dialState.intensity.stakes + 2),
        darkness: clamp(dialState.intensity.darkness + 1),
        pace: clamp(dialState.intensity.pace + 2),
        twist: clamp(dialState.intensity.twist + 1),
      },
    }
  } else {
    // believable
    return {
      ...dialState,
      intensity: {
        ...dialState.intensity,
        realism: clamp(dialState.intensity.realism + 2),
        twist: clamp(dialState.intensity.twist - 2),
        darkness: clamp(dialState.intensity.darkness - 1),
      },
    }
  }
}

// ========================================
// Core API Functions
// ========================================

/**
 * Generate story seed ideas (Dreamscapes)
 * When seedPrompt is provided (template-aware mode), uses template-specific prompts
 * instead of the generic seed generation prompt.
 */
export async function generateDreamscapes(
  params: GenerateDreamscapesParams
): Promise<Dreamscape[]> {
  try {
    // Template-aware seed generation: use template's seedPrompt if provided
    let systemPrompt: string
    let userPrompt: string

    if (params.seedPrompt) {
      systemPrompt = params.seedPrompt.system
      userPrompt = params.seedPrompt.user.replace('{count}', String(params.count))
    } else {
      systemPrompt = `You are a creative story idea generator. Generate compelling, original story premises that:
- Are 1-2 sentences long
- Have clear conflict or intrigue
- Include a twist or unexpected element
- Are specific and concrete (not abstract)
- Feel fresh and engaging

${params.vibe ? `Match this vibe: ${params.vibe}` : 'Generate diverse, creative premises across different genres and tones'}`
      userPrompt = `Generate ${params.count} unique story seed ideas.`
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ]

    const lt = startLangfuseGeneration('seed-generation', messages, { temperature: 0.9 }, {
      model: 'gpt-5-mini', metadata: { count: params.count, vibe: params.vibe },
    })

    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-5-mini',
      messages,
      response_format: zodResponseFormat(DreamscapesResponseSchema, 'dreamscapes'),
      temperature: 0.9,
    })

    await lt.end(completion)

    const result = completion.choices[0].message.parsed
    if (!result) {
      throw new Error('Failed to parse dreamscapes response')
    }

    return result.seeds.map((seed) => ({
      id: uid(),
      title: '',
      chunks: [
        {
          id: uid(),
          title: '',
          text: seed.text,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  } catch (error) {
    console.error('OpenAI generateDreamscapes error:', error)
    throw new Error('Failed to generate dreamscapes with OpenAI')
  }
}

/**
 * Enhance existing dreamscape chunks
 */
export async function enhanceDreamscape(
  params: EnhanceDreamscapeParams
): Promise<EnhanceDreamscapeResult> {
  try {
    // Build prompt data for inspector
    const promptData = buildEnhancementPrompt({
      chunks: params.chunks,
      goalPreset: params.goalPreset,
      customGoal: params.customGoal,
      intensity: params.intensity,
      avoidPhrases: params.avoidPhrases,
    })

    // Special case: stitch multiple chunks together
    if (params.goalPreset === 'stitch' && params.chunks.length > 1) {
      const combined = params.chunks.map((c) => c.text).join('\n\n---\n\n')

      const stitchMessages = [
        {
          role: 'system' as const,
          content: `You are a story editor who finds creative connections between separate story ideas. Combine the provided story seeds into one coherent narrative that:
- Reveals how the separate ideas are actually connected
- Creates a larger, more interesting story
- Maintains the core elements of each seed
- Adds narrative tissue that makes the connection feel organic and surprising`,
        },
        { role: 'user' as const, content: `Combine these story ideas:\n\n${combined}` },
      ]

      const lt = startLangfuseGeneration('enhancement-stitch', stitchMessages, { temperature: 0.8 }, { model: 'gpt-5-mini' })

      const completion = await openai.beta.chat.completions.parse({
        model: 'gpt-5-mini',
        messages: stitchMessages,
        response_format: zodResponseFormat(StitchedSeedResponseSchema, 'stitched_seed'),
        temperature: 0.8,
      })

      await lt.end(completion)

      const result = completion.choices[0].message.parsed
      if (!result) {
        throw new Error('Failed to parse stitched seed response')
      }

      return { stitchedSeed: result.stitchedSeed, promptData }
    }

    // Normal enhancement goals
    const goalPrompts: Record<string, string> = {
      vivid: `You are enhancing a short story IDEA/SEED (not writing a full story).

Take the provided story idea and add vivid sensory details and imagery while keeping it as a brief seed/concept (2-4 sentences).

Enhancement goals:
- Add rich sensory details (visual, auditory, tactile, olfactory)
- Add atmospheric description
- Add vivid imagery

IMPORTANT: Keep it brief - just enhance the seed, don't expand it into a full story. Preserve the original plot and premise.`,

      conflict: `You are enhancing a short story IDEA/SEED (not writing a full story).

Take the provided story idea and heighten the dramatic tension while keeping it as a brief seed/concept (2-4 sentences).

Enhancement goals:
- Add higher stakes and complications
- Add obstacles and opposing forces
- Add tension and dramatic pressure

IMPORTANT: Keep it brief - just enhance the seed, don't expand it into a full story. Preserve the original premise.`,

      believable: `You are enhancing a short story IDEA/SEED (not writing a full story).

Take the provided story idea and make it more grounded/realistic while keeping it as a brief seed/concept (2-4 sentences).

Enhancement goals:
- Add realistic, mundane details
- Add authenticity markers (specific locations, realistic dialogue tags)
- Add caveats and complications that make it feel grounded
- Use less dramatic, more everyday language

IMPORTANT: Keep it brief - just enhance the seed, don't expand it into a full story.`,

      'less-ai': `You are editing a short story IDEA/SEED (not writing a full story).

Rewrite the provided story idea to sound more natural and human while keeping it as a brief seed/concept (2-4 sentences).

Enhancement goals:
- Remove clichéd phrases like "little did I know", "the plot thickens", "journey", etc.
- Use more natural, conversational language
- Replace generic descriptions with specific, concrete details
- Make it sound like a real person wrote it, not an AI

IMPORTANT: Keep it brief - just enhance the seed, don't expand it into a full story.`,

      custom:
        params.customGoal
          ? `You are enhancing a short story IDEA/SEED (not writing a full story).

${params.customGoal}

IMPORTANT: Keep it brief - just enhance the seed (2-4 sentences), don't expand it into a full story.`
          : 'Enhance the following story seed while preserving its core premise. Keep it brief.',
    }

    const systemPrompt =
      goalPrompts[params.goalPreset] ||
      'Enhance the following story seed while preserving its core premise.'

    const enhancedChunks = await Promise.all(
      params.chunks.map(async (chunk) => {
        const chunkMessages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: chunk.text },
        ]

        const lt = startLangfuseGeneration(
          `enhancement-${params.goalPreset}`,
          chunkMessages,
          { temperature: 0.7 },
          { model: 'gpt-5-mini', metadata: { goalPreset: params.goalPreset, chunkId: chunk.id } }
        )

        const completion = await openai.beta.chat.completions.parse({
          model: 'gpt-5-mini',
          messages: chunkMessages,
          response_format: zodResponseFormat(EnhancedChunkSchema, 'enhanced_chunk'),
          temperature: 0.7,
        })

        await lt.end(completion)

        const result = completion.choices[0].message.parsed
        if (!result) {
          throw new Error('Failed to parse enhanced chunk response')
        }

        return {
          ...chunk,
          id: uid(),
          text: result.text,
        }
      })
    )

    return { enhancedChunks, promptData }
  } catch (error) {
    console.error('OpenAI enhanceDreamscape error:', error)
    throw new Error('Failed to enhance dreamscape with OpenAI')
  }
}

/**
 * Generate a single story variant
 * When systemPromptOverride/userPromptOverride are provided (template flow),
 * they replace the default buildSystemPrompt/seed prompt entirely.
 */
async function generateVariant(
  title: string,
  dialState: DialState,
  seed: string,
  systemPromptOverride?: string,
  userPromptOverride?: string,
): Promise<OutputVariant> {
  const systemPrompt = systemPromptOverride || buildSystemPrompt(dialState)
  const userPrompt = userPromptOverride || `Write a complete story based on this seed:\n\n${seed}`
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ]

  const lt = startLangfuseGeneration('output-generation', messages, { temperature: 0.7 }, {
    model: 'gpt-5-mini', metadata: { variantTitle: title, platform: dialState.platform },
  })

  const completion = await openai.beta.chat.completions.parse({
    model: 'gpt-5-mini',
    messages,
    response_format: zodResponseFormat(StoryOutputSchema, 'story_output'),
    temperature: 0.7,
  })

  await lt.end(completion)

  const result = completion.choices[0].message.parsed
  if (!result) {
    throw new Error('Failed to parse story output response')
  }

  return {
    id: uid(),
    projectId: '',
    title,
    text: result.text,
    dialState,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Generate a single story output with dial parameters
 */
export async function generateOutputs(
  params: GenerateOutputsParams
): Promise<OutputVariant[]> {
  try {
    const seed = params.dreamscape.chunks.map((c) => c.text).join('\n\n')

    // Generate single variant
    const variant = await generateVariant(
      params.dialState.presetId || 'Story',
      params.dialState,
      seed,
      params.systemPromptOverride,
      params.userPromptOverride,
    )

    return [variant]
  } catch (error) {
    console.error('OpenAI generateOutputs error:', error)
    throw new Error('Failed to generate outputs with OpenAI')
  }
}

// Export the adapter interface
export const openaiAdapter = {
  generateDreamscapes,
  enhanceDreamscape,
  generateOutputs,
}
