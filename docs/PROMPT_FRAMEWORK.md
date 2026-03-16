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
| **Chain-of-Thought (CoT)** for story generation | CoT is for reasoning/logic tasks. Creative generation benefits from constrained space, not traced reasoning. |
| **R-T-F** (Role, Task, Format) | Too thin — our templates need constraints, context, and expectations to produce quality output. |
| **CoT for enhancement** | Exception — we DO use a CoT-like prefill pattern for the enhancement step. See [Enhancement CoT Pattern](#enhancement-cot-pattern). |

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

### Placeholder Resolution

These placeholders are resolved by `buildPromptFromTemplate()` at generation time:

| Placeholder | Source | Notes |
|---|---|---|
| `{dreamscape}` | Dreamscape chunks text + auto-stitching instructions if multi-fragment | Always present |
| `{styleModifier}` | Selected `styleVariant.promptModifier` or first variant's modifier | Empty string if no variants |
| `{selfCheckRubric}` | `template.selfCheckRubric` array joined as checkbox list | Empty string if no rubric |
| `{fewShotExcerpt}` | `template.fewShotExcerpt` string | Empty string if no excerpt |

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

## Enhancement CoT Pattern

**This is the one place where Chain-of-Thought applies.** Enhancement (improving an existing seed) benefits from the model planning its approach before executing.

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

| Step | Use CoT? | Why |
|---|---|---|
| Seed generation | No | Simple creative generation — just produce seeds |
| Story output generation | No | Creative writing benefits from constraints, not reasoning traces |
| Enhancement (vivid, conflict, etc.) | Yes | Transformation task — analyze what to keep, what to change |
| Stitching (multi-seed merge) | Yes | Synthesis task — needs to find connections between separate ideas |

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

Hero templates (the curated 9) SHOULD also have:

- [ ] `seedPrompt` — template-aware seed generation (with positive AND negative examples)
- [ ] `styleVariants` — 2-3 named variants with distinct `promptModifier` instructions
- [ ] `selfCheckRubric` — 5-7 quality criteria as verification checklist
- [ ] `fewShotExcerpt` — structural reference showing output shape (not a full example)
- [ ] `exampleOutput` — complete example for UI preview and quality reference

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
| Using CoT for story generation | Creative writing doesn't benefit from reasoning traces | Reserve CoT for enhancement/stitching only |
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
| `src/lib/adapters/openai.ts` | OpenAI adapter — receives assembled prompts, calls GPT-4o |
| `src/app/api/dreamscapes/generate/route.ts` | API route for seed generation |
| `src/app/api/outputs/generate/route.ts` | API route for story output generation |

---

**When in doubt**: System prompt = identity + rules (static per template). User prompt = brief + input (variable per generation). XML tags = boundaries. Expectation = quality bar. CoT = enhancement only.
