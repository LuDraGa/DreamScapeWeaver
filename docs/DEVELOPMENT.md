# Development Guide

## Running the Application

```bash
pnpm dev      # Start dev server (Next.js 15)
pnpm build    # Build for production
pnpm lint     # Lint
```

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Auth (local dev)
NEXT_PUBLIC_ENABLE_AUTH=false
ENABLE_AUTH=false

# Auth (production/Vercel)
NEXT_PUBLIC_ENABLE_AUTH=true
ENABLE_AUTH=true
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional
NEXT_PUBLIC_USE_MOCK_ADAPTER=true  # Use mock adapter instead of OpenAI
```

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

### Upgrading a Hero Template

Hero templates include the full quality pipeline. To upgrade a template:

```bash
# Add JSON file to the appropriate category
src/config/templates/{category}/{template-name}.json
```

Required fields for hero templates:
```json
{
  "seedPrompt": {
    "system": "Platform-specific seed generation system prompt",
    "user": "Seed generation user prompt with {count} variable"
  },
  "styleVariants": [
    {
      "id": "variant-id",
      "name": "Display Name",
      "description": "One-line description",
      "promptModifier": "Full style instructions for the LLM"
    }
  ],
  "selfCheckRubric": [
    "Quality check question 1?",
    "Quality check question 2?"
  ],
  "fewShotExcerpt": "Condensed structural reference (beats, not full examples)",
  "promptTemplate": {
    "system": "...",
    "user": "... {dreamscape} {fewShotExcerpt} {styleModifier} {selfCheckRubric} {avoidPhrases} ..."
  }
}
```

All new fields are optional — non-hero templates still work without them.

### Adding a Preset (Power User Mode)

```javascript
// Edit src/config/presets.json
{
  id: "horror-short",
  name: "Horror Short",
  platform: "reels",
  outputFormat: "reel-script",
  wordCount: 400,
  tone: "narrative",
  intensity: { stakes: 8, darkness: 9, pace: 7, twist: 8, realism: 5, catharsis: 4, moralClarity: 3 }
}
```

### Adding a Platform

```javascript
// Edit src/config/platforms.json
{
  id: "youtube",
  name: "YouTube",
  metrics: ["views", "likes", "comments", "avgWatchTime"]
}
```

## Testing Flows

### Normal User Flow (Template-First)
1. Ensure `powerUserMode` is OFF in Settings
2. Go to Create page
3. Select a template category (e.g., "reddit")
4. Select a template (e.g., "r/AITAH")
5. Pick a style variant (e.g., "Controversial")
6. Enter a seed or click "Generate Seeds" (should produce platform-specific seeds)
7. Generate output — verify style variant and rubric affect quality
8. Rate & Save

### Power User Flow
1. Enable `powerUserMode` in Settings
2. Go to Create page
3. Enter seed text or generate dreamscapes (generic, not template-aware)
4. Select preset → auto-fills dials
5. Generate → verify 3 variants appear
6. Rate & Save

### Admin Prompt Editing
1. Enable `developerMode` in Settings
2. Select template + style variant
3. Enter seed → prompt editor should show assembled prompt
4. Verify `{styleModifier}`, `{selfCheckRubric}`, `{fewShotExcerpt}` are replaced
5. Edit prompts → generate → verify edits took effect

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
