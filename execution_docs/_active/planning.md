# StoryWeaver - Production MVP Refactor Planning

## Task: Refactor Single-File Prototype to Production-Ready Next.js App

**Session**: 2025-02-26
**Context**: Convert single-file React prototype (`GenAI Story Generator.jsx`) to production-ready Next.js app deployed on Vercel with Supabase backend and OpenAI integration

## Current State

### What We Have
- ✅ Single-file React prototype (~1100 lines)
- ✅ Good UX flow (Create → Library → Settings)
- ✅ Working mock generation with intensity dials
- ✅ localStorage persistence
- ✅ Performance tracking system
- ✅ Enhancement workflow (vivid, conflict, stitch, etc.)

### Limitations
- ❌ Not modular (single file)
- ❌ No TypeScript
- ❌ No backend (mock API only)
- ❌ No database (localStorage only)
- ❌ Hardcoded configs
- ❌ No real LLM integration
- ❌ Not deployment-ready

## Target Production Stack

### Infrastructure
- **Deployment**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (buckets)
- **Auth**: Supabase Auth (future, structure now)
- **LLM Provider**: OpenAI API

### Frontend Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Package Manager**: pnpm

## Phase 1: P0 Refactors (Highest ROI)

### 1. Convert to Next.js App Router Structure

**Current**: Single `GenAI Story Generator.jsx` file

**Target Structure**:
```
app/
├── layout.tsx                 # Root layout
├── page.tsx                   # Landing page
├── globals.css                # Tailwind + custom styles
├── app/
│   ├── layout.tsx            # App layout (with sidebar)
│   ├── create/
│   │   └── page.tsx          # CreatePage (main workflow)
│   ├── library/
│   │   └── page.tsx          # LibraryPage (saved items)
│   └── settings/
│       └── page.tsx          # SettingsPage (preferences)

src/
├── components/
│   ├── ui/                   # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── slider.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── dialog.tsx
│   ├── design-system/        # Extended/composed components (following design patterns)
│   │   ├── copy-button.tsx  # Extends shadcn button
│   │   ├── toast.tsx         # Custom toast system
│   │   ├── skeleton.tsx      # Loading states
│   │   ├── icon.tsx          # SVG icon wrapper
│   │   └── themed-card.tsx   # Card with design system styling
│   └── icons/                # SVG icon definitions
├── features/
│   ├── create/               # Create page components
│   │   ├── seed-input.tsx
│   │   ├── dreamscape-generator.tsx
│   │   ├── enhancement-panel.tsx
│   │   ├── preset-selector.tsx
│   │   ├── dial-controls.tsx
│   │   └── variant-tabs.tsx
│   ├── library/              # Library page components
│   │   ├── dreamscape-card.tsx
│   │   ├── output-card.tsx
│   │   └── performance-form.tsx
│   └── settings/             # Settings page components
│       ├── preset-selector.tsx
│       ├── avoid-phrases.tsx
│       └── auto-avoid-toggle.tsx
├── lib/
│   ├── types.ts              # TypeScript types
│   ├── config.ts             # Config loader
│   ├── api.ts                # API interface (routes to correct adapter)
│   ├── env.ts                # Environment variables
│   ├── adapters/
│   │   ├── mock.ts          # Mock adapter (fallback/testing)
│   │   └── openai.ts        # OpenAI adapter (IMPLEMENT IN PHASE 1)
│   ├── persistence/
│   │   ├── local.ts         # localStorage adapter (guest users)
│   │   ├── supabase.ts      # Supabase adapter (auth users)
│   │   └── index.ts         # Persistence router (auto-select based on auth)
│   ├── auth/
│   │   └── context.tsx      # Auth context (stub for Phase 1)
│   └── utils.ts              # Utilities (uid, sleep, etc.)
├── store/
│   └── app-store.ts          # Zustand store
└── config/
    ├── presets.json          # Externalized presets
    ├── dials.json            # Externalized dials
    └── platforms.json        # Externalized platforms
```

**UX Impact**: Zero (keep identical, just restructured)

**Dependencies**:
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```

### 2. Convert to TypeScript with Proper Types

**Create**: `src/lib/types.ts`

```typescript
// Core entities
export interface Project {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface Dreamscape {
  id: string
  projectId?: string  // Optional for now
  title: string
  chunks: DreamscapeChunk[]
  createdAt: string
  updatedAt: string
}

export interface DreamscapeChunk {
  id: string
  title: string
  text: string
}

// Generation config
export interface DialState {
  presetId: string
  platform: Platform
  outputFormat: OutputFormat
  wordCount: number
  tone: Tone
  intensity: IntensityValues
  genrePrimary?: string
  genreSecondary?: string
  avoidPhrases: string[]
  cohesionStrictness: number  // 1-10
}

export interface IntensityValues {
  stakes: number        // 1-10
  darkness: number      // 1-10
  pace: number          // 1-10
  twist: number         // 1-10
  realism: number       // 1-10
  catharsis: number     // 1-10
  moralClarity: number  // 1-10
}

// Output
export interface OutputVariant {
  id: string
  projectId?: string
  dreamscapeId?: string
  title: string
  text: string
  dialState?: DialState  // Config used to generate
  createdAt: string
  rating?: number  // 1-5 stars
  feedback?: string[]  // Feedback chip IDs
  notes?: string
  performanceSnapshots?: PerformanceSnapshot[]
}

export interface PerformanceSnapshot {
  id: string
  variantId: string
  cadence: 'day' | 'week' | 'month'
  platform: string
  metrics: Record<string, number>
  recordedAt: string
}

// Config types
export interface Preset {
  id: string
  name: string
  subtitle: string
  emoji: string
  platform: Platform
  outputFormat: OutputFormat
  wordCount: number
  tone: Tone
  intensity: IntensityValues
}

export interface Dial {
  label: string
  min: number
  max: number
}

export interface PlatformConfig {
  id: string
  name: string
  metrics: string[]
}

export interface EnhancementGoal {
  id: string
  label: string
  icon: string
}

export interface FeedbackChip {
  id: string
  label: string
  positive: boolean
}

// String unions
export type Platform = 'reddit' | 'reels' | 'tiktok' | 'blog'
export type OutputFormat = 'reddit-post' | 'reel-script' | 'short-story' | 'series'
export type Tone = 'narrative' | 'dialogue' | 'script' | 'mixed'
export type EnhancementGoalId = 'vivid' | 'conflict' | 'believable' | 'stitch' | 'less-ai'

// Settings
export interface AppSettings {
  defaultPreset: string
  avoidPhrases: string[]
  autoAvoidAI: boolean
}

// API interfaces
export interface GenerateDreamscapesParams {
  count: number
  vibe?: string
}

export interface EnhanceDreamscapeParams {
  chunks: DreamscapeChunk[]
  goalPreset: EnhancementGoalId
}

export interface EnhanceDreamscapeResult {
  stitchedSeed?: string
  enhancedChunks?: DreamscapeChunk[]
}

export interface GenerateOutputsParams {
  dreamscape: Dreamscape
  dialState: DialState
}
```

**Why**:
- Prevents data shape drift
- Type-safe API boundaries
- Easier Supabase schema alignment
- Better IDE support

### 3. Externalize Configs to JSON

**Create**: `src/config/presets.json`, `src/config/dials.json`, `src/config/platforms.json`

**Load via**: `src/lib/config.ts`

```typescript
import presetsJson from '@/config/presets.json'
import dialsJson from '@/config/dials.json'
import platformsJson from '@/config/platforms.json'

export const PRESETS: Preset[] = presetsJson
export const DIALS: Record<string, Dial> = dialsJson
export const PLATFORMS: PlatformConfig[] = platformsJson

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find(p => p.id === id)
}

export function getDial(key: string): Dial | undefined {
  return DIALS[key]
}

export function getPlatform(id: string): PlatformConfig | undefined {
  return PLATFORMS.find(p => p.id === id)
}
```

**Why**:
- Easy to modify presets without touching code
- Phase 2: can move to Supabase `site_config` table
- JSON can be validated with Zod/JSON Schema

### 4. Extract API Layer with Adapters

**Create**: `src/lib/api.ts` (UI-facing interface)

```typescript
import { mockAdapter } from './adapters/mock'
// import { openaiAdapter } from './adapters/openai'  // Future

export const api = {
  dreamscapes: {
    generate: mockAdapter.generateDreamscapes,
    enhance: mockAdapter.enhanceDreamscape,
  },
  outputs: {
    generate: mockAdapter.generateOutputs,
  },
}

// Future: switch based on env
// export const api = process.env.USE_MOCK === 'true' ? mockAdapter : openaiAdapter
```

**Create**: `src/lib/adapters/mock.ts` (current behavior)

```typescript
import type {
  GenerateDreamscapesParams,
  EnhanceDreamscapeParams,
  EnhanceDreamscapeResult,
  GenerateOutputsParams,
  Dreamscape,
  OutputVariant,
} from '@/lib/types'

const MOCK_SEEDS = [
  "A middle-aged accountant discovers their neighbor...",
  // ... rest of mock seeds
]

const MOCK_STORIES = {
  balanced: `So this happened last week...`,
  intense: `I need to get this off my chest...`,
  believable: `This is kind of mundane...`,
}

export const mockAdapter = {
  async generateDreamscapes(params: GenerateDreamscapesParams): Promise<Dreamscape[]> {
    await sleep(1500 + Math.random() * 1000)
    const shuffled = [...MOCK_SEEDS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, params.count).map((text) => ({
      id: uid(),
      title: "",
      chunks: [{ id: uid(), title: "", text }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  },

  async enhanceDreamscape(params: EnhanceDreamscapeParams): Promise<EnhanceDreamscapeResult> {
    await sleep(2000 + Math.random() * 500)
    // ... current enhancement logic
  },

  async generateOutputs(params: GenerateOutputsParams): Promise<OutputVariant[]> {
    await sleep(2500 + Math.random() * 1000)
    return [
      { id: uid(), title: "Variant A — Balanced", text: MOCK_STORIES.balanced, createdAt: new Date().toISOString() },
      { id: uid(), title: "Variant B — More Intense", text: MOCK_STORIES.intense, createdAt: new Date().toISOString() },
      { id: uid(), title: "Variant C — More Believable", text: MOCK_STORIES.believable, createdAt: new Date().toISOString() },
    ]
  },
}
```

**Create**: `src/lib/adapters/openai.ts` (stub for now)

```typescript
export const openaiAdapter = {
  async generateDreamscapes(params: GenerateDreamscapesParams): Promise<Dreamscape[]> {
    // TODO: Call OpenAI API
    throw new Error('OpenAI adapter not implemented yet')
  },

  async enhanceDreamscape(params: EnhanceDreamscapeParams): Promise<EnhanceDreamscapeResult> {
    // TODO: Call OpenAI API
    throw new Error('OpenAI adapter not implemented yet')
  },

  async generateOutputs(params: GenerateOutputsParams): Promise<OutputVariant[]> {
    // TODO: Call OpenAI API
    throw new Error('OpenAI adapter not implemented yet')
  },
}
```

**Why**:
- Clean separation: UI → API interface → Adapter
- Easy to swap mock → OpenAI without UI changes
- Testable in isolation

### 5. Introduce Zustand Store

**Create**: `src/store/app-store.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dreamscape, OutputVariant, AppSettings, DialState } from '@/lib/types'

interface AppState {
  // Create flow
  currentDreamscape: Dreamscape | null
  currentDialState: DialState | null
  generatedVariants: OutputVariant[]
  activeVariantIndex: number

  // Library
  savedDreamscapes: Dreamscape[]
  savedOutputs: OutputVariant[]

  // Settings
  settings: AppSettings

  // Actions
  setCurrentDreamscape: (dreamscape: Dreamscape | null) => void
  setCurrentDialState: (dialState: DialState) => void
  setGeneratedVariants: (variants: OutputVariant[]) => void
  setActiveVariantIndex: (index: number) => void
  saveDreamscape: (dreamscape: Dreamscape) => void
  saveOutput: (output: OutputVariant) => void
  deleteDreamscape: (id: string) => void
  deleteOutput: (id: string) => void
  updateSettings: (settings: Partial<AppSettings>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      currentDreamscape: null,
      currentDialState: null,
      generatedVariants: [],
      activeVariantIndex: 0,
      savedDreamscapes: [],
      savedOutputs: [],
      settings: {
        defaultPreset: 'reddit-aitah',
        avoidPhrases: ["It's worth noting that", "I couldn't help but", "Little did I know"],
        autoAvoidAI: true,
      },

      // Actions
      setCurrentDreamscape: (dreamscape) => set({ currentDreamscape: dreamscape }),
      setCurrentDialState: (dialState) => set({ currentDialState: dialState }),
      setGeneratedVariants: (variants) => set({ generatedVariants: variants }),
      setActiveVariantIndex: (index) => set({ activeVariantIndex: index }),

      saveDreamscape: (dreamscape) =>
        set((state) => ({
          savedDreamscapes: [dreamscape, ...state.savedDreamscapes.filter((d) => d.id !== dreamscape.id)],
        })),

      saveOutput: (output) =>
        set((state) => ({
          savedOutputs: [output, ...state.savedOutputs.filter((o) => o.id !== output.id)],
        })),

      deleteDreamscape: (id) =>
        set((state) => ({
          savedDreamscapes: state.savedDreamscapes.filter((d) => d.id !== id),
        })),

      deleteOutput: (id) =>
        set((state) => ({
          savedOutputs: state.savedOutputs.filter((o) => o.id !== id),
        })),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'storyweaver-storage', // localStorage key
      partialize: (state) => ({
        savedDreamscapes: state.savedDreamscapes,
        savedOutputs: state.savedOutputs,
        settings: state.settings,
      }),
    }
  )
)
```

**Why**:
- Centralized state management
- Built-in localStorage persistence
- Easy migration to Supabase sync later
- Better devtools support

## Proposed Execution Order

### Step 1: Scaffold Next.js Project (30 min)
- [ ] Create Next.js app: `pnpm create next-app@latest . --typescript --tailwind --app --src-dir`
- [ ] Install dependencies: `pnpm add zustand`
- [ ] Set up basic layout and pages (empty shells)
- [ ] Copy over global styles from prototype

### Step 2: Extract Types & Configs (45 min)
- [ ] Create `src/lib/types.ts` with all interfaces
- [ ] Extract configs to JSON files in `src/config/`
- [ ] Create `src/lib/config.ts` loader
- [ ] Create utility functions (`src/lib/utils.ts`: uid, sleep, etc.)

### Step 3: Create API Layer (1 hr)
- [ ] Create mock adapter (`src/lib/adapters/mock.ts`)
- [ ] Move all mock generation logic from prototype
- [ ] Create API interface (`src/lib/api.ts`)
- [ ] Create OpenAI adapter stub

### Step 4: Set Up Zustand Store (45 min)
- [ ] Create `src/store/app-store.ts`
- [ ] Migrate localStorage logic to Zustand persist
- [ ] Test state persistence

### Step 5: Build UI Components (2 hrs)
- [ ] Extract reusable components (Button, Card, etc.)
- [ ] Set up shadcn/ui: `pnpm dlx shadcn-ui@latest init`
- [ ] Install needed components: `pnpm dlx shadcn-ui@latest add button input textarea slider`
- [ ] Create feature-specific components (preset selector, dial controls, etc.)

### Step 6: Build Pages (3 hrs)
- [ ] Create `/create` page (main workflow)
- [ ] Create `/library` page (saved items)
- [ ] Create `/settings` page (preferences)
- [ ] Wire up to Zustand store
- [ ] Verify UX matches prototype

### Step 7: Test & Polish (1 hr)
- [ ] Test full workflow: create → generate → save → library
- [ ] Test enhancement flow
- [ ] Test performance tracking
- [ ] Fix any regressions

**Total Estimated Time**: ~9 hours

## Developer Answers

1. **shadcn/ui**: ✅ Use shadcn/ui BUT maintain current UI look and feel. Structure component library with design patterns for extensibility.

2. **Deployment**: ✅ Deploy AFTER Supabase integration (Phase 2)

3. **OpenAI Integration**: ✅ Implement OpenAI adapter in Phase 1 (full implementation, not stub)

4. **Route Structure**: ✅ Use `/app/create`, `/app/library`, `/app/settings` (nested under /app)

5. **Persistence Strategy**: ✅ HYBRID approach:
   - **Guest users**: localStorage only (minimal features)
   - **Logged-in users**: Supabase persistence (full features)
   - Need both persistence adapters working in Phase 1

## Success Criteria

- [ ] Application runs in Next.js with TypeScript
- [ ] All original UX flows work identically
- [ ] Configs externalized to JSON
- [ ] Clean API adapter boundary (easy to swap mock → OpenAI)
- [ ] Zustand store manages all state
- [ ] Code is modular and maintainable
- [ ] Ready for Vercel deployment
- [ ] Ready for Supabase integration (Phase 2)

## Dependencies & Risks

### Dependencies
- Next.js 14+ (App Router stable)
- TypeScript 5+
- Zustand 4+
- shadcn/ui (optional but recommended)

### Risks
- **UX Regression**: Mitigate by keeping UI logic identical, just refactored
- **State Migration**: Test localStorage → Zustand migration thoroughly
- **Config Drift**: Validate JSON configs match TypeScript types

## Next Steps

Once approved:
1. Create execution doc with detailed task tracking
2. Begin Step 1 (scaffold Next.js)
3. Update documentation to reflect new architecture

---

*Awaiting developer approval to proceed*
