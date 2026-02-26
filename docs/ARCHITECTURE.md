# Architecture

## Project Structure

**StoryWeaver** is a single-file React application (`GenAI Story Generator.jsx`, ~1100 lines) with mock API layer. No backend integration yet.

### File Breakdown

```
GenAI Story Generator.jsx (~1100 lines)
├── CONFIG DATA (lines 7-79)
│   ├── PRESETS - Platform/genre presets (Reddit AITAH, Petty Revenge, etc.)
│   ├── PLATFORMS - Platform definitions with metrics
│   ├── DIALS - Intensity controls (stakes, darkness, pace, twist, etc.)
│   ├── GENRES, OUTPUT_FORMATS, TONES
│   └── ENHANCEMENT_GOALS, FEEDBACK_CHIPS
│
├── MOCK API LAYER (lines 85-192)
│   ├── MOCK_DREAMSCAPE_SEEDS - Sample story seeds
│   ├── MOCK_STORIES - Sample outputs (balanced/intense/believable variants)
│   ├── generateDreamscapes() - Seed generation
│   ├── enhanceDreamscape() - Enhancement workflows
│   └── generateOutputs() - Multi-variant story generation
│
├── LOCAL STORAGE (lines 197-202)
│   ├── loadFromStorage() - Restore state
│   └── saveToStorage() - Persist state
│
├── APP CONTEXT (lines 207-232)
│   └── AppProvider - Global state (savedDreamscapes, savedOutputs, settings)
│
├── UI COMPONENTS (lines 238-297)
│   ├── Icons (I.*) - SVG icon components
│   ├── CopyBtn, Toast, Skeleton, Slider, Collapse
│
├── PAGES (lines 325-1027)
│   ├── CreatePage - Main workflow (seed → enhance → generate → refine)
│   ├── LibraryPage - Saved dreamscapes/outputs + performance tracking
│   └── SettingsPage - Default preset, avoid phrases, auto-avoid-AI
│
└── MAIN APP (lines 1029-1101)
    └── StoryGeneratorApp - Navigation, sidebar, page routing
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

## Mock API Layer

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

## Migration Path to Real Backend

### Phase 1: API Integration

Replace mock functions with real API calls:

```javascript
async function generateOutputs({ dreamscape, dialState }) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seed: dreamscape.chunks.map(c => c.text).join('\n\n'),
      platform: dialState.platform,
      format: dialState.outputFormat,
      wordCount: dialState.wordCount,
      tone: dialState.tone,
      intensity: dialState.intensity,
      avoidPhrases: dialState.avoidPhrases,
    })
  })

  const { variants } = await response.json()
  return variants
}
```

### Phase 2: Database + Auth

Replace localStorage with database:

```javascript
// Replace AppProvider localStorage with Supabase
const { data: savedDreamscapes } = await supabase
  .from('dreamscapes')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

const saveDreamscape = async (dreamscape) => {
  const { error } = await supabase
    .from('dreamscapes')
    .upsert({ ...dreamscape, user_id: user.id })

  if (error) throw error
}
```

### Phase 3: Modularization

Split into proper file structure:

```
src/
├── config/
│   ├── presets.ts
│   ├── platforms.ts
│   └── dials.ts
├── api/
│   ├── dreamscapes.ts
│   ├── enhance.ts
│   └── generate.ts
├── context/
│   └── AppContext.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Slider.tsx
│   └── ...
├── pages/
│   ├── CreatePage.tsx
│   ├── LibraryPage.tsx
│   └── SettingsPage.tsx
└── App.tsx
```

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
