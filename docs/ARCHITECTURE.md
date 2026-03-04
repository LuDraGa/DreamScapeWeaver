# Architecture

## Project Structure

**StoryWeaver** is a Next.js 15 application with real OpenAI API integration (`gpt-4o`) and Supabase auth (Google OAuth + email/password). Persistence is still localStorage — Supabase DB persistence is Phase 3.

**Stack**: Next.js 15 + React 19 + TypeScript + Tailwind CSS + Zustand + Radix UI + OpenAI SDK + Zod

### File Breakdown

```
src/
├── app/
│   ├── api/                          # Server-side API routes (LLM calls happen here)
│   │   ├── dreamscapes/generate/     # POST - generate story seeds via OpenAI
│   │   ├── dreamscapes/enhance/      # POST - enhance/stitch seeds via OpenAI
│   │   ├── outputs/generate/         # POST - generate 3 story variants via OpenAI
│   │   └── parts/transform/          # POST - transform studio parts
│   └── app/
│       ├── create/page.tsx           # CreatePage (4-step seed→output flow)
│       ├── library/page.tsx          # LibraryPage (saved items + performance)
│       ├── settings/page.tsx         # SettingsPage
│       └── studio/page.tsx           # StudioPage (project/part management)
├── components/
│   ├── create/                       # Template gallery components
│   ├── design-system/                # Shared UI (CopyButton, Slider, Toast, etc.)
│   ├── studio/                       # Studio-specific components
│   └── ui/                           # Radix-based primitives (Button, Card, etc.)
├── config/
│   ├── presets.json / dials.json / platforms.json / ...
│   └── templates/                    # ~50 templates across 6 categories
│       ├── reddit/                   # aitah, tifu, nosleep, petty-revenge, writing-prompts
│       ├── short-form/               # TikTok/Reels story types
│       ├── long-form/                # YouTube formats
│       ├── marketing/                # Brand, email, landing page, etc.
│       ├── audio-production/         # Podcast, voiceover, etc.
│       └── video-production/         # Shot lists, storyboards, etc.
├── lib/
│   ├── adapters/
│   │   ├── openai.ts                 # ✅ REAL - gpt-4o with Zod structured outputs
│   │   └── mock.ts                   # Toggle via NEXT_PUBLIC_USE_MOCK_ADAPTER=true
│   ├── persistence/
│   │   ├── local.ts                  # ✅ ACTIVE - localStorage
│   │   └── supabase.ts               # 🚧 STUB - all methods throw, Phase 2
│   ├── auth/context.tsx              # 🚧 STUB - always returns guest user, Phase 2
│   ├── prompt-builders.ts            # Prompt construction logic
│   ├── types.ts                      # All TypeScript types
│   └── env.ts                        # Env vars (OPENAI_API_KEY, Supabase keys)
├── store/app-store.ts                # Zustand global state
└── hooks/usePromptInspector.ts       # Dev tool for inspecting prompts
```

## Key Concepts

### Dreamscapes

Story seeds/premises that serve as the foundation for generation. Can have multiple chunks (parts) that can be enhanced or stitched together.

```typescript
interface Dreamscape {
  id: string
  title: string
  chunks: Array<{
    id: string
    title: string
    text: string
  }>
  createdAt: string
  updatedAt: string
}
```

### Intensity Dials

7-dimensional control system for story characteristics:

- **Stakes** (1-10) - How much is on the line
- **Darkness** (1-10) - Tone/mood darkness
- **Pace** (1-10) - Story speed/urgency
- **Twist Factor** (1-10) - Plot surprise level
- **Realism** (1-10) - Believability vs dramatic license
- **Catharsis** (1-10) - Emotional payoff/satisfaction
- **Moral Clarity** (1-10) - Good/bad distinction clarity

### Presets

Pre-configured dial + platform + format combinations:

```javascript
{
  id: "reddit-aitah",
  name: "Reddit AITAH",
  platform: "reddit",
  outputFormat: "reddit-post",
  wordCount: 800,
  tone: "narrative",
  intensity: {
    stakes: 7,
    darkness: 5,
    pace: 6,
    twist: 7,
    realism: 9,      // High believability for Reddit
    catharsis: 6,
    moralClarity: 4
  }
}
```

### Enhancement Goals

Transformations applied to dreamscape chunks:

- **vivid** - Add sensory details and atmospheric description
- **conflict** - Inject tension and stakes
- **believable** - Add authenticity markers (details, caveats)
- **stitch** - Combine multiple chunks into cohesive narrative
- **less-ai** - Remove AI-ish phrasing

### Multi-Variant Generation

System generates 3 variants per prompt:
1. **Balanced** - Middle ground across all dials
2. **More Intense** - Higher stakes, faster pace, darker tone
3. **More Believable** - More realistic, grounded, authentic

Used for A/B testing different approaches.

## Data Model

### localStorage Keys

```typescript
// sg_dreamscapes
Array<{
  id: string
  title: string
  chunks: Array<{ id: string, title: string, text: string }>
  createdAt: string
  updatedAt: string
}>

// sg_outputs
Array<{
  id: string
  projectId: string  // Currently unused (no multi-project support)
  title: string
  text: string
  createdAt: string
  performanceSnapshots?: Array<{
    id: string
    variantId: string
    cadence: 'day' | 'week' | 'month'
    platform: string
    metrics: Record<string, number>  // { upvotes: 420, comments: 89 }
    recordedAt: string
  }>
}>

// sg_settings
{
  defaultPreset: string     // Preset ID
  avoidPhrases: string[]    // Phrases to avoid in generation
  autoAvoidAI: boolean      // Auto-remove AI-ish language
}
```

### State Management

**Global Context** (AppProvider):
- `savedDreamscapes` - All saved dreamscapes
- `savedOutputs` - All saved story outputs
- `settings` - User preferences
- CRUD methods: `saveDreamscape()`, `saveOutput()`, `deleteDreamscape()`, `deleteOutput()`

**CreatePage Local State**:
- `step` - Current workflow step (0=seed, 1=enhance, 2=generate config, 3=outputs)
- `chunks` - Current dreamscape chunks being edited
- `dialState` - Current intensity dial settings + platform config
- `outputs` - Generated story variants
- `activeVariant` - Currently displayed variant (0-2)

**LibraryPage Local State**:
- `tab` - Current view ("dreamscapes" | "outputs")
- `search` - Search filter
- `expandedOutput` - Currently expanded output ID

## Component Patterns

### Page Structure

```jsx
function SomePage() {
  const { savedData, saveData } = useApp()  // Global context
  const [localState, setLocalState] = useState()
  const [toast, setToast] = useState("")

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1>Page Title</h1>
      {/* Content */}
      <Toast message={toast} show={!!toast} />
    </div>
  )
}
```

### Card Pattern

```jsx
<div className="rounded-2xl p-6" style={{ background: "rgba(15,23,42,0.6)" }}>
  <h2 style={{ color: "#f1f5f9" }}>Title</h2>
  <p style={{ color: "#64748b" }}>Description</p>
</div>
```

### Button Pattern

```jsx
<button
  className="px-4 py-2 rounded-xl font-medium transition-all"
  style={{ background: "#6366f1", color: "#fff" }}
  onClick={handleClick}
>
  Label
</button>
```

## API Layer

The adapter pattern in `src/lib/adapters/` allows switching between real OpenAI and mock. Toggle with `NEXT_PUBLIC_USE_MOCK_ADAPTER=true`.

All LLM calls use `gpt-4o-2024-08-06` with Zod structured outputs for type-safe, guaranteed JSON responses.

### generateDreamscapes()

```javascript
async function generateDreamscapes({ count, vibe }) {
  await sleep(1500 + Math.random() * 1000)  // Simulate API delay
  const shuffled = [...MOCK_DREAMSCAPE_SEEDS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((text) => ({
    id: uid(),
    title: "",
    chunks: [{ id: uid(), title: "", text }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
}
```

### enhanceDreamscape()

```javascript
async function enhanceDreamscape({ chunks, goalPreset }) {
  await sleep(2000 + Math.random() * 500)

  // Special case: stitch multiple chunks together
  if (goalPreset === "stitch" && chunks.length > 1) {
    const combined = chunks.map((c) => c.text).join("\n\n---\n\n")
    return {
      stitchedSeed: `What started as two separate incidents...\n\n${combined}`
    }
  }

  // Normal case: append enhancement to each chunk
  const suffix = getSuffixForGoal(goalPreset)
  return {
    enhancedChunks: chunks.map((c) => ({
      ...c,
      id: uid(),
      text: c.text + suffix
    }))
  }
}
```

### generateOutputs()

```javascript
async function generateOutputs({ dreamscape, dialState }) {
  await sleep(2500 + Math.random() * 1000)

  // Returns 3 pre-written variants
  // In real implementation, would call LLM API with dialState params
  return [
    { id: uid(), title: "Variant A — Balanced", text: MOCK_STORIES.balanced },
    { id: uid(), title: "Variant B — More Intense", text: MOCK_STORIES.intense },
    { id: uid(), title: "Variant C — More Believable", text: MOCK_STORIES.believable },
  ]
}
```

## Phase Status & Next Steps

### ✅ Phase 1: Complete
- Next.js app + real OpenAI API (`gpt-4o`)
- Adapter pattern with mock toggle
- localStorage persistence
- Template library (~50 templates)
- Studio page

### ✅ Phase 2a: Auth — Complete
- Supabase auth: Google OAuth + email/password
- `storyweaver` schema isolation (shared Supabase project)
- `profiles` table with `user_role` enum (`normal`, `admin`, `dev`)
- Profile auto-created on first login via callback route
- Mock login locally (role picker, `NEXT_PUBLIC_ENABLE_AUTH=false`)
- Real auth on Vercel (`NEXT_PUBLIC_ENABLE_AUTH=true` + `ENABLE_AUTH=true`)
- Middleware enforces `/app/*` protection at runtime via `ENABLE_AUTH` (non-public env var)

### 🚧 Phase 2b: Persistence — Next
- Design RDBMS schema in Figma (ERD) before touching code
- Implement `src/lib/persistence/supabase.ts` (all methods currently throw)
- Tables: `dreamscapes`, `output_variants`, `performance_snapshots`, `projects`, `parts`, `settings`

### 🚧 Phase 3: Billing
- Stripe + usage metering per user
- Free tier / Pro tier

## Performance Tracking System

### Data Structure

```typescript
interface PerformanceSnapshot {
  id: string
  variantId: string           // Which output variant
  cadence: 'day' | 'week' | 'month'
  platform: string            // 'reddit' | 'reels' | 'tiktok' | 'blog'
  metrics: {
    // Reddit
    upvotes?: number
    comments?: number

    // Reels/TikTok
    views?: number
    likes?: number
    shares?: number
    avgWatchTime?: number

    // Blog
    readTime?: number
  }
  recordedAt: string
}
```

### Usage Pattern

User manually logs metrics from Library page:

1. Expand output card
2. Click "Track Performance"
3. Select cadence (day/week/month)
4. Select platform
5. Enter metrics
6. Save snapshot

Multiple snapshots per output = time-series data for A/B testing.

## Code Style

- **No semicolons** - Entire file uses ASI
- **Arrow functions** - `const fn = () => {}` preferred
- **Template literals** - Backticks for strings with variables
- **Inline styles** - Tailwind classes + style prop for colors
- **Compact JSX** - One-line where possible
