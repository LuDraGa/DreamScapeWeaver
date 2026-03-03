---
**Commit**: b71fc8c
**Date**: 2026-03-03 20:25:23
**Message**: fix: post-commit hook bugs and clean up archived docs
---

# StoryWeaver - Active Execution

## Task: Fix Post-Commit Hook and Add Google Docs-style Commenting

**Session**: 2026-03-03
**Context**: Fixing post-commit hook bugs and implementing commenting system for Rate & Save page

## Execution Status

### ✅ Completed Tasks

1. Implemented Google Docs-style commenting system
   - Text selection detection with offset calculation
   - Floating popover for adding comments/regenerating selections
   - Optional comments sidebar with resolve functionality
   - Selective regeneration using comments as guidance

2. Added always-visible Split/Continue cards
   - Split into Parts with guidance textarea
   - Continue Story with guidance textarea
   - Both cards always visible (no conditional rendering)

3. Removed old multi-part UI
   - Removed part navigation tabs
   - Removed old regeneration notes expandable
   - Removed old continue-to-next-part button
   - Simplified content header

4. Fixed missing state variable
   - Added `notes` state to prevent runtime error

5. Cleaned up archived execution docs
   - Deleted 11 useless template archives
   - Kept 3 useful properly-named archives

### 🔄 In Progress

- Fixing post-commit hook with improvements from AICreditSystem repo

### ⏳ Pending Tasks

- Update post-commit hook with bug fixes
- Git commit all changes without Claude attribution

## Changes Made

### Files Modified
- `src/app/app/create/page.tsx` - Added commenting system, removed old multi-part UI
- `src/lib/utils.ts` - Added parseMultiPartOutput utility (will be removed in hook fix)
- `.husky/post-commit` - Needs bug fixes

### Files Deleted
- 11 template archive files in `execution_docs/archive/`

## Implementation Notes

### Key Technical Details

**Commenting System**:
- Uses `window.getSelection()` API for text selection
- Calculates offsets relative to content start using `Range` API
- Stores comments with `startOffset`, `endOffset`, `selectedText`, `commentText`
- Marks comments as resolved when selection is regenerated

**Selective Regeneration**:
- Extracts context before/after selected text (500 chars each)
- Filters relevant comments within selection range
- Uses comments as guidance in regeneration prompt
- Splices new content back into original text

**Split/Continue Functions**:
- Always-visible cards with guidance textareas
- Split: Prompts LLM to split story into 2-3 parts with [PART N] markers
- Continue: Generates next part and appends with [PART 2] marker

### Post-Commit Hook Bug

**Problem**: Hook uses `-f` (file exists check) instead of `-n` (variable non-empty check) at line 173

**Current (WRONG)**:
```bash
if [ -f "$PLANNING_ARCHIVE" ] || [ -f "$EXECUTION_ARCHIVE" ]; then
```

**Should be**:
```bash
if [ -n "$PLANNING_ARCHIVE" ] || [ -n "$EXECUTION_ARCHIVE" ]; then
```

**Additional improvements from AICreditSystem**:
1. Initialize `PLANNING_ARCHIVE=""` and `EXECUTION_ARCHIVE=""` at top
2. Use `grep -Eq` (extended regex) instead of `grep -q` with basic regex
3. Check for untouched templates: `grep -Eq "^## Task: \[New Task Name\]$"`
4. Cleaner output messages

### Challenges & Solutions

**Challenge**: `notes` state variable was missing, causing runtime error
**Solution**: Added `const [notes, setNotes] = useState<Record<number, string>>({})`

**Challenge**: Text selection offsets needed careful calculation
**Solution**: Used `Range.cloneRange()` and `setEnd()` to calculate offset from content start

## Testing Notes

- Dev server compiled successfully with no errors
- Commenting system ready for manual testing
- Post-commit hook bug identified and solution documented

## Developer Actions Required
- [x] Fix runtime error with missing `notes` state
- [x] Clean up useless archived docs
- [ ] Update post-commit hook with bug fixes
- [ ] Test commenting system manually
- [ ] Test post-commit hook behavior

---

*This document tracks active implementation progress*
