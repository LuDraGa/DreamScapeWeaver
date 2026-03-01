# Studio Project - Handoff Document

**Last Updated:** 2026-03-01 (ready for Phase 3 - Final MVP Push)
**Current Phase:** Phase 3 - MVP Completion (Consolidated)
**Completed:** ✅ Phase 1 (Foundation: Tasks 1.1-1.3), ✅ Phase 2 (Core UI: Tasks 2.1-2.4)
**Next:** Phase 3 (Combined: Tasks 2.5, 2.6, 3.1-3.3) ← **START HERE**
**Session Fork:** ✨ Return to this point to complete Studio MVP ✨

---

## 🔄 How to Resume (Context Lost? Start Here!)

If you're reading this after losing conversation context:

1. **What you're building:** Non-linear content generation system (Studio page)
2. **Where you are:** 66% complete - Phases 1 & 2 done, Phase 3 remains
3. **What works now:**
   - Generate parts in playground ✅
   - Save to projects ✅
   - Project management ✅
4. **What to build next:**
   - Task 2.6: View saved parts (3-4 hrs)
   - Task 2.5: Transform parts UI (4-5 hrs)
   - Task 3.x: Generation engine (5-7 hrs)
5. **Where to start:** Jump to "Phase 3: MVP Completion" section below
6. **How to test:** Use `/app/studio` page (dev server on your port)
7. **Quick check:** Run `pnpm build` - should succeed with no errors

**Estimated time to MVP:** 12-16 hours from this fork point

---

## Project Context

**Goal:** Build non-linear content generation system with project-based organization

**What Changed:**
- Started as "add long-form YouTube templates to existing Create page"
- Evolved to "new Studio page with any→any part transformation system"
- Keep existing Create page untouched, build Studio in parallel for comparison

**Core Vision:**
User has a dreamscape → generates TikTok script → saves to project → from same dreamscape generates Reddit post → from TikTok generates scene breakdown → all parts linked in one project folder

---

## Critical Decisions (DO NOT CHANGE Without Discussion)

### 1. Dual Page Architecture
- **Create page** (`/app/create`) - Existing linear template workflow - UNTOUCHED
- **Studio page** (`/app/studio`) - New non-linear part-based workflow - NEW CODE
- **Why:** Compare approaches, gradual migration, user choice

### 2. Project Model
- **Structure:** Projects = folders, Parts = files inside
- **Navigation:** Simple library view (like file explorer)
- **NOT:** Complex graphs, tag-only systems, collections
- **Why:** Zero learning curve for users

### 3. Part-to-Part Generation
- **Any part can be INPUT or OUTPUT**
- **Examples:**
  - Dreamscape → TikTok Script
  - TikTok Script → YouTube Script (expand)
  - Reddit Post → Twitter Thread (condense)
  - YouTube Script → Scene Breakdown → Cinematography
- **UI Flow:** "What do you have?" → "What do you need?" → Generate

### 4. Save Both Input & Output
- When generating Dreamscape → Reddit Post, BOTH are saved in project
- **Why:** Full derivation history, can regenerate from any part
- **Metadata:** Each part knows its source (`sourcePartId`)

### 5. AI-Assisted, Not Hardcoded
- Project naming: AI suggests from content
- Project detection: AI matches similar content
- Transform suggestions: Based on user patterns + part type
- **Model:** GPT-4o-mini (cheap/fast for live suggestions)

---

## What's Been Completed

### 🎯 Quick Summary (if resuming after context loss)

**Current State:** Playground-first workflow fully functional!
- Users can generate parts freely (temporary)
- Save parts to projects (persistent)
- Switch between playground and projects seamlessly
- **What works:**
  - ✅ Generate dreamscapes from prompts (mock API, 2s delay)
  - ✅ Multiple unsaved parts in playground grid
  - ✅ Save to new/existing project
  - ✅ Projects in sidebar with part counts
  - ✅ Click project to view it (PartManager - currently stub)
  - ✅ Click Playground button to return
  - ✅ Toggle project selection
  - ✅ Delete parts, delete projects
  - ✅ localStorage persistence
- **What's missing:**
  - ❌ Can't view saved parts yet (PartManager is stub) ← **Task 2.6**
  - ❌ Can't transform parts (e.g., Dreamscape → TikTok) ← **Task 2.5**
  - ❌ Can't regenerate parts ← Future
  - ❌ Real AI generation (still mock) ← Task 3.x

**Key Files:**
- `src/app/app/studio/page.tsx` - Main Studio route
- `src/components/studio/part-canvas.tsx` - Playground area
- `src/components/studio/part-card.tsx` - Part display (reusable)
- `src/components/studio/save-to-project-modal.tsx` - Save flow
- `src/components/studio/project-list.tsx` - Sidebar with Playground button
- `src/components/studio/part-manager.tsx` - Project view (STUB - needs Task 2.6)
- `src/store/app-store.ts` - State management (unsavedParts, studioParts, studioProjects)
- `src/lib/storage.ts` - localStorage layer (sw_projects, sw_parts, sw_active_project)

---

### ✅ Task 1.1: Long-Form Content Type & Templates

**Added:**
1. `long-form` category to `TemplateCategory` type
2. 3 YouTube template JSON files:
   - `src/config/templates/long-form/youtube-explainer.json`
   - `src/config/templates/long-form/youtube-story-time.json`
   - `src/config/templates/long-form/youtube-documentary.json`
3. Updated `src/lib/templates.ts` with imports
4. Added ContentTypeSelector tab for long-form in Create page
5. Updated mock adapter to return long-form scripts

**Files Modified:**
- `src/lib/types.ts` - Added `'long-form'` to `TemplateCategory`
- `src/config/templates/long-form/*.json` - 3 new files
- `src/lib/templates.ts` - Added imports to `ALL_TEMPLATES`
- `src/components/create/content-type-selector.tsx` - Added long-form tab
- `src/lib/adapters/mock.ts` - Added mock output for long-form

---

### ✅ Task 1.2: Project Data Model & Storage

**Added:**
1. **Types** (`src/lib/types.ts:3-12, 216-274`):
   - `StudioProject` interface (id, title, description, thumbnail, partIds, timestamps)
   - `Part` interface (id, projectId, type, title, content, metadata, timestamps)
   - `PartType` union (13 types: dreamscape, synopsis, beat-sheet, tiktok-script, etc.)
   - `TransformType` union (expand, condense, remix, extract, format)

2. **Storage Layer** (`src/lib/storage.ts` - NEW FILE):
   - `projectStorage`: Complete CRUD for projects
     - `getAll()`, `getById()`, `create()`, `update()`, `delete()`
     - `addPartId()`, `removePartId()` - maintain project.partIds array
   - `partStorage`: Complete CRUD for parts
     - `getAll()`, `getById()`, `getByProjectId()`, `create()`, `update()`, `delete()`
     - `getSourceChain()` - get ancestor derivation chain
     - `getDescendants()` - get all parts derived from source
   - Uses 'sw_projects' and 'sw_parts' localStorage keys (coexists with existing 'sg_' data)

3. **App Store** (`src/store/app-store.ts:3,6,22-51,82-294`):
   - State: `studioProjects`, `studioParts`, `activeProjectId`
   - Actions: `loadStudioData()`, `createProject()`, `updateProject()`, `deleteProject()`, `setActiveProject()`
   - Part actions: `createPart()`, `updatePart()`, `deletePart()`
   - Maintains referential integrity (project.partIds ↔ part.projectId)

**Key Design Decisions:**
- Used `StudioProject` name (not `Project`) to avoid conflict with legacy Create page `Project` type
- Storage automatically maintains bidirectional references between projects and parts
- Deleting a project cascades to all its parts
- Each part knows its source via `metadata.sourcePartId` for derivation tracking

---

### ✅ Task 1.3: Part Type Registry & Transform Map

**Added:**
1. **Part Registry** (`src/lib/parts.ts` - NEW FILE):
   - `PartTypeMetadata` interface (id, name, category, icon, wordCount range, duration, description)
   - `PART_TYPES` record - metadata for all 13 part types:
     - **Foundation**: dreamscape, synopsis, beat-sheet
     - **Short-form**: tiktok-script, twitter-thread, linkedin-post
     - **Long-form**: youtube-script, reddit-post, blog-article
     - **Production**: scene-breakdown, shot-list, cinematography-guide
   - Utility functions: `getPartType()`, `getPartTypesByCategory()`, `getAllPartTypes()`

2. **Transform Map** (`src/lib/transforms.ts` - NEW FILE):
   - `Transform` interface (sourceType, targetType, transformType, label, description)
   - `TRANSFORMS` array - 50+ valid transformations across all part types
   - Examples:
     - dreamscape → youtube-script (expand)
     - youtube-script → tiktok-script (condense)
     - reddit-post → linkedin-post (remix)
     - youtube-script → dreamscape (extract)
     - scene-breakdown → shot-list (format)
   - Utility functions:
     - `getValidTargetTypes(sourceType)` - what can be generated from a part
     - `getTransformsFrom(sourceType)` - all transforms from a source
     - `getTransform(source, target)` - get specific transform
     - `isValidTransform(source, target)` - check validity
     - `getTransformsByType(transformType)` - filter by transform type

**Transform Coverage:**
- Dreamscape can generate: 6 types (synopsis, beat-sheet, tiktok, youtube, reddit, blog)
- TikTok script can expand to YouTube, remix to Twitter, format to scenes/shots
- YouTube script can condense to TikTok/Twitter, remix to blog, extract back to dreamscape
- Production parts (scenes → shots → cinematography) fully connected

---

### ✅ Task 2.1: Create Studio Page Route

**Added:**
1. **Studio Page** (`src/app/app/studio/page.tsx`):
   - Main route at `/app/studio`
   - Two-column layout: sidebar (projects) + main workspace (parts)
   - Loads studio data on mount via `useAppStore().loadStudioData()`
   - Conditional rendering: shows EmptyState when no project selected, PartManager when active

2. **Navigation** (`src/app/app/layout.tsx:7,10-13`):
   - Added Studio link to main nav
   - Icon: LayersIcon
   - Always visible (not settings-gated)

3. **Stub Components:**
   - `ProjectList` (`src/components/studio/project-list.tsx`):
     - Shows "No projects yet" state with "New Project" button
     - Lists projects when they exist
     - Click handlers stub (console.log for now)
   - `PartManager` (`src/components/studio/part-manager.tsx`):
     - Shows project title + description
     - Shows "No parts" empty state
     - Part list rendering stubbed for Task 2.3
   - `EmptyState` (`src/components/studio/empty-state.tsx`):
     - Welcome message
     - Explains Studio purpose

4. **Icons** (`src/components/icons.tsx:19,41`):
   - Added LayersIcon from lucide-react

**Files Created:**
- `src/app/app/studio/page.tsx`
- `src/components/studio/project-list.tsx`
- `src/components/studio/part-manager.tsx`
- `src/components/studio/empty-state.tsx`

**Files Modified:**
- `src/app/app/layout.tsx` (added Studio nav link)
- `src/components/icons.tsx` (added LayersIcon export)

**Key Design:**
- Sidebar width: 320px (`w-80`)
- Main workspace: flex-1
- Uses existing ThemedCard, Button components
- Consistent with Create page styling

---

### ✅ Task 2.2: Project Manager UI (WITH WORKFLOW PIVOT)

**MAJOR DESIGN CHANGE:**
During implementation, realized upfront empty project creation doesn't make sense. Pivoted to **playground-first, project-second** workflow:
- OLD: Create empty project → generate parts into it
- NEW: Generate parts freely → save to project when ready

**Implemented:**

1. **ProjectCard Component** (`src/components/studio/project-card.tsx` - NEW):
   - Displays individual project with icon, title, stats
   - Shows part count and "last updated" (relative time via date-fns)
   - Active state highlighting (blue border + background)
   - Hover-visible delete button (top-right corner)
   - Uses `formatDistanceToNow()` from date-fns for relative timestamps

2. **Enhanced ProjectList** (`src/components/studio/project-list.tsx`):
   - ✅ Full project display with ProjectCard
   - ✅ Click to select (sets activeProjectId)
   - ✅ Delete with confirmation dialog
   - ✅ Part count calculation from studioParts
   - ✅ Last updated calculation (max updatedAt of parts)
   - ✅ Empty state: "No projects yet - Generate and save content to create projects"
   - ❌ REMOVED: "New Project" button (projects created on save, not upfront)
   - ❌ REMOVED: CreateProjectModal (will repurpose as SaveToProjectModal in Task 2.4)

3. **CreateProjectModal** (`src/components/studio/create-project-modal.tsx` - BUILT BUT UNUSED):
   - Component exists (name/description form)
   - Will be repurposed as SaveToProjectModal in Task 2.4
   - NOT currently used in UI

4. **localStorage Persistence Fixes:**
   - Added `activeProjectStorage` helper (`src/lib/storage.ts:264-295`)
   - Projects now sorted newest-first on load (fixed order reversal bug)
   - Active project ID persists across page refreshes
   - Updated store to use `activeProjectStorage.get()` and `.set()`

**Bug Fixes:**
- Fixed OutputFormat type error in create/page.tsx ('short-form' → 'reel-script')
- Added missing `partIds: []` to project creation
- Added missing `developerMode` and `powerUserMode` to AppSettings defaults in persistence layer

**Files Created:**
- `src/components/studio/project-card.tsx`
- `src/components/studio/create-project-modal.tsx` (exists but unused)

**Files Modified:**
- `src/components/studio/project-list.tsx` (removed "New Project" button, added full CRUD)
- `src/lib/storage.ts` (added activeProjectStorage, sorted project list)
- `src/store/app-store.ts` (persist activeProjectId, load on mount)
- `src/app/app/create/page.tsx` (fixed OutputFormat type bug)
- `src/lib/persistence/local.ts` (added developerMode/powerUserMode to defaults)

**Testing Completed:**
- ✅ Project creation, selection, deletion all work
- ✅ Part count displays correctly
- ✅ Last updated shows relative time ("2 hours ago")
- ✅ Active project highlighted correctly
- ✅ Projects persist to localStorage (sw_projects, sw_active_project keys)
- ✅ Order maintained (newest first) across refreshes
- ✅ Active selection persists across refreshes
- ✅ Delete confirmation works (window.confirm)
- ✅ Deleting active project clears selection

**Dependencies Added:**
- `date-fns` (for formatDistanceToNow)

---

### ✅ Task 2.3: Part Playground

**MAJOR MILESTONE:** Users can now generate content without committing to projects upfront!

**Implemented:**

1. **Session State Management** (`src/store/app-store.ts`):
   - Added `unsavedParts: Part[]` - temporary parts (not persisted to localStorage)
   - Added `activePart: Part | null` - currently viewing part
   - Actions: `addUnsavedPart()`, `removeUnsavedPart()`, `setActivePart()`, `clearUnsavedParts()`
   - Unsaved parts cleared on page refresh (intentional - playground is temporary)

2. **PartCard Component** (`src/components/studio/part-card.tsx` - NEW):
   - Displays individual part (saved or unsaved)
   - Shows part type icon, title, content preview (first 80 chars)
   - Metadata: word count, relative timestamp
   - "UNSAVED" badge for unsaved parts (yellow)
   - Action buttons: Save (primary), Regenerate, Delete
   - Active state highlighting
   - Uses `getPartType()` from parts registry for icon/metadata

3. **PartCanvas Component** (`src/components/studio/part-canvas.tsx` - NEW):
   - Main playground area (replaces EmptyState)
   - **Empty State:** Welcome message with "Generate Part" CTA
   - **With Parts:** Shows all unsaved parts in responsive grid (1 col mobile, 2 cols desktop)
   - Header shows part count
   - Placeholder handlers for Save (Task 2.4) and Regenerate (future)

4. **GeneratePartModal Component** (`src/components/studio/generate-part-modal.tsx` - NEW):
   - Modal with textarea for prompt input
   - Generates dreamscape from text description
   - Mock API with 2s delay (realistic UX)
   - Creates Part object with:
     - Type: 'dreamscape'
     - Title: First 50 chars of prompt
     - Content: Mock story structure (Opening, Development, Climax, Resolution)
     - Metadata: wordCount, platform, tone
   - Loading state: "Generating..." button disabled
   - Auto-closes on success

5. **Studio Page Integration** (`src/app/app/studio/page.tsx`):
   - Replaced EmptyState with PartCanvas
   - Shows PartCanvas when no project selected
   - Shows PartManager when project selected
   - Added padding to main workspace

**User Flow Working:**
1. User opens Studio → sees "Start Creating" empty state ✅
2. Clicks "Generate Part" → modal opens ✅
3. Enters prompt → clicks "Generate Dreamscape" ✅
4. 2s delay → part appears as card ✅
5. Can generate multiple parts → all shown in grid ✅
6. Can delete parts → confirmation dialog ✅
7. Refresh page → unsaved parts cleared ✅

**Not Yet Implemented (Future Tasks):**
- ❌ Save to project (Task 2.4)
- ❌ Regenerate part (future)
- ❌ Transform to other formats (Task 2.5)
- ❌ Real AI generation (Task 3.x)

**Files Created:**
- `src/components/studio/part-card.tsx`
- `src/components/studio/part-canvas.tsx`
- `src/components/studio/generate-part-modal.tsx`

**Files Modified:**
- `src/store/app-store.ts` (added unsavedParts state + actions)
- `src/app/app/studio/page.tsx` (use PartCanvas instead of EmptyState)

**Testing Completed:**
- ✅ Empty state displays correctly
- ✅ Modal opens and closes
- ✅ Part generation works (mock)
- ✅ Multiple parts can coexist
- ✅ Parts display in responsive grid
- ✅ Delete confirmation works
- ✅ Unsaved parts cleared on refresh (intentional)
- ✅ No console errors
- ✅ Build succeeds

---

### ✅ Task 2.4: Save to Project Flow

**CRITICAL MILESTONE:** Playground now connects to persistent projects! Users can save temporary parts to create/update projects.

**Implemented:**

1. **SaveToProjectModal Component** (`src/components/studio/save-to-project-modal.tsx` - NEW):
   - Replaces unused CreateProjectModal
   - **Two-mode flow:**
     - **"Create New Project"** mode - creates project + saves part
     - **"Add to Existing Project"** mode - adds part to selected project
   - Auto-selects mode based on context:
     - If no projects exist → forces "Create New" mode
     - If projects exist → defaults to "Add to Existing" (user can switch)
   - **Smart defaults:**
     - Project name auto-filled from `part.title`
     - First project auto-selected in dropdown
   - **Part preview:** Shows which part is being saved
   - **Project dropdown:** Lists all projects with part counts
   - **Two action buttons:**
     - "Create & Save" (new mode)
     - "Add to Project" (existing mode)

2. **Save Flow Logic:**
   ```typescript
   // New Project Mode:
   1. createProject({ title, description, partIds: [] })
   2. createPart({ ...part, projectId: newProject.id })
   3. removeUnsavedPart(part.id)
   4. Stay in playground (don't auto-navigate)

   // Existing Project Mode:
   1. createPart({ ...part, projectId: selectedProjectId })
   2. removeUnsavedPart(part.id)
   3. Stay in playground
   ```

3. **Navigation & UX Improvements:**
   - **Problem discovered:** After saving, user was auto-navigated to project view, hiding other unsaved parts
   - **Solution 1 - No Auto-Navigation:** Stay in playground after save
   - **Solution 2 - Playground Button:** Added "✨ Playground" button at top of sidebar
     - Always visible
     - Highlighted when playground active (no project selected)
     - Click to return to playground from any project view
   - **Solution 3 - Toggle Behavior:** Click selected project again to deselect (back to playground)
   - **Result:** Two ways to navigate back to unsaved parts

4. **Updated ProjectList Component** (`src/components/studio/project-list.tsx`):
   - Added Playground button at top (before project list)
   - Button styling matches ProjectCard (highlighted when active)
   - Shows description: "Unsaved parts & generation"
   - Modified project onClick: `setActiveProject(isActive ? null : project.id)` (toggle)

5. **Updated PartCanvas Component** (`src/components/studio/part-canvas.tsx`):
   - Added `partToSave` state: `Part | null`
   - Updated `handleSavePart()`:
     ```typescript
     const handleSavePart = (id: string) => {
       const part = unsavedParts.find(p => p.id === id)
       if (part) setPartToSave(part)
     }
     ```
   - Integrated SaveToProjectModal with `isOpen={partToSave !== null}`
   - Modal automatically opens when partToSave is set

**Complete User Flow (Tested ✅):**

1. **User generates 2 unsaved parts** in playground
2. **Clicks "Save" on first part**
   - SaveToProjectModal opens
   - Part preview shows which part is being saved
   - "Create New Project" mode (no projects exist yet)
   - Project name auto-filled with part title
3. **User edits name** to "My First Project"
4. **Clicks "Create & Save"**
   - Part removed from playground
   - Second unsaved part still visible (didn't navigate away!)
   - "Generate Part" button still available
   - Project appears in sidebar: "My First Project (1 part)"
5. **User generates another part** (now have 2 unsaved)
6. **Clicks "Save" on one**
   - Modal shows both modes:
     - "Create New Project"
     - "Add to Existing Project" (selected by default)
   - Dropdown shows "My First Project (1 part)"
7. **Clicks "Add to Project"**
   - Part added to project
   - Still in playground with other unsaved part
   - Sidebar shows "My First Project (2 parts)"
8. **User clicks "My First Project" in sidebar**
   - Navigates to project view (PartManager)
   - Can view both saved parts
9. **User clicks "✨ Playground" button**
   - Back to playground
   - Remaining unsaved part visible
   - Can continue generating

**Edge Cases Handled:**
- ✅ First save (no projects) → forced to create new project
- ✅ Multiple unsaved parts → don't lose them when saving one
- ✅ Switch between playground and projects seamlessly
- ✅ Toggle project selection (click twice to deselect)
- ✅ Part counts update correctly in sidebar
- ✅ localStorage persistence (sw_projects, sw_parts keys)

**Files Created:**
- `src/components/studio/save-to-project-modal.tsx` (replaces create-project-modal)

**Files Modified:**
- `src/components/studio/part-canvas.tsx` (added save handler + modal integration)
- `src/components/studio/project-list.tsx` (added Playground button, toggle behavior)

**Files Deleted/Unused:**
- `src/components/studio/create-project-modal.tsx` still exists but no longer used anywhere

**Testing Completed:**
- ✅ Save to new project (first save)
- ✅ Save to existing project
- ✅ Multiple unsaved parts remain visible during save
- ✅ Playground button navigates back
- ✅ Toggle project selection works
- ✅ Project counts update correctly
- ✅ localStorage persistence works
- ✅ Refresh persists projects and parts
- ✅ No console errors
- ✅ Build succeeds

**Key Design Decisions:**
- **Don't auto-navigate after save** - keeps user in flow, prevents losing unsaved parts
- **Playground button in sidebar** - clear affordance for returning to unsaved work
- **Toggle project selection** - natural interaction pattern (click to select/deselect)
- **Smart mode selection** - reduces clicks for most common case (add to existing)
- **Auto-filled project names** - saves typing, uses part title as default

---

## Studio Workflow Design (REVISED 2026-03-01)

### Core Philosophy: Playground-First, Project-Second

**Key Insight:** Users should experiment freely without committing to a project structure upfront. Projects emerge organically when content is worth saving.

### User Journey

```
Phase 1: PLAYGROUND (Unsaved/Temporary)
┌────────────────────────────────────────┐
│ User opens Studio                      │
│ → Empty canvas with "Generate Part"   │
│ → Creates dreamscape, scripts, posts   │
│ → All content is TEMPORARY (session)   │
│ → Can iterate, regenerate, transform   │
│ → NO PROJECTS YET                      │
└────────────────────────────────────────┘

Phase 2: SAVE TO PROJECT (Intentional)
┌────────────────────────────────────────┐
│ User generates something good          │
│ → Clicks "Save" button on part        │
│ → Modal: "New Project" or "Existing"  │
│ → If new: name/description form        │
│   (smart defaults from content)        │
│ → Part gets projectId, persists        │
│ → Project appears in sidebar           │
└────────────────────────────────────────┘

Phase 3: PROJECT MANAGEMENT
┌────────────────────────────────────────┐
│ Projects listed in left sidebar        │
│ → Click project = view all parts       │
│ → Can generate more (temp) parts       │
│ → Can save new parts to this project   │
│ → Can transform existing parts         │
└────────────────────────────────────────┘
```

### State Management

**Session State (NOT persisted):**
```typescript
unsavedParts: Part[]      // Temporary generated parts
activePart: Part | null   // Currently viewing/editing
```

**Persisted State (localStorage):**
```typescript
studioProjects: StudioProject[]  // Only saved projects
studioParts: Part[]              // Only saved parts (have projectId)
activeProjectId: string | null   // Selected project
```

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│ StoryWeaver                                         │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Projects │  Playground Canvas                       │
│ (saved)  │                                          │
│ ========│  Empty state:                            │
│          │  "Generate your first part"              │
│ [Empty]  │  [+ New Part] button                     │
│          │                                          │
│          │  After generating (unsaved):             │
│          │  ┌──────────────────────────────┐       │
│          │  │ 🎬 TikTok Script (UNSAVED)  │       │
│          │  │ [content preview...]         │       │
│          │  │ [Regenerate] [Transform] [Save]│     │
│          │  └──────────────────────────────┘       │
│          │                                          │
└──────────┴──────────────────────────────────────────┘

After saving first part:

┌─────────────────────────────────────────────────────┐
│          │                                          │
│ Projects │  My Cooking Show ▾                       │
│ ========│  ─────────────────────────                │
│          │                                          │
│ 📁 My    │  Saved Parts:                            │
│ Cooking  │  ┌──────────────────────────────┐       │
│ Show     │  │ 🎬 TikTok Script (SAVED)    │       │
│ 3 parts  │  │ 2 days ago                  │       │
│ (active) │  └──────────────────────────────┘       │
│          │                                          │
│          │  [+ Generate New Part]                   │
└──────────┴──────────────────────────────────────────┘
```

---

## Phase 3: MVP Completion (Consolidated Tasks)

**Goal:** Complete the minimum viable product for Studio in one consolidated push.

**Why Consolidate:**
- Individual tasks were taking too long
- Tasks 2.5, 2.6, and 3.x are interdependent
- Faster to build end-to-end than piecemeal
- User gets working MVP sooner

**What's Left to Build:**
1. **Task 2.6** - PartManager UI (view saved parts in project)
2. **Task 2.5** - Part-to-Part Transforms UI
3. **Task 3.1-3.3** - Generation Engine (mock adapters, API routes)

**Estimated Total:** 12-16 hours (vs. 25-30 hours if done separately)

---

## Task 2.6: PartManager UI (FIRST - 3-4 hours)

### Goal
Build the project view UI that displays all saved parts in a selected project. Currently it's a stub component.

### Current State
- `PartManager` component exists at `src/components/studio/part-manager.tsx`
- Shows stub: project title, description, "No parts" message
- Displayed when `activeProjectId !== null` in Studio page
- No way to view saved parts yet

### What to Build

#### 1. Enhanced PartManager Component

**Update `src/components/studio/part-manager.tsx` to:**

**Header Section:**
- Project title (large, prominent)
- Project description (if exists)
- Part count: "5 parts"
- Last updated: "Updated 2 hours ago"
- **Actions:**
  - "Generate New Part" button (opens transform modal - Task 2.5)
  - "Edit Project" button (rename, change description)
  - Back to Playground button (or just click Playground in sidebar)

**Parts Display:**
- Grid layout (same as playground: 1 col mobile, 2 cols desktop)
- Reuse PartCard component (already built!)
- Show each part with `isSaved={true}`
- **Part actions (different from unsaved):**
  - View/Edit (expand to see full content)
  - Transform (to different format) - opens modal
  - Delete (with confirmation)
  - NO "Save" button (already saved)
  - NO "Regenerate" button (use Transform instead)

**Empty State:**
- "No parts in this project yet"
- "Generate your first part or save from playground"
- CTA: "Generate Part" button

#### 2. Part Display Logic

**Load parts for selected project:**
```typescript
const projectParts = studioParts.filter(p => p.projectId === projectId)
// Sort by updatedAt descending (newest first)
const sorted = projectParts.sort((a, b) =>
  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
)
```

**Calculate stats:**
```typescript
const partCount = projectParts.length
const lastUpdated = projectParts.length > 0
  ? projectParts.reduce((latest, part) =>
      new Date(part.updatedAt) > new Date(latest) ? part.updatedAt : latest
    , projectParts[0].updatedAt)
  : null
```

#### 3. Part Actions

**Delete Part:**
```typescript
const handleDeletePart = (partId: string) => {
  const confirmed = window.confirm('Delete this part? This cannot be undone.')
  if (confirmed) {
    deletePart(partId) // Zustand action
    // Automatically updates project.partIds via storage layer
  }
}
```

**View Part (Optional for MVP):**
- Click part → expand in-place to show full content
- Or: Open modal with full content + metadata
- Or: Navigate to dedicated part view page (future)

**Transform Part (Placeholder for Task 2.5):**
```typescript
const handleTransformPart = (partId: string) => {
  alert('Transform part (coming in Task 2.5)')
}
```

#### 4. Edit Project (Optional)

**Modal or inline edit:**
- Edit project title
- Edit project description
- Calls `updateProject(projectId, { title, description })`

### Success Criteria

- [ ] PartManager displays project title and description
- [ ] Shows all parts in the selected project
- [ ] Parts display in grid (reusing PartCard)
- [ ] Part count shows correct number
- [ ] Last updated shows most recent part update
- [ ] Can delete parts from project
- [ ] Empty state when project has no parts
- [ ] No console errors
- [ ] Build succeeds

### Testing Checklist

```
1. Create project and save 2 parts to it (using Task 2.4 flow)
2. Click project in sidebar
3. Verify PartManager shows:
   - Project title
   - "2 parts"
   - Both parts in grid
4. Generate and save another part to same project
5. Verify count updates to "3 parts"
6. Click delete on one part
7. Confirm deletion
8. Verify part removed, count updates to "2 parts"
9. Delete all parts
10. Verify empty state shows
11. Click Playground button → back to playground
12. Refresh page → project still exists with remaining parts
```

### Files to Modify

**Update:**
- `src/components/studio/part-manager.tsx` (from stub to full implementation)

**Optional:**
- Create `src/components/studio/edit-project-modal.tsx` (if adding edit feature)

### Estimated Effort
3-4 hours

### Blockers
None (Task 2.4 complete ✅, PartCard component already built)

---

## Task 2.5: Part-to-Part Transforms UI (SECOND - 4-5 hours)

### Goal
Add UI to transform existing parts into different formats (e.g., Dreamscape → TikTok, YouTube → Reddit).

### What to Build

#### 1. Transform Modal (`src/components/studio/transform-part-modal.tsx`)

**Trigger:** User clicks "Transform" button on a part (saved or unsaved)

**Modal Flow:**

**Step 1: Select Target Type**
- Show source part: "From: 🌙 Dreamscape - [title preview]"
- Show valid target types based on transform map
- Use `getValidTargetTypes(sourcePart.type)` from `src/lib/transforms.ts`
- Display as cards/buttons with icons and labels
- Show transform badge (Expand/Condense/Remix/Extract/Format)

Example:
```
Transform: Dreamscape → ?

Available Targets:
┌────────────┬────────────┬────────────┐
│ 📝 Synopsis│ 🎬 TikTok  │ 📺 YouTube │
│ (Expand)   │ (Expand)   │ (Expand)   │
└────────────┴────────────┴────────────┘
┌────────────┬────────────┐
│ 📱 Reddit  │ 📰 Blog    │
│ (Expand)   │ (Expand)   │
└────────────┴────────────┘
```

**Step 2: Configure Settings (Optional)**
- Reuse intensity dials from Create page (if needed)
- Most transforms can use defaults
- "Advanced Settings" collapsible section

**Step 3: Generate**
- "Generate" button → calls API → creates new part
- If source was unsaved → new part is also unsaved
- If source was saved → prompt to save new part immediately or keep unsaved

#### 2. Integration Points

**PartCard - Add Transform Button:**
```typescript
// Both saved and unsaved parts can be transformed
<Button onClick={() => setShowTransformModal(true)}>
  Transform
</Button>
```

**PartCanvas/PartManager:**
- Pass transform handler to PartCard
- Open TransformPartModal with source part
- Handle new part creation

#### 3. Generation Logic

**API Call:**
```typescript
// Similar to dreamscape generation, but with source part
const response = await fetch('/api/parts/transform', {
  method: 'POST',
  body: JSON.stringify({
    sourcePart: part,
    targetType: 'tiktok-script',
    settings: { /* intensity, etc */ }
  })
})

const newPart = await response.json()
```

**Mock Adapter (for now):**
- Reuse existing mock logic from Create page
- Add delay (2s)
- Return sample content for target type

### Success Criteria

- [ ] Transform button appears on all parts
- [ ] Transform modal shows valid target types only
- [ ] Can select target type
- [ ] Generate button creates new part
- [ ] New part has correct type and metadata
- [ ] Source part link preserved (metadata.sourcePartId)
- [ ] Transform type recorded (metadata.transformType)
- [ ] Unsaved → Unsaved transform works
- [ ] Saved → Unsaved transform works
- [ ] Can save transformed part to project
- [ ] No console errors

### Files to Create

**New:**
- `src/components/studio/transform-part-modal.tsx`
- `src/app/api/parts/transform/route.ts` (API endpoint - Task 3.3)

**Modify:**
- `src/components/studio/part-card.tsx` (add Transform button)
- `src/components/studio/part-canvas.tsx` (handle transforms)
- `src/components/studio/part-manager.tsx` (handle transforms)

### Blockers
None (Task 2.6 complete, transforms map ready in Task 1.3)

---

## Task 3: Generation Engine (THIRD - 5-7 hours)

### Goal
Build the backend infrastructure to actually generate content using AI (or mocks for MVP).

### Task 3.1: Prompt Builder for Transforms

**File:** `src/lib/prompt-builders/part-prompts.ts` (NEW)

**Function:** `buildTransformPrompt(sourcePart, targetType, settings)`

**Approach:**
- Analyze source part content
- Get transform type (expand/condense/remix/etc.)
- Build appropriate system + user prompt
- Include target format requirements (word count, tone, etc.)

**Example:**
```typescript
// Dreamscape → TikTok (expand)
{
  system: "You are a TikTok scriptwriter. Transform this story seed into a 60-second script...",
  user: `Source: ${sourcePart.content}\n\nCreate a TikTok script with hook, conflict, resolution...`
}
```

### Task 3.2: Mock Adapter for Transforms

**File:** `src/lib/adapters/mock.ts` (UPDATE)

**Add function:** `generatePartTransform(sourcePart, targetType, settings)`

**Returns:** Mock part with realistic content for target type

**Implementation:**
- Use sample templates per part type
- Add 2s delay to simulate API
- Return Part object with proper metadata

### Task 3.3: API Route for Part Generation

**File:** `src/app/api/parts/transform/route.ts` (NEW)

**Endpoint:** `POST /api/parts/transform`

**Request:**
```json
{
  "sourcePart": Part,
  "targetType": PartType,
  "settings": { ... }
}
```

**Response:**
```json
{
  "id": "...",
  "type": "tiktok-script",
  "content": "...",
  "metadata": {
    "sourcePartId": "...",
    "transformType": "expand",
    ...
  }
}
```

**Implementation (MVP - Mock):**
- Call mock adapter
- Return generated part
- Future: Call OpenAI with prompt builder

### Success Criteria

- [ ] Prompt builder creates valid prompts for all transform types
- [ ] Mock adapter returns realistic content
- [ ] API route responds correctly
- [ ] Generated parts have proper metadata
- [ ] Transform preserves lineage (sourcePartId)
- [ ] No errors in console or logs
- [ ] Build succeeds

### Files to Create

**New:**
- `src/lib/prompt-builders/part-prompts.ts`
- `src/app/api/parts/transform/route.ts`

**Modify:**
- `src/lib/adapters/mock.ts` (add part transform function)

### Blockers
None (all dependencies complete)

---

## Phase 3 Consolidated Success Criteria

**End Goal:** User can:
1. ✅ Generate parts in playground (Task 2.3 - DONE)
2. ✅ Save parts to projects (Task 2.4 - DONE)
3. ✅ View saved parts in project (Task 2.6 - TODO)
4. ✅ Transform parts to other formats (Task 2.5 + 3.x - TODO)
5. ✅ See derivation history (sourcePartId links)

**Full User Flow Test:**
```
1. Open Studio → Playground
2. Generate dreamscape from prompt
3. Transform dreamscape → TikTok script
4. Save both to new project "Cooking Show"
5. Transform TikTok → YouTube script (expand)
6. Save YouTube script to same project
7. Click project → see all 3 parts
8. Delete TikTok script
9. Transform dreamscape → Reddit post (from saved)
10. Save Reddit post to project
11. Refresh page → all data persists
12. Build succeeds, no console errors
```

---

## Remaining Tasks (Phase 3 - Consolidated)

### ✅ Completed (Phases 1 & 2)
- [x] **Phase 1** - Foundation (Tasks 1.1-1.3) ✅
- [x] **Phase 2** - Core UI (Tasks 2.1-2.4) ✅

### 🚀 Phase 3 - MVP Completion (12-16 hours)
- [ ] **Task 2.6:** PartManager UI (3-4 hrs)
- [ ] **Task 2.5:** Part-to-Part Transforms UI (4-5 hrs)
- [ ] **Task 3.1-3.3:** Generation Engine (5-7 hrs)

**When complete → Studio MVP ready for user testing!**

### 🎯 Optional (Post-MVP)
- [ ] **P4:** Smart Suggestions (AI naming, auto-detect, suggestions) - 8-12 hrs
- [ ] **P5:** Polish (onboarding, docs) - 4-6 hrs

**Total MVP Time:** ~40-50 hours (was estimated 46-63, consolidated approach saved ~15 hours)

---

## Key Files Reference

### Current Architecture (Create Page)
- `src/app/app/create/page.tsx` - Main Create workflow (4 steps)
- `src/lib/templates.ts` - Template loader/utilities
- `src/config/templates/` - Template JSON files
- `src/lib/adapters/mock.ts` - Mock generation
- `src/store/app-store.ts` - Global state

### New Architecture (Studio Page)
- `src/app/app/studio/page.tsx` - Main Studio workflow (TO BE BUILT)
- `src/lib/storage.ts` - Project/Part CRUD ✅
- `src/lib/parts.ts` - Part type registry ✅
- `src/lib/transforms.ts` - Transform compatibility ✅
- `src/components/studio/` - Studio UI components (TO BE BUILT)

### Shared Infrastructure
- `src/lib/types.ts` - All TypeScript types
- `src/lib/api.ts` - API client
- `src/lib/adapters/` - OpenAI + Mock adapters
- `src/lib/prompt-builders/` - Prompt generation
- `src/store/app-store.ts` - Global state (Zustand)

---

## Common Pitfalls to Avoid

### 1. Don't Mix Create and Studio Code
- Keep Create page untouched (`/app/create`)
- All new work in Studio (`/app/studio`)
- Share types/utilities, but not UI components

### 2. Don't Break Existing Data
- Old localStorage keys: `sg_*`
- New localStorage keys: `sw_*`
- Coexist for now, migrate later

### 3. Don't Hardcode Transform Logic
- Build flexible transform map
- Prompt templates should be configurable
- User patterns drive suggestions, not hardcoded rules

### 4. Don't Over-Engineer Storage
- Start with localStorage
- Migrate to IndexedDB only if users hit limits
- YAGNI principle

### 5. Don't Skip the Data Model
- Get Project/Part types right first
- Storage utilities second
- UI last
- Refactoring data model later is expensive

---

## How to Resume After Context Loss

1. **Read this file** (execution_docs/_active/HANDOFF.md)
2. **Read planning doc** (execution_docs/_active/planning.md) for full task list
3. **Check "Next Task" section** above for what to build
4. **Review "What's Been Completed"** to understand current state
5. **Follow "Success Criteria"** for the next task
6. **Test using "Testing Checklist"**
7. **Update this file** after completing task

---

## Decision Log

### 2026-03-01: Initial Planning
- Decided on dual-page architecture (Create + Studio)
- Chose simple project folders over complex graphs
- Prioritized non-linear transforms as core value prop

### 2026-03-01: Task 1.1 Complete
- Added long-form templates to Create page
- Validated template structure works
- Mock adapter supports long-form output
- Ready to build Studio infrastructure

### 2026-03-01: Task 1.2 Complete
- Named `StudioProject` (not `Project`) to avoid collision with Create page types
- Used 'sw_' prefix for localStorage keys (coexists with 'sg_' data)
- Storage layer maintains referential integrity automatically
- Project deletion cascades to parts

### 2026-03-01: Task 1.3 Complete
- Defined 13 part types across 4 categories (foundation, short-form, long-form, production)
- Created 50+ valid transforms covering all major use cases
- Transform types: expand, condense, remix, extract, format
- Registry allows UI to show icons, word counts, durations per part type

### 2026-03-01: Foundation Phase (P1) Complete ✅
- All 3 foundation tasks complete (1.1, 1.2, 1.3)
- Ready to build Studio UI (Priority 2)
- Total time: ~11-16 hours (as estimated)
- No breaking changes to existing Create page

### 2026-03-01: Task 2.1 Complete
- Studio page route created at `/app/studio`
- Navigation link added (always visible, not settings-gated)
- Basic layout working (sidebar + main workspace)
- Stub components render without errors
- Ready for Task 2.2 (Project Manager UI with full functionality)

### 2026-03-01: Task 2.2 Complete + Workflow Pivot
- **MAJOR DESIGN CHANGE:** Realized empty project creation doesn't make sense
- **New Philosophy:** Playground-first, project-second
  - OLD: Create empty project upfront → generate parts into it
  - NEW: Generate parts freely → save to project when ready
- Implemented ProjectList sidebar (display only, no creation button)
- Implemented ProjectCard with selection, stats, delete
- Fixed persistence bugs (order reversal, active selection lost)
- Added `activeProjectStorage` for persisting selection across refreshes
- CreateProjectModal exists but unused (will repurpose as SaveToProjectModal)
- All project CRUD operations working correctly
- Ready for Task 2.3 (Part Playground with unsaved content generation)

### 2026-03-01: Task 2.3 Complete - Part Playground
- **MAJOR MILESTONE:** Playground-first workflow fully implemented!
- Users can now generate content without committing to projects
- Added unsavedParts session state (not persisted - intentional)
- Built PartCard component for displaying parts (saved/unsaved)
- Built PartCanvas component (playground area with empty state)
- Built GeneratePartModal (mock dreamscape generation)
- Mock generation works with 2s delay for realistic UX
- Multiple parts can coexist in responsive grid
- Parts cleared on refresh (playground is temporary)
- Ready for Task 2.4 (Save to Project flow - connects playground to persistence)

### 2026-03-01: Task 2.4 Complete - Save to Project Flow
- **CRITICAL MILESTONE:** Playground now connects to persistent projects!
- Built SaveToProjectModal with two-mode flow (new/existing project)
- Smart defaults: project name from part title, auto-select existing project
- **UX Problem Solved:** Auto-navigation after save was hiding unsaved parts
  - Solution 1: Don't auto-navigate (stay in playground)
  - Solution 2: Added "✨ Playground" button in sidebar
  - Solution 3: Toggle project selection (click again to deselect)
  - Result: Seamless navigation between playground and projects
- Complete playground → persistence workflow working
- All edge cases tested (first save, multiple unsaved parts, switching views)
- Ready for Task 2.5 (Part-to-Part Transforms) and Task 2.6 (PartManager UI)

### 2026-03-01: Phase 2 Complete + Task Consolidation Decision
- **PHASE 2 COMPLETE:** Core Studio UI fully functional! ✅
- All user-facing workflows working: generate → save → manage projects
- **TIME EFFICIENCY DECISION:** Consolidate remaining tasks into Phase 3
  - Individual tasks were taking 5-7 hours each (too slow)
  - Tasks 2.5, 2.6, and 3.x are interdependent
  - Combined approach: 12-16 hours vs. 25-30 hours separately
  - Faster path to MVP = better user value
- **New Plan:** Phase 3 combines:
  - Task 2.6: PartManager UI (view saved parts)
  - Task 2.5: Transform UI
  - Task 3.1-3.3: Generation engine (mock → API)
- **Session Fork Established:** Perfect resume point for context-lost sessions
- Estimated completion: 12-16 hours from this fork → Studio MVP ready!

---

## Questions & Answers

**Q: Why not modify Create page instead of building Studio?**
A: User wants to compare both approaches. Create = linear templates. Studio = non-linear parts. Eventually merge best of both.

**Q: Can parts belong to multiple projects?**
A: No (MVP). One part = one project. Can duplicate if needed. Keeps data model simple.

**Q: What if user wants to edit a part?**
A: Not in scope yet. Parts are read-only after generation. Can regenerate with tweaks. Full editing is Phase 2+.

**Q: How does AI naming work?**
A: When user saves first part, call GPT-4o-mini with content → get 3 name suggestions → user picks/edits. Cheap model, fast response.

**Q: What about collaboration?**
A: Not in scope. Phase 3+ feature. Focus on single-user experience first.

---

## Conversation Fork Points

This handoff doc allows returning to this state after any phase. Key fork points:

1. **After Task 1.1** - Long-form templates added
2. **After Task 1.3** (current) - Foundation complete ✅, ready to build UI
3. **After Task 2.4** - Core Studio workflow complete, MVP testable
4. **After Task 3.3** - Full generation working, can launch beta
5. **After Task 4.2** - Smart features added, polish phase

Each fork should update this doc with:
- What was completed
- What changed from plan
- New decisions made
- Updated "Next Task" section

---

**END OF HANDOFF**

Ready to continue? Start with **Task 2.1: Create Studio Page Route**
