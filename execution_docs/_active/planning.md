# Planning: Prompt Inspector (Developer Debug Tool)

**Date**: 2026-02-27
**Task**: Add live prompt inspector for debugging AI prompts across Create workflow
**Priority**: P2 - Developer Experience Enhancement
**Estimated Effort**: 4-5 hours

## Problem Statement

Need real-time visibility into the exact prompts being sent to the API at each stage of the Create workflow to:
- Debug why certain outputs don't match expectations
- Understand how intensity dials affect prompting
- Verify prompt structure before implementation
- Optimize prompt engineering iteratively

## Requirements

### Scope: What to Inspect
1. **Preset Tab** (Step 0): Show prompt structure for selected preset + platform + format + **advanced settings** (intensity dials, genres, tone, word count)
2. **Generate Tab** (Step 1): Initial dreamscape generation prompt
3. **Enhance Tab** (Step 2): Enhancement goal prompts (vivid, conflict, etc.) + stitching
4. **Output Tab** (Step 3): Final story generation prompt with all dials applied

### Behavior: Live Updates
- Updates **in real-time** as user adjusts:
  - Preset selection
  - Platform/format dropdowns
  - Intensity dial sliders
  - Genre/tone selections
  - Word count input
  - Enhancement goal selection
- Shows **preview of what would be sent** (before clicking Generate)
- Shows **actual prompt sent** after Generate is clicked

### Display Format: Structured Prompt Chain

Each prompt broken into expandable sections:

```
[System Prompt] ▼
  You are a creative story generator optimized for {platform}...

  Variables:
    platform: "reddit"
    format: "reddit-post"
    tone: "narrative"

[User Prompt] ▼
  Generate a story seed based on: "{user_input}"

  Variables:
    user_input: "My neighbor stole my wifi..."
    word_count: 800
    intensity_stakes: 7
    intensity_darkness: 5
    genres: ["Drama", "Thriller"]

[Assistant Prefix] ▼
  (Optional preset response starter)

[Final Instruction] ▼
  Variables:
    enhancement_goal: "vivid"
    avoid_phrases: ["It's worth noting", "Little did I know"]
```

### Feature Flag: Standardized Architecture

**Approach**: All feature flags defined and controlled in Settings

**Current Implementation** (localStorage only):
- Settings page has toggles for all feature flags
- Stored in `sg_settings` object
- Each flag has clear label + description

**Future Implementation** (with backend auth):
- Backend determines which flags are available based on user role
- Normal users: "Power User Mode" toggle (more controls vs simplified UI)
- Admin users: "Power User Mode" + "Developer Mode" toggles
- Settings page conditionally shows flags based on `user.role`

**Benefits**:
- Single source of truth for feature flags (Settings)
- No URL param conditionals to maintain
- Easy role-based flag management when auth is added
- Clean separation: UI reads from settings, backend controls availability

**Developer Mode Flag**:
```javascript
// Settings schema (current)
{
  developerMode: false,  // Show prompt inspector
  powerUserMode: false,  // (Future) Show advanced controls
  ...
}

// Settings page (future with auth)
{user?.isAdmin && (
  <label>
    <input type="checkbox" checked={settings.developerMode} ... />
    Developer Mode
  </label>
)}
```

### UX: Bottom Drawer (Resizable)

**Layout**:
- **Trigger Button**: Fixed bottom-right corner
  - Icon: 🔍 or <Code /> icon
  - Text: "Prompt Inspector"
  - Badge showing current step (Preset/Generate/Enhance/Output)
  - Only visible when `isDevMode === true`

- **Drawer**: Slides up from bottom (similar to browser DevTools)
  - Default height: 40% of viewport
  - Min height: 200px
  - Max height: 80% of viewport
  - **Resizable**: Drag handle at top edge
  - **Scrollable**: Vertical scroll for long prompts
  - **Collapsible**: Click drag handle or X button to close

**Drawer Content Structure**:
```
┌─────────────────────────────────────────────────┐
│ ≡≡≡ Prompt Inspector  [Collapse] [Copy All]    │ ← Drag handle
├─────────────────────────────────────────────────┤
│ 📍 Current Step: Generate (Step 1)              │
│                                                 │
│ [System Prompt] ▼                               │ ← Expandable
│   You are a creative story generator...         │
│   [Variables ▼]                                 │ ← Nested expandable
│     platform: "reddit"                          │
│     format: "reddit-post"                       │
│                                                 │
│ [User Prompt] ▼                                 │
│   Generate 3 story seeds based on...           │
│   [Variables ▼]                                 │
│     count: 3                                    │
│     vibe: "dark"                                │
│     ...                                         │
│                                                 │
│ [Copy This Prompt]                              │
└─────────────────────────────────────────────────┘
```

## Technical Implementation

### Phase 1: Feature Flag Infrastructure (30 min)

**Files to modify**:
1. **Settings State** (AppContext):
   ```javascript
   // In AppProvider initialization
   const [settings, setSettings] = useState(() => loadFromStorage("sg_settings", {
     defaultPreset: "reddit-aitah",
     avoidPhrases: [...],
     autoAvoidAI: true,
     developerMode: false, // NEW
   }))
   ```

2. **SettingsPage Component**:
   ```javascript
   // Add toggle in SettingsPage
   <label className="...">
     <input
       type="checkbox"
       checked={settings.developerMode}
       onChange={(e) => setSettings({ ...settings, developerMode: e.target.checked })}
     />
     Developer Mode
   </label>
   <p className="text-xs text-slate-500 mt-1">
     Show prompt inspector for debugging API prompts
   </p>
   ```

3. **Pass developerMode to CreatePage** (in StoryGeneratorApp):
   ```javascript
   // Simply read from settings and pass to CreatePage
   <CreatePage isDevMode={settings.developerMode} />
   ```

### Phase 2: Prompt Builder Functions (1.5 hours)

Create utility functions that mirror the mock API layer but return prompt strings:

**New section after MOCK API LAYER** (~line 193):

```javascript
// ============================================================
// PROMPT BUILDERS (for inspector)
// ============================================================

function buildPresetPrompt({ preset, platform, format, intensity, genres, tone, wordCount }) {
  const systemPrompt = `You are a creative story generator optimized for ${platform}.`

  const userPrompt = `Preview of story generation settings:

Preset: ${preset.name} (${preset.subtitle})
Platform: ${platform}
Format: ${format}
Word Count: ~${wordCount} words
Tone: ${tone}
Genres: ${genres.length > 0 ? genres.join(', ') : 'Not specified'}

Intensity settings (from advanced options):
${Object.entries(intensity).map(([k, v]) => `  ${DIALS[k].label}: ${v}/10`).join('\n')}

This prompt will be used when you click "Generate" in Step 1.`

  return {
    messages: [
      { role: 'system', content: systemPrompt, variables: { platform } },
      { role: 'user', content: userPrompt, variables: {
        preset: preset.name,
        platform,
        format,
        intensity,
        genres,
        tone,
        wordCount
      }},
    ],
    fullPrompt: `${systemPrompt}\n\n${userPrompt}`
  }
}

function buildDreamscapePrompt({ count, vibe, intensity, platform, format }) {
  const systemPrompt = `You are a creative story generator optimized for ${platform}.`

  const userPrompt = `Generate ${count} unique story seeds with a ${vibe} vibe.

Platform: ${platform}
Format: ${format}
Intensity settings:
${Object.entries(intensity).map(([k, v]) => `  ${k}: ${v}/10`).join('\n')}

Return engaging, platform-optimized story seeds.`

  return {
    messages: [
      { role: 'system', content: systemPrompt, variables: { platform } },
      { role: 'user', content: userPrompt, variables: { count, vibe, intensity, platform, format } },
    ],
    fullPrompt: `${systemPrompt}\n\n${userPrompt}`
  }
}

function buildEnhancementPrompt({ chunks, goalPreset, intensity, avoidPhrases }) {
  const systemPrompt = `You are a story enhancement specialist.`

  const enhancementGoals = {
    vivid: "Add vivid sensory details and imagery",
    conflict: "Introduce or heighten conflict",
    believable: "Make the story more grounded and believable",
    stitch: "Combine multiple chunks into a cohesive narrative",
    "less-ai": "Remove AI-sounding phrases and make it more human"
  }

  const userPrompt = `Enhancement goal: ${enhancementGoals[goalPreset]}

Story chunks to enhance:
${chunks.map((c, i) => `Chunk ${i + 1}:\n${c.text}`).join('\n\n---\n\n')}

Avoid these phrases: ${avoidPhrases.join(', ')}

Apply intensity settings:
${Object.entries(intensity).map(([k, v]) => `  ${k}: ${v}/10`).join('\n')}`

  return {
    messages: [
      { role: 'system', content: systemPrompt, variables: {} },
      { role: 'user', content: userPrompt, variables: { goalPreset, chunkCount: chunks.length, intensity, avoidPhrases } },
    ],
    fullPrompt: `${systemPrompt}\n\n${userPrompt}`
  }
}

function buildOutputPrompt({ dreamscape, intensity, platform, format, wordCount, tone, genres, avoidPhrases }) {
  const systemPrompt = `You are a master storyteller creating ${platform} content.`

  const userPrompt = `Create a ${wordCount}-word story for ${platform} (${format} format).

Story seed:
${dreamscape.chunks.map(c => c.text).join('\n\n')}

Genre(s): ${genres.join(', ')}
Tone: ${tone}
Word count: ~${wordCount} words

Intensity settings:
${Object.entries(intensity).map(([k, v]) => `  ${DIALS[k].label}: ${v}/10`).join('\n')}

Avoid these phrases: ${avoidPhrases.join(', ')}

Generate 3 variants:
1. Balanced (as-is)
2. More Intense (dial everything up)
3. More Believable (more grounded, realistic)`

  return {
    messages: [
      { role: 'system', content: systemPrompt, variables: { platform } },
      { role: 'user', content: userPrompt, variables: {
        dreamscape: dreamscape.id,
        intensity,
        platform,
        format,
        wordCount,
        tone,
        genres,
        avoidPhrases,
        variantCount: 3
      }},
    ],
    fullPrompt: `${systemPrompt}\n\n${userPrompt}`
  }
}
```

### Phase 3: PromptInspector Component (2 hours)

**New component after UI COMPONENTS section** (~line 300):

```javascript
// ============================================================
// PROMPT INSPECTOR (Developer Tool)
// ============================================================

function PromptInspector({ isOpen, onClose, promptData }) {
  const drawerRef = useRef(null)
  const [height, setHeight] = useState(40) // percentage
  const [isDragging, setIsDragging] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e) => {
      const viewportHeight = window.innerHeight
      const newHeight = ((viewportHeight - e.clientY) / viewportHeight) * 100
      setHeight(Math.min(80, Math.max(20, newHeight)))
    }

    const handleMouseUp = () => setIsDragging(false)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  if (!isOpen) return null

  return (
    <div
      ref={drawerRef}
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 z-50 flex flex-col"
      style={{ height: `${height}vh` }}
    >
      {/* Drag Handle */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 cursor-ns-resize select-none"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">≡≡≡</span>
          <span className="font-semibold text-sm">🔍 Prompt Inspector</span>
          {promptData?.step && (
            <span className="text-xs text-slate-400">
              ({promptData.step})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => copyToClipboard(promptData?.fullPrompt || '')}
            className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 rounded"
          >
            Copy All
          </button>
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 text-sm">
        {!promptData ? (
          <div className="text-slate-400 text-center py-8">
            No prompt data available. Adjust settings or generate content to see prompts.
          </div>
        ) : (
          <div className="space-y-4">
            {promptData.messages?.map((msg, idx) => (
              <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <button
                  onClick={() => toggleSection(`msg-${idx}`)}
                  className="flex items-center gap-2 w-full text-left font-medium mb-2"
                >
                  {expandedSections[`msg-${idx}`] ? <I.ChevDown className="w-4 h-4" /> : <I.ChevRight className="w-4 h-4" />}
                  <span className="text-indigo-400">
                    [{msg.role === 'system' ? 'System Prompt' : msg.role === 'user' ? 'User Prompt' : 'Assistant'}]
                  </span>
                </button>

                {expandedSections[`msg-${idx}`] && (
                  <div className="ml-6 space-y-2">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap bg-slate-900 p-2 rounded">
                      {msg.content}
                    </pre>

                    {msg.variables && Object.keys(msg.variables).length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleSection(`vars-${idx}`)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300"
                        >
                          {expandedSections[`vars-${idx}`] ? <I.ChevDown className="w-3 h-3" /> : <I.ChevRight className="w-3 h-3" />}
                          Variables
                        </button>

                        {expandedSections[`vars-${idx}`] && (
                          <div className="ml-4 mt-1 space-y-1">
                            {Object.entries(msg.variables).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="text-emerald-400">{key}:</span>{' '}
                                <span className="text-slate-300">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Phase 4: Integration into CreatePage (1 hour)

**Modifications to CreatePage component**:

1. **Add state for prompt data**:
   ```javascript
   const [inspectorPromptData, setInspectorPromptData] = useState(null)
   const [inspectorOpen, setInspectorOpen] = useState(false)
   ```

2. **Update prompts live as settings change**:
   ```javascript
   // Add effect to rebuild prompt when any setting changes
   useEffect(() => {
     if (!isDevMode) return

     if (step === 0) {
       // Preset tab - show preview with advanced settings
       setInspectorPromptData({
         step: 'Preset (Setup)',
         ...buildPresetPrompt({
           preset: currentPreset || PRESETS[0],
           platform: selectedPlatform,
           format: selectedFormat,
           intensity: dialState,
           genres: selectedGenres,
           tone: currentPreset?.tone || 'narrative',
           wordCount: currentPreset?.wordCount || 800
         })
       })
     } else if (step === 1) {
       setInspectorPromptData({
         step: 'Generate (Step 1)',
         ...buildDreamscapePrompt({
           count: 3,
           vibe: currentPreset?.name || 'balanced',
           intensity: dialState,
           platform: selectedPlatform,
           format: selectedFormat
         })
       })
     } else if (step === 2 && selectedGoal) {
       setInspectorPromptData({
         step: 'Enhance (Step 2)',
         ...buildEnhancementPrompt({
           chunks: currentDreamscape?.chunks || [],
           goalPreset: selectedGoal,
           intensity: dialState,
           avoidPhrases: settings.avoidPhrases
         })
       })
     } else if (step === 3) {
       setInspectorPromptData({
         step: 'Output (Step 3)',
         ...buildOutputPrompt({
           dreamscape: currentDreamscape,
           intensity: dialState,
           platform: selectedPlatform,
           format: selectedFormat,
           wordCount: currentPreset?.wordCount || 800,
           tone: currentPreset?.tone || 'narrative',
           genres: selectedGenres,
           avoidPhrases: settings.avoidPhrases
         })
       })
     }
   }, [step, dialState, selectedPlatform, selectedFormat, selectedGoal, currentDreamscape, selectedGenres, currentPreset, settings.avoidPhrases, isDevMode])
   ```

3. **Add floating trigger button** (in CreatePage return):
   ```javascript
   {isDevMode && (
     <button
       onClick={() => setInspectorOpen(!inspectorOpen)}
       className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-40"
     >
       🔍 Prompt Inspector
       {step > 0 && (
         <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded">
           Step {step}
         </span>
       )}
     </button>
   )}

   <PromptInspector
     isOpen={inspectorOpen && isDevMode}
     onClose={() => setInspectorOpen(false)}
     promptData={inspectorPromptData}
   />
   ```

## Implementation Checklist

### Phase 1: Feature Flag Infrastructure ✅
- [ ] Add `developerMode: false` to settings default
- [ ] Add toggle in SettingsPage component
- [ ] Test: Toggle in Settings persists
- [ ] Test: Inspector appears when enabled

### Phase 2: Prompt Builder Functions ✅
- [ ] Create `buildPresetPrompt()` (includes advanced settings)
- [ ] Create `buildDreamscapePrompt()`
- [ ] Create `buildEnhancementPrompt()`
- [ ] Create `buildOutputPrompt()`
- [ ] Add after MOCK API LAYER section
- [ ] Test: Functions return correct structure

### Phase 3: PromptInspector Component ✅
- [ ] Create base component with drawer UI
- [ ] Implement resize drag handle
- [ ] Implement expandable sections
- [ ] Implement copy-to-clipboard
- [ ] Style with proper spacing/colors
- [ ] Test: Drawer resizes smoothly
- [ ] Test: Sections expand/collapse
- [ ] Test: Copy buttons work

### Phase 4: Integration into CreatePage ✅
- [ ] Add `inspectorPromptData` state
- [ ] Add `inspectorOpen` state
- [ ] Add `useEffect` to rebuild prompts on changes (all steps 0-3)
- [ ] Add floating trigger button
- [ ] Add `<PromptInspector />` component
- [ ] Pass `isDevMode` prop through components
- [ ] Test: Prompt updates live with dial changes
- [ ] Test: Button only shows when `isDevMode === true`
- [ ] Test: Preset tab (step 0) shows preview with advanced settings
- [ ] Test: Advanced settings (dials, genres) changes update prompt live

## Files to Modify

1. **GenAI Story Generator.jsx** (all changes in one file):
   - Line ~193: Add PROMPT BUILDERS section (buildPresetPrompt, buildDreamscapePrompt, buildEnhancementPrompt, buildOutputPrompt)
   - Line ~207: Modify AppProvider - add `developerMode: false` to settings default
   - Line ~300: Add PromptInspector component
   - Line ~325: Modify CreatePage component
     - Add `isDevMode` prop
     - Add state for inspector (inspectorPromptData, inspectorOpen)
     - Add useEffect for live updates (all steps 0-3)
     - Add trigger button (bottom-right corner)
     - Add PromptInspector component
   - Line ~973: Modify SettingsPage - add Developer Mode toggle
   - Line ~1029: Modify StoryGeneratorApp
     - Pass `settings.developerMode` as `isDevMode` prop to CreatePage

## Testing Strategy

### Feature Flag Tests:
1. Default state: Inspector hidden
2. Enable in Settings: Inspector appears
3. Disable in Settings: Inspector disappears
4. Setting persists across page reloads

### Prompt Building Tests:

**Preset Tab (Step 0) - Critical for debugging**:
1. Preset selection: Shows correct preset prompt
2. Platform change: Prompt reflects new platform
3. Format change: Prompt reflects new format
4. **Intensity dial adjustment**: Prompt updates with new dial values in real-time
5. **Genre selection**: Prompt shows selected genres
6. **Tone change**: Prompt reflects new tone
7. **Word count change**: Prompt reflects new word count

**Generate Tab (Step 1)**:
1. Shows dreamscape generation prompt
2. Reflects preset settings from step 0

**Enhance Tab (Step 2)**:
1. Enhancement goal selection: Shows goal-specific prompt
2. Stitching: Shows stitching prompt with all chunks

**Output Tab (Step 3)**:
1. Shows full output generation prompt with all dials applied
2. Includes avoid phrases from settings

### UX Tests:
1. Drawer opens/closes smoothly
2. Resize handle works (drag up/down)
3. Min/max height constraints respected
4. Sections expand/collapse correctly
5. Variables show correct values
6. Copy buttons work
7. Scrolling works for long prompts
8. Doesn't block main workflow

## Success Criteria

✅ Developer can enable inspector via Settings or URL param
✅ Inspector shows real-time prompt updates as dials adjust
✅ Prompt chain clearly shows system/user/assistant messages
✅ Variables displayed in expandable sections
✅ Drawer is resizable and scrollable
✅ Copy-to-clipboard works for full prompt and sections
✅ Non-intrusive: doesn't block main Create workflow
✅ Feature flag can be easily swapped to `user.isAdmin` later

---

**Ready for approval**
