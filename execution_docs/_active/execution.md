# StoryWeaver - Active Execution

## Task: AI Review System (Admin-Only) + Model Upgrade

**Session**: 2026-03-14
**Context**: Add GPT-5.4-powered quality review on Rate & Save (admin-only), upgrade all generation models to gpt-5-mini.

## Execution Status

### ✅ Completed Tasks

- [x] Add review types to types.ts (`AIReviewResult`, `AIReviewRubricScore`, `ReviewOutputParams`)
- [x] Create openai-review.ts adapter (GPT-5.4, XML prompt framework, Zod structured output)
- [x] Create API route `/api/outputs/review` with admin role check
- [x] Add `api.outputs.review()` client wrapper in api.ts
- [x] Add AI Review card to Rate & Save step (admin-only, between split/continue and rating)
- [x] Upgrade `gpt-4o-2024-08-06` → `gpt-5-mini` in openai.ts (4 occurrences)
- [x] Rename archived doc: `2026-03-13-181b7ce-template-flow-style-variants-quality-pipeline.md`
- [x] Build passes

### ⏳ Pending Tasks

- [ ] Commit

## Changes Made

### Files Modified
- `src/lib/types.ts` — Added `AIReviewResult`, `AIReviewRubricScore`, `ReviewOutputParams` types
- `src/lib/api.ts` — Added `api.outputs.review()` client wrapper
- `src/lib/adapters/openai.ts` — Model upgrade: `gpt-4o-2024-08-06` → `gpt-5-mini` (all 4 generation calls)
- `src/app/app/create/page.tsx` — AI Review card on Rate & Save (admin-only), review state vars, handler, variant-switch reset

### Files Created
- `src/lib/adapters/openai-review.ts` — Review adapter with GPT-5.4, XML prompt framework, Zod schema
- `src/app/api/outputs/review/route.ts` — POST endpoint with admin auth check

### Files Deleted
- None

## Implementation Notes

### Key Technical Details
- **Review model**: GPT-5.4 (best model for analytical review)
- **Generation model**: gpt-5-mini (upgraded from gpt-4o-2024-08-06)
- **Temperature**: 0.3 for review (consistent analytical output), unchanged for generation
- **Admin check**: Server-side role check in API route + client-side `canAccessDevTools(role)` for UI visibility
- **Prompt framework**: Full XML tag structure (`<role>`, `<context>`, `<constraints>`, `<expectation>`) per PROMPT_FRAMEWORK.md
- **Reviewer role**: Expert editorial reviewer + prompt engineer — reviews content AND traces quality back to prompt causes
- **Review context**: Receives dreamscape text, system prompt, user prompt, and output — full generation pipeline visibility
- **Structured output**: Zod schema enforces consistent format with rubric analyses + crisp summary
- **8 rubrics**: Hook Effectiveness, Narrative Authenticity, Structural Cohesion, Pacing & Flow, Twist/Surprise Factor, Emotional Resonance, Platform Fit, Prompt Adherence
- **UI**: Collapsible card with always-visible summary (grade + scores + weaknesses + strengths + prompt suggestions) and expandable detailed analysis
- **State reset**: Review clears when switching variants

## Developer Actions Required
- [x] Build succeeds
- [ ] Test with admin role: AI Review button visible, review runs and displays
- [ ] Test with non-admin role: AI Review card not visible
- [ ] Verify gpt-5-mini model works for existing generation flows

---

*This document tracks active implementation progress*
