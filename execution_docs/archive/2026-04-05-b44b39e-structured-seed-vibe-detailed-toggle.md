---
**Commit**: b44b39e
**Date**: 2026-04-05 13:53:38
**Message**: feat: structured seed generation with Vibe/Detailed toggle and stronger vibe anchoring
---

# StoryWeaver - Active Execution

## Task: Structured Seeds with Detail Toggle

**Session**: 2026-03-24
**Context**: Richer seed generation with premise + freeform details, explicit Vibe/Detailed toggle

## Execution Status

### ✅ Completed Tasks

- [x] Update types.ts — add `details?: string[]` to DreamscapeChunk, `SeedDetailLevel` type, `detailLevel` to GenerateDreamscapesParams
- [x] Update Zod schema in openai.ts — `premise` + `details[]` replacing `text`
- [x] Add `getDetailLevelInstruction()` — appended to system prompt for both template and generic paths
- [x] Update seed mapping — `seed.premise` → `chunk.text`, `seed.details` → `chunk.details`
- [x] Update downstream — `generateOutputs` includes details in seed text passed to story generation
- [x] Update API route — pass `detailLevel` from body to params
- [x] Add detail toggle UI (both normal user and power user panels) — segmented "Vibe / Detailed" control
- [x] Update seed card display (both panels) — shows premise + detail bullets
- [x] Update `handleUseGeneratedIdea` — preserves details when using a seed
- [x] Build passes

### 🔄 In Progress

*None currently*

### ⏳ Pending Tasks

- [ ] Manual testing with live API

## Changes Made

### Files Modified
- `src/lib/types.ts` — `DreamscapeChunk.details`, `SeedDetailLevel`, `GenerateDreamscapesParams.detailLevel`
- `src/lib/adapters/openai.ts` — Zod schema, `getDetailLevelInstruction()`, seed mapping, downstream details formatting
- `src/app/api/dreamscapes/generate/route.ts` — pass `detailLevel`
- `src/app/app/create/page.tsx` — `genDetailLevel` state, toggle UI, structured seed cards, `handleUseGeneratedIdea` details pass-through

### Files Created
- None

### Files Deleted
- None

## Implementation Notes

### Key Technical Details
- Detail level instruction injected at adapter level (appended to system prompt) — works for both template-specific and generic seed prompts without editing templates
- Zod structured outputs enforce `{ premise, details[] }` schema — LLM must comply
- Vibe mode: 0-2 details, suggestive premise. Detailed mode: 3-6 details, concrete premise
- Both modes include instruction: "user's vibe MUST be the conceptual foundation of every seed — template style shapes HOW, not WHAT"
- Backward compatible: `details` is optional on DreamscapeChunk, existing seeds without it still render fine

---

*This document tracks active implementation progress*
