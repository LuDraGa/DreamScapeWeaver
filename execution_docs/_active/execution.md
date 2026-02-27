# StoryWeaver - Active Execution

## Task: Prompt Inspector Implementation (Next.js Version)

**Session**: 2026-02-27
**Context**: Implementing live prompt inspector for debugging AI prompts across Create workflow in Next.js app

## Execution Status

### ✅ Completed Tasks

#### Documentation
- Created `docs/DESIGN_DECISIONS.md` with feature flags architecture
- Updated `CLAUDE.md` to reference design decisions doc prominently

#### Fix #1: Developer Mode Toggle Not Showing
- Added `developerMode: boolean` to `AppSettings` interface in `src/lib/types.ts`
- Added `developerMode: false` to default settings in `src/store/app-store.ts`
- Added Developer Mode toggle in `src/app/app/settings/page.tsx`

#### Fix #2: Remove Next.js Dev Indicator ("N" button)
- Disabled Next.js dev indicators in `next.config.ts` by adding:
  ```typescript
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  }
  ```

#### Prompt Inspector Feature
- **Created `src/lib/prompt-builders.ts`**: Utility functions to build prompts for inspector
  - `buildPresetPrompt()`: Shows preview of preset + platform + advanced settings
  - `buildDreamscapePrompt()`: Shows initial dreamscape generation prompt
  - `buildEnhancementPrompt()`: Shows enhancement goal prompts
  - `buildOutputPrompt()`: Shows final story generation prompt with all dials
- **Created `src/components/dev-tools/prompt-inspector.tsx`**: Bottom drawer component
  - Resizable (20-80% viewport height, default 40%)
  - Expandable sections for System/User prompts
  - Nested expandable variables section
  - Copy-to-clipboard functionality
  - Drag-to-resize with mouse
- **Modified `src/app/app/create/page.tsx`**: Integrated inspector into Create page
  - Imported prompt builders and PromptInspector component
  - Added inspector state (`inspectorPromptData`, `inspectorOpen`)
  - Added useEffect to build prompts live based on step/dialState/enhanceGoal/chunks
  - Added floating trigger button (bottom-right, only visible when `settings.developerMode === true`)
  - Added PromptInspector component to render tree

### 🔄 In Progress
- None

### ⏳ Pending Tasks
- Manual testing by user

## Changes Made

### Files Modified
- `CLAUDE.md` - Added DESIGN_DECISIONS.md reference
- `docs/DESIGN_DECISIONS.md` - Updated to remove outdated sections (removed ASI, single-file, mock API references based on user feedback)
- `next.config.ts` - Disabled dev indicators
- `src/lib/types.ts` - Added `developerMode` field to AppSettings
- `src/store/app-store.ts` - Added `developerMode: false` to default settings
- `src/app/app/settings/page.tsx` - Added Developer Mode toggle
- `src/app/app/create/page.tsx` - Full prompt inspector integration

### Files Created
- `docs/DESIGN_DECISIONS.md` - Architectural decisions document
- `src/lib/prompt-builders.ts` - Prompt building utilities
- `src/components/dev-tools/prompt-inspector.tsx` - Prompt inspector component

### Files Deleted
- None

## Implementation Notes

### Key Technical Details

**Feature Flags Architecture**:
- All feature flags defined in Settings page only (no URL params per design decision)
- Current: `settings.developerMode` for prompt inspector
- Future: Backend controls which flags available based on user role
- Easy migration: Wrap Settings toggles in `{user?.role === 'admin' && ...}`

**Prompt Builder Functions** (`src/lib/prompt-builders.ts`):
- Return `PromptData` object with:
  - `step`: String describing which step
  - `messages`: Array of `{role, content, variables}` objects
  - `fullPrompt`: Complete concatenated prompt string
- All builders use DIALS config to format intensity values
- Variables section shows all inputs that affect the prompt

**PromptInspector Component** (`src/components/dev-tools/prompt-inspector.tsx`):
- Bottom drawer pattern (familiar from browser DevTools)
- Mouse drag-to-resize functionality
- Expandable sections: Click to expand/collapse System/User prompts
- Nested variables: Each prompt message can show its variable inputs
- Copy-to-clipboard: Button to copy full prompt to clipboard
- Only renders when `isOpen && isDevMode`

**Live Updates in Create Page**:
- useEffect watches: `[step, dialState, enhanceGoal, chunks, settings.developerMode]`
- Updates prompt data in real-time as user adjusts dials, genres, formats, etc.
- Covers steps:
  - Step 0 (Dreamscape): (no prompt yet, could add chunk preview)
  - Step 1 (Preset): Shows preset + advanced settings prompt
  - Step 2 (Generate): Shows dreamscape generation prompt
  - Step 3 (Rate & Save): Shows output generation prompt
  - Enhancement (when drawer open): Shows enhancement prompt

**Important Note**: Step numbers in Next.js version differ from planning doc
- Planning doc referenced steps 0-3 as Preset/Generate/Enhance/Output
- Next.js implementation uses steps 0-3 as Dreamscape/Preset/Generate/Rate&Save
- Adjusted implementation to match actual step flow

### Challenges & Solutions
- ✅ Developer Mode toggle not showing → Added to types, store, and settings page
- ✅ Next.js "N" dev indicator showing → Disabled via devIndicators config
- ✅ Step numbering mismatch → Adjusted to match actual Next.js implementation

## Testing Notes

**Ready for manual testing**:
1. **Enable Developer Mode**:
   - Go to Settings
   - Toggle "Developer Mode" to Enabled
   - Should persist across page reloads

2. **Verify Inspector Appears**:
   - Go to Create page
   - Should see floating "🔍 Prompt Inspector" button in bottom-right corner
   - Button should only appear when Developer Mode is enabled

3. **Test Prompt Inspector in Each Step**:
   - **Step 1 (Preset)**: Verify preset + platform + advanced settings (dials, genres) visible
   - **Step 2 (Generate)**: Verify dreamscape generation prompt
   - **Step 3 (Rate & Save)**: Verify full output generation prompt

4. **Test Live Updates** (Critical for debugging):
   - Adjust intensity dials → Prompt should update in real-time
   - Change platform/format → Prompt should reflect changes
   - Add/remove genres → Prompt should update

5. **Test Drawer Functionality**:
   - Click drag handle (top edge) and drag up/down → Should resize
   - Should respect min (20%) and max (80%) height constraints
   - Should be scrollable for long prompts

6. **Test Expandable Sections**:
   - Click [System Prompt] / [User Prompt] → Should expand/collapse
   - Click "Variables" → Should show all input variables
   - Variables should show correct values from state

7. **Test Copy-to-Clipboard**:
   - Click "Copy All" → Should copy full prompt
   - Verify paste works in text editor

8. **Verify No Dev Indicator**:
   - Next.js "N" button in bottom-left should be gone
   - Check console for no errors

## Developer Actions Required
- [ ] Restart dev server (`npm run dev` or similar) for Next.js config changes to take effect
- [ ] Test developer mode toggle in Settings (enable/disable)
- [ ] Verify inspector appears when enabled, hidden when disabled
- [ ] Test prompt updates live with dial changes **(critical for debugging prompts!)**
- [ ] Test all steps (Dreamscape/Preset/Generate/Rate&Save)
- [ ] Test resize functionality (drag handle)
- [ ] Test expandable sections and variables
- [ ] Test copy-to-clipboard
- [ ] Verify no errors in console
- [ ] Test on different screen sizes
- [ ] Verify Next.js "N" dev indicator is gone

---

**Status**: Implementation complete - ready for testing

**Next Steps**:
1. User tests feature
2. User provides feedback on prompt visibility
3. Iterate on prompt builders based on actual debugging needs
