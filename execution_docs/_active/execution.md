# StoryWeaver - Active Execution

## Task: Combined Setup Step (Tabbed Seed + Template)

**Session**: 2026-03-13
**Context**: Merge template selection and seed input into a single tabbed step so users can approach from either direction.

## Execution Status

### ✅ Completed Tasks

- Refactored Step 0 for normal users: tabbed (Your Idea | Choose Format) + status bar
- Merged old Step 0 (Template) and Step 1 (Seed) into single combined step
- Updated step labels: Normal users get `Setup → Rate & Save` (2 steps)
- Status bar shows seed + template status with clickable indicators
- Generate button contextual text based on what's missing
- "Generate Seeds" works without template with amber nudge: "Pick a format first for better seeds"
- Library "Use as Seed" defaults to format tab (seed pre-filled, format needed)
- Build passes

### 🔄 In Progress

- Commit

### ⏳ Pending Tasks

- None

## Changes Made

### Files Modified
- `src/app/app/create/page.tsx` — Combined tabbed setup step, removed separate seed step for normal users
- `execution_docs/_active/planning.md` — Planning doc
- `execution_docs/_active/execution.md` — Tracking

### Files Created
-

### Files Deleted
-

## Implementation Notes

### Key Technical Details
- `setupTab` state: `'idea' | 'format'`, defaults to `'format'` when dreamscape pre-loaded, `'idea'` otherwise
- Normal user steps reduced from 3 (Template → Seed → Rate & Save) to 2 (Setup → Rate & Save)
- Power user flow completely unchanged (4 steps)
- Status bar always visible at bottom of combined step showing both seed and template status
- Green dots indicate filled state for each input
- Generate button text adapts: shows what's missing ("Enter an idea", "Pick a format", or "Generate Story")
- Tab bar shows green dots next to completed inputs for cross-tab visibility

### Challenges & Solutions
- Step index shift: Rate & Save moved from step 2 to step 1 for normal users — updated all references

## Testing Notes
- `pnpm build` passes

## Developer Actions Required
- [ ] Test idea-first flow (type seed → switch to format tab → pick template → generate)
- [ ] Test template-first flow (pick template → switch to idea tab → type seed → generate)
- [ ] Test Library "Use as Seed" (should land on format tab with seed pre-filled)
- [ ] Test Generate Seeds with and without template
- [x] Build succeeds

---

*This document tracks active implementation progress*
