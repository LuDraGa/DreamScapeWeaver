---
**Commit**: 0ac54e3
**Date**: 2026-02-26 16:46:41
**Message**: Base setup done for the new structure to be run on vercel
---

# StoryWeaver - Production MVP Refactor Execution

## Task: Convert Single-File Prototype to Next.js Production App

**Session**: 2025-02-26
**Context**: Implementing Phase 1 refactor as approved - Next.js + TypeScript + shadcn/ui + OpenAI + hybrid persistence

## Execution Status

### ✅ Completed Tasks

- [x] Set up environment file with OpenAI API key
- [x] Updated .gitignore for environment files
- [x] Finalized planning doc with developer answers
- [x] Installed all dependencies (Next.js, React 19, Zustand, OpenAI, Tailwind, TypeScript)
- [x] Created Next.js project structure with TypeScript config
- [x] Configured Tailwind with design system colors
- [x] Created TypeScript types (src/lib/types.ts)
- [x] Extracted all configs to JSON files (presets, dials, platforms, etc.)
- [x] Created config loader (src/lib/config.ts)
- [x] Created utilities (src/lib/utils.ts - uid, sleep, cn, copyToClipboard, etc.)
- [x] Created environment config (src/lib/env.ts)
- [x] Created Auth context stub (src/lib/auth/context.tsx)
- [x] Created localStorage adapter (src/lib/persistence/local.ts)
- [x] Created Supabase adapter stub (src/lib/persistence/supabase.ts)
- [x] Created persistence router (src/lib/persistence/index.ts)

### 🔄 In Progress

*Setting up Zustand store with persistence routing*

### ⚠️ IMPORTANT NOTE: OpenAI Adapter

The OpenAI adapter (`src/lib/adapters/openai.ts`) is currently **stubbed with detailed TODO comments**.

**Status**: Comprehensive stub created with implementation guidance
**Priority**: HIGH
**Estimated time**: 2-3 hours
**Impact**: Required for actual AI generation (currently using mock adapter)

See **`TODO.md`** in root for full implementation requirements.

**Current behavior**: App uses mock adapter, all generation is simulated.
**After OpenAI implementation**: Switch `src/lib/api.ts` to use openaiAdapter by default.

### ⏳ Pending Tasks

**Step 1: Scaffold Next.js Project**
- [ ] Run `pnpm create next-app@latest . --typescript --tailwind --app --src-dir`
- [ ] Install core dependencies
- [ ] Set up project structure
- [ ] Configure Tailwind with design system tokens

**Step 2: Design System Setup**
- [ ] Initialize shadcn/ui
- [ ] Extract design tokens from prototype (colors, spacing, typography)
- [ ] Create `src/lib/design-tokens.ts`
- [ ] Configure Tailwind theme
- [ ] Create base component patterns

**Step 3: Extract Types & Configs**
- [ ] Create `src/lib/types.ts` with all interfaces
- [ ] Extract configs to JSON: `presets.json`, `dials.json`, `platforms.json`
- [ ] Create `src/lib/config.ts` loader
- [ ] Create `src/lib/utils.ts` (uid, sleep, cn helper)
- [ ] Create `src/lib/env.ts` for environment variables

**Step 4: Build Persistence Layer (HYBRID)**
- [ ] Create `src/lib/persistence/local.ts` (localStorage adapter)
- [ ] Create `src/lib/persistence/supabase.ts` (stub for Phase 1)
- [ ] Create `src/lib/persistence/index.ts` (router - guest vs auth)
- [ ] Create `src/lib/auth/context.tsx` (stub - always guest for Phase 1)

**Step 5: Build API Layer with OpenAI**
- [ ] Create `src/lib/adapters/mock.ts` (move mock logic from prototype)
- [ ] Create `src/lib/adapters/openai.ts` (FULL IMPLEMENTATION)
  - [ ] Implement `generateDreamscapes()` with OpenAI
  - [ ] Implement `enhanceDreamscape()` with OpenAI
  - [ ] Implement `generateOutputs()` with OpenAI + dial parameters
- [ ] Create `src/lib/api.ts` (interface - routes to OpenAI by default)
- [ ] Add environment flag to switch mock/OpenAI

**Step 6: Set Up Zustand Store**
- [ ] Create `src/store/app-store.ts`
- [ ] Integrate with persistence layer (auto-detect guest vs auth)
- [ ] Test localStorage persistence

**Step 7: Build Component Library**
- [ ] Install shadcn/ui components: button, input, textarea, slider, card, badge, dialog
- [ ] Create `src/components/design-system/` wrapper components
  - [ ] `copy-button.tsx` (matches prototype style)
  - [ ] `toast.tsx` (slide-in notification)
  - [ ] `skeleton.tsx` (loading states)
  - [ ] `icon.tsx` (SVG wrapper)
  - [ ] `themed-card.tsx` (design system card)
- [ ] Extract SVG icons to `src/components/icons/`
- [ ] Document component patterns in `src/components/design-system/README.md`

**Step 8: Build Feature Components**
- [ ] Create page layouts (with sidebar navigation)
- [ ] Create `/app/create` components:
  - [ ] `seed-input.tsx`
  - [ ] `dreamscape-generator.tsx`
  - [ ] `enhancement-panel.tsx`
  - [ ] `preset-selector.tsx`
  - [ ] `dial-controls.tsx`
  - [ ] `variant-tabs.tsx`
- [ ] Create `/app/library` components:
  - [ ] `dreamscape-card.tsx`
  - [ ] `output-card.tsx`
  - [ ] `performance-form.tsx`
- [ ] Create `/app/settings` components:
  - [ ] `preset-selector.tsx`
  - [ ] `avoid-phrases-input.tsx`
  - [ ] `auto-avoid-toggle.tsx`

**Step 9: Build Pages**
- [ ] Create `app/layout.tsx` (root layout)
- [ ] Create `app/page.tsx` (landing page)
- [ ] Create `app/app/layout.tsx` (app layout with sidebar)
- [ ] Create `app/app/create/page.tsx`
- [ ] Create `app/app/library/page.tsx`
- [ ] Create `app/app/settings/page.tsx`
- [ ] Wire up to Zustand store
- [ ] Test routing

**Step 10: OpenAI Integration Testing**
- [ ] Test dreamscape generation with OpenAI
- [ ] Test enhancement with different goals
- [ ] Test output generation with dial parameters
- [ ] Add error handling and loading states
- [ ] Add fallback to mock if OpenAI fails

**Step 11: Full Workflow Testing**
- [ ] Test create flow: seed → enhance → generate → save
- [ ] Test library: view saved items, track performance
- [ ] Test settings: change defaults, avoid phrases
- [ ] Test guest user flow (localStorage persistence)
- [ ] Verify UX matches prototype
- [ ] Fix any regressions

## Changes Made

### Files Created
- `.env.local` - Environment variables (OpenAI key)
- `execution_docs/_active/execution.md` - This file
- `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- `src/lib/types.ts` - All TypeScript interfaces
- `src/config/*.json` - Externalized configs (presets, dials, platforms, enhancement-goals, feedback-chips, genres)
- `src/lib/config.ts` - Config loader with helper functions
- `src/lib/utils.ts` - Utility functions (uid, sleep, cn, etc.)
- `src/lib/env.ts` - Environment config with validation
- `src/lib/auth/context.tsx` - Auth context stub (Phase 1)
- `src/lib/persistence/local.ts` - localStorage adapter
- `src/lib/persistence/supabase.ts` - Supabase adapter stub
- `src/lib/persistence/index.ts` - Persistence router

### Files Modified
- `.gitignore` - Added `.env*.local`
- `execution_docs/_active/planning.md` - Added developer answers
- `package.json` - Added all dependencies and scripts

### Files Deleted
- None yet

## Implementation Notes

### Key Technical Decisions

**1. Hybrid Persistence Strategy**
```typescript
// src/lib/persistence/index.ts
export function getPersistence() {
  const { user } = useAuth()  // Will always return null in Phase 1
  return user ? supabasePersistence : localStoragePersistence
}
```

**2. OpenAI Integration Pattern**
- Use streaming responses where possible for better UX
- Include dial parameters in system prompt
- Format as JSON for structured outputs
- Handle rate limits gracefully

**3. Design System Extension Pattern**
```typescript
// Base shadcn component
import { Button } from '@/components/ui/button'

// Extended design system component
export function CopyButton({ text }: { text: string }) {
  return (
    <Button
      variant="ghost"
      className="themed-button-styles"
      onClick={() => copyToClipboard(text)}
    >
      <CopyIcon />
    </Button>
  )
}
```

**4. Route Structure**
- `/` - Landing page (guest entry)
- `/app/create` - Main workflow
- `/app/library` - Saved items
- `/app/settings` - Preferences

**5. Auth Stub Pattern**
```typescript
// Phase 1: Always guest
export function useAuth() {
  return { user: null, isGuest: true }
}

// Phase 2: Add Supabase Auth
// Will check session and return real user
```

### Challenges & Solutions

**Challenge**: Maintaining exact UI look while using shadcn/ui
**Solution**:
- Use shadcn primitives as base
- Create wrapper components in `design-system/` folder
- Extract design tokens to Tailwind config
- Document pattern in component README

**Challenge**: Hybrid persistence without auth in Phase 1
**Solution**:
- Stub auth context (always returns guest)
- Build both adapters now
- Router auto-selects localStorage
- Phase 2: Just enable auth, router switches automatically

**Challenge**: OpenAI prompt engineering for dial parameters
**Solution**:
- Convert dial values to descriptive system prompt
- Use structured JSON output format
- Include examples in prompt
- Test with various dial combinations

## Testing Notes

### Manual Testing Checklist
- [ ] Create dreamscape manually
- [ ] Generate dreamscapes with OpenAI
- [ ] Enhance with each goal type
- [ ] Generate outputs with different presets
- [ ] Rate and provide feedback
- [ ] Save to library
- [ ] Load from library
- [ ] Track performance
- [ ] Change settings
- [ ] Verify localStorage persistence across sessions

### OpenAI API Testing
- [ ] Test with various vibe/genre inputs
- [ ] Test enhancement with different goals
- [ ] Test output generation with extreme dial values
- [ ] Test error handling (invalid key, rate limits)
- [ ] Test mock fallback

## Developer Actions Required

- [ ] Approve execution plan
- [ ] Provide feedback on component patterns
- [ ] Test OpenAI integration when ready
- [ ] Review UI match with prototype

## Next Actions

1. **Get approval** to proceed with execution
2. **Start Step 1**: Scaffold Next.js project
3. **Parallel work**: Can work on types/configs while Next.js installs

---

**Status**: Awaiting approval to begin execution
**Last Updated**: 2025-02-26
