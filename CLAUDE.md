# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

- **[docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md)**: ⭐ **ALWAYS READ FIRST** - Significant architectural decisions (feature flags in Settings, no URL params, code style, etc.)
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: File structure, key concepts (Dreamscapes, Intensity Dials, Presets), data model, mock API layer
- **[docs/WORKFLOWS.md](docs/WORKFLOWS.md)**: CreatePage 4-step flow, LibraryPage, SettingsPage, data flow diagrams
- **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)**: Colors, typography, spacing, component patterns, animations
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)**: Running the app, code style, common tasks, testing, migration to production
- **[execution_docs/_active/](execution_docs/_active/)**: Active planning and execution tracking

## Project Overview

**StoryWeaver** - Next.js story generation tool for creating platform-optimized narrative content (Reddit, Reels, TikTok, YouTube, Marketing, etc.).

**Current State**: Full Next.js 15 app with real OpenAI API integration (`gpt-4o`). Auth and Supabase persistence are stubbed (Phase 2). Data stored in localStorage for now.

**Stack**: Next.js 15 + React 19 + TypeScript + Tailwind CSS + Zustand + Radix UI + OpenAI SDK + Zod

## Development Commands

```bash
pnpm dev      # Start dev server
pnpm build    # Build for production
pnpm lint     # Lint
```

## Critical Rules

### ✅ DO

- Read **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** first to understand file structure and key concepts
- Use **Glob/Grep** for code search across `src/`
- Update `execution_docs/_active/execution.md` in real-time when working
- Follow the design system in **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)**
- Use TypeScript — the codebase is fully typed

### ❌ NEVER

- Skip execution doc updates
- Code without planning in `execution_docs/_active/planning.md`
- Use semicolons (codebase uses ASI)

## Session Management

**IMPORTANT**: At the start of each new session:

1. **Check for archived docs needing rename**:
   ```bash
   ls execution_docs/archive/*to-be-renamed.md
   ```

2. **Read archived docs** to understand previous work:
   - Check commit info header (first 5 lines)
   - Read full content to understand what was accomplished

3. **Rename archived files** based on task content:
   ```
   Format: YYYY-MM-DD-[commit-id]-[descriptive-task-name].md

   Example:
   2025-02-26-a3f8c9d-planning-to-be-renamed.md
   → 2025-02-26-a3f8c9d-add-backend-api.md
   ```

4. **Carry forward incomplete tasks** to new `execution_docs/_active/execution.md`

## Workflow

### Starting a New Task

1. **Plan** → `execution_docs/_active/planning.md`
   - Document approach, alternatives, rationale
   - Get user approval before coding

2. **Execute** → `execution_docs/_active/execution.md`
   - Track tasks in real-time (✅ Completed, 🔄 In Progress, ⏳ Pending)
   - Note files changed, issues, developer actions needed
   - Update as you work

3. **Commit** → User commits (both planning and execution docs included)
   - Post-commit hook archives docs to `execution_docs/archive/`
   - Hook resets templates in `execution_docs/_active/`
   - Hook adds archived docs to git (amends commit)
   - **Next session**: Rename archived files based on task

### Husky Post-Commit Hook

Automatically archives and resets docs after commit:

```bash
# Archives (if substantial content):
execution_docs/_active/planning.md
  → execution_docs/archive/YYYY-MM-DD-[hash]-planning-to-be-renamed.md

execution_docs/_active/execution.md
  → execution_docs/archive/YYYY-MM-DD-[hash]-execution-to-be-renamed.md

# Resets templates in execution_docs/_active/
# Amends commit to include archived docs + reset templates
```

## File Structure

```
src/
├── app/
│   ├── api/                          # Next.js API routes (server-side LLM calls)
│   │   ├── dreamscapes/generate/     # POST - generate story seeds
│   │   ├── dreamscapes/enhance/      # POST - enhance/stitch seeds
│   │   ├── outputs/generate/         # POST - generate 3 story variants
│   │   └── parts/transform/          # POST - transform studio parts
│   └── app/
│       ├── create/page.tsx           # CreatePage (4-step seed→output flow)
│       ├── library/page.tsx          # LibraryPage (saved items + performance)
│       ├── settings/page.tsx         # SettingsPage
│       └── studio/page.tsx           # StudioPage (project/part management)
├── components/
│   ├── create/                       # Template gallery components
│   ├── design-system/                # Shared UI (CopyButton, Slider, Toast, etc.)
│   ├── studio/                       # Studio-specific components
│   └── ui/                           # Radix-based primitives (Button, Card, etc.)
├── config/
│   ├── presets.json / dials.json / platforms.json / ...
│   └── templates/                    # ~50 templates across 6 categories
│       ├── reddit/                   # aitah, tifu, nosleep, petty-revenge, writing-prompts
│       ├── short-form/               # TikTok/Reels story types
│       ├── long-form/                # YouTube formats
│       ├── marketing/                # Brand, email, landing page, etc.
│       ├── audio-production/         # Podcast, voiceover, etc.
│       └── video-production/         # Shot lists, storyboards, etc.
├── lib/
│   ├── adapters/
│   │   ├── openai.ts                 # ✅ REAL - gpt-4o with Zod structured outputs
│   │   └── mock.ts                   # Toggle via NEXT_PUBLIC_USE_MOCK_ADAPTER=true
│   ├── persistence/
│   │   ├── local.ts                  # ✅ ACTIVE - localStorage
│   │   └── supabase.ts               # 🚧 STUB - Phase 2
│   ├── auth/context.tsx              # 🚧 STUB - always guest, Phase 2
│   ├── prompt-builders.ts            # Prompt construction logic
│   ├── types.ts                      # All TypeScript types
│   └── env.ts                        # Env vars (OPENAI_API_KEY, Supabase keys)
├── store/app-store.ts                # Zustand global state
└── hooks/usePromptInspector.ts       # Dev tool for inspecting prompts

docs/
├── ARCHITECTURE.md          # File structure, concepts, data model
├── WORKFLOWS.md             # Page flows, data flow diagrams
├── DESIGN_SYSTEM.md         # Colors, typography, patterns
└── DEVELOPMENT.md           # Setup, common tasks, migration

execution_docs/
├── _active/
│   ├── planning.md          # Current task planning
│   └── execution.md         # Current task execution tracking
└── archive/                 # Archived docs (renamed after commit)

.husky/
└── post-commit              # Auto-archives docs after commit
```

## Key Concepts (Quick Reference)

**Dreamscapes**: Story seeds with multiple chunks that can be enhanced or stitched together.

**Intensity Dials**: 7-dimensional control (stakes, darkness, pace, twist, realism, catharsis, moral clarity).

**Presets**: Pre-configured dial + platform + format combinations (Reddit AITAH, Petty Revenge, etc.).

**Enhancement Goals**: Transformations (vivid, conflict, believable, stitch, less-ai).

**Multi-Variant Generation**: Generates 3 variants per prompt (Balanced, More Intense, More Believable).

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for detailed explanations.

## Common Tasks

### Adding a Preset
```typescript
// Edit src/config/presets.json
{ "id": "new-preset", "name": "...", "intensity": { ... } }
```

### Adding an Enhancement Goal
```typescript
// 1. Edit src/config/enhancement-goals.json
{ "id": "humor", "label": "Add humor", "icon": "😂" }

// 2. Add goal prompt in src/lib/adapters/openai.ts → enhanceDreamscape()
const goalPrompts = { humor: `System prompt for humor enhancement...` }
```

### Adding a Template
```bash
# Add JSON file to appropriate category:
src/config/templates/{category}/{template-name}.json
```

### Adding a Dial
```typescript
// 1. Edit src/config/dials.json
// 2. Update IntensityValues type in src/lib/types.ts
// 3. Update buildIntensityPrompt() in src/lib/adapters/openai.ts
// 4. Add to all preset intensity objects in presets.json
```

See **[docs/DEVELOPMENT.md § Common Development Tasks](docs/DEVELOPMENT.md#common-development-tasks)** for detailed examples.

## Data Model

### localStorage Keys (Phase 1 — active)

```typescript
sg_dreamscapes: Array<Dreamscape>
sg_outputs: Array<OutputVariant>
sg_settings: AppSettings
```

Types defined in `src/lib/types.ts`. See **[docs/ARCHITECTURE.md § Data Model](docs/ARCHITECTURE.md#data-model)** for full type definitions.

## Design System

**Colors**: Dark blue-black bg (`#080c14`), translucent slate cards, indigo primary (`#6366f1`)

**Typography**: DM Sans font, text-sm default (14px)

**Spacing**: p-6 cards (24px), gap-3/gap-4 for sections (12px/16px)

See **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** for complete system.

## Phase Status

| Phase | What | Status |
|-------|------|--------|
| ✅ Phase 1 | Next.js app + real OpenAI API (`gpt-4o`) | Done |
| ✅ Phase 1 | localStorage persistence + adapter pattern | Done |
| ✅ Phase 2a | Supabase auth (Google OAuth + email/password) | Done |
| 🚧 Phase 2b | Supabase DB persistence (design ERD first) | Not started |
| 🚧 Phase 3 | Billing / usage metering | Not started |

## Auth & Environment

### Local dev (mock login)
```
NEXT_PUBLIC_ENABLE_AUTH=false   # shows mock role picker on /auth/login
ENABLE_AUTH=false               # middleware passes through, no session required
```

### Production (Vercel)
```
NEXT_PUBLIC_ENABLE_AUTH=true    # shows real Google + email/password login UI
ENABLE_AUTH=true                # middleware enforces /app/* protection at runtime
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Key distinction**: `NEXT_PUBLIC_*` vars are baked at build time (client UI). `ENABLE_AUTH` has no prefix so middleware reads it fresh at runtime — this is why auth enforcement actually works on Vercel.

### Supabase setup
- Project: shared with another app, isolated via `storyweaver` schema
- `profiles` table: `id`, `email`, `role` (`normal`/`admin`/`dev`), `created_at`
- Profile created on first login via `/auth/callback`
- Bootstrap admin: `UPDATE storyweaver.profiles SET role = 'admin' WHERE email = 'your@email.com';`

See **[docs/ARCHITECTURE.md § Migration Path](docs/ARCHITECTURE.md#migration-path-to-real-backend)** for detailed steps.

## Remember

1. **Read docs first** - ARCHITECTURE.md has all the details
2. **Update execution docs** - Track progress in real-time
3. **Plan before coding** - Use execution_docs/_active/planning.md
4. **No semicolons** - Codebase uses ASI
5. **TypeScript** - All new code must be typed
6. **Rename archived docs** - At start of each session

## Additional Resources

- **Architecture & Concepts**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Workflows & Patterns**: [docs/WORKFLOWS.md](docs/WORKFLOWS.md)
- **Design System**: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- **Development Guide**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
