# Create Page Enhancements - Execution Doc

**Date**: 2026-02-26
**Task**: Add missing features from original prototype to Create page
**Status**: IN PROGRESS

## Missing Features Identified

### 1. Dreamscape Tab (Step A)
- [ ] **MergeView button** - Show/hide combined preview of all chunks
- [ ] **Reorder controls** - Up/down arrows to reorder parts
- [ ] **Save functionality** - Already implemented, just verify it works

### 2. Preset Tab (Step B)
- [ ] **Advanced Options section** with:
  - [ ] Word Count slider (100-5000)
  - [ ] Platform selection (reddit, reels, tiktok, blog)
  - [ ] Output Format selection (reddit-post, reel-script, short-story, series)
  - [ ] Tone selection (narrative, dialogue, script, mixed)
  - [ ] Genre selection (optional, multi-select)
  - [ ] 7 Intensity Dials (stakes, darkness, pace, twist, realism, catharsis, moralClarity)
  - [ ] Cohesion slider (1-10)
  - [ ] Avoid Phrases input with chip display
  - [ ] "Randomize within preset" button

### 3. Persistence Layer
- [ ] Verify all CRUD operations use the persistence layer (localStorage for guests, Supabase stub for logged-in)

## Implementation Plan

1. Create LabeledSlider component ✅
2. Add MergeView to Dreamscape tab
3. Add reorder controls (up/down arrows)
4. Add comprehensive Advanced section to Preset tab
5. Test persistence layer integration

## Files to Modify

- `src/app/app/create/page.tsx` - Main updates
- `src/components/design-system/labeled-slider.tsx` - Created ✅

## Notes

- Need to manage dialState properly in Preset tab
- Advanced options should collapse/expand
- Reordering should be simple up/down, not drag-and-drop (simpler UX)
- All dial changes should update the dialState
- When preset is selected, it should populate the advanced options
- Randomize button should slightly vary intensity dials within ±2
