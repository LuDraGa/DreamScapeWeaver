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

## Style Variants Replace Intensity Dials (for Normal Users)

**Decision**: Normal users control output quality through **style variants** (2-3 curated options per template), not 7 intensity dials.

**Rationale**:
- 7 dials are overwhelming for non-power-users and don't clearly map to output quality
- Style variants are template-specific and named meaningfully (e.g., "Controversial", "Emotional", "Unhinged" for AITAH)
- Each variant's `promptModifier` contains expert-crafted instructions that produce distinct, high-quality outputs
- Reproducibility is high: same seed + template + style variant = consistent quality
- Variability comes from different seeds and style choices, not random dial positions

**Implementation**:
```typescript
interface StyleVariant {
  id: string
  name: string           // User-facing name
  description: string    // One-line description
  promptModifier: string // Full style instructions injected into prompt
}

// Each hero template has 2-3 style variants
// e.g., AITAH: "Controversial", "Emotional", "Unhinged"
// e.g., nosleep: "Slow Burn", "Paranoia", "Visceral"
```

**Power users** still have access to the full 7-dial system via power user mode. The dials are not removed — they're just hidden for normal users.

**Anti-patterns**:
- ❌ Don't add more dials to solve quality problems — add better style variants
- ❌ Don't randomize style variant selection — explicit user choice enables reproducibility

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

## Template-First Workflow (Normal Users)

**Decision**: Normal users select a **template** before entering a seed. The template drives seed generation, style options, and output quality.

**Rationale**:
- Seeds generated without template context are generic and don't match platform conventions
- Template-first ensures seeds are platform-aware from the start (e.g., AITAH seeds focus on interpersonal conflicts)
- Style variants only make sense in the context of a specific template
- Self-check rubrics and few-shot excerpts are template-specific quality tools

**Flow** (Normal users):
1. Select template from categorized gallery (reddit, short-form, long-form, etc.)
2. Pick a style variant (e.g., "Controversial" for AITAH)
3. Enter seed manually OR generate platform-aware seeds using template's `seedPrompt`
4. Generate output (template + style variant + rubric + few-shot all injected into prompt)
5. Rate & Save

**Flow** (Power users):
1. Enter seed / generate generic dreamscapes (original flow)
2. Select preset (auto-fills platform, dials, word count, tone)
3. Customize dials in Advanced Settings
4. Generate output
5. Review 3 variants → Rate & Save

**Anti-pattern**: Don't start normal users with empty form or generic seed generation

---

## Template Quality Pipeline: Zero-Cost Quality Layers

**Decision**: Quality improvements are baked into templates via `selfCheckRubric` and `fewShotExcerpt` — injected into the same API call at zero extra cost.

**Rationale**:
- Self-check rubric adds quality criteria to the prompt (e.g., "Does it maintain the 'this is true' illusion?")
- Few-shot excerpt provides structural guidance without full examples (saves tokens)
- Both are template-specific, so they match the platform's conventions
- No additional API calls — quality comes from better prompts, not more prompts

**Implementation** (`buildPromptFromTemplate`):
```typescript
// Style variant's promptModifier → replaces {styleModifier}
// selfCheckRubric array → joined as numbered list → replaces {selfCheckRubric}
// fewShotExcerpt string → replaces {fewShotExcerpt}
// avoidPhrases array → joined → replaces {avoidPhrases}
```

**Anti-pattern**: ❌ Don't add post-generation validation API calls for quality — fix the prompt instead

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

## Admin Prompt Editing

**Decision**: Admin/dev users can inspect and edit system + user prompts before generation.

**Rationale**:
- Enables rapid prompt iteration without code changes
- Admin prompt editor shows the fully assembled prompt (template + style + rubric + few-shot)
- Edits are session-only — they don't persist back to template JSON

**Implementation**: Admin prompt editor is visible when `settings.developerMode` is true. Shows two text areas (system prompt, user prompt) that override the template-built prompts for that generation.

---

## Prompt Architecture: XML-Structured Hybrid Framework

**Decision**: All template prompts use an XML-tagged hybrid framework combining the Modular Framework (Role, Context, Task, Constraints, Format, Examples) with RISEN's Expectation block. Chain-of-Thought is used only for the enhancement step.

**Full reference**: [docs/PROMPT_FRAMEWORK.md](PROMPT_FRAMEWORK.md)

**Key structural rules**:

1. **System prompt carries identity + rules** — `<role>`, `<context>`, `<constraints>`, `<expectation>` XML blocks. These are static per template and get higher attention weight from the LLM.
2. **User prompt carries the brief + input** — `<task>`, `<story_seed>`, `<style>`, `<structure>`, `<reference_example>`, `<quality_check>` XML blocks. These contain per-generation variables.
3. **XML tags for all sections** — clear optical separation so the LLM distinguishes instruction types from content.
4. **`<expectation>` block in system prompt** — qualitative description of what "great" looks like (e.g., "reader stops scrolling and genuinely struggles with their judgment"), not a mechanical checklist.
5. **CoT prefill for enhancement only** — enhancement is a transformation task (analyze → preserve → improve), not a creative generation task. Story generation does NOT use CoT.
6. **Avoid-phrases in system prompt `<constraints>`** — not in user prompt. Higher attention weight = more reliable enforcement.

**Rationale**:
- System prompt content gets higher attention weight in GPT-4o and Claude — constraints placed there are followed more reliably
- XML tags provide unambiguous boundaries between instruction types — the LLM knows what's a rule vs. what's content
- One universal structure across all template categories (reddit, short-form, long-form, marketing, production) — same skeleton, different fills
- CoT is counterproductive for creative generation (constrains rather than enables creativity) but valuable for transformation tasks where the model needs to analyze before acting

**Anti-patterns**:
- ❌ One-line system prompts ("You are a writer") — wastes the highest-attention-weight slot
- ❌ Dumping all instructions in user prompt — constraints get lower attention weight
- ❌ Plain text without XML tags — model can't distinguish instruction types
- ❌ Using CoT for story output generation — creative writing doesn't benefit from reasoning traces
- ❌ Generic expectations ("be engaging") — gives the model no concrete quality target

---

## Summary: Key Principles

1. **Feature flags**: Always in Settings, never URL params
2. **Storage**: Namespace with `sg:*` prefix
3. **UI**: Follow design system patterns
4. **Debug tools**: Bottom drawer pattern
5. **Workflow**: Template-first for normal users, preset-first for power users
6. **State**: Zustand + localStorage (Zustand already in use)
7. **Quality control**: Style variants for normal users, intensity dials for power users
8. **Library**: Two-tab (Seeds / Content), hook-first cards, multi-select NOT filters
9. **Lineage**: DAG model, breadcrumb navigation (no graph visualization)
10. **Quality pipeline**: selfCheckRubric + fewShotExcerpt + styleModifier = zero-cost quality layers
11. **Prompt architecture**: XML-tagged hybrid framework — system prompt carries identity/rules, user prompt carries brief/input, CoT for enhancement only ([full spec](PROMPT_FRAMEWORK.md))

---

**When making decisions**: Check if it conflicts with anything here. If so, discuss before implementing. If it's a new significant decision, add it to this doc.
