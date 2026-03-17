# Prompt Framework

The prompt engineering standard for all StoryWeaver templates. This document defines the structure, placement rules, and patterns for constructing prompts that go to the LLM.

**Key decision**: See [DESIGN_DECISIONS.md § Prompt Architecture](DESIGN_DECISIONS.md#prompt-architecture-xml-structured-hybrid-framework) for the rationale behind this framework.

---

## Framework Overview

StoryWeaver uses a **hybrid prompt framework** combining three established approaches:

| Source Framework | What We Take From It | Where It Applies |
|---|---|---|
| **Modular Framework** (Role, Context, Task, Constraints, Format, Examples) | The 6-block skeleton — every prompt needs these categories of instruction | All templates — the universal structure |
| **RISEN** (Role, Input, Steps, Expectation, Narrowing) | The `<expectation>` block — defining what "great" looks like before generation starts | System prompt — sets the quality bar |
| **XML Tagging** | Structural separation via XML tags — clear boundaries between instruction types | Both system and user prompts — optical clarity for the LLM |

**What we do NOT use**:

| Framework | Why Not |
|---|---|
| **CoT for direct story generation** | Creative writing from a generic narrator doesn't benefit from reasoning traces — constrained prompting is better. |
| **R-T-F** (Role, Task, Format) | Too thin — our templates need constraints, context, and expectations to produce quality output. |

**Exceptions where CoT IS used**:

| Pattern | When | Why It Helps |
|---|---|---|
| **Character-First CoT** | First-person templates needing a distinct voice (e.g., AITAH) | Two-call flow: build a specific character, then the model *embodies* that character. Produces dramatically more authentic, varied voices. See [Character-First CoT Pattern](#character-first-cot-pattern). |
| **Enhancement CoT** | Improving/transforming existing seeds | Analyze-then-act pattern — model plans what to preserve vs. change. See [Enhancement CoT Pattern](#enhancement-cot-pattern). |

---

## The Two Roles: System vs User

The most important structural rule: **what goes where**.

### System Prompt — "Who you are and how you work"

The system prompt is the LLM's identity and rulebook. Content here gets **higher attention weight** — constraints placed in the system prompt are followed more reliably than the same constraints in the user prompt.

The system prompt contains things that are **always true** for this template, regardless of which specific seed or style variant is used.

### User Prompt — "What to do right now"

The user prompt is the per-request brief. It contains the **variable inputs** — the seed, the style modifier, and the structural guidance for this specific generation.

### Placement Rules

| Content Type | Goes In | Why |
|---|---|---|
| Persona / expertise depth | System | Identity — always true |
| Platform conventions / audience | System | Context — always true for this template |
| Word count, forbidden phrases, tone rules | System | Hard constraints — higher enforcement in system |
| What "great" looks like | System | Expectation — sets quality bar before generation |
| Few-shot structural example | System | Reference material — persona-level knowledge |
| The story seed (dreamscape) | User | Per-request variable input |
| Style variant modifier | User | Per-request variable selection |
| Output structure / beat sheet | User | Per-request format guidance |
| Self-check rubric | User | Per-request final verification pass |

---

## XML Tag Structure

All prompts use XML tags for clear separation between instruction types. This gives the LLM unambiguous boundaries between "what kind of instruction is this" vs. "what is the actual content."

### System Prompt Tags

```xml
<role>
  Expert persona with DEPTH — not just "you are a writer" but what you specialize in,
  what makes your output distinctive, what quality level you operate at.

  Good: "You are a veteran Reddit contributor who writes morally ambiguous conflict
  stories for r/AITAH. Your posts are indistinguishable from real Reddit posts..."

  Bad: "You are an expert writer for r/AITAH."
</role>

<context>
  The platform, audience, and content landscape this template exists in.
  What the audience expects, what gets engagement, what gets called out as fake.

  This is the "world" the content lives in — not the task itself.
</context>

<constraints>
  Hard rules that are ALWAYS enforced for this template:
  - Word count range
  - Forbidden phrases (avoidPhrases from template settings)
  - Tone requirements
  - Structural musts (e.g., "must include ages in opening")
  - Platform-specific rules

  These are non-negotiable regardless of seed or style variant.
</constraints>

<expectation>
  What "done well" looks like. The RISEN element.

  This is NOT a rubric checklist — it's a qualitative description of the ideal output.
  It tells the model what to aim for before it starts generating.

  Good: "A successful post makes the reader stop scrolling, read the whole thing,
  and genuinely struggle with their judgment."

  Bad: "The output should be high quality and engaging."
</expectation>
```

### User Prompt Tags

```xml
<task>
  Clear, verb-driven instruction. One sentence.
  "Write an r/AITAH post based on the story seed below."
</task>

<story_seed>
  The dreamscape text — the raw narrative input.
  If multiple fragments, includes auto-injected stitching instructions.

  This is the {dreamscape} placeholder content.
</story_seed>

<style>
  The selected style variant's promptModifier.
  Empty string if no variant selected.

  This is the {styleModifier} placeholder content.
</style>

<structure>
  The output format / beat sheet. Numbered steps showing
  the expected structural flow of the output.

  e.g., "1. Opening line with ages → 2. Background → 3. Incident → 4. Aftermath → 5. AITAH?"
</structure>

<reference_example>
  The few-shot structural excerpt (when available).
  Shows the model what the output should LOOK like structurally.

  This is the {fewShotExcerpt} placeholder content.
</reference_example>

<quality_check>
  The self-check rubric as a checkbox list.
  "Before outputting, verify your post passes ALL of these: □ ..."

  This is the {selfCheckRubric} placeholder content.
</quality_check>
```

---

## Template JSON Mapping

How template JSON fields map to the XML structure:

### `promptTemplate.system` (the system prompt)

Contains the full system prompt with XML tags. All of these are **static per template** — they don't change per generation:

```json
{
  "promptTemplate": {
    "system": "<role>\n...\n</role>\n\n<context>\n...\n</context>\n\n<constraints>\n...\n</constraints>\n\n<expectation>\n...\n</expectation>"
  }
}
```

**What moves INTO the system prompt** (compared to the old structure):
- `avoidPhrases` — previously injected into user prompt via `{avoidPhrases}` placeholder. Now hardcoded inside `<constraints>`.
- `fewShotExcerpt` — previously injected into user prompt via `{fewShotExcerpt}` placeholder. Now hardcoded inside system prompt as reference knowledge (or kept in user prompt as `<reference_example>` — template author's choice based on length).

### `promptTemplate.user` (the user prompt)

Contains the user prompt template with XML tags and placeholders:

```json
{
  "promptTemplate": {
    "user": "<task>\nWrite an r/AITAH post based on the story seed below.\n</task>\n\n<story_seed>\n{dreamscape}\n</story_seed>\n\n<style>\n{styleModifier}\n</style>\n\n<structure>\n1. Opening line...\n2. Background...\n</structure>\n\n<reference_example>\n{fewShotExcerpt}\n</reference_example>\n\n<quality_check>\n{selfCheckRubric}\n</quality_check>"
  }
}
```

### `characterPrompt` (optional — CoT character-first templates)

Templates that need a distinct first-person voice can provide a `characterPrompt` field. When present, this triggers a **two-call flow**: the first call builds a character profile, the second call writes the story as that character. See [Character-First CoT Pattern](#character-first-cot-pattern) for full details.

```json
{
  "characterPrompt": {
    "system": "<role>\nYou are an expert character designer...\n</role>\n\n<task>\nGiven a story seed, design the OP as a complete, specific person...\n</task>\n\n<output_format>\n1. Demographics\n2. Education & Occupation\n...\n</output_format>",
    "user": "<story_seed>\n{dreamscape}\n</story_seed>\n\nDesign the OP character for this story seed."
  }
}
```

When `characterPrompt` is present, the `promptTemplate.system` should include a `{character}` placeholder where the generated character profile will be injected:

```xml
<character>
{character}
</character>
```

### Placeholder Resolution

These placeholders are resolved by `buildPromptFromTemplate()` at generation time:

| Placeholder | Source | Notes |
|---|---|---|
| `{dreamscape}` | Dreamscape chunks text + auto-stitching instructions if multi-fragment | Always present |
| `{styleModifier}` | Selected `styleVariant.promptModifier` or first variant's modifier | Empty string if no variants |
| `{selfCheckRubric}` | `template.selfCheckRubric` array joined as checkbox list | Empty string if no rubric |
| `{fewShotExcerpt}` | `template.fewShotExcerpt` string | Empty string if no excerpt |
| `{character}` | Character profile generated by Call 1 (injected at runtime by `generateVariant()`) | Only for CoT templates with `characterPrompt` |

**Note**: `{avoidPhrases}` is no longer a user prompt placeholder — avoid phrases are now embedded directly in the system prompt's `<constraints>` block. `buildPromptFromTemplate()` no longer needs to replace this placeholder.

---

## Seed Generation Prompts

### Generic Seed Prompt (XML Framework)

When no template `seedPrompt` is provided, the generic seed generation prompt uses the same XML framework as story generation. It includes `<role>`, `<context>`, `<constraints>`, `<expectation>`, and `<examples>` tags. When a template is selected but has no custom `seedPrompt`, the generic prompt also receives `<template_context>` with the template's name, category, and description to tailor seeds to the content type.

The generic prompt lives in `src/lib/adapters/openai.ts` → `buildGenericSeedPrompt()`.

### Template-Specific Seed Prompts

Templates can optionally provide a `seedPrompt` for template-aware seed generation. When present, this completely replaces the generic prompt. Template seed prompts should also use XML structure:

```json
{
  "seedPrompt": {
    "system": "<role>\nYou are a story seed generator specializing in r/AITAH moral dilemma content...\n</role>\n\n<context>\nr/AITAH is a subreddit where...\n</context>\n\n<constraints>\n- Each seed: 2-3 sentences...\n</constraints>\n\n<expectation>\nA great AITAH seed makes you immediately take one side...\n</expectation>",
    "user": "<task>\nGenerate {count} unique r/AITAH story seeds.\n</task>\n\n<examples>\nGOOD seed topics: ...\n\nBAD seed topics: ...\n</examples>"
  }
}
```

**Rules for seed prompts**:
- Use XML tags: `<role>`, `<context>`, `<constraints>`, `<expectation>` in system; `<task>`, `<examples>` in user
- Include positive examples ("GOOD seeds: ...")
- Include negative examples ("BAD seeds: ...")
- Use `{count}` placeholder for the number of seeds to generate
- Keep the role specific to the content type — not generic "you are a writer"

---

## Character-First CoT Pattern

For templates that need a **distinct first-person voice** — where the narrator is a specific person with a background, vocabulary, and worldview — a single-call prompt can't produce enough voice diversity. The model defaults to a generic "casual narrator" regardless of how many character instructions you put in the prompt.

The solution: a **two-call chain-of-thought** where the first call designs the character and the second call embodies them.

### When to Use This Pattern

Use character-first CoT when:
- The output is **first-person narrative** (the narrator IS a character, not an omniscient voice)
- **Voice authenticity** matters (readers should picture a specific person typing/speaking)
- **Voice diversity** matters (different seeds should produce different-sounding narrators)
- The content type has a **real-world equivalent** where real people write in their own voice (Reddit posts, confessions, personal stories)

Do NOT use it for:
- Third-person or omniscient narration
- Scripts, production docs, marketing copy
- Content where the "voice" is the brand, not a character

### The Two-Call Flow

```
┌─────────────────────────────────────────────────┐
│ CALL 1: Character Generation (gpt-5-mini)       │
│                                                   │
│ System: Character designer role + output format   │
│ User:   Story seed → "Design the OP character"    │
│ Output: Free-form character profile (text)        │
└──────────────────────┬──────────────────────────┘
                       │ character profile
                       ▼
┌─────────────────────────────────────────────────┐
│ CALL 2: Story Generation (gpt-5.4)              │
│                                                   │
│ System: "You ARE this person" + {character}       │
│         injected into <character> block            │
│ User:   Story seed + style + structure + rubric   │
│ Output: Story written in that character's voice   │
└─────────────────────────────────────────────────┘
```

**Call 1** is cheap (gpt-5-mini, ~200-400 tokens output, no structured output needed). Its job is to make creative decisions about who this person is.

**Call 2** uses a stronger model (gpt-5.4) because it needs to inhabit a complex character while also writing high-quality narrative. The character profile is injected into the system prompt's `<character>` block via the `{character}` placeholder.

### Template JSON Structure

```json
{
  "characterPrompt": {
    "system": "<role>..character designer role..</role>\n<task>..design the OP..</task>\n<output_format>..10 character dimensions..</output_format>",
    "user": "<story_seed>\n{dreamscape}\n</story_seed>\n\nDesign the OP character..."
  },
  "promptTemplate": {
    "system": "<role>\nYou ARE the person described below...\n</role>\n\n<character>\n{character}\n</character>\n\n<context>...</context>\n<constraints>...</constraints>\n<expectation>...</expectation>",
    "user": "<task>Write the post as this person.</task>\n<story_seed>{dreamscape}</story_seed>\n..."
  }
}
```

### Character Prompt Design

The character prompt's `<output_format>` should cover dimensions that directly affect writing voice:

1. **Demographics** — age, gender, life stage
2. **Education & Occupation** — controls vocabulary and sentence structure
3. **Cultural Background** — shapes values, references, family dynamics
4. **Socioeconomic Context** — financial stress/comfort bleeds into tone
5. **Personality Type** — confrontational vs. conflict-avoidant, analytical vs. emotional
6. **Platform Familiarity** — veteran user vs. first-timer changes conventions used
7. **Emotional State While Writing** — rage-typing at 2am vs. calm reflection days later
8. **Voice Markers** — specific word choices, sentence patterns, cultural references
9. **Self-Awareness Level** — sees own flaws vs. oblivious
10. **Detail Selection** — what they'd emphasize or skip based on worldview

### Story Prompt Design (Call 2)

The system prompt for Call 2 has a critical framing shift: instead of "write as this character", use **"you ARE this character"**:

```xml
<role>
You ARE the person described in the character profile below.
You are not writing AS them — you ARE them.
Every word, every comma, every aside comes from this specific human being.
</role>

<character>
{character}
</character>
```

This identity framing produces stronger voice consistency than instructional framing.

### Billing & Cost

CoT templates incur two debits:
- `output_generation` (1150 credits) — the story call
- `character_generation` (500 credits) — the character call

Total: **1650 credits** per CoT generation (vs. 1150 for standard templates).

### Prompt Inspector

The prompt inspector shows:
- **Before generation (Step 1)**: Both calls labeled — "CALL 1: CHARACTER (gpt-5-mini)" and "CALL 2: STORY (gpt-5.4)" with `{character}` as placeholder
- **After generation (Step 2)**: The story prompt with the actual character profile injected — so devs see exactly what the writing model received

### Implementation

- Template detection: `template.characterPrompt` field present → two-call flow
- `buildPromptFromTemplate()` returns `characterSystemPrompt` + `characterUserPrompt` alongside the regular prompts
- `generateVariant()` in `openai.ts` handles the two-call orchestration
- Character profile stored on `OutputVariant.characterProfile` for inspector and AI review

---

## Enhancement CoT Pattern

Enhancement (improving an existing seed) benefits from the model planning its approach before executing.

### Why CoT Works Here

Story generation is a single creative act — the model should just write. But enhancement is a **transformation task**: take existing content, analyze what to change, then apply changes while preserving what's good. This analyze-then-act pattern benefits from explicit reasoning.

### The Prefill Pattern

Use a multi-turn structure with an **assistant prefill** that forces the model to plan before generating:

```typescript
const messages = [
  {
    role: 'system',
    content: `You are a story enhancement specialist. You improve story seeds
while preserving their core premise and voice.

When asked to enhance a seed, first analyze what to preserve and what to improve,
then produce the enhanced version.`
  },
  {
    role: 'user',
    content: `Enhance this story seed with the goal: "${goalDescription}"

<seed>
${chunkText}
</seed>

First, briefly identify (1) the core elements to preserve and (2) specific areas
to improve for this enhancement goal. Then write the enhanced seed.`
  },
  {
    role: 'assistant',
    content: `Let me analyze this seed.

**Preserve:** `
    // ← Assistant prefill. The model continues from here,
    //   forcing it to reason before generating the enhanced text.
  }
]
```

### When to Use CoT vs. Not

| Step | Use CoT? | Pattern | Why |
|---|---|---|---|
| Seed generation | No | — | Simple creative generation — just produce seeds |
| Story output (generic voice) | No | — | Creative writing benefits from constraints, not reasoning traces |
| Story output (first-person character) | Yes | Character-First | Two-call: build character → embody character. See [above](#character-first-cot-pattern) |
| Enhancement (vivid, conflict, etc.) | Yes | Prefill | Transformation task — analyze what to keep, what to change |
| Stitching (multi-seed merge) | Yes | Prefill | Synthesis task — needs to find connections between separate ideas |

### Implementation Notes

- The assistant prefill trick works with OpenAI's API by including a partial `assistant` message
- The model completes the analysis and then naturally transitions to the enhanced output
- Use structured output (Zod schema) to extract just the enhanced text from the response
- Temperature for enhancement should be lower (0.7) than generation (0.9) since we want controlled transformation

---

## Template Authoring Guide

When creating a new template, follow this checklist:

### Required Fields

Every template MUST have:

- [ ] `promptTemplate.system` with `<role>`, `<context>`, `<constraints>`, `<expectation>` XML blocks
- [ ] `promptTemplate.user` with `<task>`, `<story_seed>`, `<structure>` XML blocks + `{dreamscape}` placeholder
- [ ] `settings.tone` — one of `narrative`, `dialogue`, `script`, `mixed`
- [ ] `compatibility` — keyword matching for dreamscape-template pairing

### Strongly Recommended

Hero templates (the curated set) SHOULD also have:

- [ ] `seedPrompt` — template-aware seed generation (with positive AND negative examples)
- [ ] `styleVariants` — 2-3 named variants with distinct `promptModifier` instructions
- [ ] `selfCheckRubric` — 5-7 quality criteria as verification checklist
- [ ] `fewShotExcerpt` — structural reference showing output shape (not a full example)
- [ ] `exampleOutput` — complete example for UI preview and quality reference

### Optional — Character-First Templates

For first-person narrative templates where voice authenticity matters:

- [ ] `characterPrompt` — triggers two-call CoT flow. See [Character-First CoT Pattern](#character-first-cot-pattern)
- [ ] `{character}` placeholder in `promptTemplate.system` inside a `<character>` block
- [ ] Self-check rubric should include voice consistency check (e.g., "Does the OP's voice feel consistent and specific?")

### Writing Good XML Blocks

**`<role>` — Be specific, not generic**

```xml
<!-- Bad -->
<role>You are a creative writer.</role>

<!-- Good -->
<role>
You are a veteran Reddit contributor who writes morally ambiguous conflict stories
for r/AITAH. Your posts are indistinguishable from real Reddit posts — casual
first-person voice, specific ages and relationship details, natural paragraph breaks.
You've written viral posts that hit 10K+ upvotes because readers genuinely can't
decide who's right.
</role>
```

**`<context>` — Describe the world, not the task**

```xml
<!-- Bad -->
<context>This is for Reddit.</context>

<!-- Good -->
<context>
r/AITAH is a subreddit where people describe interpersonal conflicts and ask if
they were wrong. The best posts generate 50/50 debate in comments. Readers are
skeptical of posts that sound "written" — authenticity is everything. Posts that
feel AI-generated get called out and downvoted immediately.
</context>
```

**`<constraints>` — Concrete and enforceable**

```xml
<!-- Bad -->
<constraints>
Make it good and not too long.
</constraints>

<!-- Good -->
<constraints>
- 400-800 words
- First-person, casual Reddit voice with contractions and parenthetical asides
- Include specific ages and relationship context in opening line
- Both parties MUST have genuinely defensible positions
- NEVER use: "little did I know", "the room fell silent", "needless to say"
</constraints>
```

**`<expectation>` — Qualitative, not mechanical**

```xml
<!-- Bad -->
<expectation>The output should be engaging and well-written.</expectation>

<!-- Good -->
<expectation>
A successful post makes the reader stop scrolling, read the whole thing, and
genuinely struggle with their judgment. The moral dilemma is ambiguous enough
that the top comments will be split between NTA and YTA. The voice sounds like
a real 25-35 year old typing on their phone at 11pm after a bad day.
</expectation>
```

---

## Category-Specific Guidance

The XML structure is the same for all categories. What differs is the **content emphasis** within each block:

### Reddit Templates
- `<role>`: Emphasize authenticity — "indistinguishable from real posts"
- `<context>`: Subreddit culture, what gets upvoted/downvoted, community norms
- `<constraints>`: Platform conventions (ages in opening, TL;DR rules, flair)
- `<expectation>`: Reader reaction — "stop scrolling", "genuinely debate"

### Short-Form Templates (TikTok/Reels)
- `<role>`: Emphasize pacing mastery — "every word earns its place"
- `<context>`: Platform attention dynamics — "3 seconds to hook, 60 seconds total"
- `<constraints>`: Strict word count (100-150), no wasted words, hook-first
- `<expectation>`: Viewer behavior — "rewatch to catch what they missed", "share with friends"

### Long-Form Templates (YouTube)
- `<role>`: Emphasize structural expertise — "clear sections, chapter timestamps"
- `<context>`: YouTube audience expectations — watch time, retention curves
- `<constraints>`: Section markers, timestamp format, intro hook requirements
- `<expectation>`: Viewer journey — "understand a complex topic in 10 minutes"

### Marketing Templates
- `<role>`: Emphasize persuasion expertise — "conversion-focused copywriting"
- `<context>`: Business context — audience, funnel position, competitive landscape
- `<constraints>`: CTA requirements, brand voice rules, compliance needs
- `<expectation>`: Business outcome — "reader takes the intended action"

### Production Templates (Audio/Video)
- `<role>`: Emphasize technical expertise — "production-ready documents"
- `<context>`: Production workflow — who reads this document, when, for what purpose
- `<constraints>`: Format standards, technical notation, industry conventions
- `<expectation>`: Usability — "a crew member can execute from this document alone"

---

## Anti-Patterns

| Anti-Pattern | Why It's Bad | Do This Instead |
|---|---|---|
| One-line system prompts ("You are a writer") | Wastes the highest-attention-weight slot on nothing | Fill all 4 XML blocks with specific, useful content |
| Dumping everything in user prompt | Constraints get lower attention weight, content blurs with instructions | Split: static rules → system, variable inputs → user |
| Plain text without XML tags | Model can't distinguish instruction types from content | Wrap every section in descriptive XML tags |
| Using CoT for third-person/omniscient narration | Creative writing from a generic voice doesn't benefit from reasoning traces | Reserve CoT for first-person character templates and enhancement/stitching |
| Character instructions in a single-call prompt | Model defaults to generic voice regardless of how detailed the character description is | Use two-call character-first pattern — separate character design from story writing |
| Generic expectations ("be engaging") | Gives the model no concrete quality target | Describe the ideal reader/viewer reaction specifically |
| Copying few-shot examples verbatim | Model pattern-matches too closely, output feels templated | Label as "STRUCTURAL REFERENCE (do not copy)" |
| Adding avoid-phrases in user prompt | Lower enforcement reliability | Put in system prompt `<constraints>` block |

---

## File Reference

| File | Purpose |
|---|---|
| `src/config/templates/{category}/{name}.json` | Template definitions with prompt content |
| `src/lib/templates.ts` | `buildPromptFromTemplate()` — resolves placeholders, assembles final prompts |
| `src/lib/prompt-builders.ts` | Legacy prompt builders (preset/dial-based flow, not template flow) |
| `src/lib/adapters/openai.ts` | OpenAI adapter — receives assembled prompts, handles single-call and two-call (CoT) flows |
| `src/app/api/dreamscapes/generate/route.ts` | API route for seed generation |
| `src/app/api/outputs/generate/route.ts` | API route for story output generation |

---

**When in doubt**: System prompt = identity + rules (static per template). User prompt = brief + input (variable per generation). XML tags = boundaries. Expectation = quality bar. CoT = character-first voice templates + enhancement/stitching.
