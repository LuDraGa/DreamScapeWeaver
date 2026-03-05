# Development Guide

## Running the Application

This is a standalone React file designed for rapid prototyping. Multiple options to run:

### Option 1: Vite (Recommended)

```bash
# If you don't have a Vite project yet
npm create vite@latest . -- --template react
npm install

# Copy or rename the file
# GenAI Story Generator.jsx → src/App.jsx
# Or update src/main.jsx to import from the correct file

# Start dev server
npm run dev
```

### Option 2: Direct Browser (CDN)

Create an `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19",
        "react-dom/client": "https://esm.sh/react-dom@19/client"
      }
    }
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./GenAI Story Generator.jsx"></script>
</body>
</html>
```

### Option 3: CodeSandbox/StackBlitz

Upload the file directly to online editors for instant preview.

## Code Style & Conventions

### JavaScript Style

- **No semicolons** - Uses ASI (automatic semicolon insertion)
- **Arrow functions** - Prefer `const fn = () => {}` over `function fn() {}`
- **Template literals** - Use backticks for strings with variables
- **Compact code** - One-line JSX where possible

### React Patterns

```javascript
// State declaration
const [state, setState] = useState(initialValue)

// Derived state (avoid useEffect)
const filtered = items.filter(item => condition)

// Event handlers
const handleClick = () => {}
const handleChange = (e) => {}

// Context usage
const { savedData, saveData } = useApp()
```

### Component Structure

```javascript
function ComponentName({ props }) {
  // 1. Context hooks
  const { contextValue } = useApp()

  // 2. State
  const [localState, setLocalState] = useState()

  // 3. Derived state
  const computed = useMemo(() => calculate(), [deps])

  // 4. Effects
  useEffect(() => {}, [deps])

  // 5. Event handlers
  const handleAction = () => {}

  // 6. Render
  return <div>...</div>
}
```

## Common Development Tasks

### Adding a New Preset

```javascript
// 1. Add to PRESETS array (line 7)
{
  id: "horror-short",
  name: "Horror Short",
  subtitle: "Creepy vibe",
  emoji: "👻",
  platform: "reels",
  outputFormat: "reel-script",
  wordCount: 400,
  tone: "narrative",
  intensity: {
    stakes: 8,
    darkness: 9,
    pace: 7,
    twist: 8,
    realism: 5,
    catharsis: 4,
    moralClarity: 3
  }
}

// 2. Preset will automatically appear in CreatePage preset grid
```

### Adding an Enhancement Goal

```javascript
// 1. Add to ENHANCEMENT_GOALS (line 59)
{ id: "humor", label: "Add humor", icon: "😂" }

// 2. Update enhanceDreamscape() mock (line 170)
const suffixes = {
  vivid: "\n\nThe fluorescent lights hummed...",
  conflict: "\n\nBut there's a catch...",
  believable: " (This actually happened...)",
  stitch: "",
  "less-ai": "",
  humor: "\n\nAnd then things got weird. Like, really weird."  // ← Add this
}
```

### Adding a Dial

```javascript
// 1. Add to DIALS object (line 42)
suspense: { label: "Suspense", min: 1, max: 10 }

// 2. Add to all preset intensity objects
intensity: {
  stakes: 7,
  darkness: 5,
  // ... existing dials
  suspense: 6  // ← Add to each preset
}

// 3. Add slider in CreatePage advanced section (~line 650)
<Slider
  label={DIALS.suspense.label}
  value={dialState.intensity.suspense}
  onChange={(v) => setDialState(s => ({
    ...s,
    intensity: { ...s.intensity, suspense: v }
  }))}
  min={DIALS.suspense.min}
  max={DIALS.suspense.max}
/>
```

### Adding a Platform

```javascript
// 1. Add to PLATFORMS (line 35)
{
  id: "youtube",
  name: "YouTube",
  metrics: ["views", "likes", "comments", "avgWatchTime"]
}

// 2. Platform will automatically appear in:
//    - CreatePage platform selector
//    - LibraryPage performance tracking
```

### Adding a Component

Since this is a single file, add inline:

```javascript
// Add after existing components (around line 300)
function NewComponent({ props }) {
  return (
    <div className="rounded-xl p-4"
      style={{ background: "rgba(15,23,42,0.6)" }}>
      {/* Component content */}
    </div>
  )
}

// Use anywhere in the app
<NewComponent props={value} />
```

## Searching the Codebase

Since this is a single file, use simple grep:

```bash
# Find all state declarations
grep -n "useState" "GenAI Story Generator.jsx"

# Find specific component
grep -n "function CreatePage" "GenAI Story Generator.jsx"

# Find all storage operations
grep -n "localStorage" "GenAI Story Generator.jsx"

# Find preset definitions
grep -n "PRESETS\|intensity:" "GenAI Story Generator.jsx"

# Find dial usage
grep -n "dialState.intensity" "GenAI Story Generator.jsx"
```

### Line Number Reference

```
7-79:    CONFIG DATA (presets, platforms, dials, etc.)
85-192:  MOCK API LAYER (generate functions)
197-202: LOCAL STORAGE (load/save)
207-232: APP CONTEXT (global state)
238-297: UI COMPONENTS (icons, buttons, etc.)
325-814: CreatePage (main workflow)
815-972: LibraryPage (saved items)
973-1027: SettingsPage (preferences)
1029-1101: StoryGeneratorApp (navigation, sidebar)
```

## Testing in Browser

### Check localStorage

```javascript
// Open browser console

// Check stored data
JSON.parse(localStorage.getItem('sg_dreamscapes'))
JSON.parse(localStorage.getItem('sg_outputs'))
JSON.parse(localStorage.getItem('sg_settings'))

// Clear all data
localStorage.clear()

// Set specific value
localStorage.setItem('sg_settings', JSON.stringify({
  defaultPreset: "reddit-aitah",
  avoidPhrases: ["It's worth noting that"],
  autoAvoidAI: true
}))
```

### Test UI Flows

1. **Dreamscape creation**:
   - Enter text in seed textarea
   - Click "Continue"
   - Verify stored in state

2. **Generation**:
   - Select preset
   - Click "Generate"
   - Verify 3 variants appear

3. **Save to Library**:
   - Rate a variant
   - Click "Save to Library"
   - Navigate to Library tab
   - Verify output appears

4. **Performance tracking**:
   - Open saved output
   - Click "Track Performance"
   - Fill metrics form
   - Save snapshot
   - Verify appears in output card

## Debugging Tips

### React DevTools

Install React DevTools browser extension to inspect:
- Component tree
- Props and state
- Context values
- Re-render causes

### Common Issues

**"Cannot read property of undefined"**:
- Check optional chaining: `output?.text` instead of `output.text`
- Verify data exists in state before rendering

**State not updating**:
- Check if you're mutating state directly (bad)
- Use spread operator to create new objects/arrays (good)

```javascript
// ❌ Bad - mutates state
chunks[0].text = "new text"

// ✅ Good - creates new array/object
setChunks(chunks.map(c =>
  c.id === targetId ? { ...c, text: "new text" } : c
))
```

**localStorage not persisting**:
- Check browser privacy settings (incognito mode blocks localStorage)
- Verify `saveToStorage()` is called after state updates
- Check for JSON serialization errors

**UI not re-rendering**:
- Verify state is actually changing (use console.log)
- Check if you're using the correct state setter
- Ensure component is subscribed to the right context value

## Performance Optimization

### Current State (Prototype)

The app is unoptimized for speed because:
- Single large file (no code splitting)
- No memoization
- No virtualization for long lists

This is **intentional** - optimize for development speed, not runtime performance.

### Future Optimizations

When/if this becomes production:

1. **Code splitting**:
   ```javascript
   const LibraryPage = lazy(() => import('./pages/LibraryPage'))
   ```

2. **Memoization**:
   ```javascript
   const expensiveCalculation = useMemo(() => {
     return chunks.map(processChunk).filter(filterFn)
   }, [chunks])
   ```

3. **Virtualization** (for Library with 1000+ items):
   ```javascript
   import { useVirtualizer } from '@tanstack/react-virtual'
   ```

4. **Debounce search**:
   ```javascript
   const debouncedSearch = useDeferredValue(search)
   ```

But **not yet** - keep it simple for now.

## Migration to Production

See **[ARCHITECTURE.md § Migration Path](./ARCHITECTURE.md#migration-path-to-real-backend)** for detailed backend integration steps.

### Phase 1: API Integration

Replace mock functions with real LLM API calls:

```javascript
// Before (mock)
async function generateOutputs({ dreamscape, dialState }) {
  await sleep(2500)
  return MOCK_STORIES
}

// After (real API)
async function generateOutputs({ dreamscape, dialState }) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ dreamscape, dialState })
  })
  return response.json()
}
```

### Phase 2: Database + Auth

Replace localStorage with Supabase/Firebase:

```javascript
// Before (localStorage)
const savedDreamscapes = loadFromStorage('sg_dreamscapes', [])

// After (Supabase)
const { data: savedDreamscapes } = await supabase
  .from('dreamscapes')
  .select('*')
  .eq('user_id', user.id)
```

### Phase 3: Modularization

Split into proper file structure:

```
src/
├── config/         # presets.ts, platforms.ts, dials.ts
├── api/            # dreamscapes.ts, enhance.ts, generate.ts
├── context/        # AppContext.tsx
├── components/     # Button.tsx, Card.tsx, etc.
├── pages/          # CreatePage.tsx, LibraryPage.tsx
└── App.tsx
```

But again: **Not yet. Keep it simple.**

## CI/CD Setup

Since this is a single-file prototype, there's no build process yet.

When you do need CI:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run lint
```

## Database Commands

```bash
# Push schema migration to remote Supabase
supabase db push

# Seed all system templates (46 templates from src/config/templates/**)
pnpm db:seed

# Full setup: push migration + seed (run once on fresh environment)
pnpm db:migrate

# Check migration history (local vs remote)
supabase migration list

# Dry-run: preview what would be pushed without applying
supabase db push --dry-run
```

**Shared Supabase project note**: This project shares a Supabase instance with another app.
All tables are isolated under the `storyweaver` schema. The other app's migrations are tracked
as stub files in `supabase/migrations/` (named `*_remote.sql`) and marked applied via
`supabase migration repair`. Never delete those stub files.

**Re-seeding templates**: `pnpm db:seed` is idempotent — safe to re-run after adding new
template JSON files. Uses `ON CONFLICT (slug) DO UPDATE` so existing rows are updated in place.

## Additional Resources

- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Workflows**: [WORKFLOWS.md](./WORKFLOWS.md)
- **Design System**: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
