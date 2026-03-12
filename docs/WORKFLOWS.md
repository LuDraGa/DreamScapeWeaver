# Workflows

## CreatePage: Two Flow Modes

The CreatePage supports two distinct flows depending on user mode:
- **Normal users**: Template-first flow (Template → Seed → Rate & Save)
- **Power users**: Idea-first flow (Dreamscape → Platform & Style → Generate → Review)

### Normal User Flow: Template → Seed → Rate & Save

#### Step 0: Template Selection

User picks a template from a categorized gallery (reddit, short-form, long-form, marketing, etc.):

```
Category tabs → Template grid → Style variant picker → Template settings summary
```

- Templates show icon, name, description, duration, word count
- After selecting a template, user picks a **style variant** (e.g., "Controversial", "Emotional", "Unhinged" for AITAH)
- Style variant selection shows name + description for each option
- Template settings summary shows intensity values, genres, and avoid phrases

#### Step 1: Seed Input + Generation

- Seed text area with selected template badge shown
- **Template-aware seed generation**: passes `selectedTemplate.seedPrompt` to the API, producing platform-specific seeds instead of generic ones
- Admin users see a prompt editor for inspecting/editing the system and user prompts
- Style variant is passed through to `buildPromptFromTemplate` for output generation

#### Step 2: Rate & Save

- View generated output
- Rate, copy, save to library

### Power User Flow: Dreamscape → Platform → Generate → Review

#### Step 0: Dreamscape Creation

- Multi-chunk seed editor with "Add Another Part"
- AI seed generation (generic dreamscapes, no template context)
- Drag-to-reorder chunks

#### Step 1: Platform & Style Configuration

Preset selection auto-fills platform, format, word count, tone, and all 7 intensity dials. Advanced customization panel allows manual dial adjustment.

#### Step 2: Generate

Calls `generateOutputs()` with full dial state.

#### Step 3: Output Review & Refinement

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

### Normal User Generation Flow (Template-First)
```
Template selection (category → template → style variant)
  ↓
Seed input (manual or template-aware AI generation)
  ↓
buildPromptFromTemplate(template, dreamscape, styleVariantId)
  → injects styleModifier, selfCheckRubric, fewShotExcerpt into prompt
  ↓
generateOutputs() [OpenAI API]
  ↓
Output review → Rate & Save
  ↓
localStorage.setItem('sg_outputs', ...)
```

### Power User Generation Flow
```
chunks + dialState
  ↓
generateOutputs() [OpenAI API]
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

### Template-Aware Seed Generation Flow
```
User clicks "Generate Seeds" with template selected
  ↓
API receives seedPrompt from template (if available)
  ↓
openai.generateDreamscapes({ seedPrompt, count })
  → uses template.seedPrompt.system + .user instead of generic prompt
  ↓
Platform-specific seeds returned (e.g., AITAH seeds = interpersonal conflicts)
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
