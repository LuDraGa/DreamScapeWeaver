---
**Commit**: b8f5a1c
**Date**: 2026-03-19 03:49:48
**Message**: feat: admin word count override, AI review fix, nosleep template enhancement, AI video scenes template
---

# StoryWeaver - Active Execution

## Task: Admin Word Count Override + Review System Fix + Nosleep Template Enhancement

**Session**: 2026-03-19
**Context**: Word count override for admin editor, fix AI review system to use override target, enhance nosleep template quality.

## Execution Status

### ✅ Completed Tasks

**Word Count Override (admin editor)**
1. `editedWordCount` state + number input UI in admin editor
2. `applyWordCountOverride()` helper — replaces ALL word count references (ranges, tildes, targets, expansion guidance, bare numbers)
3. Hard cap appended to system prompt + prepended to user prompt
4. Override reflected in prompt inspector and AI review context
5. Slow Burn variant changed from "first 300-400 words" to "first 25%" (percentage-based, won't get caught by regex)

**AI Review System Fix (grade-killer)**
6. `wordCountTarget` now uses `editedWordCount` when override is active (was always `selectedTemplate?.wordCount`)
7. `selfCheckRubric` strings now transformed via `applyWordCountOverride()` when override is active (was always raw template text)
8. Same fix applied to prompt inspector `reviewParamsForInspector`

**Nosleep Template Enhancement (content quality)**
9. `<constraints>`: Require 2+ human roughness beats (self-corrections, circle-backs, over-specific details)
10. `<constraints>`: Require help-seeking line (why people post on Reddit)
11. `<structure>`: Loosened from rigid numbered list to "hit these beats organically — allow circle-backs and out-of-sequence mentions"
12. `<structure>`: Step 7 now includes "request for help"

### Files Modified
- `src/app/app/create/page.tsx` — applyWordCountOverride helper, generation logic, inspector, AI review
- `src/config/templates/reddit/nosleep.json` — constraints, structure, style variant, rubric

## Key Insight

The C grades were NOT content quality issues. The AI review system was evaluating word count against the template's default (1500) even when admin overrode to 650. Template Criteria 4 scored 2-3/10 every time, dragging the overall grade from B+ to C. The fix passes the override value to both `wordCountTarget` and the rubric strings.

---

*This document tracks active implementation progress*
