# StoryWeaver - Planning: Preset Tab UX Improvements

**Session**: 2026-02-27
**Task**: Improve Preset Tab (Step B) UX and rename tab

## User Requirements

From user discussion, three main improvements:

1. **Rename "Preset" tab** - Current name doesn't clearly convey its purpose
2. **Make Genre multi-select** - Currently single-select, should allow multiple genres
3. **Differentiate UX by user mode** - Different experiences for normal/power/admin users

### Platform-Specific Output Formats
User wants platform → format relationship:
- **Reddit**: AITAH, Pro Revenge, TIL, Shower Thoughts, etc. (text-based)
- **YouTube**: Long form vs short form
- **Reels/TikTok**: Short video formats

### User Mode Flows

**Normal User**:
- Platform selection → Platform-specific output formats (auto-populated)
- Duration/word count auto-set based on ideal for selected format
- Tone, genres, intensity dials auto-selected via LLM call based on dreamscape (fastest model)
- Avoid phrases from library defaults

**Power User**:
- All selections visible with smart defaults pre-selected
- Full manual control over all parameters
- Can override any auto-selection

**Admin User** (future):
- All power user features
- Can add new: avoid phrases, genres, tones, output formats, platforms

## Proposed Changes

### Task 1: Rename "Preset" Tab

**Options to discuss**:
- "Story Controls"
- "Output Settings"
- "Platform & Style"
- "Configuration"
- "Format Selection"

**Recommendation**: "Platform & Style" - clearly indicates platform selection + styling/tone choices

### Task 2: Multi-Select Genre

**Current**: Single genre (genrePrimary only)
**New**: Multiple genres (array)

**Technical changes**:
- `DialState` type: Change `genrePrimary?: string` and `genreSecondary?: string` to `genres?: string[]`
- UI: Change from single-select buttons to multi-select chips
- Prompt builders: Update to handle genre array

### Task 3: User Mode Differentiation

This is the complex one requiring deeper discussion.

#### Architecture Approach

**Option A: Conditional Rendering (Current Pattern)**
- Continue using `settings.powerUserMode` checks throughout
- Show/hide sections based on mode
- Pros: Simple, minimal refactoring
- Cons: Code gets messy with lots of conditionals

**Option B: Mode-Specific Components**
- Create separate components: `<PresetStepNormal />`, `<PresetStepPower />`, `<PresetStepAdmin />`
- Route based on user mode
- Pros: Clean separation, easier to maintain
- Cons: More code duplication

**Option C: Adaptive Component with Render Props**
- Single component with mode-aware sections
- Use configuration objects to define what's visible/interactive per mode
- Pros: DRY, centralized logic
- Cons: More complex initial setup

**Recommendation**: Option B - Mode-specific components. Given the significantly different UX flows, separation makes sense.

#### Platform → Format Relationship

**Current structure**:
```json
// platforms.json
{ "id": "reddit", "name": "Reddit" }

// No formats tied to platforms - formats are global
```

**Proposed structure**:
```json
// platforms.json
{
  "id": "reddit",
  "name": "Reddit",
  "formats": [
    {
      "id": "reddit-aitah",
      "name": "AITAH",
      "description": "Am I The A**hole stories",
      "idealWordCount": 800,
      "idealTone": "narrative",
      "idealGenres": ["drama", "conflict"],
      "idealIntensity": { ... }
    },
    {
      "id": "reddit-pro-revenge",
      "name": "Pro Revenge",
      "description": "Elaborate revenge stories",
      "idealWordCount": 2000,
      ...
    }
  ]
}
```

This allows:
- Platform selection drives format options
- Formats have "ideal" presets that can be overridden by power users
- Normal users just pick platform → format, everything else auto-set
- Power users see the suggestions but can modify

#### LLM Auto-Selection for Normal Users

For normal users, when they select platform + format, call LLM to analyze dreamscape and suggest:
- Best matching genres (from available list)
- Ideal tone
- Intensity dial values

**API endpoint**: `/api/analyze-dreamscape`
**Input**: Dreamscape chunks
**Output**: Suggested config matching the format's ideal profile

Uses fastest/cheapest model (e.g., GPT-4o-mini or Claude Haiku)

## Questions for User

Before implementation:

1. **Tab name preference?** "Platform & Style" or something else?

2. **Admin mode scope**: Should we implement admin features (add genres, platforms, etc.) now, or defer to future?

3. **Platform-format refactoring**: The platform → format relationship requires restructuring JSON configs and presets. This is significant work. Should we:
   - Do full refactor now (takes longer but cleaner)
   - Keep current structure and add mode differentiation first (faster, iterative)

4. **LLM auto-selection**: Confirm you want this feature for normal users? Will require:
   - New API endpoint
   - LLM integration in backend
   - Loading states in UI
   - Cost considerations (though using fast/cheap models)

5. **Genre multi-select**: Simple change. Proceed with this?

## Recommended Approach

**Phase 1** (Quick wins - do now):
1. Rename tab to "Platform & Style"
2. Implement multi-select genres
3. Test with current structure

**Phase 2** (Requires discussion):
1. Design platform → format data model
2. Create mode-specific UX components
3. Implement LLM auto-selection for normal users
4. Add admin mode features (deferred to future?)

## Technical Notes

### Files to modify (Phase 1):
- `src/app/app/create/page.tsx` (line 904-1154: Step B section)
- `src/lib/types.ts` (DialState interface)
- `src/lib/prompt-builders.ts` (handle genres array)

### Files to create (Phase 2):
- `src/components/create/preset-step-normal.tsx`
- `src/components/create/preset-step-power.tsx`
- `src/components/create/preset-step-admin.tsx` (future)
- `src/app/api/analyze-dreamscape/route.ts`
- Restructure `src/config/platforms.json`

### Data migration considerations:
- Existing saved dreamscapes/outputs may have old `genrePrimary` field
- Need migration logic or graceful fallback

## Next Steps

1. User reviews this plan
2. User answers questions above
3. Decide on phase 1 vs phase 2 scope
4. Get explicit approval to proceed
5. Implement approved changes

---

*This is a planning document. No code changes have been made yet.*
