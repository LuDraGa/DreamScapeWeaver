# Planning: Non-Linear Content Studio

**Started:** 2026-03-01
**Context:** Evolving from linear template workflow to flexible part-based generation system

---

## Vision

**From:** Dreamscape → Template → Story (linear, single output)
**To:** Any Part → Any Part (non-linear, multiple outputs, project-based)

**Example Flow:**
- User has dreamscape → generates TikTok script → loves it → saves to "VR Horror" project
- From same dreamscape → generates Reddit post → saves to same project
- From TikTok script → generates scene breakdown → generates cinematography
- All parts live in "VR Horror" project, can be reused/remixed

---

## Critical Decisions Made

### 1. **Keep Existing Create Page, Build New "Studio" Page**
- **Why:** Compare both approaches, gradual migration, A/B test
- **Decision:** New route `/app/studio` with completely new UI
- **Migration path:** Eventually merge best of both or sunset Create page

### 2. **Project Model: Simple Folders**
- **What:** Projects = top-level containers, Parts = content inside
- **Not:** Complex graphs, collections, tags-only
- **Why:** Zero learning curve, familiar mental model (file explorer)

### 3. **Save Both Input and Output**
- **Example:** Dreamscape → Reddit Post saves BOTH in project
- **Why:** Full derivation history, can regenerate/remix from any part
- **Storage:** Each part is independent, linked by metadata

### 4. **Non-Linear Part-Based Generation**
- **Any part can be input OR output**
- **Examples:**
  - Dreamscape → TikTok Script
  - TikTok Script → Long-form YouTube Script (expand)
  - Reddit Post → Twitter Thread (condense)
  - Scene Breakdown → Cinematography
  - YouTube Script → Dreamscape (extract concept)
- **UI:** "What do you have?" → "What do you need?" → Generate

### 5. **Smart Suggestions (Observational, Not Hardcoded)**
- **Trigger:** User pauses, cursor idle, incomplete sections
- **Powered by:** Cheap model (GPT-4o-mini) for live analysis
- **Examples:**
  - "This dreamscape fits 'VR Horror' project. Add it?"
  - "You have a script. Generate scene breakdown?"
  - "Scene 3 missing camera angles. Add them?"

### 6. **AI-Assisted Naming and Scoping**
- **Project naming:** AI suggests from first saved part content
- **Auto-detection:** Subsequent saves auto-assign to active/related project
- **Override:** User can always change/create new project

---

## Content Part Types (MVP Scope)

### Text Foundations
1. Dreamscape (existing)
2. Synopsis (100-300 words)
3. Beat Sheet (structure outline)

### Short-Form Content
1. Reel/TikTok Script (existing templates)
2. Twitter Thread (8-15 tweets)
3. LinkedIn Post (1300-2000 chars)

### Long-Form Content
1. **YouTube Script (5-20min)** - NEW
2. Reddit Post (existing)
3. Blog Article (800-2000 words)

### Video Production Parts
1. Scene Breakdown (acts, transitions, locations)
2. Shot List (numbered shots, camera specs)
3. Cinematography Guide (lighting, color, movement)

**MVP Focus:** 10 part types (bold = new)
**Phase 2:** Add remaining parts (podcast, marketing, audio)

---

## Tasks Breakdown

### **PRIORITY 1: Foundation (High Value, Required)**

#### Task 1.1: Add Long-Form Content Type & Templates
- **Effort:** Medium (4-6 hours)
- **What:**
  - Add `"long-form"` to `TemplateCategory` type
  - Create 3 YouTube templates JSON (Explainer, Story Time, Documentary)
  - Update `src/lib/templates.ts` imports
  - Add mock data for long-form in mock adapter
- **Value:** HIGH (unlocks new content type, user-requested)
- **Blocker:** None
- **Files:**
  - `src/lib/types.ts`
  - `src/config/templates/long-form/*.json` (new)
  - `src/lib/templates.ts`
  - `src/lib/adapters/mock.ts`

#### Task 1.2: Project Data Model & Storage
- **Effort:** Medium (5-7 hours)
- **What:**
  - Define `Project` and `Part` types
  - Update localStorage schema (or migrate to IndexedDB if needed)
  - Create project CRUD utilities (create, read, update, delete)
  - Part metadata (parentProjectId, sourcePartId, partType, createdAt)
- **Value:** HIGH (foundation for everything else)
- **Blocker:** None
- **Files:**
  - `src/lib/types.ts`
  - `src/lib/storage.ts` (new or refactor localStorage.ts)
  - `src/store/app-store.ts` (add project state)

#### Task 1.3: Part Type Registry & Transform Map
- **Effort:** Small (2-3 hours)
- **What:**
  - Define all part types with metadata (name, category, wordCount, icon)
  - Create transform compatibility matrix (which parts can generate which)
  - Utility: `getValidTransforms(sourcePart)` → returns possible output types
- **Value:** HIGH (enables non-linear generation)
- **Blocker:** None
- **Files:**
  - `src/lib/parts.ts` (new)
  - `src/lib/transforms.ts` (new)

---

### **PRIORITY 2: Core Studio UI (High Value, User-Facing)**

#### Task 2.1: Create Studio Page Route
- **Effort:** Small (1-2 hours)
- **What:**
  - New route: `/app/studio/page.tsx`
  - Basic layout (sidebar + main workspace)
  - Navigation link in app (Settings toggle: "Use Studio (Beta)")
- **Value:** MEDIUM (enables parallel development)
- **Blocker:** None
- **Files:**
  - `src/app/app/studio/page.tsx` (new)
  - `src/components/layout/nav.tsx` (add link)

#### Task 2.2: Project Manager UI (Library)
- **Effort:** Medium (5-7 hours)
- **What:**
  - Project list view (grid of cards)
  - Project card (thumbnail, title, part count, last updated)
  - Create new project modal (AI-suggested name, user edits)
  - Delete project
  - Search/filter projects
- **Value:** HIGH (primary navigation)
- **Blocker:** Task 1.2 (project data model)
- **Files:**
  - `src/components/studio/project-list.tsx` (new)
  - `src/components/studio/project-card.tsx` (new)
  - `src/components/studio/create-project-modal.tsx` (new)

#### Task 2.3: Part Manager UI (Inside Project)
- **Effort:** Medium (5-7 hours)
- **What:**
  - Part list view (timeline or grid)
  - Part card (type icon, preview, created date, source lineage)
  - Click part → view full content
  - Delete part
  - Derivation tree visualization ("This script came from Dreamscape X")
- **Value:** HIGH (core workflow)
- **Blocker:** Task 1.2 (project data model)
- **Files:**
  - `src/components/studio/part-list.tsx` (new)
  - `src/components/studio/part-card.tsx` (new)
  - `src/components/studio/part-viewer.tsx` (new)

#### Task 2.4: Part-to-Part Generator UI
- **Effort:** Large (8-10 hours)
- **What:**
  - "Transform" interface:
    - Step 1: Select source part (from current project or dreamscape)
    - Step 2: Select output type (filtered by valid transforms)
    - Step 3: Generate (show 3 variants)
    - Step 4: Save to project (auto-saves both source and result)
  - Visual flow indicator (Source → Transform → Result)
  - Re-generate from any saved part
- **Value:** VERY HIGH (core new feature)
- **Blocker:** Task 1.3 (transform map), Task 2.3 (part viewer)
- **Files:**
  - `src/components/studio/transform-generator.tsx` (new)
  - `src/components/studio/part-selector.tsx` (new)
  - `src/components/studio/output-type-selector.tsx` (new)

---

### **PRIORITY 3: Generation Engine (Medium Value, Backend)**

#### Task 3.1: Prompt Builder for Part Transforms
- **Effort:** Large (10-12 hours)
- **What:**
  - Build prompts for each transform type (Dreamscape→Script, Script→Scenes, etc.)
  - Separate prompt templates for each transform pair
  - Variable substitution ({sourceContent}, {targetWordCount}, {targetPlatform})
  - Reuse existing prompt-builders.ts patterns
- **Value:** HIGH (generates actual content)
- **Blocker:** Task 1.3 (transform map)
- **Files:**
  - `src/lib/prompt-builders/transforms.ts` (new)
  - Separate files per transform category if needed

#### Task 3.2: Mock Adapter for Part Transforms
- **Effort:** Medium (4-6 hours)
- **What:**
  - Mock outputs for each transform type
  - Detect transform type from request params
  - Return appropriate mock data
- **Value:** MEDIUM (testing before real API)
- **Blocker:** Task 3.1 (prompt builder)
- **Files:**
  - `src/lib/adapters/mock.ts` (extend)

#### Task 3.3: API Route for Part Generation
- **Effort:** Small (2-3 hours)
- **What:**
  - New route: `/api/parts/generate`
  - Accept: `{ sourcePart, targetType, projectId }`
  - Return: `{ variants: Part[] }`
  - Use OpenAI adapter or mock based on env flag
- **Value:** MEDIUM (connects UI to generation)
- **Blocker:** Task 3.1 (prompt builder)
- **Files:**
  - `src/app/api/parts/generate/route.ts` (new)

---

### **PRIORITY 4: Smart Suggestions (Low Value Initially, Polish)**

#### Task 4.1: AI Project Name Suggester
- **Effort:** Small (2-3 hours)
- **What:**
  - Analyze first part content (dreamscape/script text)
  - Call cheap model (GPT-4o-mini) to suggest 3 project names
  - User picks or edits
  - Cache suggestions to avoid repeated calls
- **Value:** MEDIUM (reduces friction)
- **Blocker:** Task 1.2 (project model)
- **Files:**
  - `src/lib/ai-suggestions.ts` (new)
  - `src/components/studio/create-project-modal.tsx` (integrate)

#### Task 4.2: Auto-Detect Project Association
- **Effort:** Small (2-3 hours)
- **What:**
  - When saving a part, check if source part exists in a project
  - If yes: default to same project
  - If no: check content similarity with existing projects (keyword match)
  - Suggest: "Add to 'VR Horror' project?"
- **Value:** MEDIUM (reduces manual organization)
- **Blocker:** Task 1.2 (project model)
- **Files:**
  - `src/lib/ai-suggestions.ts` (extend)
  - Part save flow

#### Task 4.3: Contextual Transform Suggestions
- **Effort:** Medium (4-5 hours)
- **What:**
  - Detect when user views a part
  - Show suggested next steps: "Generate scene breakdown?" "Condense to Twitter thread?"
  - Based on part type + user patterns (if they always do Script→Scenes, suggest it)
- **Value:** LOW initially (nice-to-have)
- **Blocker:** Task 2.4 (transform UI)
- **Files:**
  - `src/components/studio/part-viewer.tsx` (add suggestion cards)
  - `src/lib/ai-suggestions.ts` (detect patterns)

#### Task 4.4: Pause/Block Detection & Prompts
- **Effort:** Large (8-10 hours)
- **What:**
  - Track cursor position, idle time, edit patterns
  - Detect: user stuck (same section, repeated edits, long pause)
  - Surface help: "Add more details here?" "Generate this section?"
  - Use cheap model for analysis
- **Value:** LOW (polish feature, defer to Phase 2)
- **Blocker:** Task 2.4 (core workflow working)
- **Files:**
  - `src/lib/user-analytics.ts` (new - track behavior)
  - `src/components/studio/smart-assistant.tsx` (new - suggestion UI)

---

### **PRIORITY 5: Polish & Documentation (Low Value, End)**

#### Task 5.1: Studio Onboarding Flow
- **Effort:** Small (2-3 hours)
- **What:**
  - First-time user tour (3-4 steps)
  - Show: Projects → Parts → Transform → Save
  - Dismissible, can replay from Settings
- **Value:** MEDIUM (reduces learning curve)
- **Blocker:** Task 2.4 (transform UI done)
- **Files:**
  - `src/components/studio/onboarding-tour.tsx` (new)

#### Task 5.2: Template Handoff Document
- **Effort:** Small (2-3 hours)
- **What:**
  - Create `docs/TEMPLATES.md`
  - How to add new templates
  - How to add new part types
  - How to add new transforms
- **Value:** LOW (developer onboarding)
- **Blocker:** None
- **Files:**
  - `docs/TEMPLATES.md` (new)

---

## Effort Summary

| Priority | Tasks | Total Effort | Value |
|----------|-------|--------------|-------|
| P1: Foundation | 3 tasks | 11-16 hours | HIGH - Unlocks everything |
| P2: Core UI | 4 tasks | 19-26 hours | VERY HIGH - User-facing workflow |
| P3: Generation | 3 tasks | 16-21 hours | HIGH - Makes it work |
| P4: Smart AI | 4 tasks | 16-23 hours | MEDIUM - Polish, can defer |
| P5: Polish | 2 tasks | 4-6 hours | LOW - Nice-to-have |
| **TOTAL** | **16 tasks** | **66-92 hours** | - |

**MVP (Phase 1):** P1 + P2 + P3 = ~46-63 hours
**Full Feature:** Add P4 = ~62-86 hours
**Complete:** Add P5 = ~66-92 hours

---

## Execution Priority (Value/Effort Ratio)

### **IMMEDIATE (Week 1-2):**
1. **Task 1.1** - Add long-form templates (4-6h) - Quick win
2. **Task 1.2** - Project data model (5-7h) - Foundation
3. **Task 1.3** - Part type registry (2-3h) - Foundation
4. **Task 2.1** - Create Studio page (1-2h) - Enable parallel work

### **HIGH PRIORITY (Week 2-3):**
5. **Task 2.2** - Project Manager UI (5-7h) - Core navigation
6. **Task 2.3** - Part Manager UI (5-7h) - Core workflow
7. **Task 3.1** - Prompt builder (10-12h) - Generation engine

### **MEDIUM PRIORITY (Week 3-4):**
8. **Task 2.4** - Part-to-Part Generator (8-10h) - Core feature
9. **Task 3.2** - Mock adapter (4-6h) - Testing
10. **Task 3.3** - API route (2-3h) - Backend connection

### **OPTIONAL ENHANCEMENTS (Week 4+):**
11. Task 4.1 - AI project naming (2-3h)
12. Task 4.2 - Auto-detect project (2-3h)
13. Task 5.1 - Onboarding tour (2-3h)

### **DEFER TO PHASE 2:**
14. Task 4.3 - Contextual suggestions
15. Task 4.4 - Pause detection
16. Task 5.2 - Documentation

---

## Data Model Sketch

```typescript
// Project
interface Project {
  id: string
  title: string // AI-suggested or user-edited
  description?: string
  thumbnail?: string // First part's preview image
  createdAt: string
  updatedAt: string
  partIds: string[] // References to parts
}

// Part (replaces current Output/Dreamscape)
interface Part {
  id: string
  projectId: string
  type: PartType // 'dreamscape' | 'tiktok-script' | 'youtube-script' | 'scene-breakdown' | etc.
  title: string
  content: string // The actual text
  metadata: {
    wordCount: number
    platform?: string
    duration?: string
    tone?: string
    sourcePartId?: string // What part this was generated from
    transformType?: string // 'expand' | 'condense' | 'remix' | 'extract'
  }
  createdAt: string
  updatedAt: string
}

// Transform
interface Transform {
  sourceType: PartType
  targetType: PartType
  transformType: 'expand' | 'condense' | 'remix' | 'extract' | 'format'
  promptTemplate: string
}
```

---

## Open Questions

1. **Storage:** Stick with localStorage or migrate to IndexedDB for larger projects?
   - **Lean:** Start with localStorage, migrate if users hit limits

2. **Part reuse:** Can a part belong to multiple projects?
   - **Decision:** No (MVP). One part = one project. Can duplicate if needed.

3. **Versioning:** Save edit history of parts?
   - **Decision:** Not MVP. Just save final version. Can add later.

4. **Export:** How to export projects (JSON, ZIP)?
   - **Decision:** Phase 2. Not critical for MVP.

5. **Collaboration:** Multi-user projects?
   - **Decision:** Way out of scope. Phase 3+.

---

## Success Metrics

**MVP Success = User can:**
1. Create project from first saved part (1 click + AI name suggestion)
2. Generate 3+ different part types from one dreamscape
3. Navigate library and find saved parts
4. Re-generate from any saved part
5. See clear lineage (this script came from that dreamscape)

**Phase 2 Success = User can:**
1. Get smart suggestions for next transforms
2. Auto-organize parts into projects
3. Use pause detection for help

---

## Next Steps

**Immediate:**
1. Start with **Task 1.1** (long-form templates) - Quick win, high value
2. Then **Task 1.2** (project data model) - Foundation for everything
3. Then **Task 2.1** (Studio page) - Parallel workspace

**Developer note:** Keep existing Create page untouched. All new work in `/app/studio`.

---

## Conversation Summary

**Started with:** "Add long-form YouTube templates"
**Evolved to:** "Non-linear content generation system with project-based organization"
**Key insight:** Users need both flexibility (any→any transforms) AND structure (projects as folders)
**Compromise:** Simple project model + powerful transform engine = best of both worlds
