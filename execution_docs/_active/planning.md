# Planning: Phase 2b RDBMS Schema — ERD Revision

**Started:** 2026-03-05
**Context:** User reviewed the FigJam ERD and requested 5 targeted improvements. This doc captures the full design before FigJam update and SQL generation.

---

## Scope of Changes

1. Resolve circular FK between dreamscapes ↔ output_variants
2. Universal base fields on all tables (created_at, updated_at, created_by, updated_by, is_archived)
3. output_variants.feedback: TEXT[] → TEXT nullable (UI enforces 1000 char)
4. Versioning: dreamscape_chunks + output_variants get immutable version history tables
5. Promote platform + format + template_id onto output_variants (extracted from dial_state JSONB)
6. Add CHECK constraints on origin, cadence, platform

---

## Decision: Circular FK Resolution

**Problem:**
- `dreamscapes.source_output_id → output_variants.id` (nullable SET NULL)
- `output_variants.dreamscape_id → dreamscapes.id` (nullable SET NULL)
These two FKs form a cycle. Insert order is ambiguous for derived dreamscapes.

**Options considered:**
- Deferred constraints (DEFERRABLE INITIALLY DEFERRED) — keeps schema simple but requires all derived-dreamscape inserts to be wrapped in explicit transactions. Easy to miss in app code.
- Separate lineage table — breaks cycle completely, no special transaction handling, extensible.

**Decision: separate `dreamscape_origins` table**
- Remove `dreamscapes.source_output_id`
- Add `storyweaver.dreamscape_origins (dreamscape_id PK FK, source_output_id FK nullable SET NULL)`
- 1:1 extension — only exists for dreamscapes with `origin = 'derived'`
- If source output is deleted: `source_output_id` goes NULL, row stays (you know it was derived, reference is lost)
- No circular FK anywhere in schema
- Insert flow: insert dreamscape → insert dreamscape_origins row referencing an existing output

---

## Decision: Base Fields Pattern

All tables get:
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()   -- auto-updated by trigger
created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
is_archived BOOLEAN NOT NULL DEFAULT false
```

**profiles edge case:** `created_by` is a self-reference (the user doesn't exist yet during insert).
Resolution: `created_by` is nullable on profiles. Set to self after profile creation, or leave NULL for system-created profiles.

**Version tables** (dreamscape_chunk_versions, output_variant_versions) are **immutable** — they get `created_at` + `created_by` only. No `updated_at`, `updated_by`, `is_archived` — a version row never changes.

**user_settings** gets `created_at` added (currently missing). The lazy-creation pattern stays for now.

---

## Decision: Versioning

**What gets versioned:**
- `dreamscape_chunks` — body + title change when user edits or enhancement is applied
- `output_variants` — body + title change when user edits or transform is applied
- dreamscapes title changes are lower stakes; deferred

**Pattern:** current state stays on main table, history in separate `_versions` table.

Main tables get: `current_version SMALLINT NOT NULL DEFAULT 1`

```sql
-- Chunk versions
CREATE TABLE storyweaver.dreamscape_chunk_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id         UUID NOT NULL REFERENCES dreamscape_chunks(id) ON DELETE CASCADE,
  version_num      SMALLINT NOT NULL,
  title            TEXT NOT NULL DEFAULT '',
  body             TEXT NOT NULL DEFAULT '',
  change_source    TEXT NOT NULL,          -- 'initial' | 'user_edit' | 'enhancement'
  enhancement_goal TEXT,                   -- nullable — which goal ('vivid', 'conflict', etc.)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE (chunk_id, version_num)
);

-- Output variant versions
CREATE TABLE storyweaver.output_variant_versions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  output_variant_id UUID NOT NULL REFERENCES output_variants(id) ON DELETE CASCADE,
  version_num       SMALLINT NOT NULL,
  title             TEXT NOT NULL DEFAULT '',
  body              TEXT NOT NULL,
  change_source     TEXT NOT NULL,          -- 'initial' | 'user_edit' | 'transform'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE (output_variant_id, version_num)
);
```

**Version lifecycle:**
1. On create: insert main row (current_version = 1) + insert version row (version_num = 1, change_source = 'initial')
2. On edit: increment current_version on main row, insert new version row
3. On restore: treat restore as a new edit — insert new version row with body = old version's body

---

## Decision: feedback field

`output_variants.feedback`: `TEXT[] NOT NULL DEFAULT {}` → `TEXT nullable`
No constraint. Free-form. UI enforces 1000 char max. No default.

---

## Decision: Promoted fields on output_variants

Extract from dial_state JSONB to first-class columns:
- `platform TEXT NOT NULL` — enables fast GROUP BY without JSONB extraction
- `format TEXT NOT NULL` — the specific format/template type
- `template_id TEXT` — nullable, the exact template config used

Keep `dial_state JSONB NOT NULL` — still the full snapshot. Promoted columns are denormalized for queryability.

---

## Decision: CHECK Constraints

```sql
-- dreamscapes.origin
CHECK (origin IN ('generated', 'derived', 'imported'))

-- performance_snapshots.cadence
CHECK (cadence IN ('day', 'week', 'month'))

-- performance_snapshots.platform
CHECK (platform IN ('reddit', 'reels', 'tiktok', 'youtube', 'blog', 'marketing', 'email'))
```

---

## Full Updated Schema

### storyweaver.profiles (modified)
```
id          UUID PK
email       TEXT UNIQUE NOT NULL
role        user_role NOT NULL DEFAULT 'normal'
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
created_by  UUID nullable FK → self (set after creation)
updated_by  UUID nullable FK → self
is_archived BOOLEAN NOT NULL DEFAULT false
```

### storyweaver.user_settings (modified)
```
user_id         UUID PK FK → profiles (CASCADE)
avoid_phrases   TEXT[] NOT NULL DEFAULT {}
default_preset  TEXT NOT NULL DEFAULT 'reddit-aitah'
power_user_mode BOOLEAN NOT NULL DEFAULT false
auto_avoid_ai   BOOLEAN NOT NULL DEFAULT true
developer_mode  BOOLEAN NOT NULL DEFAULT false
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()   [NEW]
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
created_by      UUID FK nullable
updated_by      UUID FK nullable
is_archived     BOOLEAN NOT NULL DEFAULT false       [NEW]
```

### storyweaver.dreamscapes (modified)
```
id              UUID PK DEFAULT gen_random_uuid()
user_id         UUID FK NOT NULL → profiles (CASCADE)
title           TEXT NOT NULL DEFAULT ''
origin          TEXT NOT NULL DEFAULT 'generated'    CHECK (IN ('generated','derived','imported'))
current_version SMALLINT NOT NULL DEFAULT 1          [NEW]
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
created_by      UUID FK nullable
updated_by      UUID FK nullable
is_archived     BOOLEAN NOT NULL DEFAULT false       [NEW]
-- REMOVED: source_output_id (moved to dreamscape_origins)
```

### storyweaver.dreamscape_origins (NEW)
```
dreamscape_id    UUID PK FK → dreamscapes (CASCADE)
source_output_id UUID FK nullable → output_variants (SET NULL)
created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
created_by       UUID FK nullable
```
1:1 with dreamscapes. Only exists when origin = 'derived'. Breaks the circular FK.

### storyweaver.dreamscape_chunks (modified)
```
id              UUID PK DEFAULT gen_random_uuid()
dreamscape_id   UUID FK NOT NULL → dreamscapes (CASCADE)
user_id         UUID FK NOT NULL (RLS shortcut)
position        SMALLINT NOT NULL
title           TEXT NOT NULL DEFAULT ''
body            TEXT NOT NULL DEFAULT ''
current_version SMALLINT NOT NULL DEFAULT 1          [NEW]
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
created_by      UUID FK nullable
updated_by      UUID FK nullable
is_archived     BOOLEAN NOT NULL DEFAULT false       [NEW]
UNIQUE (dreamscape_id, position)
```

### storyweaver.dreamscape_chunk_versions (NEW)
```
id               UUID PK DEFAULT gen_random_uuid()
chunk_id         UUID FK NOT NULL → dreamscape_chunks (CASCADE)
version_num      SMALLINT NOT NULL
title            TEXT NOT NULL DEFAULT ''
body             TEXT NOT NULL DEFAULT ''
change_source    TEXT NOT NULL    -- 'initial' | 'user_edit' | 'enhancement'
enhancement_goal TEXT nullable   -- 'vivid' | 'conflict' | 'believable' | 'stitch' | 'less-ai'
created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
created_by       UUID FK nullable
UNIQUE (chunk_id, version_num)
```

### storyweaver.output_variants (modified)
```
id              UUID PK DEFAULT gen_random_uuid()
user_id         UUID FK NOT NULL → profiles (CASCADE)
dreamscape_id   UUID FK nullable → dreamscapes (SET NULL)
platform        TEXT NOT NULL                        [NEW — promoted from dial_state]
format          TEXT NOT NULL                        [NEW — promoted from dial_state]
template_id     TEXT nullable                        [NEW]
title           TEXT NOT NULL DEFAULT ''
body            TEXT NOT NULL
dial_state      JSONB NOT NULL
rating          SMALLINT nullable CHECK (rating BETWEEN 1 AND 5)
feedback        TEXT nullable                        [CHANGED from TEXT[]]
notes           TEXT nullable
current_version SMALLINT NOT NULL DEFAULT 1          [NEW]
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
created_by      UUID FK nullable
updated_by      UUID FK nullable
is_archived     BOOLEAN NOT NULL DEFAULT false       [NEW]
```

### storyweaver.output_variant_versions (NEW)
```
id                UUID PK DEFAULT gen_random_uuid()
output_variant_id UUID FK NOT NULL → output_variants (CASCADE)
version_num       SMALLINT NOT NULL
title             TEXT NOT NULL DEFAULT ''
body              TEXT NOT NULL
change_source     TEXT NOT NULL    -- 'initial' | 'user_edit' | 'transform'
created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
created_by        UUID FK nullable
UNIQUE (output_variant_id, version_num)
```

### storyweaver.performance_snapshots (modified)
```
id                UUID PK DEFAULT gen_random_uuid()
output_variant_id UUID FK NOT NULL → output_variants (CASCADE)
user_id           UUID FK NOT NULL (RLS shortcut)
cadence           TEXT NOT NULL    CHECK (IN ('day','week','month'))
platform          TEXT NOT NULL    CHECK (IN ('reddit','reels','tiktok','youtube','blog','marketing','email'))
metrics           JSONB NOT NULL
recorded_at       TIMESTAMPTZ NOT NULL
created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()  [NEW]
created_by        UUID FK nullable
updated_by        UUID FK nullable
is_archived       BOOLEAN NOT NULL DEFAULT false      [NEW]
UNIQUE (output_variant_id, platform, cadence, recorded_at)
```

---

## Relationship Summary

```
profiles → user_settings          1:1  CASCADE (lazy creation)
profiles → dreamscapes            1:N  CASCADE
profiles → output_variants        1:N  CASCADE
dreamscapes → dreamscape_chunks   1:N  CASCADE
dreamscapes → dreamscape_origins  1:1  CASCADE (only for origin='derived')
dreamscape_origins → output_variants  N:1  SET NULL
output_variants → dreamscapes     N:1  SET NULL (core generation relationship)
output_variants → performance_snapshots  1:N  CASCADE
output_variants → output_variant_versions  1:N  CASCADE
dreamscape_chunks → dreamscape_chunk_versions  1:N  CASCADE
```
No circular FKs.

---

## FigJam Update Plan

The Figma MCP's generate_diagram does NOT support ERD syntax — only flowchart/sequence/state/gantt.
Resolution: generate a relationship flowchart in FigJam as a supplementary view (shows tables and relationships),
plus provide the user with the exact cell-by-cell changes to make to the existing ERD manually.

---

## Status

- [x] Design complete
- [ ] User approval
- [ ] FigJam flowchart generated
- [ ] FigJam ERD manual update instructions provided
- [ ] SQL migration script written (future task)
