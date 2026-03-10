import { Langfuse } from 'langfuse'
import { env } from '@/lib/env'

let _langfuse: Langfuse | null = null

/**
 * Langfuse singleton. Lazy-initialized, cached for the process lifetime.
 * Reads keys from env vars (set in .env.local).
 * Server-side only.
 */
export function getLangfuse(): Langfuse {
  if (_langfuse) return _langfuse

  _langfuse = new Langfuse({
    secretKey: env.langfuse.secretKey,
    publicKey: env.langfuse.publicKey,
    baseUrl: env.langfuse.baseUrl,
  })

  return _langfuse
}

/**
 * Create a Langfuse trace + generation span for an OpenAI call.
 * Returns helpers to end the generation and flush the trace.
 *
 * Usage:
 *   const lt = startLangfuseGeneration('seed-generation', messages, { temperature: 0.9 })
 *   const completion = await openai.beta.chat.completions.parse({...})
 *   await lt.end(completion)
 *   // lt.traceId is available for storage in generation_events
 */
export function startLangfuseGeneration(
  name: string,
  input: unknown,
  modelParameters?: Record<string, string | number | boolean | string[] | null>,
  options?: { userId?: string, metadata?: Record<string, unknown> }
) {
  const langfuse = getLangfuse()

  const trace = langfuse.trace({
    name,
    userId: options?.userId,
    metadata: options?.metadata,
  })

  const generation = trace.generation({
    name: `${name}/openai`,
    model: 'gpt-4o-2024-08-06',
    input,
    modelParameters,
  })

  return {
    traceId: trace.id,
    async end(completion: { choices: Array<{ message: { parsed?: unknown } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } | null }) {
      generation.end({
        output: completion.choices[0]?.message?.parsed,
        usage: completion.usage
          ? { input: completion.usage.prompt_tokens, output: completion.usage.completion_tokens }
          : undefined,
      })
      await langfuse.flushAsync()
    },
    usage(completion: { usage?: { prompt_tokens?: number; completion_tokens?: number } | null }) {
      return {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
      }
    },
  }
}
