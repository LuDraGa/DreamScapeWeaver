# Planning: Remove Intensity Dials + Enhance Seed Generation Prompts

## Problem

1. **Intensity dials are unused complexity** — 7-dimensional sliders (stakes, darkness, pace, twist, realism, catharsis, moralClarity) that nobody uses. They add noise to the codebase and config templates without meaningful impact on output quality.

2. **Seed generation prompts need professional treatment** — The generic fallback is a weak one-liner. The 11 template-specific seedPrompts are decent but inconsistent with the XML framework used by story generation prompts. The PROMPT_FRAMEWORK.md defines the quality standard: `<role>`, `<context>`, `<constraints>`, `<expectation>` — seed prompts should follow it too.

3. **Template seedPrompt not wired in power user mode** — `handleGenerateDreamscapes` (power user) doesn't pass `selectedTemplate?.seedPrompt`.

## Scope

### Part A: Remove Intensity Dials Entirely

Remove all traces of the 7-dimensional intensity dial system.

**Files to modify:**

| File | Change |
|------|--------|
| `src/lib/types.ts` | Remove `IntensityValues`, strip `intensity` from `DialState`, `Preset`, `Template.settings`, `GenerateDreamscapesParams`, `EnhanceDreamscapeParams` |
| `src/config/dials.json` | **DELETE** |
| `src/lib/config.ts` | Remove `DIALS` export, `Dial` type, `getDial()` |
| `src/config/presets.json` | Remove `intensity` from all 5 presets |
| All ~50 template JSONs | Remove `settings.intensity` block |
| `src/lib/adapters/openai.ts` | Remove `buildIntensityPrompt()`, `adjustIntensity()`, strip intensity from `buildSystemPrompt()` |
| `src/lib/adapters/mock.ts` | Remove intensity from params |
| `src/lib/prompt-builders.ts` | Remove intensity from all 4 builders, remove `DIALS` import |
| `src/app/app/create/page.tsx` | Remove `randomizeIntensity`, `genIntensity`, `randomizeDialIntensity`, intensity sliders UI, `DIALS` import |
| `src/hooks/usePromptInspector.ts` | Remove `genIntensity` param, intensity from prompt builders |
| `src/app/api/dreamscapes/generate/route.ts` | Remove `intensity` from body parsing |
| `src/app/api/dreamscapes/enhance/route.ts` | Remove `intensity` from body parsing |
| `src/store/app-store.ts` | Remove intensity from initial dialState |
| `docs/PROMPT_FRAMEWORK.md` | Remove `settings.intensity` from required fields checklist |

### Part B: Enhance Seed Generation Prompts

#### B1: Rewrite generic (no-template) seed prompt with XML framework

**Current** (openai.ts fallback — used when no template seedPrompt exists):
```
System: "You are a creative story idea generator. Generate compelling, original story premises that: [5 bullets]"
User: "Generate N unique story seed ideas."
```

**Proposed** — Full XML structure following PROMPT_FRAMEWORK.md:

```xml
SYSTEM:
<role>
You are an expert story seed architect. You design compelling narrative premises
that make writers immediately see the full story. Your seeds are specific, concrete,
and conflict-driven — never vague concepts or abstract themes. Every seed you produce
has a clear protagonist, a specific situation, and tension that demands resolution.
</role>

<context>
StoryWeaver is a platform for generating narrative content across formats — Reddit
stories, short-form video scripts, YouTube narratives, and more. Story seeds are
the foundation: 1-3 sentence premises that capture a complete story concept. Writers
select seeds and expand them into full content. The best seeds are the ones that
make a writer think "I NEED to write this."
</context>

<constraints>
- Each seed: 1-3 sentences maximum
- Must include: a specific protagonist (age, role, or relationship), a concrete
  situation, and clear tension or conflict
- Must be grounded in reality — real relationships, real settings, real emotions
- NO fantasy, sci-fi, supernatural, or movie-plot scenarios unless the vibe
  specifically requests it
- NO vague concepts ("a person faces a difficult choice") — always specific
  ("a 34-year-old teacher discovers her best friend has been secretly dating
  her ex-husband for six months")
- Each seed must be distinct in setting, conflict type, and emotional register
- Avoid clichéd setups: no "little did they know", no "everything changed when",
  no amnesia, no secret twins
</constraints>

<expectation>
A great seed makes you stop and think about it. It presents a situation where the
reader immediately takes a side, imagines the characters, and wants to know what
happens next. The conflict should be specific enough to write from but open enough
to take in multiple directions. A writer should be able to read one seed and
immediately start drafting.
</expectation>

USER:
<task>
Generate {count} unique story seeds.{vibe}
</task>

<format>
Return each seed as a standalone premise — no titles, no labels, no numbering
in the seed text itself. Each seed should work as a complete concept in 1-3 sentences.
</format>

<examples>
GOOD seeds (specific, grounded, tension-rich):
- "A nurse discovers that the patient she's been caring for in the ICU is the drunk
   driver who killed her daughter three years ago. His family keeps thanking her for
   being so attentive."
- "After 15 years of marriage, a woman finds a shoebox of letters her husband wrote
   to another woman — dated before they met — that describe her exact life in detail."
- "A man agrees to be his estranged father's kidney donor, then finds out at the
   hospital that his father changed the will to leave everything to his stepchildren."

BAD seeds (vague, clichéd, or ungrounded):
- "Someone faces a moral dilemma at work" (too vague — WHO? WHAT dilemma?)
- "A haunted house reveals dark secrets" (supernatural + cliché)
- "Everything changes when a stranger arrives in town" (generic premise, no specifics)
</examples>
```

#### B2: Upgrade template-specific seedPrompts to XML

Upgrade the 11 existing template seedPrompts to use the same XML structure. The content stays the same (they're already well-written), but wrapped in proper `<role>`, `<context>`, `<constraints>`, `<expectation>` tags for consistency with the framework.

Example for AITAH:
```xml
SYSTEM:
<role>
You are a story seed generator specializing in r/AITAH (Am I The A**hole)
moral dilemma content. You design realistic interpersonal conflict scenarios
where BOTH sides have genuinely valid points. Your seeds are indistinguishable
from real situations people actually post about on Reddit.
</role>

<context>
r/AITAH is a subreddit where people describe interpersonal conflicts and ask
if they were wrong. The best seeds generate genuine moral ambiguity — a reasonable
person should struggle to decide who's right. Seeds must feel like situations that
happen in real life, not movie plots.
</context>

<constraints>
- Each seed: 2-3 sentences describing the situation and the controversial action
- Include specific details: ages, relationships, context
- Both parties must have defensible positions
- The moral question must be genuinely ambiguous
- Grounded in everyday life: family disputes, workplace friction, friendship
  betrayals, relationship boundaries, money conflicts, in-law drama
- NO fantasy, sci-fi, celebrity, or movie-plot scenarios
</constraints>

<expectation>
A great AITAH seed makes you immediately take one side — then reconsider when you
think about it from the other perspective. The moral question should haunt the
reader. Both "NTA" and "YTA" should feel like valid judgments.
</expectation>

USER:
<task>
Generate {count} unique r/AITAH story seeds.
</task>

<examples>
GOOD seed topics: refusing to attend a sibling's wedding over a boundary, telling
a friend their partner is cheating, choosing career over family event, setting a
financial boundary with parents, calling out a friend's parenting.

BAD seed topics: treasure maps, parallel universes, AI becoming sentient, anything
involving celebrities or fantasy elements.
</examples>
```

#### B3: Wire up seedPrompt in power user mode

In `handleGenerateDreamscapes`, pass `selectedTemplate?.seedPrompt` and `selectedTemplate?.id` (same as normal mode already does at line 1082).

#### B4: Update PROMPT_FRAMEWORK.md

Update the "Seed Generation Prompts" section to reflect that seed prompts now use XML structure (remove the "no XML needed" guidance).

## Execution Order

1. Types + config (foundation) — types.ts, dials.json, config.ts, presets.json
2. Template JSONs (bulk) — remove `settings.intensity` from all ~50 files
3. Core logic — openai.ts, prompt-builders.ts, mock.ts
4. API routes — dreamscapes/generate, dreamscapes/enhance
5. UI + state — create/page.tsx, app-store.ts, usePromptInspector.ts
6. Generic seed prompt rewrite — openai.ts
7. Template seedPrompt XML upgrades — 11 template JSON files
8. Power user wiring — create/page.tsx handleGenerateDreamscapes
9. Docs update — PROMPT_FRAMEWORK.md
10. Build verification
