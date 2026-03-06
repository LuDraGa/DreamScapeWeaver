import type { Dreamscape, OutputVariant, AppSettings } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// DB row shapes (snake_case — mirrors storyweaver schema)
// ---------------------------------------------------------------------------

interface DbDreamscape {
  id: string
  user_id: string
  title: string
  origin: string
  current_version: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

interface DbChunk {
  id: string
  dreamscape_id: string
  user_id: string
  position: number
  title: string
  body: string
  current_version: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

interface DbDreamscapeOrigin {
  dreamscape_id: string
  source_output_id: string | null
  created_at: string
}

interface DbOutputVariant {
  id: string
  user_id: string
  dreamscape_id: string | null
  platform: string
  format: string
  template_id: string | null
  title: string
  body: string
  dial_state: Record<string, unknown>
  rating: number | null
  feedback: string | null  // stored as JSON.stringify(string[]) — see mapper note
  notes: string | null
  dial_state_version: number
  current_version: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

interface DbUserSettings {
  user_id: string
  avoid_phrases: string[]
  default_preset: string
  power_user_mode: boolean
  auto_avoid_ai: boolean
  developer_mode: boolean
  updated_at: string
}

// ---------------------------------------------------------------------------
// Mappers — DB row → App type
// ---------------------------------------------------------------------------

function mapChunkFromDb(row: DbChunk): Dreamscape['chunks'][number] {
  return {
    id: row.id,
    title: row.title,
    text: row.body, // DB uses 'body', app uses 'text'
  }
}

function mapDreamscapeFromDb(
  row: DbDreamscape,
  chunks: DbChunk[],
  origin: DbDreamscapeOrigin | null
): Dreamscape {
  return {
    id: row.id,
    title: row.title,
    origin: row.origin as Dreamscape['origin'],
    sourceOutputId: origin?.source_output_id ?? undefined,
    chunks: [...chunks]
      .sort((a, b) => a.position - b.position)
      .map(mapChunkFromDb),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapOutputFromDb(row: DbOutputVariant): OutputVariant {
  // feedback is stored as JSON-stringified string[] in a TEXT column.
  // Deserialise safely — if it fails, discard.
  let feedback: string[] | undefined
  if (row.feedback) {
    try {
      const parsed = JSON.parse(row.feedback)
      if (Array.isArray(parsed)) feedback = parsed
    } catch {
      // malformed — ignore
    }
  }

  return {
    id: row.id,
    dreamscapeId: row.dreamscape_id ?? undefined,
    title: row.title,
    text: row.body, // DB uses 'body', app uses 'text'
    dialState: row.dial_state as unknown as OutputVariant['dialState'],
    rating: row.rating ?? undefined,
    feedback,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    // performanceSnapshots: deferred — loaded separately by library page
  }
}

function mapSettingsFromDb(row: DbUserSettings): AppSettings {
  return {
    defaultPreset: row.default_preset,
    avoidPhrases: row.avoid_phrases ?? [],
    autoAvoidAI: row.auto_avoid_ai,
    developerMode: row.developer_mode,
    powerUserMode: row.power_user_mode,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: AppSettings = {
  defaultPreset: 'reddit-aitah',
  avoidPhrases: ["It's worth noting that", "I couldn't help but", 'Little did I know'],
  autoAvoidAI: true,
  developerMode: false,
  powerUserMode: false,
}

async function getSessionUser() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')
  return { supabase, userId: session.user.id }
}

// ---------------------------------------------------------------------------
// Supabase persistence adapter
// ---------------------------------------------------------------------------

export const supabaseAdapter = {

  // ─── Dreamscapes ──────────────────────────────────────────────────────────

  async getDreamscapes(): Promise<Dreamscape[]> {
    const supabase = createClient()

    // Fetch all active dreamscapes for current user (RLS scopes to auth.uid())
    const { data: dreamscapeRows, error: dsError } = await supabase
      .from('dreamscapes')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (dsError) throw dsError
    if (!dreamscapeRows?.length) return []

    const ids = dreamscapeRows.map((d) => d.id)

    // Batch-fetch all chunks for these dreamscapes in a single query
    const { data: chunkRows, error: chunkError } = await supabase
      .from('dreamscape_chunks')
      .select('*')
      .in('dreamscape_id', ids)
      .eq('is_archived', false)
      .order('position', { ascending: true })

    if (chunkError) throw chunkError

    // Batch-fetch origins for derived dreamscapes
    const { data: originRows } = await supabase
      .from('dreamscape_origins')
      .select('*')
      .in('dreamscape_id', ids)

    // Index by dreamscape_id for O(1) lookup
    const chunksByDreamscape = (chunkRows ?? []).reduce<Record<string, DbChunk[]>>(
      (acc, chunk) => {
        ;(acc[chunk.dreamscape_id] ??= []).push(chunk)
        return acc
      },
      {}
    )

    const originByDreamscape = (originRows ?? []).reduce<Record<string, DbDreamscapeOrigin>>(
      (acc, o) => {
        acc[o.dreamscape_id] = o
        return acc
      },
      {}
    )

    return dreamscapeRows.map((row) =>
      mapDreamscapeFromDb(
        row,
        chunksByDreamscape[row.id] ?? [],
        originByDreamscape[row.id] ?? null
      )
    )
  },

  async saveDreamscape(dreamscape: Dreamscape): Promise<void> {
    const { supabase, userId } = await getSessionUser()
    const now = new Date().toISOString()

    // Upsert dreamscape row
    const { error: dsError } = await supabase
      .from('dreamscapes')
      .upsert(
        {
          id: dreamscape.id,
          user_id: userId,
          title: dreamscape.title,
          origin: dreamscape.origin ?? 'generated',
          updated_at: now,
        },
        { onConflict: 'id' }
      )

    if (dsError) throw dsError

    // Sync chunks — delete all existing, insert current set.
    // DELETE + INSERT is simpler than a diff and avoids the UNIQUE(dreamscape_id, position)
    // constraint violation that occurs when reordering (e.g. swap position 0 ↔ 1).
    await supabase
      .from('dreamscape_chunks')
      .delete()
      .eq('dreamscape_id', dreamscape.id)

    if (dreamscape.chunks.length > 0) {
      const chunkRows = dreamscape.chunks.map((chunk, index) => ({
        id: chunk.id,
        dreamscape_id: dreamscape.id,
        user_id: userId,
        position: index,
        title: chunk.title,
        body: chunk.text, // app uses 'text', DB uses 'body'
        updated_at: now,
      }))

      const { error: chunkError } = await supabase
        .from('dreamscape_chunks')
        .insert(chunkRows)

      if (chunkError) throw chunkError
    }

    // Upsert dreamscape_origins row for derived dreamscapes
    if (dreamscape.origin === 'derived' && dreamscape.sourceOutputId) {
      const { error: originError } = await supabase
        .from('dreamscape_origins')
        .upsert(
          {
            dreamscape_id: dreamscape.id,
            source_output_id: dreamscape.sourceOutputId,
          },
          { onConflict: 'dreamscape_id' }
        )

      if (originError) throw originError
    }
  },

  async deleteDreamscape(id: string): Promise<void> {
    // Soft delete — row stays in DB, excluded from all queries via is_archived filter.
    // Chunks are NOT cascade-archived here; they're filtered out via dreamscape JOIN.
    const { supabase } = await getSessionUser()

    const { error } = await supabase
      .from('dreamscapes')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  // ─── Output variants ──────────────────────────────────────────────────────

  async getOutputs(): Promise<OutputVariant[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('output_variants')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data ?? []).map(mapOutputFromDb)
    // Note: performanceSnapshots not joined here — deferred to library page work
  },

  async saveOutput(output: OutputVariant): Promise<void> {
    const { supabase, userId } = await getSessionUser()

    // platform and format are NOT NULL columns — extract from dialState with fallback
    const platform = output.dialState?.platform ?? 'reddit'
    const format = output.dialState?.outputFormat ?? 'reddit-post'

    const { error } = await supabase
      .from('output_variants')
      .upsert(
        {
          id: output.id,
          user_id: userId,
          dreamscape_id: output.dreamscapeId ?? null,
          platform,
          format,
          title: output.title,
          body: output.text, // app uses 'text', DB uses 'body'
          dial_state: output.dialState ?? {},
          rating: output.rating ?? null,
          // feedback is string[] in the app type — serialise to TEXT for the DB column.
          // This bridges the app's chip-ID array with the DB's free-form TEXT design.
          // Revisit when library feedback UI is redesigned.
          feedback: output.feedback?.length ? JSON.stringify(output.feedback) : null,
          notes: output.notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    if (error) throw error
  },

  async deleteOutput(id: string): Promise<void> {
    // Soft delete — performance_snapshots remain (the metric data is still valid).
    const { supabase } = await getSessionUser()

    const { error } = await supabase
      .from('output_variants')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  // ─── Settings ─────────────────────────────────────────────────────────────

  async getSettings(): Promise<AppSettings> {
    const supabase = createClient()

    // maybeSingle(): returns null (not error) when no row exists.
    // user_settings is lazy-created — no row until first save.
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!data) return { ...DEFAULT_SETTINGS }

    return mapSettingsFromDb(data)
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    const { supabase, userId } = await getSessionUser()

    // UPSERT: inserts on first save, updates on subsequent saves.
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          avoid_phrases: settings.avoidPhrases,
          default_preset: settings.defaultPreset,
          power_user_mode: settings.powerUserMode,
          auto_avoid_ai: settings.autoAvoidAI,
          developer_mode: settings.developerMode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) throw error
  },
}
