# Planning: Structured Seeds with Detail Toggle

## Problem

Seed generation currently outputs a single text blob (1-2 sentences). This:
- Loses the user's original vibe/concept in favor of template defaults
- Gives a thin preview — hard to tell if the seed matches the user's vision
- Gives final generation too little direction — story output can drift from intent

Example: User inputs "you realise you aren't living but this is just a flashback of your life before death" with NoSleep Paranoia. Gets surveillance/stalker seeds instead of existential dread.

## Solution

### 1. New Seed Schema

Replace `{ text: string }` with:

```
{
  premise: string,        // core idea, 2-3 sentences, well-defined
  details: string[]       // freeform list — character traits, turning points,
                          // setting anchors, sensory details, world rules, motifs,
                          // whatever serves THIS specific idea
}
```

Key principle: **details are freeform and idea-dependent**, not a rigid schema. The LLM decides what types of details are relevant for each seed.

### 2. Explicit Detail Toggle

New UI control alongside vibe input + count dropdown:

- **Sparse**: Premise is suggestive but defined. 0-2 details only if essential to the concept. Good for open-ended exploration.
- **Rich**: Premise is concrete and specific. 3-6 details covering character, setting, turning points, sensory anchors, etc. Good for when user has a clear vision.

Toggle is a segmented control or similar simple two-option UI element.

### 3. Prompt Changes

Seed generation prompts updated to:
- Output structured JSON (premise + details) — enforced by Zod via structured outputs
- Respect detail level toggle (sparse vs rich instruction block)
- **Anchor to user's vibe more strongly** — the user's input is the foundation of every seed, template style shapes HOW the story is told, not WHAT it's about

Applied to both:
- Generic seed prompt (`config/prompts/seed-generation.json`)
- Template-specific seedPrompts (all hero templates with custom seedPrompt)

### 4. UI Changes

**Seed card display:**
- Premise shown as main text (like current, but richer)
- If details exist, collapsible bullet list below
- Collapsed by default with subtle indicator ("3 details" badge or chevron)

**New control:**
- Detail toggle (Sparse/Rich) added to generation controls panel
- Local component state like genVibe and genCount

### 5. Type Changes

```typescript
// types.ts — DreamscapeChunk
interface DreamscapeChunk {
  id: string
  title: string
  text: string           // ← premise goes here (backward compatible)
  details?: string[]     // ← new optional field
}
```

Backward compatible — existing seeds without details still render fine.

### 6. Downstream: Structured Seed → Story Generation

When a seed is "Used" for final generation:
- Pass full structured seed (premise + details) into the story generation prompt
- Prompt builder formats it: premise as the core concept, details as concrete constraints
- More details = more directed output, fewer details = more creative freedom

### 7. Zod Schema Change

```typescript
// openai.ts
const DreamscapeSeedSchema = z.object({
  premise: z.string().describe('The core story idea in 2-3 well-defined sentences'),
  details: z.array(z.string()).describe('Freeform concrete story elements — character traits, turning points, setting details, sensory anchors, world rules, motifs. Include what serves this specific idea.'),
})
```

## File Changes

| File | Change |
|------|--------|
| `src/lib/adapters/openai.ts` | Zod schema update, seed mapping, detail-level param |
| `src/lib/types.ts` | Add `details?: string[]` to DreamscapeChunk |
| `src/lib/prompt-builders.ts` | Detail-level instruction injection for both generic and template paths |
| `src/config/prompts/seed-generation.json` | Updated prompt with structured output instructions + detail-level blocks |
| `src/app/app/create/page.tsx` | Detail toggle UI + structured seed card display |
| Template seedPrompts (hero templates) | Updated to output structured format with detail-level awareness |

## What We're NOT Touching

- Template content/style (templates are fine)
- Enhancement/stitch flow
- Library/save logic
- Output generation prompts (only seed gen changes, downstream just receives richer input)

## Open Questions

- Toggle labels: "Sparse" / "Rich" or "Minimal" / "Detailed" or something else?
- Should the detail toggle default to Sparse or Rich?
