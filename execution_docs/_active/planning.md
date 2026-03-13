# Planning: Combined Setup Step (Tabbed Seed + Template)

## Problem
Current flow forces template-first for normal users, but users approach from different directions:
1. Template-first: "I want to write for r/nosleep"
2. Idea-first: "I have this idea about a creepy neighbor"
3. Ready-made: "Here's a story I wrote, format it for Reddit"
4. Library: "Use as Seed" pre-loads seed, needs template selection

## Solution
Merge Step 0 (Template) and Step 1 (Seed) into a **single combined step with two tabs**:
- Tab 1: "Your Idea" — seed textarea + AI seed generation
- Tab 2: "Choose Format" — template gallery + style variant picker
- Status bar at bottom showing both states + Generate button

## Key Behaviors
- User can interact with either tab first (no forced order)
- "Generate Seeds" works without template (generic seeds) but shows nudge: "Select a format for better seeds"
- "Generate Seeds" with template selected uses template's seedPrompt
- "Generate Story" button enables when BOTH seed text exists AND template is selected
- From Library "Use as Seed": lands on combined step with seed pre-filled, format tab highlighted
- Status bar always visible showing: seed status + template status

## Normal User Flow (After)
- Step 0: Combined Setup (tabbed: Your Idea | Choose Format) + status bar + Generate
- Step 1: Rate & Save (unchanged)

## Power User Flow (unchanged)
- Step 0: Dreamscape
- Step 1: Platform & Style
- Step 2: Generate
- Step 3: Rate & Save

## Implementation Plan
1. Add `setupTab` state: `'idea' | 'format'` (default: 'idea')
2. Refactor Step 0 normal user UI:
   - Tab bar at top: [Your Idea] | [Choose Format]
   - Tab content swaps in place
   - "Your Idea" tab: seed textarea + generate seeds button + generated results
   - "Choose Format" tab: category tabs → template grid → style variant picker
3. Add status bar at bottom of Step 0:
   - Left: seed status indicator (filled/empty with preview)
   - Right: template status indicator (selected/not with name)
   - Center: Generate Story button (enabled when both ready)
4. Remove Step 1 (Seed) for normal users — merged into Step 0
5. Update step labels: Normal users get `Setup → Rate & Save` (2 steps)
6. Update Library "Use as Seed" to set setupTab to 'format' (seed pre-filled, nudge to pick format)
7. Nudge on "Generate Seeds" when no template: show inline message
8. Move admin prompt editor into collapsible within combined step

## Files to Modify
- `src/app/app/create/page.tsx` — main refactor
- `execution_docs/_active/execution.md` — tracking
