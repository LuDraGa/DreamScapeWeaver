# Design Decisions

This document records significant architectural and design decisions that should be followed throughout the project. These are **hard constraints** that affect how features are built.

---

## Feature Flags Architecture

**Decision**: All feature flags are defined and controlled in the Settings page only.

**Rationale**:
- Single source of truth for feature state
- No URL parameters or other external controls to maintain
- Easy migration to role-based access when auth is added
- Clean separation: UI reads from settings, backend (future) controls availability

**Implementation**:

### Current (localStorage only)
```javascript
// Settings schema in AppContext
const settings = {
  defaultPreset: "reddit-aitah",
  avoidPhrases: [...],
  autoAvoidAI: true,
  developerMode: false,    // Show prompt inspector (admin only, future)
  powerUserMode: false,    // (Future) Show advanced controls vs simplified UI
}

// Settings page - all users can see their available flags
<SettingsPage>
  <Toggle flag="developerMode" />  // Visible to all now, admin-only later
  <Toggle flag="powerUserMode" />  // (Future)
</SettingsPage>
```

### Future (with backend auth)
```javascript
// Backend determines which flags are available based on user.role
// Settings page conditionally shows flags

function SettingsPage() {
  const { user, settings, setSettings } = useApp()

  return (
    <>
      {/* Normal users */}
      <Toggle
        checked={settings.powerUserMode}
        onChange={(val) => setSettings({ ...settings, powerUserMode: val })}
        label="Power User Mode"
        description="Show advanced controls and options"
      />

      {/* Admin users only */}
      {user?.role === 'admin' && (
        <Toggle
          checked={settings.developerMode}
          onChange={(val) => setSettings({ ...settings, developerMode: val })}
          label="Developer Mode"
          description="Show prompt inspector and debug tools"
        />
      )}
    </>
  )
}
```

**Anti-patterns to avoid**:
- ❌ URL parameters (`?dev=true`) - adds conditional logic everywhere
- ❌ Environment variables for user features - not dynamic per-user
- ❌ Feature flags scattered across components - hard to track
- ❌ Multiple sources of truth (settings + localStorage + URL) - causes bugs

**Benefits**:
- Easy to test (just toggle in Settings)
- Easy to add new flags (add to schema + Settings page)
- Easy to make role-based (wrap in `{user?.role === 'admin' && ...}`)
- No cleanup needed when migrating to backend auth

---

## UI Visibility Attributes: Power vs Normal User Features

**Decision**: Use data attributes to mark UI elements with specific visibility requirements.

**Attributes**:
- `data-advanced-feature="true"` - Power user only (hidden for normal users)
- `data-basic-feature="true"` - Normal user only (hidden for power users)
- No attribute - Shows to everyone regardless of mode

**Important distinction**:
- `powerUserMode` - Advanced controls vs simplified UI (user preference)
- `developerMode` - Debug tools, prompt inspector (admin/dev only)
- These are **orthogonal** - admins can disable power features, power users aren't admins

**Rationale**:
- Mirror pattern provides symmetry and clarity
- Easy to identify all mode-specific elements in codebase
- Separates functionality (which still runs) from visibility (which is controlled)
- Allows different UI presentations for different user types

### Pattern 1: Advanced Features (Power Users Only)

**Use case**: Expert controls, manual overrides, advanced configuration

```tsx
// ✅ Power users only: Advanced intensity sliders
<div
  data-advanced-feature="true"
  className={settings.powerUserMode ? 'block' : 'hidden'}
>
  {/* Advanced intensity sliders */}
  <LabeledSlider ... />
  <button onClick={randomize}>🎲 Randomize</button>
</div>

// Behind the scenes: Randomization still happens automatically for all users
const handleGenerate = () => {
  const randomized = randomizeIntensity() // Runs regardless of powerUserMode
  setIntensity(randomized)
  // Only power users see the sliders to manually override
}
```

**Examples**:
1. **Dreamscape intensity randomization**
   - Normal users: Intensity randomized automatically (UI hidden)
   - Power users: Can see and manually adjust intensity sliders

2. **Cohesion strictness** (future)
   - Normal users: Default value (5) used automatically
   - Power users: Can see and adjust the slider

### Pattern 2: Basic Features (Normal Users Only)

**Use case**: Simplified wizards, onboarding flows, guided experiences

```tsx
// ✅ Normal users only: Simplified preset selection (3 popular presets)
<div
  data-basic-feature="true"
  className={!settings.powerUserMode ? 'grid' : 'hidden'}
>
  <SimplePresetCard preset="reddit-aitah" />
  <SimplePresetCard preset="petty-revenge" />
  <SimplePresetCard preset="romance" />
</div>

// ✅ Power users only: Full preset grid + custom builder
<div
  data-advanced-feature="true"
  className={settings.powerUserMode ? 'grid' : 'hidden'}
>
  {PRESETS.map(p => <DetailedPresetCard key={p.id} preset={p} />)}
  <CustomPresetBuilder />
</div>
```

**Examples**:
1. **Getting Started tour** (`data-basic-feature`)
   - Normal users: See guided walkthrough
   - Power users: Skip straight to tools

2. **Helper tooltips** (`data-basic-feature`)
   - Normal users: See explanatory text
   - Power users: Clean interface without hand-holding

### Pattern 3: Debug Tools (Developer Mode)

**Use case**: Prompt inspector, debug panels, internal tooling

```tsx
// ✅ Developer mode only (separate from power user mode)
{settings.developerMode && (
  <PromptInspector ... />
)}
```

**Note**: Debug tools use conditional rendering (not data attributes) since they're admin-only, not user-preference.

### Key Principles

1. **Most UI needs no tag** - Shows to everyone
2. **`data-advanced-feature`** - Power user exclusive controls
3. **`data-basic-feature`** - Simplified UI for normal users
4. **`developerMode`** - Admin/dev tools (orthogonal to power mode)

### Searching for mode-specific features

```bash
# Find all power-user-only UI
grep -r 'data-advanced-feature' src/

# Find all normal-user-only UI
grep -r 'data-basic-feature' src/

# Find all developer-mode features
grep -r 'developerMode' src/
```

### Migration Path

When `powerUserMode` feature flag is added to Settings:

```tsx
// Step 1: Add to settings schema (already done)
const settings = {
  powerUserMode: false,
  developerMode: false,  // Separate from power mode
}

// Step 2: All data-advanced-feature and data-basic-feature elements automatically work
// No code changes needed - they already check settings.powerUserMode
```

---

## localStorage Keys: Namespaced with `sg:*`

**Decision**: All localStorage keys must use the `sg:*` prefix.

**Rationale**:
- Prevents collision with other apps
- Easy to identify/clear app data
- Professional storage management

**Implementation**:
```javascript
// ✅ Correct
localStorage.setItem('sg:dreamscapes', data)
localStorage.setItem('sg:outputs', data)
localStorage.setItem('sg:settings', data)

// ❌ Incorrect
localStorage.setItem('dreamscapes', data)
localStorage.setItem('storyweaver_dreamscapes', data)
```

**Related**: Reset function only clears `sg:*` keys (never use `localStorage.clear()`)

---

## Design System: Consistent UI Patterns

**Decision**: Use design system defined in [docs/DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for all UI components.

**Key patterns**:
- **Colors**: Dark blue-black bg (`#080c14`), indigo primary (`#6366f1`)
- **Typography**: DM Sans font, text-sm default (14px)
- **Spacing**: p-6 cards (24px), gap-3/gap-4 sections (12px/16px)
- **Components**: Reuse Button, Card, IconButton patterns

**Why**: Maintain visual consistency as app grows

---

## Intensity Dials: Story Control System (Evolving)

**Current State**: Stories are controlled by 7 intensity dials (stakes, darkness, pace, twist, realism, catharsis, moralClarity).

**Status**: ⚠️ **Under review** - May be simplified or refactored

**Potential additions**:
- **Language Complexity** dial: Control reading level
  - Low (1-3): Simple, direct language (Reels/TikTok - anyone can understand)
  - Medium (4-7): Standard narrative language
  - High (8-10): Complex vocabulary, literary style (short story series - focused on reading experience and visualization)

**Rationale for current system**:
- Granular control over story characteristics
- Platform-specific optimization (e.g., Reddit AITAH = high realism)
- Preset-based quick start (presets = dial configurations)

**Implementation** (current):
```javascript
const DIALS = {
  stakes: { label: "Stakes", min: 1, max: 10 },
  darkness: { label: "Darkness", min: 1, max: 10 },
  pace: { label: "Pace", min: 1, max: 10 },
  twist: { label: "Twist Factor", min: 1, max: 10 },
  realism: { label: "Realism", min: 1, max: 10 },
  catharsis: { label: "Catharsis", min: 1, max: 10 },
  moralClarity: { label: "Moral Clarity", min: 1, max: 10 },
}

// Presets are pre-configured dial states
const PRESETS = [
  {
    id: "reddit-aitah",
    intensity: { stakes: 7, darkness: 5, pace: 6, ... }
  }
]
```

**Why this matters**: All prompt generation must respect dial settings. If dials change, prompt builders must be updated.

**Open question**: Is 7-dimensional control too complex? Consider consolidation or adding platform-specific dials (e.g., language complexity).

---

## Prompt Inspector: Bottom Drawer Pattern

**Decision**: Debug tools (like Prompt Inspector) use a resizable bottom drawer, not sidebars or modals.

**Rationale**:
- Prompts are long (need horizontal space)
- Familiar pattern (browser DevTools)
- Non-intrusive (doesn't block main workflow)
- Resizable (user controls how much space it takes)

**Implementation pattern**:
```javascript
<div className="fixed bottom-0 left-0 right-0" style={{ height: `${height}vh` }}>
  {/* Drag handle for resizing */}
  {/* Scrollable content */}
</div>
```

---

## Git Workflow: Execution Docs Auto-Archive

**Decision**: Post-commit hook automatically archives planning/execution docs.

**How it works**:
1. User commits code (includes `execution_docs/_active/*.md`)
2. Hook archives docs to `execution_docs/archive/YYYY-MM-DD-[hash]-*-to-be-renamed.md`
3. Hook resets templates in `execution_docs/_active/`
4. Hook amends commit to include archived + reset docs

**Developer responsibility**: Rename archived docs at start of next session based on task content

**Why**: Preserves history of planning decisions without manual file management

---

## Preset-First Workflow

**Decision**: Users start with a preset, then optionally customize (not blank slate).

**Rationale**:
- Faster to start (preset = good defaults)
- Platform-optimized (Reddit AITAH preset knows what works on Reddit)
- Discoverable (presets teach users what settings matter)

**Flow**:
1. Select preset (e.g., "Reddit AITAH")
2. Preset auto-fills: platform, format, intensity dials, word count, tone
3. User can customize in Advanced Settings
4. Click Generate

**Anti-pattern**: Don't start with empty form requiring all fields

---

## State Management: Context + localStorage

**Decision**: Use React Context for global state + localStorage for persistence (no Zustand/Redux yet).

**Rationale**:
- Simple for prototype phase
- No external dependencies
- Easy to migrate to Zustand when app grows

**Current**:
```javascript
<AppContext.Provider value={{ savedDreamscapes, settings, ... }}>
  {children}
</AppContext.Provider>
```

**Future** (when scaling):
```javascript
// Migrate to Zustand for better performance
const useAppStore = create(persist((set) => ({ ... })))
```

---

## Avoid Phrases: User-Configurable AI Detection

**Decision**: Users can configure phrases to avoid in Settings (e.g., "It's worth noting").

**Rationale**:
- Different platforms have different "AI tells"
- User knows their audience best
- Easy to update as AI detection evolves

**Implementation**:
```javascript
const settings = {
  avoidPhrases: [
    "It's worth noting that",
    "I couldn't help but",
    "Little did I know"
  ],
  autoAvoidAI: true  // Automatically apply avoid phrases
}
```

---

## Library: Two-Tab Model (Seeds vs Content)

**Decision**: The Library is split into two distinct tabs with separate browsing intents.

- **Seeds tab** — browse Dreamscapes (inputs). Primary action: "Continue →" which pre-loads the dreamscape into store and jumps to Create Step 1 (Platform & Style), skipping Step 0.
- **Content tab** — browse OutputVariants (generated content). Primary actions: rate, copy, delete, promote to seed.

**Rationale**: The user's mental model when returning to the library is either "what do I want to generate from?" (Seeds) or "what have I already made?" (Content). Mixing them creates noise.

**Anti-pattern**: ❌ Don't show outputs and dreamscapes in a flat unified feed — they have different primary actions and different filter axes.

---

## Content Lineage: DAG, Not Hierarchy

**Decision**: The creative graph is a DAG (directed acyclic graph). Any OutputVariant can be promoted to a new Dreamscape seed (`origin: 'derived'`, `sourceOutputId` set), which can then generate further outputs. One output can branch to multiple derived dreamscapes.

**Data model**:
```typescript
interface Dreamscape {
  origin?: 'manual' | 'generated' | 'derived'
  sourceOutputId?: string  // set when origin = 'derived'
}
```

**UX approach**: Don't render the full DAG visually — it's unnavigable at scale. Instead:
- Show lineage as a breadcrumb on each card (`← from "..."`)
- Show output count per seed
- The full graph is traversable by following breadcrumbs, not drawn

---

## Hook-First Card Pattern

**Decision**: In Library cards (both Seeds and Content), the **first sentence of the content** ("the hook") is the primary visual identifier, shown prominently. The title is secondary/muted below it.

**Rationale**: Users remember content by what it says, not by auto-generated or generic titles. The hook is the most distinctive and memorable signal. Titles are unreliable (AI may generate "Balanced Variant" etc.).

**Implementation**: Extract first sentence up to `.!?\n`, truncate at 160 chars.

**Also**: Titles are inline-editable on double-click (Enter/Escape/blur to commit) for both seeds and content.

---

## Content Filters: Multi-Select with NOT

**Decision**: Content tab filters use multi-select chips with three states per chip.

**Chip cycle**: neutral (grey) → **selected/include** (indigo, OR'd) → **excluded/NOT** (red ✕, AND'd) → neutral

**Logic**:
- Multiple selected chips within a category = OR (show if matches any)
- Across categories (platform AND preset) = AND
- Excluded chips = hard NOT regardless

**Full list always shown**: All platforms and all presets are always rendered. Zero-count chips are disabled (greyed), not hidden — so users can see what's possible, not just what they've generated.

**Anti-pattern**: ❌ Don't hide zero-count filter options — it makes the filter system feel broken when you don't have data yet.

---

## Studio Page: Removed

**Decision**: The Studio page (part-based non-linear content system) has been removed entirely.

**Rationale**: The Create page → Library loop is the right UX for now. Studio was a premature abstraction before the core loop was solid. The "project" concept may return later as a scoped container for Library items.

**Files removed**: `src/app/app/studio/`, `src/components/studio/` (10 files), `src/lib/storage.ts`, `src/lib/parts.ts`, `src/lib/transforms.ts`, `src/app/api/parts/transform/`.

---

## dial_state: Immutable Historical Snapshots

**Decision**: Never migrate or overwrite `dial_state` on existing `output_variants` rows. Old outputs keep their stored dial values forever.

**Rationale**: An output's `dial_state` is a snapshot of the exact config used to generate it — it's historical record, not live config. Mutating it would corrupt the provenance of the content.

**Handling schema evolution**: When `DialState` gains new fields, old rows will be missing those keys. Handle this at read time in the UI with defaults:

```typescript
// Always merge with current defaults — never update the DB row
const dialState = { ...DEFAULT_DIAL_STATE, ...output.dialState }
```

New outputs get the full current shape. Old outputs silently fill gaps with defaults. No migration queries needed, no data corruption risk.

**`dial_state_version` column**: Exists as a read-time audit tool. Lets you query which rows have an older shape (`WHERE dial_state_version = 1`) for debugging or analytics. It is NOT a trigger for backfilling data.

**Anti-pattern**: ❌ Don't run `UPDATE output_variants SET dial_state = dial_state || '{"newField": 5}'` — old outputs should reflect the exact config that produced them.

---

## Summary: Key Principles

1. **Feature flags**: Always in Settings, never URL params
2. **Storage**: Namespace with `sg:*` prefix
3. **UI**: Follow design system patterns
4. **Debug tools**: Bottom drawer pattern
5. **Workflow**: Preset-first, not blank slate
6. **State**: Zustand + localStorage (Zustand already in use)
7. **Intensity dials**: Under review, may add language complexity control
8. **Library**: Two-tab (Seeds / Content), hook-first cards, multi-select NOT filters
9. **Lineage**: DAG model, breadcrumb navigation (no graph visualization)

---

**When making decisions**: Check if it conflicts with anything here. If so, discuss before implementing. If it's a new significant decision, add it to this doc.
