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

**StoryWeaver** - React-based story generation tool for creating platform-optimized narrative content (Reddit, Reels, TikTok, etc.).

**Current State**: Single-file React prototype (`GenAI Story Generator.jsx`, ~1100 lines) with mock API layer. No backend integration yet.

**Stack**: React 19 + Vanilla JavaScript (JSX) + Inline Tailwind CSS

## Development Commands

```bash
# This is a single-file prototype - no build step yet
# See docs/DEVELOPMENT.md for setup options

# When you add package.json dependencies:
npm install               # Install dependencies
npm run prepare           # Setup husky (done automatically)
```

## Critical Rules

### ✅ DO

- Read **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** first to understand file structure and key concepts
- Use **grep** for code search (single file, ~1100 lines)
  ```bash
  grep -n "function CreatePage" "GenAI Story Generator.jsx"
  grep -n "useState" "GenAI Story Generator.jsx"
  ```
- Update `execution_docs/_active/execution.md` in real-time when working
- Follow the design system in **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)**

### ❌ NEVER

- Skip execution doc updates
- Code without planning in `execution_docs/_active/planning.md`
- Use semicolons (entire file uses ASI)
- Break the single-file structure unless explicitly migrating to production

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
GenAI Story Generator.jsx    # Entire application (~1100 lines)

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

package.json                 # Minimal (just husky)
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
```javascript
// Add to PRESETS array (line 7)
{ id: "new-preset", name: "...", intensity: { ... } }
```

### Adding an Enhancement Goal
```javascript
// Add to ENHANCEMENT_GOALS (line 59)
{ id: "humor", label: "Add humor", icon: "😂" }

// Update enhanceDreamscape() (line 170)
const suffixes = { humor: "\n\nAnd then..." }
```

### Adding a Dial
```javascript
// 1. Add to DIALS (line 42)
// 2. Add to all preset intensity objects
// 3. Add slider in CreatePage advanced section
```

See **[docs/DEVELOPMENT.md § Common Development Tasks](docs/DEVELOPMENT.md#common-development-tasks)** for detailed examples.

## Code Search

Since this is a single file, use simple grep:

```bash
# Find component
grep -n "function CreatePage" "GenAI Story Generator.jsx"

# Find all state
grep -n "useState" "GenAI Story Generator.jsx"

# Find localStorage
grep -n "localStorage" "GenAI Story Generator.jsx"

# Find presets
grep -n "PRESETS\|intensity:" "GenAI Story Generator.jsx"
```

### Line Number Reference

```
7-79:    CONFIG DATA (presets, platforms, dials, etc.)
85-192:  MOCK API LAYER (generate functions)
197-202: LOCAL STORAGE (load/save)
207-232: APP CONTEXT (global state)
238-297: UI COMPONENTS (icons, buttons, etc.)
325-814: CreatePage (main workflow)
815-972: LibraryPage (saved items)
973-1027: SettingsPage (preferences)
1029-1101: StoryGeneratorApp (navigation, sidebar)
```

## Data Model

### localStorage Keys

```typescript
sg_dreamscapes: Array<Dreamscape>
sg_outputs: Array<Output>
sg_settings: Settings
```

See **[docs/ARCHITECTURE.md § Data Model](docs/ARCHITECTURE.md#data-model)** for full type definitions.

## Design System

**Colors**: Dark blue-black bg (`#080c14`), translucent slate cards, indigo primary (`#6366f1`)

**Typography**: DM Sans font, text-sm default (14px)

**Spacing**: p-6 cards (24px), gap-3/gap-4 for sections (12px/16px)

See **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** for complete system.

## Migration to Production

Current: Single-file prototype with mock API

Future phases:
1. **API Integration** - Replace mock functions with real LLM calls
2. **Database + Auth** - Replace localStorage with Supabase/Firebase
3. **Modularization** - Split into proper file structure

See **[docs/ARCHITECTURE.md § Migration Path](docs/ARCHITECTURE.md#migration-path-to-real-backend)** for detailed steps.

## Important Notes

- **Single-file application** - No build step, no modules, no imports
- **Mock API only** - All generation is simulated with delays
- **localStorage only** - No database, no auth, no multi-user
- **Prototype focus** - Optimized for rapid UX iteration, not production

This is intentional. Keep it simple until backend integration is needed.

## Remember

1. **Read docs first** - ARCHITECTURE.md has all the details
2. **Update execution docs** - Track progress in real-time
3. **Plan before coding** - Use execution_docs/_active/planning.md
4. **No semicolons** - Entire file uses ASI
5. **Keep it simple** - This is a prototype, don't over-engineer
6. **Rename archived docs** - At start of each session

## Additional Resources

- **Architecture & Concepts**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Workflows & Patterns**: [docs/WORKFLOWS.md](docs/WORKFLOWS.md)
- **Design System**: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- **Development Guide**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
