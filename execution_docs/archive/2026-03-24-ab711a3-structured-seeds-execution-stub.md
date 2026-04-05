---
**Commit**: ab711a3
**Date**: 2026-03-24 01:35:34
**Message**: fix: AI video scenes template — mandatory angle, anti-microtext, one-action split, motion variety
---

# StoryWeaver - Active Execution

## Task: Structured Seeds with Detail Toggle

**Session**: 2026-03-24
**Context**: Richer seed generation with premise + freeform details, explicit Vibe/Detailed toggle

## Execution Status

### ✅ Completed Tasks

*None yet - starting implementation*

### 🔄 In Progress

- [ ] Update types.ts — add `details?: string[]` to DreamscapeChunk

### ⏳ Pending Tasks

- [ ] Update Zod schema in openai.ts
- [ ] Update seed mapping in openai.ts generateDreamscapes
- [ ] Add detail-level param to GenerateDreamscapesParams
- [ ] Update prompt-builders.ts — detail-level instruction injection
- [ ] Update seed-generation.json prompt
- [ ] Update hero template seedPrompts for structured output
- [ ] Add detail toggle UI to CreatePage
- [ ] Update seed card display for premise + details
- [ ] Pass structured seed downstream to story generation

## Changes Made

### Files Modified
-

### Files Created
-

### Files Deleted
-

## Implementation Notes

### Key Technical Details
- Toggle labels: "Vibe" (default) / "Detailed"
- Vibe = suggestive premise, 0-2 details
- Detailed = concrete premise, 3-6 details
- Backward compatible — existing seeds without details still work

---

*This document tracks active implementation progress*
