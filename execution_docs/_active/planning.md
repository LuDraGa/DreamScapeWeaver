# Planning: Template-First Flow + Style Variants + Quality Pipeline

**Session**: 2026-03-13
**Branch**: `simplify-and-focus`
**Context**: Redesign the generation pipeline for dramatically higher output quality. Based on product review feedback and deep analysis of current output shortcomings.

## Problem Statement

Current pipeline (generic dreamscape → platform selection → generation) produces outputs not usable on target platforms:
1. Seeds generated without platform context (fantasy seeds for AITAH)
2. Intensity dials (7 dims × 10 levels) are decorative — no meaningful effect
3. Template prompts lack few-shot examples, correct word counts, self-check rubrics
4. No quality assurance layer

## Proposed Changes

### 1. Template Schema Redesign

Add new fields to Template interface and JSON files:

```typescript
seedPrompt?: {
  system: string   // Platform-aware seed generation system prompt
  user: string     // User prompt with {count} variable
}
styleVariants: StyleVariant[]  // 2-3 named styles per template
selfCheckRubric: string[]      // Quality criteria checked before output
fewShotExcerpt?: string        // Condensed structural example
```

```typescript
interface StyleVariant {
  id: string
  name: string         // e.g., "Controversial", "Emotional", "Unhinged"
  description: string  // Short description for UI
  promptModifier: string // Additional prompt instructions for this style
}
```

### 2. Template-First Flow (Normal Users)

**Current:** Step A (Dreamscape) → Step B (Platform & Style) → Step C (Rate & Save)
**New:** Step A (Pick Template + Style) → Step B (Seed — template-aware gen + manual input) → Step C (Rate & Save)

Template selection moves FIRST. Seed generation uses `template.seedPrompt` for platform-aware seeds.

Template is also auto-suggested AFTER seed editing via compatibility matching (keyword-based, no LLM call).

### 3. Style Variants Replace Dials (Normal Users)

- Normal users see 2-3 named style options per template
- Each style has a `promptModifier` with concrete writing instructions
- Power users retain full dial access

### 4. Self-Check Rubric in Generation Prompts

Appended to every template generation prompt — zero extra API calls:

```
Before outputting, verify:
□ Would a real person post this?
□ Is the moral dilemma genuinely ambiguous?
□ Does it include ages, relationship context, specific details?
□ Is it 400-800 words?
```

### 5. Fix Word Counts per Platform

| Template | Current | Correct |
|----------|---------|---------|
| r/AITAH | 200 | 500-800 |
| r/TIFU | 200 | 400-700 |
| r/nosleep | 200 | 800-1500 |
| Short-form (Reels) | 200 | 150-300 |
| Long-form (YouTube) | 500 | 1500-3000 |

### 6. Few-Shot Excerpts in Hero Templates

Condensed structural examples showing beats, tone, format. Not full posts.

### 7. Auto-Suggest Template After Seed Edit

Reuse enhanced compatibility matching. If best-fit template changes after user edits seed, show nudge. No LLM call.

---

## Implementation Steps

### Step 1: Template Schema + Types
- Add `StyleVariant` type to `types.ts`
- Extend `Template` interface with new fields
- Add optional `templateId` and `seedPrompt` to `GenerateDreamscapesParams`

### Step 2: Upgrade 9 Hero Template JSONs
- `seedPrompt` — platform-aware seed generation
- `styleVariants` — 2-3 per template
- `selfCheckRubric` — platform-specific quality checks
- `fewShotExcerpt` — structural example
- Corrected `wordCount`
- Improved `promptTemplate` with rubric + few-shot injection
- Start with `reddit-aitah` as reference, apply pattern to all 9

### Step 3: Wire Template-Aware Seed Generation
- `openai.ts` `generateDreamscapes()` accepts optional `seedPrompt` override
- API route passes through
- `mock.ts` updated

### Step 4: Wire Style Variants to Generation
- `buildPromptFromTemplate()` accepts style variant, injects `promptModifier`
- Self-check rubric auto-appended to user prompt
- Update `GenerateOutputsParams` with `styleVariantId`

### Step 5: Refactor Create Page Flow (Normal Users)
- Reorder: Template Selection → Seed → Rate & Save
- Style variant picker in template selection
- Seed gen panel uses template's `seedPrompt`
- Auto-suggest template on significant seed edit

### Step 6: Update All Docs
- ARCHITECTURE.md, WORKFLOWS.md, DESIGN_DECISIONS.md, DEVELOPMENT.md, FUTURE_GROWTH.md

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Add `StyleVariant`, extend `Template`, extend `GenerateDreamscapesParams` |
| `src/config/templates/reddit/*.json` | Upgrade 4 hero templates |
| `src/config/templates/short-form/*.json` | Upgrade 4 hero templates |
| `src/config/templates/long-form/youtube-story-time.json` | Upgrade 1 hero template |
| `src/lib/templates.ts` | Update `buildPromptFromTemplate()` for style + rubric |
| `src/lib/adapters/openai.ts` | Template-aware seed gen, style variant support |
| `src/lib/adapters/mock.ts` | Template-aware mock seeds |
| `src/app/api/dreamscapes/generate/route.ts` | Pass through seed prompt |
| `src/app/app/create/page.tsx` | Reorder flow, style picker, template-first |
| `src/lib/prompt-builders.ts` | Update for template context |
| `docs/*.md` | Full doc update |

## Risks

- Template JSON schema changes — must be backward-compatible with non-hero templates
- Create page refactor — preserve power user flow while changing normal user flow
- Few-shot examples must be high quality or they anchor model to bad output
