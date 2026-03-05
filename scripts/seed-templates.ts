/**
 * scripts/seed-templates.ts
 *
 * Seeds storyweaver.templates from src/config/templates/**\/*.json.
 *
 * USAGE:
 *   pnpm db:seed
 *
 * BEHAVIOUR:
 *   - Reads all JSON files under src/config/templates/
 *   - Upserts each as a system template (ON CONFLICT slug DO UPDATE)
 *   - Safe to re-run: existing rows are updated in place, nothing is deleted
 *   - Runs with the Supabase service role key (bypasses RLS)
 *
 * REQUIRES (in .env.local or environment):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

// ---------------------------------------------------------------------------
// Load .env.local (Node 18 doesn't support --env-file)
// ---------------------------------------------------------------------------

try {
  const envFile = readFileSync('.env.local', 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!(key in process.env)) process.env[key] = value
  }
} catch { /* .env.local not found — fall through to real env */ }

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TEMPLATES_DIR = join(process.cwd(), 'src/config/templates')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  process.exit(1)
}

// Service role client — bypasses RLS so we can upsert system templates
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ---------------------------------------------------------------------------
// Template JSON shape (mirrors src/config/templates/**/*.json)
// ---------------------------------------------------------------------------

interface TemplateJson {
  id: string
  displayName: string
  category: string
  icon?: string
  description?: string
  duration?: string
  wordCount?: number
  platforms: string[]
  settings: {
    tone?: string
    genres?: string[]
    intensity?: Record<string, number>
    avoidPhrases?: string[]
  }
  promptTemplate: {
    system: string
    user: string
  }
  compatibility: {
    perfectMatch?: string[]
    goodFit?: string[]
    checkType?: string
    dreamscapeTypes?: string[]
  }
  exampleOutput?: string
}

// DB row shape for upsert
interface TemplateRow {
  slug: string
  name: string
  category: string
  icon: string | null
  description: string | null
  word_count: number | null
  duration: string | null
  platforms: string[]
  settings: TemplateJson['settings']
  prompt_template: TemplateJson['promptTemplate']
  compatibility: TemplateJson['compatibility']
  example_output: string | null
  is_system: true
  sort_order: number
  user_id: null
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function findJsonFiles(dir: string): string[] {
  const files: string[] = []

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...findJsonFiles(full))
    } else if (entry.endsWith('.json')) {
      files.push(full)
    }
  }

  return files
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

function toRow(json: TemplateJson, sortOrder: number): TemplateRow {
  return {
    slug:             json.id,
    name:             json.displayName,
    category:         json.category,
    icon:             json.icon ?? null,
    description:      json.description ?? null,
    word_count:       json.wordCount ?? null,
    duration:         json.duration ?? null,
    platforms:        json.platforms ?? [],
    settings:         json.settings,
    prompt_template:  json.promptTemplate,
    compatibility:    json.compatibility,
    example_output:   json.exampleOutput ?? null,
    is_system:        true,
    sort_order:       sortOrder,
    user_id:          null,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Discovering template JSON files…')

  const files = findJsonFiles(TEMPLATES_DIR)
  console.log(`Found ${files.length} templates`)

  const rows: TemplateRow[] = []

  for (const [i, file] of files.entries()) {
    const rel = relative(TEMPLATES_DIR, file)
    try {
      const raw = readFileSync(file, 'utf-8')
      const json: TemplateJson = JSON.parse(raw)
      rows.push(toRow(json, i))
      console.log(`  ✓ ${rel} → slug: ${json.id}`)
    } catch (err) {
      console.error(`  ✗ ${rel}: failed to parse`, err)
      process.exit(1)
    }
  }

  console.log(`\nUpserting ${rows.length} templates into storyweaver.templates…`)

  // Upsert in batches of 20 to avoid hitting request size limits
  const BATCH = 20
  let upserted = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)

    const { error } = await supabase
      .schema('storyweaver')
      .from('templates')
      .upsert(batch, {
        onConflict: 'slug',
        ignoreDuplicates: false, // update all fields on conflict
      })

    if (error) {
      console.error(`Upsert failed at batch ${i / BATCH + 1}:`, error.message)
      process.exit(1)
    }

    upserted += batch.length
    console.log(`  Upserted ${upserted}/${rows.length}`)
  }

  console.log('\nDone. All templates seeded successfully.')
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
