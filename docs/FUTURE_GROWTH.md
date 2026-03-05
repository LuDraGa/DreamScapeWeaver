# Future Growth — Deferred Architecture & Product Decisions

This file captures architectural ideas and product decisions that are intentionally deferred.
Referenced from CLAUDE.md. Do not implement anything here without explicit planning.

---

## 1. Projects Feature — DB Upgrade Path

When we introduce Projects (scoping a user's work into named campaigns/ideas with a dashboard):

**New table required:**
```sql
storyweaver.projects
  id           UUID PK
  user_id      UUID FK → profiles (CASCADE)
  title        TEXT NOT NULL
  description  TEXT
  status       TEXT DEFAULT 'active'  -- 'active' | 'archived'
  created_at   TIMESTAMPTZ
  updated_at   TIMESTAMPTZ
```

**Additive migrations on existing tables (nullable — non-breaking):**
```sql
ALTER TABLE dreamscapes     ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL
ALTER TABLE output_variants ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL
```

`ON DELETE SET NULL` is deliberate — deleting a project never deletes the user's content.

TypeScript types already have `projectId?: string` on both `Dreamscape` and `OutputVariant` — no type changes needed.

### Comparison groups within a project

For "named groupings" within a project (e.g., "Round 1 Reddit attempts" vs "Round 2 TikTok scripts"):

```sql
storyweaver.project_collections
  id          UUID PK
  project_id  UUID FK → projects (CASCADE)
  user_id     UUID FK (RLS)
  title       TEXT NOT NULL
  created_at  TIMESTAMPTZ

-- output_variants gets:
collection_id UUID REFERENCES project_collections(id) ON DELETE SET NULL
```

**Key principle: defer this until you see how users actually group content.**
Don't pre-build comparison UI before real usage data shows what groupings users naturally want.

---

## 2. Analytics Feedback Loop — generation_events Table

When scale is high enough (meaningful query volume across many users), add a flat analytics table:

```sql
storyweaver.generation_events
  id                UUID PK
  user_id           UUID FK → profiles
  output_variant_id UUID FK → output_variants (CASCADE)
  preset_id         TEXT NOT NULL  -- extracted from dial_state for fast GROUP BY
  platform          TEXT NOT NULL  -- extracted from dial_state
  dial_state        JSONB NOT NULL  -- full snapshot
  rating            SMALLINT       -- denormalized from output_variants
  peak_metric_value INTEGER        -- best metric value ever recorded for this output
  created_at        TIMESTAMPTZ
```

**Why deferred:** This table is only valuable when aggregate queries across many rows are needed.
For early-stage usage, the existing `output_variants.dial_state` + `rating` + `performance_snapshots` tables already contain all the raw data — you can query them directly. The `generation_events` table is a materialized analytics layer for when joins become expensive.

### The full feedback loop (product vision)

```
Generated output → User rates it (1-5) → User logs real-world perf metrics
        ↓
Correlate: which dial config → high rating + high perf?
        ↓
Surface: suggested dial defaults, smarter preset recommendations per user
```

Queries that enable this (all achievable against existing schema):
- "Your top-performing presets" → GROUP BY `dial_state->>'presetId'` WHERE rating >= 4
- "Dial settings that work for Reddit" → filter `dial_state->>'platform' = 'reddit'` + high rating
- "Feedback chip trends" → aggregate `feedback[]` array elements per user over time

These are Phase 3+ product features. The schema already captures everything needed.

---

## 3. Audit Trail / Row Versioning

**Implemented in Phase 2b** — versioning is live for the two tables that matter most:

- `dreamscape_chunk_versions` — immutable history per chunk edit/enhancement
- `output_variant_versions` — immutable history per output edit/transform

Both follow the same pattern: main table holds current state (fast reads), `_versions` table is
append-only with `version_num`, `change_source`, and full content snapshot. `current_version`
on the main table is a monotonic counter for optimistic concurrency.

Restore flow: read body from desired `version_num` row → write to main table → increment
`current_version` → insert new version row (`change_source='user_edit'`).

**Still deferred** — full audit trail for admin/billing (profiles changes, role changes,
payment events). `created_by` / `updated_by` on all tables provides lightweight audit for now.

---

## 4. Studio Parts Persistence

The Studio page (`/app/studio`) manages "parts" but its data model is not yet well-defined.
Do not design or implement the `parts` table until the Studio feature is more stable.

Once Studio's data model is clear, `parts` will likely need:
- `project_id` FK (once Projects ships)
- `output_variant_id` FK (linking part to a generated output)
- `transform_history` JSONB (audit of part transformations)

---

## 5. Billing & Usage Metering (Phase 3)

- Stripe integration for Pro tier
- `usage_events` table: track API calls (OpenAI token usage) per user per day
- `subscriptions` table: FK to profiles, Stripe subscription ID, tier, limits
- Free tier: N generations/month; Pro tier: unlimited or higher cap

No schema design needed until Phase 3 begins.
