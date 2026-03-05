-- =============================================================================
-- StoryWeaver — Phase 2b RDBMS Schema
-- Migration: 001_phase2b_schema.sql
-- Schema:    storyweaver
-- =============================================================================
--
-- OVERVIEW:
--   This migration establishes the full Phase 2b relational schema under the
--   `storyweaver` schema (isolated from other apps sharing this Supabase project).
--
--   Tables in dependency order:
--     1.  profiles            (ALTER — Phase 2a base, extended here)
--     2.  templates           (system-level, no user_id — seeded from config JSON)
--     3.  user_settings       (1:1 with profiles)
--     4.  dreamscapes         (owned by user)
--     5.  output_variants     (owned by user, references dreamscapes + templates)
--     6.  dreamscape_origins  (1:1 with dreamscapes, references output_variants — breaks circular FK)
--     7.  dreamscape_chunks   (owned by dreamscape)
--     8.  dreamscape_chunk_versions    (version history for chunks)
--     9.  output_variant_versions      (version history for output variants)
--     10. performance_snapshots        (metrics per output per platform)
--
-- BASE FIELDS (on every table unless noted):
--   created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
--   updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()  -- auto-maintained by trigger
--   created_by  UUID FK nullable → profiles (SET NULL on delete)
--   updated_by  UUID FK nullable → profiles (SET NULL on delete)
--   is_archived BOOLEAN NOT NULL DEFAULT false       -- soft delete
--
--   NOTE: version tables (chunk_versions, variant_versions) are IMMUTABLE — they
--   only carry created_at + created_by. No updated_at, updated_by, or is_archived.
--
-- CIRCULAR FK RESOLUTION:
--   The original design had dreamscapes.source_output_id → output_variants AND
--   output_variants.dreamscape_id → dreamscapes, forming a cycle. This is resolved
--   by extracting lineage into a separate dreamscape_origins table. No circular
--   FK exists anywhere in this schema.
--
-- VERSIONING STRATEGY:
--   Main tables (dreamscape_chunks, output_variants) hold current state for fast reads.
--   _versions tables hold immutable history rows. current_version on the main table
--   is a monotonic counter — increment on every edit, append to _versions table.
--   Restore = new edit (v_n+1) with old body — no special logic needed.
--
-- HOW TO RUN:
--   Paste into Supabase SQL Editor and execute.
--   Idempotent: uses IF NOT EXISTS + DO $$ blocks where needed.
--   Phase 2a profiles table is extended with ALTER TABLE (safe to re-run).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- SCHEMA
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS storyweaver;


-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

-- User roles — defined in Phase 2a, included here for reference.
-- DO $$ BEGIN
--   CREATE TYPE storyweaver.user_role AS ENUM ('normal', 'admin', 'dev');
-- EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- origin describes how a dreamscape came to exist.
DO $$ BEGIN
  CREATE TYPE storyweaver.dreamscape_origin AS ENUM (
    'generated',  -- created fresh by the AI seed generator
    'derived',    -- forked from an existing output variant by the user
    'imported'    -- manually entered / pasted by the user (future)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- change_source describes what triggered a version snapshot.
DO $$ BEGIN
  CREATE TYPE storyweaver.change_source AS ENUM (
    'initial',     -- the very first version, created at row creation
    'user_edit',   -- the user manually edited the content
    'enhancement', -- an AI enhancement goal was applied (chunks only)
    'transform'    -- an AI transform was applied (output variants only)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =============================================================================
-- TRIGGER FUNCTION (defined early — used by every table's trigger below)
-- =============================================================================
--
-- Shared trigger function that auto-updates updated_at on every row mutation.
-- Must be created before any CREATE TRIGGER statements that reference it.
-- Attached to all mutable tables. NOT attached to version tables (immutable).

CREATE OR REPLACE FUNCTION storyweaver.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- TABLE: storyweaver.profiles  (EXTENDED — base created in Phase 2a)
-- =============================================================================
--
-- DESCRIPTION:
--   One row per authenticated user. Created automatically via trigger on
--   auth.users insert (Supabase Auth). Extended here with audit fields and
--   soft-delete support.
--
-- PHASE 2a FIELDS (already exist):
--   id         UUID PK (mirrors auth.users.id)
--   email      TEXT UNIQUE NOT NULL
--   role       user_role NOT NULL DEFAULT 'normal'
--   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
--
-- NEW FIELDS (this migration):
--   created_by  UUID nullable FK → self
--     Rationale: self-referential — the profile is its own creator. Cannot be
--     set at insert time (profile doesn't exist yet), so it is NULL for
--     system-created entries and set to `id` by the app post-creation or by
--     an admin. Nullable by design — not a data quality problem.
--
--   updated_by  UUID nullable FK → self
--     Rationale: tracks which profile last modified this row. Useful for admin
--     operations where an admin changes another user's role.
--
--   is_archived BOOLEAN NOT NULL DEFAULT false
--     Rationale: soft delete for banned/deactivated accounts. Hard delete
--     cascades all content, which is destructive; archiving lets an admin
--     suspend a user while preserving their data for review.
--
-- DESIGN NOTES:
--   - Profiles live in the `storyweaver` schema but mirror `auth.users` ids.
--   - `updated_at` is kept current by a trigger (see TRIGGERS section).
--   - No versioning on profiles — role/email changes are low-frequency, audit
--     trail via updated_by + updated_at is sufficient.
-- =============================================================================

-- Extend profiles with audit fields introduced in Phase 2b.
-- IF NOT EXISTS makes these safe to re-run.
-- created_by is nullable by design (self-reference; set post-creation or left NULL).
ALTER TABLE storyweaver.profiles
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Profiles RLS extension: admins can read all profiles (policy may already exist from Phase 2a).
-- Ensure is_archived is visible to the owner so they know their account status.
-- (Phase 2a RLS policies for profiles are left in place — this migration adds no new profile policies.)


-- =============================================================================
-- TABLE: storyweaver.templates
-- =============================================================================
--
-- DESCRIPTION:
--   Canonical registry of all story templates available in the app. Templates
--   define the generation config (platform, dial defaults, prompt scaffolding,
--   word count targets) for a specific content type. They are the "blueprints"
--   that guide the AI toward producing platform-appropriate output.
--
--   System templates are seeded from src/config/templates/**/*.json via
--   scripts/seed-templates.ts. The slug field mirrors the JSON `id` field,
--   making cross-referencing between config files and DB rows unambiguous.
--
--   Custom templates (is_system = false) are a future feature — users will be
--   able to fork and save their own template variants. The schema supports this
--   now via the user_id + is_system fields.
--
-- RELATIONSHIPS:
--   ← output_variants.template_id (N:1, SET NULL)   outputs generated with this template
--   → profiles.id via created_by / user_id (nullable)  for user-created templates
--
-- FIELDS:
--   id          UUID PK DEFAULT gen_random_uuid()
--     Surrogate key. output_variants.template_id FK references this.
--
--   slug        TEXT UNIQUE NOT NULL
--     Human-readable identifier. Mirrors the `id` field in template JSON files
--     (e.g. 'reddit-aitah', 'short-horror-creepy', 'marketing-brand-story').
--     Used as the stable cross-reference between app config and DB. Never changes
--     for system templates — changing a slug breaks all historical output_variant links.
--
--   name        TEXT NOT NULL
--     Display name shown in the UI template gallery (e.g. 'r/AITAH', 'Horror/Creepy').
--     Mirrors the `displayName` field in JSON.
--
--   category    TEXT NOT NULL
--     Top-level grouping used to organize the template gallery:
--     'reddit' | 'short-form' | 'long-form' | 'marketing' | 'audio-production' | 'video-production'
--     CHECK constraint enforces the known set. New categories require a migration.
--
--   icon        TEXT nullable
--     Emoji or icon identifier shown in the gallery card (e.g. '🤔', '👻').
--     Nullable — system templates all have icons, user-created may not initially.
--
--   description TEXT nullable
--     One-sentence description of what this template produces (e.g.
--     'Am I the A**hole? - Moral dilemma stories that spark debate').
--
--   word_count  SMALLINT nullable
--     Target word count for generated output. Used to set UI expectations and
--     as a hint to the prompt builder. Nullable — some templates (e.g. shot lists)
--     are not word-count-oriented.
--
--   duration    TEXT nullable
--     Human-readable duration or format hint (e.g. '60s narration', '30-45s',
--     'About page'). Display-only — not machine-parsed.
--
--   platforms   TEXT[] NOT NULL DEFAULT '{}'
--     Array of target publishing platforms for this template. Mirrors the JSON
--     `platforms` array. Can contain values beyond the normalized platform enum
--     (e.g. 'instagram-reels', 'youtube-shorts', 'about-page') since templates
--     predate the normalized platform list.
--
--   settings    JSONB NOT NULL DEFAULT '{}'
--     Full settings blob from the JSON config: { tone, genres, intensity, avoidPhrases }.
--     intensity is the 7-dimensional dial preset for this template.
--     avoidPhrases supplements the user's global avoid list.
--
--   prompt_template JSONB NOT NULL DEFAULT '{}'
--     The AI prompt scaffolding: { system: '...', user: '...' }.
--     The user prompt contains {dreamscape} and {avoidPhrases} placeholder tokens
--     which the prompt builder replaces at generation time.
--     Stored as JSONB (not separate columns) because system/user prompts are always
--     accessed together and never queried individually.
--
--   compatibility JSONB NOT NULL DEFAULT '{}'
--     Metadata for template matching: { perfectMatch[], goodFit[], checkType, dreamscapeTypes[] }.
--     Used by the app to score template fit against a given dreamscape's content.
--     Stored as JSONB — structure is well-defined but accessed as a blob.
--
--   example_output TEXT nullable
--     A pre-written example of what this template produces. Shown in the gallery
--     to help users understand the expected output format before generating.
--
--   is_system   BOOLEAN NOT NULL DEFAULT true
--     true = shipped with the app, seeded from config JSON, managed by devs.
--     false = created by a user (future feature). System templates cannot be deleted
--     by users — only admins (or the seed script) may update them.
--
--   sort_order  SMALLINT NOT NULL DEFAULT 0
--     Display order within a category. Lower = shown first in the gallery.
--     System templates are ordered as they appear in the gallery config.
--
--   user_id     UUID nullable FK → profiles (SET NULL)
--     Non-null only for user-created templates (is_system = false). NULL for all
--     system templates — they belong to the app, not a specific user.
--
-- BASE FIELDS: created_at, updated_at, created_by, updated_by, is_archived
--   is_archived: hides a template from the gallery without deleting it.
--   Archived templates remain on historical output_variants for reference.
--
-- SEEDING:
--   System templates are inserted by scripts/seed-templates.ts using
--   INSERT ... ON CONFLICT (slug) DO UPDATE — idempotent, safe to re-run.
--   Run after every migration: `pnpm db:seed`
-- =============================================================================

CREATE TABLE IF NOT EXISTS storyweaver.templates (

  -- Identity
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT    NOT NULL,
  user_id          UUID    REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,

  -- Display fields
  name             TEXT    NOT NULL,
  category         TEXT    NOT NULL,
  icon             TEXT,
  description      TEXT,
  word_count       SMALLINT,
  duration         TEXT,

  -- Generation config
  platforms        TEXT[]  NOT NULL DEFAULT '{}',
  settings         JSONB   NOT NULL DEFAULT '{}',
  prompt_template  JSONB   NOT NULL DEFAULT '{}',
  compatibility    JSONB   NOT NULL DEFAULT '{}',
  example_output   TEXT,

  -- Classification
  is_system        BOOLEAN NOT NULL DEFAULT true,
  sort_order       SMALLINT NOT NULL DEFAULT 0,

  -- Base audit fields
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  is_archived      BOOLEAN NOT NULL DEFAULT false,

  -- Constraints
  CONSTRAINT templates_slug_unique UNIQUE (slug),
  CONSTRAINT templates_category_check CHECK (
    category IN ('reddit','short-form','long-form','marketing','audio-production','video-production')
  ),
  CONSTRAINT templates_system_no_user CHECK (
    NOT (is_system = true AND user_id IS NOT NULL)
  )

);

COMMENT ON TABLE storyweaver.templates IS
  'Canonical registry of all story templates. System templates seeded from '
  'src/config/templates/**/*.json via scripts/seed-templates.ts. '
  'Slug mirrors JSON id field — never change slugs on system templates.';

COMMENT ON COLUMN storyweaver.templates.slug IS
  'Stable human-readable ID matching the JSON config ''id'' field (e.g. ''reddit-aitah''). '
  'Used as the upsert key in seed script. Changing a slug breaks historical FK links.';

COMMENT ON COLUMN storyweaver.templates.prompt_template IS
  'AI prompt scaffolding: { system, user }. User prompt contains {dreamscape} and '
  '{avoidPhrases} tokens replaced at generation time by the prompt builder.';

COMMENT ON COLUMN storyweaver.templates.is_system IS
  'System templates (true) are owned by the app and seeded from config JSON. '
  'User templates (false) are a future feature — user_id is non-null when is_system=false.';

-- RLS for templates
ALTER TABLE storyweaver.templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active system templates
CREATE POLICY "templates: authenticated read"
  ON storyweaver.templates FOR SELECT
  TO authenticated
  USING (NOT is_archived);

-- Users can manage their own custom templates
CREATE POLICY "templates: owner manage custom"
  ON storyweaver.templates FOR ALL
  USING  (is_system = false AND auth.uid() = user_id)
  WITH CHECK (is_system = false AND auth.uid() = user_id);

-- System template mutations are service-role only (seed script uses service role)

-- Index: gallery query — active templates by category, ordered
CREATE INDEX IF NOT EXISTS idx_templates_category_sort
  ON storyweaver.templates(category, sort_order)
  WHERE NOT is_archived;

-- Index: slug lookup (upsert in seed script)
CREATE INDEX IF NOT EXISTS idx_templates_slug
  ON storyweaver.templates(slug);

-- Trigger
CREATE OR REPLACE TRIGGER trg_templates_updated_at
  BEFORE UPDATE ON storyweaver.templates
  FOR EACH ROW EXECUTE FUNCTION storyweaver.set_updated_at();


-- =============================================================================
-- TABLE: storyweaver.user_settings
-- =============================================================================
--
-- DESCRIPTION:
--   Stores per-user application preferences. One row per user (1:1 with profiles).
--   Created lazily — the row is inserted the first time the user saves settings,
--   not at signup. All reads must LEFT JOIN and handle NULL.
--
-- PRIMARY KEY: user_id (not a separate surrogate key — there is exactly one
--   settings row per user, so the FK is the PK).
--
-- FIELDS:
--   user_id         UUID PK FK → profiles (CASCADE)
--     The owning user. CASCADE DELETE — when a profile is removed, settings go too.
--
--   avoid_phrases   TEXT[] NOT NULL DEFAULT '{}'
--     List of phrases the AI should avoid in generated content. Stored as a
--     Postgres text array. No FK or enum — user-defined strings. May be empty.
--
--   default_preset  TEXT NOT NULL DEFAULT 'reddit-aitah'
--     The preset ID loaded by default on the Create page. References a value
--     in src/config/presets.json — no FK (presets are config, not DB rows).
--     If the referenced preset is removed from config, the app falls back to
--     the first available preset gracefully.
--
--   power_user_mode BOOLEAN NOT NULL DEFAULT false
--     Enables advanced UI: raw dial sliders, prompt inspector, fine-grained
--     controls. Not a role — any user can enable it. Stored here (not in
--     profiles.role) because it is a preference, not an access level.
--
--   auto_avoid_ai   BOOLEAN NOT NULL DEFAULT true
--     When true, a built-in list of AI-sounding phrases is automatically
--     appended to the avoidance prompt. Users can disable for raw output.
--
--   developer_mode  BOOLEAN NOT NULL DEFAULT false
--     Shows developer-only UI: prompt inspector panel, mock adapter toggle,
--     debug overlays. Intended for the `dev` role but not enforced at the
--     DB level — the app checks role separately.
--
-- BASE FIELDS: created_at, updated_at, created_by, updated_by, is_archived
--   created_at is added here (was missing in the original ERD).
--   is_archived: archiving settings effectively resets the user to defaults
--   on next load. The app treats a missing or archived settings row identically.
--
-- DESIGN NOTES:
--   - UPSERT semantics in app code (INSERT ... ON CONFLICT DO UPDATE).
--   - No trigger needed for lazy creation — handled at the application layer.
--   - Future: if settings grow significantly, split into user_preferences
--     (UI toggles) and user_generation_defaults (AI generation parameters).
-- =============================================================================

CREATE TABLE IF NOT EXISTS storyweaver.user_settings (

  -- Identity
  user_id          UUID PRIMARY KEY
                   REFERENCES storyweaver.profiles(id) ON DELETE CASCADE,

  -- Preferences
  avoid_phrases    TEXT[]  NOT NULL DEFAULT '{}',
  default_preset   TEXT    NOT NULL DEFAULT 'reddit-aitah',
  power_user_mode  BOOLEAN NOT NULL DEFAULT false,
  auto_avoid_ai    BOOLEAN NOT NULL DEFAULT true,
  developer_mode   BOOLEAN NOT NULL DEFAULT false,

  -- Base audit fields
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  is_archived      BOOLEAN NOT NULL DEFAULT false

);

COMMENT ON TABLE storyweaver.user_settings IS
  'Per-user application preferences. Created lazily on first settings save. '
  '1:1 with profiles. Use LEFT JOIN and handle NULL in all queries.';


-- =============================================================================
-- TABLE: storyweaver.dreamscapes
-- =============================================================================
--
-- DESCRIPTION:
--   A dreamscape is a user's story seed — the raw narrative material that the
--   AI generates and the user refines before producing publishable output.
--   It is a container for one or more ordered dreamscape_chunks (paragraphs /
--   scenes). Dreamscapes are the starting point of every creation flow.
--
-- RELATIONSHIPS:
--   → profiles (N:1, CASCADE DELETE)            owned by a user
--   ← dreamscape_chunks (1:N, CASCADE DELETE)   contains ordered text chunks
--   ← dreamscape_origins (1:1, CASCADE DELETE)  lineage record if origin='derived'
--   ← output_variants.dreamscape_id (N:1, SET NULL)  outputs produced from this seed
--
-- FIELDS:
--   id              UUID PK DEFAULT gen_random_uuid()
--
--   user_id         UUID FK NOT NULL → profiles (CASCADE)
--     The owning user. Denormalized onto child tables (chunks) as an RLS
--     shortcut so RLS policies on chunks don't require a JOIN to dreamscapes.
--
--   title           TEXT NOT NULL DEFAULT ''
--     User-editable display name. Defaults to empty string — the app shows
--     a generated placeholder ('Untitled Dreamscape') until the user renames.
--     Not versioned: title changes are low-stakes, updated_at is sufficient.
--
--   origin          dreamscape_origin NOT NULL DEFAULT 'generated'
--     Enum describing how this dreamscape came to exist. Drives whether a
--     dreamscape_origins row is created. Typed enum (not free TEXT) to allow
--     exhaustive pattern matching in app code and prevent typos.
--
--   current_version SMALLINT NOT NULL DEFAULT 1
--     Monotonic counter for optimistic concurrency. Incremented by the app
--     on every edit to the dreamscape's chunks. Does not track title changes.
--     Used to detect and reject stale edits from concurrent sessions.
--
-- BASE FIELDS: created_at, updated_at, created_by, updated_by, is_archived
--   is_archived=true: dreamscape is soft-deleted. Excluded from library queries
--   via WHERE NOT is_archived. Chunks remain in DB (not cascade-archived).
--
-- DESIGN NOTES:
--   - source_output_id was removed from this table. Lineage for derived
--     dreamscapes lives in dreamscape_origins to avoid a circular FK.
--   - Hard delete cascades to chunks and origins automatically via FK.
--   - Soft delete (is_archived) is preferred for user-facing deletes.
-- =============================================================================

CREATE TABLE IF NOT EXISTS storyweaver.dreamscapes (

  -- Identity
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES storyweaver.profiles(id) ON DELETE CASCADE,

  -- Content metadata
  title            TEXT        NOT NULL DEFAULT '',
  origin           storyweaver.dreamscape_origin NOT NULL DEFAULT 'generated',
  current_version  SMALLINT    NOT NULL DEFAULT 1,

  -- Base audit fields
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  is_archived      BOOLEAN     NOT NULL DEFAULT false

);

COMMENT ON TABLE storyweaver.dreamscapes IS
  'Story seeds. Container for ordered narrative chunks. Entry point of the '
  'creation flow. Derived dreamscapes link to their source via dreamscape_origins.';

COMMENT ON COLUMN storyweaver.dreamscapes.origin IS
  'How this dreamscape was created: generated (AI), derived (forked from an output), '
  'or imported (user-pasted). Drives whether a dreamscape_origins row is required.';

COMMENT ON COLUMN storyweaver.dreamscapes.current_version IS
  'Monotonic edit counter for optimistic concurrency. Incremented on every chunk edit. '
  'App rejects writes where client version != DB version.';


-- =============================================================================
-- TABLE: storyweaver.output_variants
-- =============================================================================
--
-- DESCRIPTION:
--   A single generated story variant ready for publishing. Every generation
--   run produces 3 output_variants (Balanced, More Intense, More Believable).
--   An output_variant belongs to (at most) one dreamscape — if the dreamscape
--   is deleted, the output is orphaned (dreamscape_id SET NULL) but preserved.
--
-- RELATIONSHIPS:
--   → profiles (N:1, CASCADE DELETE)             owned by user
--   → dreamscapes (N:1, SET NULL)                generated from this seed (nullable)
--   ← dreamscape_origins (N:1, SET NULL)         may be the source of a derived dreamscape
--   ← output_variant_versions (1:N, CASCADE)     full edit history
--   ← performance_snapshots (1:N, CASCADE)       real-world metric logs
--
-- FIELDS:
--   id              UUID PK DEFAULT gen_random_uuid()
--
--   user_id         UUID FK NOT NULL → profiles (CASCADE)
--     Denormalized for RLS — avoids JOIN to dreamscapes in row-level security.
--
--   dreamscape_id   UUID FK nullable → dreamscapes (SET NULL)
--     The seed this output was generated from. SET NULL on dreamscape delete
--     so outputs survive seed deletion. Null means the seed was deleted or
--     the output was imported (future).
--
--   platform        TEXT NOT NULL
--     Target publishing platform (reddit, reels, tiktok, youtube, blog, etc.).
--     Promoted from dial_state JSONB for fast GROUP BY and filtering.
--     CHECK constraint: (platform IN ('reddit','reels','tiktok','youtube',
--       'blog','marketing','email','audio','video')).
--
--   format          TEXT NOT NULL
--     The specific format within the platform (aitah, tifu, nosleep, etc.).
--     Promoted from dial_state for fast filtering. Free text within the
--     known set — not enum'd because formats may grow frequently.
--
--   template_id     UUID FK nullable → templates (SET NULL)
--     The template used to generate this output. SET NULL on template delete so
--     outputs survive template removal. Nullable — outputs generated before
--     template tracking was added (pre-Phase 2b) will have no template_id.
--     Join to storyweaver.templates for full template metadata.
--
--   title           TEXT NOT NULL DEFAULT ''
--     User-editable display title. Updated in place; versioned via
--     output_variant_versions when body changes (title snapshotted with body).
--
--   body            TEXT NOT NULL
--     The generated story text. The primary content. Versioned — every edit
--     appends a new row to output_variant_versions and increments current_version.
--
--   dial_state      JSONB NOT NULL
--     Full snapshot of generation config at the moment of creation: all 7
--     intensity dials, platform, format, preset_id, enhancement goals applied.
--     Immutable after creation — never updated. Serves as the audit trail for
--     exactly what prompted this output. platform/format are denormalized out
--     for queryability but dial_state is the source of truth.
--
--   rating          SMALLINT nullable CHECK (rating BETWEEN 1 AND 5)
--     User's 1-5 star rating of the output's quality. Nullable — unrated
--     outputs are excluded from feedback analytics queries by default.
--
--   feedback        TEXT nullable
--     Free-form text feedback from the user about why they rated it as they did,
--     what worked, what didn't. No constraint on content. UI enforces 1000 char
--     max. Nullable — most outputs will not have feedback.
--     NOTE: was TEXT[] in original ERD. Changed to TEXT to avoid premature
--     categorization of unstructured feedback. Clean later if patterns emerge.
--
--   notes           TEXT nullable
--     Private user notes about this output (publishing plans, revision ideas,
--     performance context). Separate from feedback — feedback is about quality,
--     notes are operational. Not versioned.
--
--   current_version SMALLINT NOT NULL DEFAULT 1
--     Monotonic edit counter. Incremented on every body/title edit. Drives
--     the output_variant_versions insert. Used for optimistic concurrency.
--
-- BASE FIELDS: created_at, updated_at, created_by, updated_by, is_archived
--   is_archived=true: output excluded from library, but performance_snapshots
--   are preserved (the real-world data is still valid even if user hid the output).
-- =============================================================================

CREATE TABLE IF NOT EXISTS storyweaver.output_variants (

  -- Identity
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES storyweaver.profiles(id) ON DELETE CASCADE,
  dreamscape_id    UUID        REFERENCES storyweaver.dreamscapes(id) ON DELETE SET NULL,

  -- Generation config (promoted from dial_state for queryability)
  platform         TEXT        NOT NULL,
  format           TEXT        NOT NULL,
  template_id      UUID REFERENCES storyweaver.templates(id) ON DELETE SET NULL,

  -- Content
  title            TEXT        NOT NULL DEFAULT '',
  body             TEXT        NOT NULL,
  dial_state       JSONB       NOT NULL,

  -- User feedback
  rating           SMALLINT,
  feedback         TEXT,
  notes            TEXT,

  -- Versioning
  current_version  SMALLINT    NOT NULL DEFAULT 1,

  -- Base audit fields
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  is_archived      BOOLEAN     NOT NULL DEFAULT false,

  -- Constraints
  CONSTRAINT output_variants_platform_check
    CHECK (platform IN ('reddit','reels','tiktok','youtube','blog','marketing','email','audio','video')),
  CONSTRAINT output_variants_rating_check
    CHECK (rating BETWEEN 1 AND 5)

);

COMMENT ON TABLE storyweaver.output_variants IS
  'Generated story variants ready for publishing. 3 are produced per generation run '
  '(Balanced, More Intense, More Believable). Orphaned (not deleted) when parent '
  'dreamscape is removed. Versioned — edits append to output_variant_versions.';

COMMENT ON COLUMN storyweaver.output_variants.dial_state IS
  'Immutable full snapshot of generation config at creation: all 7 intensity dials, '
  'platform, format, preset_id, enhancement goals. Never updated after creation. '
  'platform and format are also denormalized as first-class columns for fast filtering.';

COMMENT ON COLUMN storyweaver.output_variants.feedback IS
  'Free-form user feedback on output quality. UI enforces 1000 char max. '
  'Was TEXT[] in original ERD — changed to TEXT to defer premature categorization.';

COMMENT ON COLUMN storyweaver.output_variants.current_version IS
  'Monotonic edit counter. Incremented on every body/title edit. Each increment '
  'produces a new row in output_variant_versions.';


-- =============================================================================
-- TABLE: storyweaver.dreamscape_origins
-- =============================================================================
--
-- DESCRIPTION:
--   Tracks lineage for dreamscapes that were derived from an existing output
--   variant (origin = 'derived'). This table exists to break the circular FK
--   that would exist if dreamscapes.source_output_id referenced output_variants
--   while output_variants.dreamscape_id referenced dreamscapes.
--
-- RELATIONSHIP MODEL (no circular FK):
--   dreamscapes → output_variants  via: output_variants.dreamscape_id (SET NULL)
--   output_variants → dreamscapes  via: dreamscape_origins.source_output_id (SET NULL)
--   These two paths never form a cycle because they go through separate FKs.
--
-- FIELDS:
--   dreamscape_id    UUID PK FK → dreamscapes (CASCADE)
--     The derived dreamscape. PK = only one origin record per dreamscape.
--     CASCADE DELETE — if the dreamscape is deleted, the origin record goes too.
--
--   source_output_id UUID FK nullable → output_variants (SET NULL)
--     The output variant this dreamscape was forked from. SET NULL on output
--     delete — the origin record persists so we know the dreamscape WAS derived,
--     even if the source output no longer exists. Nullable is intentional.
--
-- INSERT FLOW:
--   1. User clicks "Re-seed from this output" on output_variant X
--   2. App inserts dreamscape row (origin='derived')
--   3. App inserts dreamscape_origins row pointing at output_variant X
--   4. No transaction ordering issue — output already exists before step 2
--
-- DESIGN NOTES:
--   - Only exists for origin='derived' dreamscapes. Generated/imported dreamscapes
--     have no dreamscape_origins row. App must not assume row existence.
--   - This is a 1:1 extension of dreamscapes, not a junction table.
--   - Intentionally minimal — no updated_at/updated_by (the origin is immutable;
--     you cannot change which output a dreamscape was derived from after creation).
-- =============================================================================

CREATE TABLE IF NOT EXISTS storyweaver.dreamscape_origins (

  -- Identity (PK = FK — 1:1 with dreamscapes)
  dreamscape_id    UUID PRIMARY KEY
                   REFERENCES storyweaver.dreamscapes(id) ON DELETE CASCADE,

  -- Lineage pointer (nullable — source may be deleted)
  source_output_id UUID
                   REFERENCES storyweaver.output_variants(id) ON DELETE SET NULL,

  -- Audit (immutable record — no updated_at)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL

);

COMMENT ON TABLE storyweaver.dreamscape_origins IS
  'Lineage record for derived dreamscapes. Breaks the circular FK between '
  'dreamscapes and output_variants. Only exists for origin=''derived'' dreamscapes. '
  'source_output_id is SET NULL (not CASCADE) so we preserve the fact that the '
  'dreamscape was derived even after the source output is deleted.';


-- =============================================================================
-- TABLE: storyweaver.dreamscape_chunks
-- =============================================================================
--
-- DESCRIPTION:
--   A single ordered text segment within a dreamscape. Dreamscapes are composed
--   of 1..N chunks, displayed and edited in sequence. Each chunk is independently
--   versioned — an enhancement applied to chunk 2 does not create a new version
--   of chunk 1.
--
-- RELATIONSHIPS:
--   → dreamscapes (N:1, CASCADE DELETE)
--   ← dreamscape_chunk_versions (1:N, CASCADE DELETE)
--
-- FIELDS:
--   id              UUID PK DEFAULT gen_random_uuid()
--
--   dreamscape_id   UUID FK NOT NULL → dreamscapes (CASCADE)
--     The parent dreamscape. CASCADE DELETE — chunks are meaningless without
--     their container. Hard delete on dreamscape removes all chunks.
--
--   user_id         UUID FK NOT NULL → profiles (CASCADE)
--     Denormalized from dreamscapes.user_id for RLS efficiency. Allows
--     Supabase RLS to enforce row-level access on chunks without a JOIN.
--     Must always match dreamscapes.user_id — enforced by application logic.
--
--   position        SMALLINT NOT NULL
--     0-based display order of this chunk within the dreamscape. UNIQUE with
--     dreamscape_id — no two chunks in the same dreamscape share a position.
--     App must reorder contiguously after insert/delete (no gaps).
--
--   title           TEXT NOT NULL DEFAULT ''
--     Optional chunk heading. Usually empty — AI generates untitled chunks.
--     User may add a title for navigation in long dreamscapes.
--
--   body            TEXT NOT NULL DEFAULT ''
--     The narrative text of this chunk. The primary content. Versioned —
--     every edit inserts a new dreamscape_chunk_versions row and increments
--     current_version.
--
--   current_version SMALLINT NOT NULL DEFAULT 1
--     Monotonic counter for optimistic concurrency and version tracking.
--     Starts at 1 (the initial row created alongside a v1 chunk_versions entry).
--
-- BASE FIELDS: created_at, updated_at, created_by, updated_by, is_archived
--   is_archived: soft-delete a specific chunk (hide without deleting the dreamscape).
--   Archived chunks are excluded from display but their version history is preserved.
--
-- CONSTRAINTS:
--   UNIQUE (dreamscape_id, position) — no position collision within a dreamscape.
-- =============================================================================

CREATE TABLE IF NOT EXISTS storyweaver.dreamscape_chunks (

  -- Identity
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  dreamscape_id    UUID        NOT NULL REFERENCES storyweaver.dreamscapes(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES storyweaver.profiles(id) ON DELETE CASCADE,

  -- Ordering & content
  position         SMALLINT    NOT NULL,
  title            TEXT        NOT NULL DEFAULT '',
  body             TEXT        NOT NULL DEFAULT '',

  -- Versioning
  current_version  SMALLINT    NOT NULL DEFAULT 1,

  -- Base audit fields
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  is_archived      BOOLEAN     NOT NULL DEFAULT false,

  -- Constraints
  CONSTRAINT dreamscape_chunks_position_unique UNIQUE (dreamscape_id, position)

);

COMMENT ON TABLE storyweaver.dreamscape_chunks IS
  'Ordered text segments within a dreamscape. Versioned independently — '
  'edits to one chunk do not version others. user_id is denormalized from '
  'dreamscapes for RLS efficiency.';

COMMENT ON COLUMN storyweaver.dreamscape_chunks.position IS
  '0-based display order. UNIQUE within a dreamscape. App must maintain '
  'contiguous ordering (no gaps) after inserts and deletes.';

COMMENT ON COLUMN storyweaver.dreamscape_chunks.user_id IS
  'Denormalized from dreamscapes.user_id for RLS. Must always match parent. '
  'Enforced by application logic, not a DB constraint.';


-- =============================================================================
-- TABLE: storyweaver.dreamscape_chunk_versions
-- =============================================================================
--
-- DESCRIPTION:
--   Immutable version history for dreamscape_chunks. One row is created for
--   every version of a chunk's content — at creation (v1) and on every
--   subsequent edit or AI enhancement. This table is append-only; rows are
--   never updated or deleted (except via CASCADE when the chunk is deleted).
--
-- RELATIONSHIPS:
--   → dreamscape_chunks (N:1, CASCADE DELETE)
--
-- FIELDS:
--   id               UUID PK DEFAULT gen_random_uuid()
--
--   chunk_id         UUID FK NOT NULL → dreamscape_chunks (CASCADE)
--     The chunk this version belongs to.
--
--   version_num      SMALLINT NOT NULL
--     Sequential version number within this chunk. Starts at 1.
--     UNIQUE with chunk_id. Must match dreamscape_chunks.current_version
--     at the moment of insert (enforced by application logic).
--
--   title            TEXT NOT NULL DEFAULT ''
--     Snapshot of chunk title at this version.
--
--   body             TEXT NOT NULL DEFAULT ''
--     Snapshot of chunk body at this version. This is the primary historical
--     record. Users restore previous versions by reading this field.
--
--   change_source    change_source NOT NULL
--     What triggered this version:
--       'initial'     — the chunk was just created (v1 always has this)
--       'user_edit'   — user typed directly in the editor
--       'enhancement' — an AI enhancement goal was applied
--
--   enhancement_goal TEXT nullable
--     Which enhancement goal was applied (if change_source = 'enhancement').
--     Free text matching src/config/enhancement-goals.json IDs:
--     'vivid' | 'conflict' | 'believable' | 'stitch' | 'less-ai'.
--     Nullable — only set when change_source = 'enhancement'.
--
-- IMMUTABILITY:
--   No updated_at, updated_by, or is_archived — version rows never change.
--   Deleting the parent chunk cascades and removes all version history.
--
-- DESIGN NOTES:
--   - Restore flow: app reads body from the desired version_num row, writes
--     it back to dreamscape_chunks.body, increments current_version, and
--     inserts a new version row with change_source='user_edit'.
--   - No separate "restore" event type needed — a restore is semantically a
--     user edit with old content.
-- =============================================================================

CREATE TABLE IF NOT EXISTS storyweaver.dreamscape_chunk_versions (

  -- Identity
  id               UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id         UUID     NOT NULL REFERENCES storyweaver.dreamscape_chunks(id) ON DELETE CASCADE,
  version_num      SMALLINT NOT NULL,

  -- Content snapshot (immutable after insert)
  title            TEXT     NOT NULL DEFAULT '',
  body             TEXT     NOT NULL DEFAULT '',

  -- Change metadata
  change_source    storyweaver.change_source NOT NULL,
  enhancement_goal TEXT,

  -- Audit (immutable row — created_at only, no updated_at)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT chunk_versions_unique UNIQUE (chunk_id, version_num),
  CONSTRAINT chunk_versions_enhancement_goal_check
    CHECK (
      (change_source = 'enhancement' AND enhancement_goal IS NOT NULL)
      OR (change_source != 'enhancement' AND enhancement_goal IS NULL)
    )

);

COMMENT ON TABLE storyweaver.dreamscape_chunk_versions IS
  'Immutable version history for dreamscape_chunks. Append-only. '
  'One row per version per chunk. Enables full undo history and content restore. '
  'CASCADE deleted with parent chunk.';

COMMENT ON COLUMN storyweaver.dreamscape_chunk_versions.enhancement_goal IS
  'Which AI enhancement goal produced this version. Required when '
  'change_source=''enhancement'', must be NULL otherwise (CHECK enforced).';


-- =============================================================================
-- TABLE: storyweaver.output_variant_versions
-- =============================================================================
--
-- DESCRIPTION:
--   Immutable version history for output_variants. Mirrors the pattern of
--   dreamscape_chunk_versions. One row created at generation (v1) and on every
--   subsequent edit or AI transform. Enables users to see and restore previous
--   versions of their output text.
--
-- RELATIONSHIPS:
--   → output_variants (N:1, CASCADE DELETE)
--
-- FIELDS:
--   id                UUID PK DEFAULT gen_random_uuid()
--
--   output_variant_id UUID FK NOT NULL → output_variants (CASCADE)
--
--   version_num       SMALLINT NOT NULL
--     Sequential version number. Starts at 1. UNIQUE with output_variant_id.
--
--   title             TEXT NOT NULL DEFAULT ''
--     Snapshot of output title at this version.
--
--   body              TEXT NOT NULL
--     Snapshot of output body at this version. The primary historical record.
--     NOT NULL with no default — unlike chunks, a body-less output makes no sense.
--
--   change_source     change_source NOT NULL
--     What triggered this version:
--       'initial'   — the output was just generated (v1)
--       'user_edit' — user edited the text in the editor
--       'transform' — an AI part transform was applied
--
-- IMMUTABILITY:
--   No updated_at, updated_by, or is_archived. Rows never mutate.
--
-- DESIGN NOTES:
--   - rating, feedback, and notes are NOT versioned here — they change
--     independently of content (e.g., user rates output without editing it).
--     Those fields are tracked only via updated_at on the main table.
--   - Restore: same pattern as chunks — read body, write to main, increment
--     current_version, insert new version row with change_source='user_edit'.
-- =============================================================================

CREATE TABLE IF NOT EXISTS storyweaver.output_variant_versions (

  -- Identity
  id                UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  output_variant_id UUID     NOT NULL REFERENCES storyweaver.output_variants(id) ON DELETE CASCADE,
  version_num       SMALLINT NOT NULL,

  -- Content snapshot
  title             TEXT     NOT NULL DEFAULT '',
  body              TEXT     NOT NULL,

  -- Change metadata
  change_source     storyweaver.change_source NOT NULL,

  -- Audit (immutable row)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT output_variant_versions_unique UNIQUE (output_variant_id, version_num)

);

COMMENT ON TABLE storyweaver.output_variant_versions IS
  'Immutable version history for output_variants. Append-only. '
  'Tracks body + title changes from generation, user edits, and AI transforms. '
  'rating/feedback/notes changes are NOT versioned here — they are tracked '
  'by updated_at on output_variants.';

COMMENT ON COLUMN storyweaver.output_variant_versions.body IS
  'Full body snapshot. NOT NULL with no default — an empty output body is invalid. '
  'This differs from chunk_versions where empty body is valid during creation.';


-- =============================================================================
-- TABLE: storyweaver.performance_snapshots
-- =============================================================================
--
-- DESCRIPTION:
--   Records real-world performance metrics that the user manually enters after
--   publishing an output. Supports multiple platforms and cadences per output.
--   The metrics field is flexible JSONB — platform-specific keys (upvotes for
--   Reddit, views for TikTok/Reels, opens for email, etc.).
--
-- RELATIONSHIPS:
--   → output_variants (N:1, CASCADE DELETE)
--
-- FIELDS:
--   id                UUID PK DEFAULT gen_random_uuid()
--
--   output_variant_id UUID FK NOT NULL → output_variants (CASCADE)
--     The output this metric snapshot belongs to. CASCADE DELETE — snapshots
--     are meaningless without their output context.
--
--   user_id           UUID FK NOT NULL (RLS shortcut)
--     Denormalized from output_variants.user_id for RLS efficiency.
--
--   platform          TEXT NOT NULL
--     Where the output was published. CHECK constraint against known platforms.
--     An output can have snapshots on multiple platforms if cross-posted.
--
--   cadence           TEXT NOT NULL
--     The reporting window: 'day' (24h), 'week' (7d), 'month' (30d).
--     Determines which metrics are expected in the JSONB. Users log snapshots
--     at the cadence that matches their content's lifecycle.
--
--   metrics           JSONB NOT NULL
--     Platform-specific key-value metric payload. Schema varies by platform:
--       reddit:    { upvotes, comments, awards, crosspost_count }
--       reels:     { views, likes, shares, saves, reach, profile_visits }
--       tiktok:    { views, likes, shares, comments, profile_visits, watch_time_sec }
--       youtube:   { views, likes, comments, watch_time_min, subscribers_gained }
--       blog:      { page_views, unique_visitors, avg_time_on_page_sec, shares }
--       marketing: { opens, clicks, conversions, ctr_pct }
--       email:     { opens, clicks, replies, unsubscribes }
--     App validates structure before insert — DB stores whatever is provided.
--
--   recorded_at       TIMESTAMPTZ NOT NULL
--     The user-entered date/time this metric observation applies to (NOT the
--     insert time). E.g., "stats as of Monday 9am". Distinct from created_at.
--
-- BASE FIELDS: created_at, updated_at, created_by, updated_by, is_archived
--   updated_at: user may correct a metric entry after the fact.
--   is_archived: hide a snapshot that was entered in error without deleting it.
--
-- CONSTRAINTS:
--   UNIQUE (output_variant_id, platform, cadence, recorded_at)
--   Prevents duplicate snapshots for the same output + platform + window + date.
-- =============================================================================

CREATE TABLE IF NOT EXISTS storyweaver.performance_snapshots (

  -- Identity
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  output_variant_id UUID        NOT NULL REFERENCES storyweaver.output_variants(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES storyweaver.profiles(id) ON DELETE CASCADE,

  -- Snapshot dimensions
  platform          TEXT        NOT NULL,
  cadence           TEXT        NOT NULL,
  recorded_at       TIMESTAMPTZ NOT NULL,

  -- Metric payload (flexible, platform-specific)
  metrics           JSONB       NOT NULL,

  -- Base audit fields
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  updated_by        UUID REFERENCES storyweaver.profiles(id) ON DELETE SET NULL,
  is_archived       BOOLEAN     NOT NULL DEFAULT false,

  -- Constraints
  CONSTRAINT performance_snapshots_platform_check
    CHECK (platform IN ('reddit','reels','tiktok','youtube','blog','marketing','email','audio','video')),
  CONSTRAINT performance_snapshots_cadence_check
    CHECK (cadence IN ('day','week','month')),
  CONSTRAINT performance_snapshots_unique
    UNIQUE (output_variant_id, platform, cadence, recorded_at)

);

COMMENT ON TABLE storyweaver.performance_snapshots IS
  'User-entered real-world metrics for a published output variant. '
  'Flexible JSONB payload per platform. recorded_at is user-specified (observation time), '
  'distinct from created_at (insert time). Drives the analytics feedback loop.';

COMMENT ON COLUMN storyweaver.performance_snapshots.metrics IS
  'Platform-specific metric payload. See table comment for expected keys per platform. '
  'DB does not enforce JSONB structure — validation happens in the application layer '
  'before insert.';

COMMENT ON COLUMN storyweaver.performance_snapshots.recorded_at IS
  'User-specified date/time the metrics were observed (e.g. "stats as of Monday 9am"). '
  'NOT the insert time — that is created_at. These will differ when users backfill.';


-- =============================================================================
-- TRIGGERS
-- =============================================================================
--
-- DESCRIPTION:
--   Auto-maintain updated_at on every mutable table. A single trigger function
--   is shared across all tables.
--
-- TODO: Create trigger function and attach to all mutable tables.
-- =============================================================================

-- NOTE: set_updated_at() is defined at the top of this file, before all tables.

-- user_settings
CREATE OR REPLACE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON storyweaver.user_settings
  FOR EACH ROW EXECUTE FUNCTION storyweaver.set_updated_at();

-- dreamscapes
CREATE OR REPLACE TRIGGER trg_dreamscapes_updated_at
  BEFORE UPDATE ON storyweaver.dreamscapes
  FOR EACH ROW EXECUTE FUNCTION storyweaver.set_updated_at();

-- dreamscape_chunks
CREATE OR REPLACE TRIGGER trg_dreamscape_chunks_updated_at
  BEFORE UPDATE ON storyweaver.dreamscape_chunks
  FOR EACH ROW EXECUTE FUNCTION storyweaver.set_updated_at();

-- output_variants
CREATE OR REPLACE TRIGGER trg_output_variants_updated_at
  BEFORE UPDATE ON storyweaver.output_variants
  FOR EACH ROW EXECUTE FUNCTION storyweaver.set_updated_at();

-- performance_snapshots
CREATE OR REPLACE TRIGGER trg_performance_snapshots_updated_at
  BEFORE UPDATE ON storyweaver.performance_snapshots
  FOR EACH ROW EXECUTE FUNCTION storyweaver.set_updated_at();

-- profiles (extended — trigger may already exist from Phase 2a; OR REPLACE is safe)
CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON storyweaver.profiles
  FOR EACH ROW EXECUTE FUNCTION storyweaver.set_updated_at();


-- =============================================================================
-- INDEXES
-- =============================================================================
--
-- DESCRIPTION:
--   Postgres does not auto-index FK columns. All FK columns used in JOINs or
--   WHERE clauses need explicit indexes.
--
-- TODO: Create all indexes below.
-- =============================================================================

-- user_settings: no extra indexes needed (PK = user_id, all queries go by PK)

-- dreamscapes — primary access patterns: by user, by archive status
CREATE INDEX IF NOT EXISTS idx_dreamscapes_user_id
  ON storyweaver.dreamscapes(user_id);

-- Partial index: active dreamscapes only (most queries exclude archived rows)
CREATE INDEX IF NOT EXISTS idx_dreamscapes_user_active
  ON storyweaver.dreamscapes(user_id, created_at DESC)
  WHERE NOT is_archived;

-- dreamscape_origins — look up "which output was this dreamscape derived from?"
CREATE INDEX IF NOT EXISTS idx_dreamscape_origins_source_output_id
  ON storyweaver.dreamscape_origins(source_output_id);

-- dreamscape_chunks — primary access: all chunks for a dreamscape, ordered
CREATE INDEX IF NOT EXISTS idx_dreamscape_chunks_dreamscape_id_position
  ON storyweaver.dreamscape_chunks(dreamscape_id, position);

-- RLS shortcut index on user_id
CREATE INDEX IF NOT EXISTS idx_dreamscape_chunks_user_id
  ON storyweaver.dreamscape_chunks(user_id);

-- dreamscape_chunk_versions — "show version history for chunk X"
CREATE INDEX IF NOT EXISTS idx_chunk_versions_chunk_id_version
  ON storyweaver.dreamscape_chunk_versions(chunk_id, version_num DESC);

-- output_variants — primary access patterns: by user, by platform, by rating
CREATE INDEX IF NOT EXISTS idx_output_variants_user_id
  ON storyweaver.output_variants(user_id);

CREATE INDEX IF NOT EXISTS idx_output_variants_dreamscape_id
  ON storyweaver.output_variants(dreamscape_id);

-- Platform + user for filtered library views ("my Reddit outputs")
CREATE INDEX IF NOT EXISTS idx_output_variants_user_platform
  ON storyweaver.output_variants(user_id, platform)
  WHERE NOT is_archived;

-- Rating analytics: "what are my highest-rated outputs?"
CREATE INDEX IF NOT EXISTS idx_output_variants_user_rating
  ON storyweaver.output_variants(user_id, rating DESC)
  WHERE rating IS NOT NULL AND NOT is_archived;

-- Template analytics: "which outputs used template X?" (future feedback loop)
CREATE INDEX IF NOT EXISTS idx_output_variants_template_id
  ON storyweaver.output_variants(template_id)
  WHERE template_id IS NOT NULL;

-- output_variant_versions — "show version history for output X"
CREATE INDEX IF NOT EXISTS idx_output_variant_versions_variant_id_version
  ON storyweaver.output_variant_versions(output_variant_id, version_num DESC);

-- performance_snapshots — "all snapshots for output X" and "all snapshots for user Y"
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_output_variant_id
  ON storyweaver.performance_snapshots(output_variant_id);

CREATE INDEX IF NOT EXISTS idx_performance_snapshots_user_id
  ON storyweaver.performance_snapshots(user_id);

-- Platform analytics: "my Reddit performance over time"
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_user_platform_recorded
  ON storyweaver.performance_snapshots(user_id, platform, recorded_at DESC)
  WHERE NOT is_archived;


-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
--
-- PATTERN: Users can only access their own rows (auth.uid() = user_id).
--          Admins bypass RLS via service role key (used server-side only).
--          All client-side queries go through Supabase anon/user key — RLS enforced.
--
-- TODO: Enable RLS and create policies for all tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------------

ALTER TABLE storyweaver.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can read and write only their own settings row
CREATE POLICY "user_settings: owner access"
  ON storyweaver.user_settings FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- dreamscapes
-- ---------------------------------------------------------------------------

ALTER TABLE storyweaver.dreamscapes ENABLE ROW LEVEL SECURITY;

-- Users can access only their own dreamscapes (active + archived)
CREATE POLICY "dreamscapes: owner access"
  ON storyweaver.dreamscapes FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- dreamscape_origins
-- ---------------------------------------------------------------------------
--
-- NOTE: dreamscape_origins has no user_id column. RLS is enforced by checking
-- ownership of the parent dreamscape via a subquery. This is slightly more
-- expensive than a direct user_id check, but the table is small (1 row per
-- derived dreamscape) and the query pattern is always by dreamscape_id.

ALTER TABLE storyweaver.dreamscape_origins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dreamscape_origins: owner access via dreamscape"
  ON storyweaver.dreamscape_origins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM storyweaver.dreamscapes d
      WHERE d.id = dreamscape_id
        AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM storyweaver.dreamscapes d
      WHERE d.id = dreamscape_id
        AND d.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- dreamscape_chunks
-- ---------------------------------------------------------------------------

ALTER TABLE storyweaver.dreamscape_chunks ENABLE ROW LEVEL SECURITY;

-- user_id is denormalized here for efficient RLS (no JOIN needed)
CREATE POLICY "dreamscape_chunks: owner access"
  ON storyweaver.dreamscape_chunks FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- dreamscape_chunk_versions
-- ---------------------------------------------------------------------------
--
-- NOTE: No user_id column on version tables — they are immutable history rows.
-- RLS via parent chunk's user_id. Insertions happen server-side (API routes)
-- using the service role key, which bypasses RLS. Client-side reads (for
-- showing version history) go through a server component or API route that
-- validates ownership before querying.
--
-- Approach: Enable RLS but allow reads via parent ownership check.
-- Writes are service-role-only (bypasses RLS) — clients never INSERT versions directly.

ALTER TABLE storyweaver.dreamscape_chunk_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chunk_versions: owner read via chunk"
  ON storyweaver.dreamscape_chunk_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM storyweaver.dreamscape_chunks c
      WHERE c.id = chunk_id
        AND c.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policy for client — all mutations are server-side only.

-- ---------------------------------------------------------------------------
-- output_variants
-- ---------------------------------------------------------------------------

ALTER TABLE storyweaver.output_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "output_variants: owner access"
  ON storyweaver.output_variants FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- output_variant_versions
-- ---------------------------------------------------------------------------
--
-- Same pattern as chunk_versions: no user_id, reads via parent ownership,
-- writes are service-role-only.

ALTER TABLE storyweaver.output_variant_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "output_variant_versions: owner read via variant"
  ON storyweaver.output_variant_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM storyweaver.output_variants v
      WHERE v.id = output_variant_id
        AND v.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- performance_snapshots
-- ---------------------------------------------------------------------------

ALTER TABLE storyweaver.performance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "performance_snapshots: owner access"
  ON storyweaver.performance_snapshots FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
