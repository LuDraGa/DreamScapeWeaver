---
**Commit**: 39e0347
**Date**: 2026-03-20 01:01:47
**Message**: fix: library "Use as Seed" now navigates to create page with promoted seed
---

# StoryWeaver - Active Execution

## Task: Soften AI Review Word Count Scoring

**Session**: 2026-03-19
**Context**: AI review was giving harsh grades (C) for strong stories that exceeded word count targets. The word count rubric was a strict pass/fail, tanking the overall grade even when the story quality was high and the overrun served the narrative.

## Execution Status

### ✅ Completed Tasks

- Softened selfCheckRubric word count item in `nosleep.json` — now only flags bloat/filler/repetition, not word count numbers
- Removed word count as a review concern in `review-prompts.ts` — explicitly tells reviewer word count is a generation-time constraint, not a quality metric, and must not appear as a weakness

### 🔄 In Progress

*None currently*

### ⏳ Pending Tasks

*None*

## Changes Made

### Files Modified
- `src/config/templates/reddit/nosleep.json` — selfCheckRubric word count item softened
- `src/lib/adapters/review-prompts.ts` — system prompt word count evaluation guidance softened

### Files Created
-

### Files Deleted
-

## Implementation Notes

### Key Technical Details
- The word count rubric in nosleep.json was: "Is it 1300-1700 words? If under 1300, expand by dramatizing..." — this was a hard pass/fail that gave 1/10 when exceeded
- Changed to: "Is the length appropriate for the story? Coherent storytelling and atmospheric completeness take priority..."
- The review system prompt had: "±10% is acceptable" — very strict
- Changed to: "Moderate overruns (up to ~40% over) that serve narrative coherence should be noted but not heavily penalized"
- Both changes affect ALL templates that use the review system (the system prompt change is global, the rubric change is nosleep-specific)

### Rationale
- The 1064-word output on a 700-word target was a strong story (9/10 atmosphere, 10/10 ending, 9/10 dread) but got a C grade because word count was 1/10
- Word count is a generation constraint, not a quality metric — the review should evaluate whether the length serves the story

## Testing Notes
- Re-run AI review on the same nosleep output to verify the grade improves
- Check that genuinely bloated/repetitive outputs still get penalized

## Developer Actions Required
- [ ] Test with a new generation + review cycle to verify scoring improvement
