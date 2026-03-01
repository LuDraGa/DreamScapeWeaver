# Studio Feature - Handoff Document

**Last Updated:** 2026-03-01
**Phase:** Foundation (P1 - Task 1.1 starting)
**Branch Point:** After template system implementation

---

## Quick Context

**What we're building:** Non-linear content studio that lets users transform any content part into any other part (Dreamscape → TikTok Script → Scene Breakdown → Cinematography, etc.) with project-based organization.

**Why:** Current Create page is linear (Dreamscape → Template → Story). Users want flexibility to:
- Generate multiple formats from one source
- Expand short content to long-form
- Condense long content to threads
- Add video production details to scripts
- Organize related content in projects

**Decision:** Build new `/app/studio` page alongside existing Create page for comparison.

---

## Current State

### What's Done (Before This Branch)
- ✅ Template system (13 templates: 6 short-form + 7 Reddit)
- ✅ Normal user mode (template selection UI)
- ✅ Power user mode (advanced dials)
- ✅ 3-step flow for normal users (skip Generate review)
- ✅ Prompt Inspector showing template prompts
- ✅ Mock adapter detecting template types

### What's Next (This Branch)
- **NOW:** Task 1.1 - Add long-form templates (YouTube, etc.)
- Then: Project data model
- Then: Studio page UI
- See `planning.md` for full 16-task breakdown

---

## Architecture Decisions

### 1. **Dual Page Strategy**
- **Keep:** `/app/create` (existing linear workflow)
- **New:** `/app/studio` (non-linear part-based workflow)
- **Why:** Compare both, A/B test, gradual migration
- **Migration:** Eventually merge or sunset Create page

### 2. **Project Model**
- **Structure:** Projects (folders) → Parts (files)
- **NOT:** Complex graphs, collections, tags-only
- **Why:** Zero learning curve, familiar mental model
- **Storage:** localStorage initially, IndexedDB if needed

### 3. **Part-Based Generation**
- **Core concept:** Any content part can be input OR output
- **Examples:**
  - Dreamscape → TikTok Script (generate from concept)
  - TikTok Script → YouTube Script (expand)
  - Reddit Post → Twitter Thread (condense)
  - Script → Scene Breakdown (add production details)
  - YouTube Script → Dreamscape (extract concept)
- **UI Pattern:** "What do you have?" → "What do you need?" → Generate

### 4. **Save Both Input & Output**
- When user generates Reddit Post from Dreamscape, BOTH are saved in project
- **Why:** Full derivation history, can regenerate/remix from any part
- **Metadata:** Each part knows its source (sourcePartId, transformType)

### 5. **Smart Suggestions (Future)**
- AI-powered project naming
- Auto-detect which project to add parts to
- Contextual transform suggestions ("Generate scene breakdown?")
- Pause/block detection for help
- **Powered by:** Cheap model (GPT-4o-mini) for cost efficiency

---

## Data Model

```typescript
// Project (top-level container)
interface Project {
  id: string
  title: string // AI-suggested or user-edited
  description?: string
  thumbnail?: string // Preview from first part
  createdAt: string
  updatedAt: string
  partIds: string[] // References to parts
}

// Part (content inside projects)
interface Part {
  id: string
  projectId: string
  type: PartType // 'dreamscape' | 'tiktok-script' | 'youtube-script' | etc.
  title: string
  content: string // The actual text
  metadata: {
    wordCount: number
    platform?: string
    duration?: string
    tone?: string
    sourcePartId?: string // What part generated this
    transformType?: string // 'expand' | 'condense' | 'remix' | 'extract'
  }
  createdAt: string
  updatedAt: string
}

// Transform (defines valid part-to-part conversions)
interface Transform {
  sourceType: PartType
  targetType: PartType
  transformType: 'expand' | 'condense' | 'remix' | 'extract' | 'format'
  promptTemplate: string
}
```

---

## Content Part Types (MVP)

### Text Foundations
1. Dreamscape (existing)
2. Synopsis (100-300 words)
3. Beat Sheet (structure outline)

### Short-Form Content
1. Reel/TikTok Script (existing templates)
2. Twitter Thread (8-15 tweets)
3. LinkedIn Post (1300-2000 chars)

### Long-Form Content
1. **YouTube Script (5-20min)** ← ADDING NOW
2. Reddit Post (existing)
3. Blog Article (800-2000 words)

### Video Production Parts
1. Scene Breakdown (acts, transitions, locations)
2. Shot List (numbered shots, camera specs)
3. Cinematography Guide (lighting, color, movement)

**Total MVP:** 10 part types
**Phase 2:** Add podcast, marketing, audio production parts

---

## Task Breakdown (16 Tasks)

### **PRIORITY 1: Foundation** (11-16 hours)
1. **Task 1.1** ← YOU ARE HERE
   - Add long-form templates (YouTube Explainer, Story Time, Documentary)
   - 4-6 hours, HIGH value, no blockers
2. Task 1.2 - Project data model & storage (5-7h)
3. Task 1.3 - Part type registry & transform map (2-3h)

### **PRIORITY 2: Core UI** (19-26 hours)
4. Task 2.1 - Studio page route (1-2h)
5. Task 2.2 - Project Manager UI (5-7h)
6. Task 2.3 - Part Manager UI (5-7h)
7. Task 2.4 - Part-to-Part Generator UI (8-10h)

### **PRIORITY 3: Generation Engine** (16-21 hours)
8. Task 3.1 - Prompt builder for transforms (10-12h)
9. Task 3.2 - Mock adapter for transforms (4-6h)
10. Task 3.3 - API route for part generation (2-3h)

### **PRIORITY 4: Smart AI** (16-23 hours - Optional)
11. Task 4.1 - AI project naming (2-3h)
12. Task 4.2 - Auto-detect project (2-3h)
13. Task 4.3 - Contextual suggestions (4-5h)
14. Task 4.4 - Pause detection (8-10h) ← Defer to Phase 2

### **PRIORITY 5: Polish** (4-6 hours - Optional)
15. Task 5.1 - Onboarding tour (2-3h)
16. Task 5.2 - Documentation (2-3h)

**MVP = P1 + P2 + P3 = ~46-63 hours**

---

## Success Metrics

**MVP Success = User can:**
1. Create project from first saved part (1 click + AI name)
2. Generate 3+ different part types from one dreamscape
3. Navigate library and find saved parts
4. Re-generate from any saved part
5. See clear lineage (this script came from that dreamscape)

---

## Files Modified So Far (Template System)

```
src/lib/types.ts
  - Added Template, TemplateCategory, TemplateCompatibility types
  - Template types: 'short-form' | 'reddit'

src/lib/templates.ts (NEW)
  - Template loading utilities
  - Compatibility checking
  - buildPromptFromTemplate()

src/config/templates/
  short-form/
    - revenge-story.json
    - motivational.json
    - horror-creepy.json
    - unexpected-twist.json
    - drama-confession.json
    - life-lesson.json
  reddit/
    - aitah.json
    - tifu.json
    - petty-revenge.json
    - nosleep.json
    - writing-prompts-scifi.json
    - writing-prompts-fantasy.json
    - writing-prompts-horror.json

src/components/create/
  - content-type-selector.tsx (NEW)
  - template-card.tsx (NEW)
  - template-gallery.tsx (NEW)
  - template-preview.tsx (NEW)

src/app/app/create/page.tsx
  - Added template state (selectedCategory, selectedTemplate)
  - Conditional stepper (3 steps for normal, 4 for power user)
  - handleGenerateFromTemplate()
  - Step B normal mode: template selection UI
  - Prompt Inspector: template prompt preview

src/lib/adapters/mock.ts
  - Detect template category by presetId prefix
  - Return video scripts for short-form templates
  - Return Reddit stories for reddit templates
```

---

## Next Files to Create/Modify (Task 1.1)

**Task 1.1: Add Long-Form Templates**

```
src/lib/types.ts
  - Change: TemplateCategory = 'short-form' | 'reddit' | 'long-form'

src/config/templates/long-form/ (NEW)
  - youtube-explainer.json
  - youtube-story-time.json
  - youtube-documentary.json

src/lib/templates.ts
  - Import long-form templates
  - Add to ALL_TEMPLATES array

src/components/create/content-type-selector.tsx
  - Add "Long Videos" card (YouTube icon)

src/lib/adapters/mock.ts
  - Add isLongFormTemplate check
  - Return mock YouTube scripts (1500-3000 words)
```

---

## Common Pitfalls & Reminders

### When Adding Templates:
1. Template ID MUST start with category prefix (`long-youtube-explainer`)
2. Import in `src/lib/templates.ts` and add to `ALL_TEMPLATES`
3. Update mock adapter to detect category by prefix
4. Intensity dials must have all 7 values (stakes, darkness, pace, twist, realism, catharsis, moralClarity)
5. Use `{dreamscape}` and `{avoidPhrases}` placeholders in prompts

### When Building Studio:
1. Keep Create page completely untouched (parallel development)
2. All new code goes in `/app/studio` and `/components/studio`
3. localStorage keys use `studio_` prefix to avoid conflicts
4. Project/Part types are separate from current Dreamscape/Output types

### Storage Strategy:
- Start with localStorage (simple, fast)
- Migrate to IndexedDB if users hit 10MB limit
- Each project/part is independent JSON object
- No relations in storage (use IDs for references)

---

## Known Issues / Tech Debt

1. **Template components unused:** ContentTypeSelector, TemplateGallery, TemplateCard, TemplatePreview were created but not used in final single-page design. Can delete or keep for reference.

2. **Mock data is hardcoded:** All generation uses static mock strings. Real LLM integration pending.

3. **No versioning:** Parts don't track edit history. Just latest version saved.

4. **No export:** Can't export projects yet. Phase 2 feature.

5. **localStorage limits:** Will hit 10MB limit with many projects. IndexedDB migration needed eventually.

---

## Conversation Pivots

**Original request:** "Add long-form YouTube templates"

**Expanded to:** "Non-linear content studio with project-based organization"

**Key insights from discussion:**
- Templates are for content formats within platforms (not platforms themselves)
- Reddit is special (many subreddits = many templates)
- Short-form video (TikTok/Reels/Shorts) is ONE format, different story types
- Long-form video (YouTube) needs different structure (chapters, timestamps)
- Users want to transform content (expand, condense, remix)
- Projects = folders (simple, not complex graphs)
- Save both input and output for full derivation history

**Rejected approaches:**
- Complex graph visualization (too much cognitive load)
- Tags-only organization (lacks structure)
- Single linear flow (not flexible enough)
- Hardcoded suggestions (should be AI-powered)

---

## How to Resume from This Point

1. **Read this document** (you're doing it!)
2. **Read `planning.md`** for full task breakdown
3. **Check current task status** in `execution.md`
4. **Review last commit** to see what was just completed
5. **Find your place** in the execution priority list
6. **Continue from there**

**Current Position:** About to start **Task 1.1** (Add long-form templates)

---

## Questions? Check These Docs

- **Planning:** `execution_docs/_active/planning.md`
- **Execution Status:** `execution_docs/_active/execution.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Design Decisions:** `docs/DESIGN_DECISIONS.md`
- **Template Guide:** `docs/TEMPLATES.md` (to be created in Task 5.2)

---

## Contact Points / Decisions Made

**Storage:** localStorage → IndexedDB if needed (not yet)
**Part reuse:** No (one part = one project)
**Versioning:** Not in MVP
**Export:** Phase 2
**Collaboration:** Way out of scope

**AI Model Usage:**
- Generation: GPT-4 or Claude (via OpenAI adapter)
- Smart suggestions: GPT-4o-mini (cheap, fast)
- Currently: Mock adapter (no real AI yet)

---

**You are here:** Ready to start Task 1.1 - Add Long-Form Templates
**Next:** Create 3 YouTube template JSONs, update types, add mock data
**After:** Task 1.2 - Project data model

Good luck! 🚀
