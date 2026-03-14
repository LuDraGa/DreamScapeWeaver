# Planning: AI Review System (Admin-Only) + Model Upgrade

## Problem
Admins need a way to evaluate generated story quality against rubrics to understand prompt weaknesses and strengths. Currently, the Rate & Save step only has manual rating (stars + chips) — no automated quality analysis.

Additionally, models need upgrading: gpt-4o → gpt-5-mini everywhere, gpt-5.4 for the new review system.

## Solution

### 1. AI Review System
Admin-only feature on Rate & Save step. Sends dreamscape + prompt + output to GPT-5.4 for structured quality review.

**Reviewer Role**: Expert editorial reviewer + prompt engineer — grades on rubrics, identifies weaknesses for prompt tuning, highlights strengths to preserve.

**Output Format**:
- Part A: Descriptive rubric-by-rubric analysis with evidence quotes (for deep reading)
- Part B: Crisp summary — scores, weaknesses, strengths, suggested prompt mods, overall grade

### 2. Model Upgrade
- Replace `gpt-4o-2024-08-06` → `gpt-5-mini` in openai.ts (all existing generation functions)
- Use `gpt-5.4` for the review system (best model for analytical review)

## Files to Create
- `src/app/api/outputs/review/route.ts` — API route
- `src/lib/adapters/openai-review.ts` — Review adapter with GPT-5.4

## Files to Modify
- `src/app/app/create/page.tsx` — Add AI Review card to Rate & Save step
- `src/lib/api.ts` — Add `api.outputs.review()` wrapper
- `src/lib/types.ts` — Add review types
- `src/lib/adapters/openai.ts` — Model upgrade gpt-4o → gpt-5-mini

## Rubric Dimensions
1. Hook Effectiveness
2. Narrative Authenticity
3. Structural Cohesion
4. Pacing & Flow
5. Twist/Surprise Factor
6. Emotional Resonance
7. Platform Fit
8. Prompt Adherence
