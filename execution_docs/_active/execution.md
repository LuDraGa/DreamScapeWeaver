# StoryWeaver - Active Execution

## Task: Fix Unexpected Twist template — 4 prompt patches + word count update

**Session**: 2026-04-05
**Context**: AI review of the Rewatch Bait variant exposed 4 template bugs. Also increasing default word count from 225 → 475 (450-500 range) based on testing showing 225 is too sparse and 800 is too padded.

## Execution Status

### ✅ Completed Tasks

- Patched `src/config/templates/short-form/unexpected-twist.json` — all 5 changes applied and verified

### 🔄 In Progress

*None*

### ⏳ Pending Tasks

- Manual retest with same dreamscape

## Changes Made

### Files Modified
- `src/config/templates/short-form/unexpected-twist.json`

### Files Created
-

### Files Deleted
-

## Implementation Notes

### Key Technical Details

5 changes to the template JSON:

1. **wordCount**: 225 → 475 (target range 450-500)
2. **selfCheckRubric**: word count criterion updated to match
3. **avoidPhrases**: added meta-commentary phrases ("on first watch", "on replay", "on rewatch", "first run-through", "second watch", "that's the line that")
4. **promptTemplate.system constraints**:
   - Word count updated
   - Spoken voice guardrail added to narrative tone bullet
   - New rule: structure labels must not appear in output
   - New rule: no meta-commentary about viewing experience
5. **promptTemplate.user structure block**:
   - Added "(Internal planning guide — labels must NOT appear in output)" header
   - Step 6 expanded: moral realignment if someone was wronged

### Challenges & Solutions
- All edits are to raw JSON string content — `\n` in the file is literal backslash-n

## Testing Notes
- Retest with same dreamscape: "My friends wife cheated on him with me..." at default word count

## Developer Actions Required
- [ ] Regenerate output with same dreamscape using default word count
- [ ] Verify no clue labels in output
- [ ] Verify no meta-commentary ("on replay" etc.)
- [ ] Verify spoken-register voice

---

*This document tracks active implementation progress*
