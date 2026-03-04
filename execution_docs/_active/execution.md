# StoryWeaver - Active Execution

## Task: Rate & Save Tab — Prompt Inspector + Generate More

**Session**: 2026-03-04
**Scope**: Two targeted fixes to the Rate & Save tab

---

## Deferred: rate-save-parts-display

**Reference name**: `rate-save-parts-display`

**Problem**: After split/continue, story parts are raw text with `[PART 1]`, `[PART 2]` markers
inline — no structured UI. `parseMultiPartOutput` and `parsedOutputs` state exist but are
only wired up to the debug test button, not to the actual split/continue handlers.

**Two dimensions of the problem**:
- Outer = Variants (Balanced / More Intense / More Believable) — tabs at top
- Inner = Parts (Part 1, Part 2…) — result of split/continue — currently unseparated

**Solution options discussed**:

Option A — Tabs within variant card:
  Part 1 | Part 2 | Part 3 sub-tabs. Clean, space-efficient. Can't see all parts at once.

Option B — Stacked labeled blocks (always expanded): ⭐ Recommended
  Each part is its own card. Natural serial reading (Part 1 → 2 → 3). Comments/regen
  are per-part. Split/continue cards adapt to: "Split This Part" / "Continue from Last Part".

Option C — Tabs + collapsible hybrid: Overkill for MVP.

**Key considerations when implementing**:
- Comments must become per-part (currently per-variant)
- Regenerate selection must be per-part
- "Split Story" splits the currently active part
- "Continue Story" always continues from the last part
- `parseMultiPartOutput` in utils.ts is already written and ready
- `parsedOutputs` state (parallel to `generatedOutputs`) is already declared

---

## Fix #1: Prompt Inspector for Split & Continue

**Status**: 🔄 In Progress

**Problem**: The inspector's useEffect (line 407-567) has no branch for split/continue prompts.
When user edits split/continue guidance or clicks those buttons, the inspector still shows
the generic output prompt.

**Solution**: Extract all inspector logic to `usePromptInspector` hook. Hook owns `inspectorFocus`
state ('default' | 'split' | 'continue'). Split/continue UI elements call `setInspectorFocus`
to drive what the inspector shows.

### Tasks
- [x] Create `src/hooks/usePromptInspector.ts`
- [x] Remove `inspectorPromptData` state + the `useEffect` from page.tsx
- [x] Wire hook into page.tsx
- [x] Wire `setInspectorFocus('split')` to split textarea onChange + split button onClick
- [x] Wire `setInspectorFocus('continue')` to continue textarea onChange + continue button onClick

---

## Fix #2: Generate More — Append Variants

**Status**: ✅ Complete

**Problem**: Generate More button called `setStep(2)` and `setGeneratedOutputs([])` — effectively
resets everything, discarding all current work.

**Correct scope**: Generate additional variants using the same template/settings/dreamscape,
APPEND to existing list (no step change, no clearing). User ends up with Variant D, E, F
alongside existing A, B, C.

### Tasks
- [x] Add `handleGenerateMore` function to page.tsx
- [x] Re-label new variants alphabetically from current offset (D, E, F...)
- [x] Switch `activeVariant` to first new variant after generation
- [x] Update Generate More button to call `handleGenerateMore`

---

## Files to Modify
- `src/hooks/usePromptInspector.ts` — NEW
- `src/app/app/create/page.tsx` — Use hook, add handleGenerateMore, wire up UI

---

*Updated in real-time during implementation*
