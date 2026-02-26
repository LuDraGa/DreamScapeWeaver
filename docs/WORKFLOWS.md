# Workflows

## CreatePage: 4-Step Generation Flow

### Step 0: Seed Creation

**Manual Entry**:
```jsx
<textarea
  value={chunk.text}
  onChange={(e) => updateChunk(chunk.id, 'text', e.target.value)}
  placeholder="A middle-aged accountant discovers..."
/>
```

- Multi-chunk support (click "Add Another Part")
- Drag-to-reorder chunks with up/down buttons
- Can load saved dreamscapes from Library

**AI Generation** (Dreamscape Generator panel):
```javascript
const handleGenerateDreamscapes = async () => {
  setGenLoading(true)
  const results = await generateDreamscapes({
    count: genCount,      // 1-10 seeds
    vibe: genVibe         // Optional vibe/genre hint
  })
  setGenResults(results)
  setGenLoading(false)
}
```

- Click seed to add to chunks
- Can generate multiple batches
- Results append to existing chunks

### Step 1: Enhancement (Optional)

Accessed via "Enhance/Merge" button when chunks exist.

**Enhancement Goals**:
```javascript
const ENHANCEMENT_GOALS = [
  { id: "vivid", label: "Add vividness", icon: "🎨" },
  { id: "conflict", label: "Add conflict", icon: "⚔️" },
  { id: "believable", label: "Make it more believable", icon: "🎯" },
  { id: "stitch", label: "Stitch chunks together", icon: "🧵" },
  { id: "less-ai", label: "Make it less AI-ish", icon: "🤖" },
]
```

**Flow**:
1. User selects enhancement goal
2. Clicks "Enhance"
3. System calls `enhanceDreamscape({ chunks, goalPreset })`
4. Results displayed in panel:
   - **Stitched seed** (if goal === "stitch") - Shows combined narrative
   - **Enhanced chunks** (other goals) - Shows each chunk with additions
5. User clicks "Use This" to replace current chunks

**Stitch Example**:
```
Input chunks:
1. "A barista starts leaving coded messages in latte art..."
2. "A detective going through a messy divorce..."

Output (stitched):
"What started as two separate incidents ended up being connected...
[Chunk 1 text]
---
[Chunk 2 text]
The thing is — these aren't two stories. They're the same story from different angles."
```

### Step 2: Generation Configuration

**Preset Selection**:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {PRESETS.map((preset) => (
    <button onClick={() => handleSelectPreset(preset.id)}>
      <span>{preset.emoji}</span>
      <div>{preset.name}</div>
      <div>{preset.subtitle}</div>
    </button>
  ))}
</div>
```

Clicking preset auto-fills:
- Platform
- Output format
- Word count
- Tone
- All 7 intensity dials

**Advanced Customization** (toggle panel):
```jsx
// Platform & Format
<select value={dialState.platform}>
  {PLATFORMS.map(p => <option value={p.id}>{p.name}</option>)}
</select>

// Intensity Dials (7 sliders)
{Object.entries(DIALS).map(([key, config]) => (
  <Slider
    label={config.label}
    value={dialState.intensity[key]}
    onChange={(v) => setDialState(s => ({
      ...s,
      intensity: { ...s.intensity, [key]: v }
    }))}
    min={config.min}
    max={config.max}
  />
))}

// Other Controls
<input type="number" value={dialState.wordCount} />
<select value={dialState.tone}>
  {TONES.map(t => <option>{t}</option>)}
</select>
```

**Generate Action**:
```javascript
const handleGenerate = async () => {
  setGenerating(true)
  const variants = await generateOutputs({
    dreamscape: { chunks },
    dialState
  })
  setOutputs(variants)
  setActiveVariant(0)
  setStep(3)
  setGenerating(false)
}
```

### Step 3: Output Review & Refinement

**Variant Tabs**:
```jsx
<div className="flex gap-2">
  {outputs.map((output, idx) => (
    <button
      onClick={() => setActiveVariant(idx)}
      className={activeVariant === idx ? "active" : ""}
    >
      {output.title}
    </button>
  ))}
</div>
```

**Active Variant Panel**:
```jsx
const output = outputs[activeVariant]

// Story text display
<div className="prose">
  {output.text}
</div>

// Copy button
<CopyBtn text={output.text} />

// Rating (1-5 stars)
<StarRating
  value={ratings[output.id]}
  onChange={(v) => setRatings({ ...ratings, [output.id]: v })}
/>

// Feedback chips
{FEEDBACK_CHIPS.map(chip => (
  <button
    onClick={() => toggleFeedback(output.id, chip.id)}
    className={feedback[output.id]?.includes(chip.id) ? "active" : ""}
  >
    {chip.label}
  </button>
))}

// Notes
<textarea
  value={notes[output.id]}
  onChange={(e) => setNotes({ ...notes, [output.id]: e.target.value })}
  placeholder="Notes about this variant..."
/>
```

**Actions**:
- **Re-run** - Generate new variants with same config
- **Save** - Add to Library with ratings/feedback/notes
- **Back to Edit** - Return to seed editing

## LibraryPage: Browsing & Performance

### Tab Structure

```jsx
<div className="tabs">
  <button onClick={() => setTab("dreamscapes")}>Dreamscapes</button>
  <button onClick={() => setTab("outputs")}>Outputs</button>
</div>
```

### Dreamscapes Tab

**Card Display**:
```jsx
{filteredDreamscapes.map(dreamscape => (
  <div className="card">
    <div className="header">
      <span>{dreamscape.title || "Untitled"}</span>
      <button onClick={() => onOpenDreamscape(dreamscape)}>
        Open in Create
      </button>
      <button onClick={() => deleteDreamscape(dreamscape.id)}>
        Delete
      </button>
    </div>

    <div className="chunks">
      {dreamscape.chunks.map(chunk => (
        <div className="chunk-preview">
          {chunk.text.slice(0, 150)}...
        </div>
      ))}
    </div>

    <div className="meta">
      Created {new Date(dreamscape.createdAt).toLocaleDateString()}
    </div>
  </div>
))}
```

### Outputs Tab

**Card Display** (with expand/collapse):
```jsx
{filteredOutputs.map(output => (
  <div className="card">
    <div className="header">
      <span>{output.title}</span>
      <button onClick={() => toggleExpand(output.id)}>
        {isExpanded ? "Collapse" : "Expand"}
      </button>
    </div>

    {isExpanded && (
      <>
        <div className="full-text">{output.text}</div>

        <div className="performance-section">
          <button onClick={() => setShowPerfForm(output.id)}>
            Track Performance
          </button>

          {output.performanceSnapshots?.map(snap => (
            <div className="snapshot">
              <div>{snap.cadence} - {snap.platform}</div>
              <div className="metrics">
                {Object.entries(snap.metrics).map(([key, val]) => (
                  <span>{key}: {val}</span>
                ))}
              </div>
              <div className="date">
                {new Date(snap.recordedAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
))}
```

**Performance Tracking Form**:
```jsx
{showPerfForm === output.id && (
  <div className="perf-form">
    <select value={perfCadence} onChange={e => setPerfCadence(e.target.value)}>
      <option value="day">Daily</option>
      <option value="week">Weekly</option>
      <option value="month">Monthly</option>
    </select>

    {/* Dynamic metric inputs based on platform */}
    {PLATFORMS.find(p => p.id === 'reddit')?.metrics.map(metric => (
      <input
        type="number"
        placeholder={metric}
        value={perfMetrics[metric] || ''}
        onChange={e => setPerfMetrics({
          ...perfMetrics,
          [metric]: parseInt(e.target.value)
        })}
      />
    ))}

    <button onClick={() => handleAddPerf(output)}>
      Save Snapshot
    </button>
  </div>
)}
```

## SettingsPage: Configuration

```jsx
function SettingsPage() {
  const { settings, setSettings } = useApp()

  return (
    <div>
      {/* Default Preset */}
      <select
        value={settings.defaultPreset}
        onChange={e => setSettings({
          ...settings,
          defaultPreset: e.target.value
        })}
      >
        {PRESETS.map(p => <option value={p.id}>{p.name}</option>)}
      </select>

      {/* Avoid Phrases */}
      <div>
        {settings.avoidPhrases?.map((phrase, idx) => (
          <div className="chip">
            {phrase}
            <button onClick={() => removePhrase(idx)}>×</button>
          </div>
        ))}
        <input
          placeholder="Add phrase to avoid..."
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setSettings({
                ...settings,
                avoidPhrases: [...settings.avoidPhrases, e.target.value]
              })
              e.target.value = ''
            }
          }}
        />
      </div>

      {/* Auto-Avoid AI Toggle */}
      <label>
        <input
          type="checkbox"
          checked={settings.autoAvoidAI}
          onChange={e => setSettings({
            ...settings,
            autoAvoidAI: e.target.checked
          })}
        />
        Automatically remove AI-ish phrases
      </label>
    </div>
  )
}
```

## Data Flow Diagrams

### Dreamscape Creation Flow
```
User Input
  ↓
chunks state (CreatePage)
  ↓
saveDreamscape() [user clicks Save]
  ↓
AppContext.savedDreamscapes
  ↓
localStorage.setItem('sg_dreamscapes', ...)
```

### Generation Flow
```
chunks + dialState
  ↓
generateOutputs() [mock API]
  ↓
outputs state (CreatePage)
  ↓
Variant tabs (user reviews)
  ↓
saveOutput() [user clicks Save]
  ↓
AppContext.savedOutputs
  ↓
localStorage.setItem('sg_outputs', ...)
```

### Enhancement Flow
```
chunks (current seed)
  ↓
User selects enhancement goal
  ↓
enhanceDreamscape({ chunks, goalPreset })
  ↓
enhanceResult state
  ↓
User clicks "Use This"
  ↓
setChunks(enhanceResult.enhancedChunks)
  OR
setChunks([{ id, text: enhanceResult.stitchedSeed }])
```

### Performance Tracking Flow
```
User opens output in Library
  ↓
Clicks "Track Performance"
  ↓
Fills performance form (cadence, metrics)
  ↓
handleAddPerf()
  ↓
Create snapshot object
  ↓
saveOutput({
  ...output,
  performanceSnapshots: [...existing, newSnapshot]
})
  ↓
Updates localStorage
```

## Common Patterns

### Loading States

```jsx
{generating ? (
  <div className="loading">
    <Skeleton />
    <p>Generating variants...</p>
  </div>
) : (
  <button onClick={handleGenerate}>Generate</button>
)}
```

### Toast Notifications

```jsx
const showToast = (msg) => {
  setToast(msg)
  setTimeout(() => setToast(""), 2000)
}

// Usage
showToast("Saved to library!")
showToast("Copied to clipboard")

// Component
<Toast message={toast} show={!!toast} />
```

### Collapsible Sections

```jsx
<div>
  <button onClick={() => setShowAdvanced(!showAdvanced)}>
    Advanced Options
    {showAdvanced ? <I.ChevUp /> : <I.ChevDown />}
  </button>

  <Collapse open={showAdvanced}>
    {/* Content here */}
  </Collapse>
</div>
```

### Search/Filter Pattern

```jsx
const [search, setSearch] = useState("")

const filtered = items.filter(item =>
  !search ||
  item.text?.toLowerCase().includes(search.toLowerCase()) ||
  item.title?.toLowerCase().includes(search.toLowerCase())
)

<input
  type="text"
  placeholder="Search..."
  value={search}
  onChange={e => setSearch(e.target.value)}
/>
```
