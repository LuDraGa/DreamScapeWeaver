# Planning: Simplify & Focus — Template Curation, Single Gen, Power User Gating

**Date**: 2026-03-12
**Branch**: `simplify-and-focus`
**Context**: External product review feedback — reduce clutter, simplify generation, focus on output quality.

## Goals

1. **Curate hero templates** (9 kept, 37 moved behind power user mode)
2. **Single generation** instead of 3 variants for all users
3. **Gate dreamscape enhancement** behind power user mode
4. **Wire template settings** to generation (template intensity/tone/genres actually reach the LLM)
5. **Admin prompt editing** before generation

## Hero Templates (Cascade-Informed)

| Chain | Source (Reddit) | Adapt (Short-form) | Extend (Long-form) |
|-------|----------------|-------------------|-------------------|
| Moral Dilemma | AITAH | Drama/Confession | Story Time |
| Relatable/Funny | TIFU | Unexpected Twist | Story Time |
| Satisfying Payoff | Petty Revenge | Revenge Story | Story Time |
| Horror/Thriller | NoSleep | Horror/Creepy | Story Time |

**9 hero templates**: aitah, tifu, petty-revenge, nosleep, drama-confession, unexpected-twist, revenge-story, horror-creepy, youtube-story-time

## Step-by-Step Implementation Plan

### Step 1: Define hero template list in `src/lib/templates.ts`
- Add `HERO_TEMPLATE_IDS` constant
- Add `getHeroTemplates()` and update `getTemplatesByCategory()` to accept `heroOnly` flag
- Keep all templates importable (power users still need them)

### Step 2: Single generation in `src/lib/adapters/openai.ts`
- Change `generateOutputs()` to produce 1 variant instead of 3
- Remove `adjustIntensity()` calls (no more Intense/Believable variants)
- Title the single output based on template name instead of "Variant A — Balanced"

### Step 3: Wire template settings to generation
- Add optional `systemPromptOverride` and `userPromptOverride` to `GenerateOutputsParams`
- When provided, `generateVariant()` uses these instead of `buildSystemPrompt(dialState)`
- `handleGenerateFromTemplate` in create page already builds template prompts via `buildPromptFromTemplate()` — pass them through the API

### Step 4: Update create page — template visibility gating
- In Step B, only show hero template categories (reddit, short-form, long-form) for normal users
- Show all 6 categories for power users
- Within each category, only show hero templates for normal users
- Button text: "Generate Story" instead of "Generate 3 Variants"

### Step 5: Gate dreamscape enhancement behind power user mode
- Hide "Enhance" button in Step A for non-power users
- Enhancement goals remain for power users

### Step 6: Update Rate & Save step for single output
- Remove variant tabs when only 1 output
- Keep all tools: rating, feedback, comments, split, continue, save, "Use as Dreamscape", export
- "Generate More" stays but generates 1 variant at a time

### Step 7: Admin prompt editing before generate
- For admin/dev role users, show expandable "Edit Prompt" section in template preview
- Display assembled system + user prompt
- Allow editing, pass through to generation

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/templates.ts` | Hero template list, filtered getters |
| `src/lib/adapters/openai.ts` | Single variant, accept prompt overrides |
| `src/lib/types.ts` | Add prompt overrides to GenerateOutputsParams |
| `src/app/api/outputs/generate/route.ts` | Pass prompt overrides to adapter |
| `src/app/app/create/page.tsx` | Template gating, single output UI, enhance gating, admin prompt edit |
