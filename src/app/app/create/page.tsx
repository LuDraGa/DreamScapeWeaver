'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { ThemedCard } from '@/components/design-system/themed-card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/design-system/skeleton'
import { Toast } from '@/components/design-system/toast'
import { PlusIcon, WandIcon, Wand2Icon, SparklesIcon, SaveIcon, XIcon, ChevronDownIcon, ChevronUpIcon, RefreshCwIcon, DownloadIcon, Star } from '@/components/icons'

const ENHANCEMENT_GOALS = [
  { id: 'vivid', label: 'Add vividness', icon: '🎨' },
  { id: 'conflict', label: 'Add conflict', icon: '⚔️' },
  { id: 'believable', label: 'Make it more believable', icon: '🎯' },
  { id: 'stitch', label: 'Stitch chunks together', icon: '🧵' },
  { id: 'less-ai', label: 'Make it less AI-ish', icon: '🤖' },
]

const FEEDBACK_CHIPS = [
  { id: 'hook-strong', label: 'Hook strong', positive: true },
  { id: 'hook-weak', label: 'Hook weak', positive: false },
  { id: 'natural', label: 'Natural', positive: true },
  { id: 'too-ai', label: 'Too AI', positive: false },
  { id: 'cohesion-strong', label: 'Cohesion strong', positive: true },
  { id: 'cohesion-weak', label: 'Cohesion weak', positive: false },
  { id: 'twist-good', label: 'Twist unpredictable', positive: true },
  { id: 'twist-predictable', label: 'Twist predictable', positive: false },
  { id: 'pace-good', label: 'Pace good', positive: true },
  { id: 'pace-fast', label: 'Pace fast', positive: false },
]
import { uid } from '@/lib/utils'
import { api } from '@/lib/api'
import { PRESETS, DIALS, PLATFORMS, OUTPUT_FORMATS, TONES, GENRES } from '@/lib/config'
import type { Dreamscape, DialState, IntensityValues } from '@/lib/types'
import { LabeledSlider } from '@/components/design-system/labeled-slider'
import { CopyButton } from '@/components/design-system/copy-button'
import { PromptInspector } from '@/components/dev-tools/prompt-inspector'
import {
  buildPresetPrompt,
  buildDreamscapePrompt,
  buildEnhancementPrompt,
  buildOutputPrompt,
  type PromptData,
} from '@/lib/prompt-builders'

/**
 * Helper: Randomize intensity values (1-10) for dreamscape generation
 */
function randomizeIntensity(): IntensityValues {
  return {
    stakes: Math.floor(Math.random() * 10) + 1,
    darkness: Math.floor(Math.random() * 10) + 1,
    pace: Math.floor(Math.random() * 10) + 1,
    twist: Math.floor(Math.random() * 10) + 1,
    realism: Math.floor(Math.random() * 10) + 1,
    catharsis: Math.floor(Math.random() * 10) + 1,
    moralClarity: Math.floor(Math.random() * 10) + 1,
  }
}

/**
 * Create Page - 4-step story generation workflow
 */
export default function CreatePage() {
  const { currentDreamscape, setCurrentDreamscape, saveDreamscape, settings } = useAppStore()

  // Step management
  const [step, setStep] = useState(0)
  const steps = [
    { label: 'Dreamscape', s: 'A' },
    { label: 'Platform & Style', s: 'B' },
    { label: 'Generate', s: 'C' },
    { label: 'Rate & Save', s: 'D' },
  ]

  // Dreamscape state (Step A)
  const [chunks, setChunks] = useState(
    currentDreamscape?.chunks || [{ id: uid(), title: '', text: '' }]
  )
  const [showGenPanel, setShowGenPanel] = useState(false)
  const [showMergeView, setShowMergeView] = useState(false)
  const [showEnhanceDrawer, setShowEnhanceDrawer] = useState(false)
  const [enhanceGoal, setEnhanceGoal] = useState<string>('')
  const [customEnhanceGoal, setCustomEnhanceGoal] = useState<string>('')
  const [enhancing, setEnhancing] = useState(false)
  const [enhanceResult, setEnhanceResult] = useState<any>(null)
  const [genVibe, setGenVibe] = useState('')
  const [genCount, setGenCount] = useState(3)
  const [genLoading, setGenLoading] = useState(false)
  const [genResults, setGenResults] = useState<Dreamscape[]>([])
  const [genIntensity, setGenIntensity] = useState<IntensityValues>(() => randomizeIntensity())
  const [showGenAdvanced, setShowGenAdvanced] = useState(false)

  // Preset state (Step B)
  const [selectedPreset, setSelectedPreset] = useState(settings.defaultPreset)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Initialize dialState from selected preset
  const getInitialDialState = (): DialState => {
    const preset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0]
    return {
      presetId: preset.id,
      platform: preset.platform,
      outputFormat: preset.outputFormat,
      wordCount: preset.wordCount,
      tone: preset.tone,
      intensity: preset.intensity,
      avoidPhrases: settings.avoidPhrases,
      cohesionStrictness: 5,
    }
  }

  const [dialState, setDialState] = useState<DialState>(getInitialDialState())

  // Generate state (Step C)
  const [generating, setGenerating] = useState(false)
  const [generatedOutputs, setGeneratedOutputs] = useState<any[]>([])

  // Rate & Save state (Step D)
  const [activeVariant, setActiveVariant] = useState(0)
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [feedback, setFeedback] = useState<Record<number, string[]>>({})
  const [notes, setNotes] = useState<Record<number, string>>({})

  // UI state
  const [toast, setToast] = useState('')

  // Prompt Inspector state (Developer Mode)
  const [inspectorPromptData, setInspectorPromptData] = useState<PromptData | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  // ============================================================
  // Prompt Inspector: Live Prompt Updates
  // ============================================================

  useEffect(() => {
    if (!settings.developerMode) return

    const currentPreset = PRESETS.find((p) => p.id === dialState.presetId) || PRESETS[0]
    const genres = dialState.genres || []

    // Enhancement prompts (highest priority - when enhance drawer is open)
    if (showEnhanceDrawer && enhanceGoal && chunks.length > 0) {
      setInspectorPromptData(
        buildEnhancementPrompt({
          chunks,
          goalPreset: enhanceGoal,
          customGoal: customEnhanceGoal,
          intensity: dialState.intensity,
          avoidPhrases: dialState.avoidPhrases,
        })
      )
    }
    // Step 0: Dreamscape - Show generation prompt when Gen panel is open
    else if (step === 0 && showGenPanel) {
      console.log('📊 Prompt Inspector updating with genIntensity:', genIntensity)
      setInspectorPromptData(
        buildDreamscapePrompt({
          count: genCount,
          vibe: genVibe,
          intensity: genIntensity,
        })
      )
    }
    // Step 0: Dreamscape - Show chunk preview (default)
    else if (step === 0 && chunks.length > 0) {
      const systemPrompt = `You are viewing the Dreamscape step.`
      const userPrompt = `Current dreamscape chunks:

${chunks.map((c, i) => `Chunk ${i + 1}:
${c.title ? `Title: ${c.title}` : '(No title)'}
${c.text ? `Text: ${c.text}` : '(No text yet)'}`).join('\n\n')}

Total chunks: ${chunks.length}

Next step: Select a preset and configure advanced settings.`

      setInspectorPromptData({
        step: 'Dreamscape (Step 0)',
        messages: [
          { role: 'system', content: systemPrompt, variables: {} },
          {
            role: 'user',
            content: userPrompt,
            variables: { chunkCount: chunks.length, chunks: chunks.map((c) => ({ title: c.title, text: c.text })) },
          },
        ],
        fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
      })
    }
    // Step 1: Preset + Advanced Settings
    else if (step === 1) {
      setInspectorPromptData(
        buildPresetPrompt({
          preset: currentPreset,
          platform: dialState.platform,
          format: dialState.outputFormat,
          intensity: dialState.intensity,
          genres,
          tone: dialState.tone,
          wordCount: dialState.wordCount,
        })
      )
    }
    // Step 2: Generate (show output generation preview)
    else if (step === 2 && chunks.length > 0) {
      const dreamscape = { id: uid(), chunks }
      setInspectorPromptData(
        buildOutputPrompt({
          dreamscape,
          intensity: dialState.intensity,
          platform: dialState.platform,
          format: dialState.outputFormat,
          wordCount: dialState.wordCount,
          tone: dialState.tone,
          genres,
          avoidPhrases: dialState.avoidPhrases,
        })
      )
    }
    // Step 3: Rate & Save (show output generation prompt)
    else if (step === 3 && chunks.length > 0) {
      const dreamscape = { id: uid(), chunks }
      setInspectorPromptData(
        buildOutputPrompt({
          dreamscape,
          intensity: dialState.intensity,
          platform: dialState.platform,
          format: dialState.outputFormat,
          wordCount: dialState.wordCount,
          tone: dialState.tone,
          genres,
          avoidPhrases: dialState.avoidPhrases,
        })
      )
    }
  }, [step, dialState, enhanceGoal, customEnhanceGoal, chunks, settings.developerMode, showGenPanel, showEnhanceDrawer, genVibe, genCount, genIntensity])

  // ============================================================
  // Step A: Dreamscape handlers
  // ============================================================

  const updateChunk = (id: string, field: 'title' | 'text', value: string) => {
    setChunks((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const addChunk = () => {
    setChunks((prev) => [...prev, { id: uid(), title: '', text: '' }])
  }

  const removeChunk = (id: string) => {
    if (chunks.length === 1) return
    setChunks((prev) => prev.filter((c) => c.id !== id))
  }

  const moveChunkUp = (index: number) => {
    if (index === 0) return
    setChunks((prev) => {
      const newChunks = [...prev]
      ;[newChunks[index - 1], newChunks[index]] = [newChunks[index], newChunks[index - 1]]
      return newChunks
    })
  }

  const moveChunkDown = (index: number) => {
    if (index === chunks.length - 1) return
    setChunks((prev) => {
      const newChunks = [...prev]
      ;[newChunks[index], newChunks[index + 1]] = [newChunks[index + 1], newChunks[index]]
      return newChunks
    })
  }

  const handleGenerateDreamscapes = async () => {
    // Only randomize intensity for non-power users
    // Power users manually control intensity via advanced controls
    if (!settings.powerUserMode) {
      const randomizedIntensity = randomizeIntensity()
      console.log('🎲 Randomized intensity (non-power user):', randomizedIntensity)
      setGenIntensity(randomizedIntensity)
    }

    setGenLoading(true)
    try {
      const results = await api.dreamscapes.generate({
        count: genCount,
        vibe: genVibe,
        intensity: genIntensity,
      })
      setGenResults(results)
      showToast(`Generated ${results.length} ideas!`)
    } catch (error) {
      showToast('Failed to generate ideas')
      console.error(error)
    } finally {
      setGenLoading(false)
    }
  }

  const handleUseGeneratedIdea = (dreamscape: Dreamscape) => {
    setChunks((prev) => {
      const firstChunk = prev[0]
      if (!firstChunk.text.trim()) {
        // Replace empty first chunk
        return [{ ...firstChunk, text: dreamscape.chunks[0].text }]
      }
      // Add as new chunk
      return [...prev, { id: uid(), title: '', text: dreamscape.chunks[0].text }]
    })
    setGenResults((prev) => prev.filter((d) => d.id !== dreamscape.id))
    showToast('Added to chunks')
  }

  const dismissGeneratedIdea = (id: string) => {
    setGenResults((prev) => prev.filter((d) => d.id !== id))
  }

  const handleSaveDreamscape = () => {
    const dreamscape = {
      id: currentDreamscape?.id || uid(),
      title: chunks[0].text.slice(0, 50) || 'Untitled',
      chunks,
      createdAt: currentDreamscape?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveDreamscape(dreamscape)
    setCurrentDreamscape(dreamscape)
    showToast('Saved to library!')
  }

  const handleEnhance = async () => {
    if (!enhanceGoal) return
    if (enhanceGoal === 'custom' && !customEnhanceGoal.trim()) {
      showToast('Please enter a custom enhancement goal')
      return
    }
    setEnhancing(true)
    try {
      const result = await api.dreamscapes.enhance({
        chunks,
        goalPreset: enhanceGoal as any,
        customGoal: customEnhanceGoal,
        intensity: genIntensity,
        avoidPhrases: dialState.avoidPhrases,
      })
      setEnhanceResult(result)
      if (result.promptData) {
        setInspectorPromptData(result.promptData)
      }
      showToast('Enhancement complete!')
    } catch (error) {
      showToast('Failed to enhance dreamscape')
      console.error(error)
    } finally {
      setEnhancing(false)
    }
  }

  const applyEnhancement = () => {
    if (enhanceResult?.enhancedChunks) {
      setChunks(enhanceResult.enhancedChunks)
    } else if (enhanceResult?.stitchedSeed) {
      setChunks([{ id: uid(), title: 'Stitched', text: enhanceResult.stitchedSeed }])
    }
    setEnhanceResult(null)
    setShowEnhanceDrawer(false)
    showToast('Enhancement applied')
  }

  // ============================================================
  // Step B: Preset handlers
  // ============================================================

  const selectPreset = (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[0]
    setDialState({
      presetId: preset.id,
      platform: preset.platform,
      outputFormat: preset.outputFormat,
      wordCount: preset.wordCount,
      tone: preset.tone,
      intensity: preset.intensity,
      genres: dialState.genres,
      avoidPhrases: dialState.avoidPhrases,
      cohesionStrictness: dialState.cohesionStrictness,
    })
  }

  const randomizeDialIntensity = () => {
    const preset = PRESETS.find((p) => p.id === selectedPreset)
    if (!preset) return

    const randomized = Object.fromEntries(
      Object.entries(preset.intensity).map(([key, value]) => [
        key,
        Math.max(1, Math.min(10, value + Math.floor(Math.random() * 5) - 2)),
      ])
    ) as unknown as IntensityValues

    setDialState((prev) => ({
      ...prev,
      intensity: randomized,
    }))
  }

  // ============================================================
  // Step C: Generate handlers
  // ============================================================

  const handleGenerateStory = async () => {
    // Auto-create dreamscape if it doesn't exist
    let dreamscape = currentDreamscape
    if (!dreamscape) {
      dreamscape = {
        id: uid(),
        title: chunks[0].text.slice(0, 50) || 'Untitled',
        chunks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setCurrentDreamscape(dreamscape)
    }

    setGenerating(true)
    try {
      const outputs = await api.outputs.generate({
        dreamscape,
        dialState,
      })

      setGeneratedOutputs(outputs)
      setActiveVariant(0)
      setRatings({})
      setFeedback({})
      setNotes({})
      showToast(`Generated ${outputs.length} variants!`)
      setStep(3) // Move to Rate & Save step
    } catch (error) {
      showToast('Failed to generate story')
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  // ============================================================
  // General
  // ============================================================

  const handleStartOver = () => {
    setStep(0)
    setChunks([{ id: uid(), title: '', text: '' }])
    setGenResults([])
    setGenVibe('')
    setShowGenPanel(false)
    setCurrentDreamscape(null)
    setGeneratedOutputs([])
    setActiveVariant(0)
    setRatings({})
    setFeedback({})
    setNotes({})
  }

  const canProceed = chunks.some((c) => c.text.trim().length > 10)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shrink-0"
            style={{
              background:
                step === i
                  ? '#6366f1'
                  : step > i
                    ? 'rgba(99,102,241,0.15)'
                    : 'rgba(30,41,59,0.5)',
              color: step === i ? '#fff' : step > i ? '#a5b4fc' : '#64748b',
              border: step === i ? '1px solid #818cf8' : '1px solid transparent',
            }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                background: step >= i ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
              }}
            >
              {step > i ? '✓' : s.s}
            </span>
            {s.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleStartOver}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ color: '#94a3b8', border: '1px solid #334155' }}
        >
          Start Over
        </button>
      </div>

      {/* STEP A: Dreamscape */}
      <div style={{ display: step === 0 ? 'block' : 'none' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Dreamscape</h2>
            <p className="text-sm text-text-muted">Your story seed(s)</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowGenPanel(!showGenPanel)}
              className="bg-transparent border-primary/30 text-primary-muted"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate Ideas
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEnhanceDrawer(true)}
              className="bg-transparent border-purple-500/30 text-purple-400"
            >
              <WandIcon className="w-4 h-4 mr-2" />
              Enhance
            </Button>
            <Button
              size="sm"
              onClick={handleSaveDreamscape}
              disabled={!canProceed}
              className="bg-primary hover:bg-primary-light text-white"
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Generate Ideas Panel */}
        {showGenPanel && (
          <ThemedCard className="mb-4 bg-primary/5 border-primary/20">
            <div className="flex items-end gap-3 mb-3 flex-wrap">
              <div className="flex-1 min-w-48">
                <label className="text-xs font-medium mb-1 block text-text-secondary">
                  Vibe (optional)
                </label>
                <Input
                  value={genVibe}
                  onChange={(e) => setGenVibe(e.target.value)}
                  placeholder="e.g. dark comedy, workplace drama..."
                  className="bg-[rgba(15,23,42,0.6)] border-[#334155] text-text-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-text-secondary">
                  Count
                </label>
                <Select
                  value={genCount.toString()}
                  onValueChange={(v) => setGenCount(Number(v))}
                >
                  <SelectTrigger className="w-20 bg-[rgba(15,23,42,0.6)] border-[#334155]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[rgba(15,23,42,0.95)] border-[#1e293b]">
                    {[1, 2, 3, 5, 10].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerateDreamscapes}
                disabled={genLoading}
                className="bg-primary hover:bg-primary-light text-white"
              >
                {genLoading ? 'Generating...' : 'Generate'}
              </Button>
            </div>

            {/* Advanced Intensity Controls (Power User Feature) */}
            <div
              data-advanced-feature="true"
              className={settings.powerUserMode ? 'mb-3' : 'hidden'}
            >
              <button
                onClick={() => setShowGenAdvanced(!showGenAdvanced)}
                className="flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors mb-2"
              >
                {showGenAdvanced ? (
                  <ChevronUpIcon className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                )}
                Advanced Intensity
              </button>

              {showGenAdvanced && (
                <div className="space-y-1.5 p-3 rounded-lg bg-[rgba(15,23,42,0.4)] border border-[#1e293b]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wide text-text-muted">
                      Manual Override
                    </span>
                    <button
                      onClick={() => setGenIntensity(randomizeIntensity())}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[rgba(30,41,59,0.6)] text-text-muted hover:text-text-primary border border-[#334155] transition-colors"
                    >
                      🎲 Randomize
                    </button>
                  </div>
                  <div className="grid gap-1.5">
                    {Object.entries(DIALS).map(([key, dial]) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="text-[10px] w-20 text-text-muted shrink-0">
                          {dial.label}
                        </label>
                        <input
                          type="range"
                          min={dial.min}
                          max={dial.max}
                          value={genIntensity[key as keyof IntensityValues]}
                          onChange={(e) =>
                            setGenIntensity((prev) => ({
                              ...prev,
                              [key]: Number(e.target.value),
                            }))
                          }
                          className="flex-1 h-1 bg-[rgba(30,41,59,0.6)] rounded-lg appearance-none cursor-pointer accent-primary"
                          style={{ maxWidth: '20vw' }}
                        />
                        <span className="text-[10px] w-6 text-right text-text-muted font-mono">
                          {genIntensity[key as keyof IntensityValues]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {genLoading && (
              <div className="grid gap-2">
                {Array.from({ length: genCount }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            )}

            {genResults.length > 0 && !genLoading && (
              <div className="grid gap-2 max-h-72 overflow-y-auto">
                {genResults.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-lg flex gap-3 group bg-[rgba(15,23,42,0.6)] border border-[#1e293b]"
                  >
                    <p className="text-sm flex-1 text-text-secondary">{d.chunks[0]?.text}</p>
                    <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleUseGeneratedIdea(d)}
                        className="px-2 py-1 rounded text-xs font-medium bg-primary text-white hover:bg-primary-light"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => dismissGeneratedIdea(d.id)}
                        className="px-2 py-1 rounded text-xs text-text-muted hover:text-text-primary"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ThemedCard>
        )}

        {/* Merge View Button */}
        {chunks.length > 1 && (
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMergeView(!showMergeView)}
              className="bg-transparent border-[#1e293b] text-text-secondary"
            >
              {showMergeView ? <ChevronUpIcon className="w-4 h-4 mr-2" /> : <ChevronDownIcon className="w-4 h-4 mr-2" />}
              {showMergeView ? 'Hide' : 'Show'} Merged View
            </Button>
          </div>
        )}

        {/* Merge View */}
        {showMergeView && chunks.length > 1 && (
          <ThemedCard className="mb-4 bg-[rgba(30,41,59,0.5)] border-[#334155]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-secondary">Combined Preview (read-only)</span>
              <CopyButton text={chunks.map((c) => c.text).join('\n\n---\n\n')} />
            </div>
            <p className="text-sm whitespace-pre-wrap text-text-secondary">
              {chunks.map((c) => c.text).join('\n\n---\n\n')}
            </p>
          </ThemedCard>
        )}

        {/* Chunks */}
        <div className="space-y-4 mb-6">
          {chunks.map((chunk, index) => (
            <ThemedCard key={chunk.id}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-secondary">
                  Part {index + 1}
                </label>
                <div className="flex items-center gap-1">
                  {/* Reorder buttons */}
                  {chunks.length > 1 && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveChunkUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0 text-text-muted hover:text-text-primary disabled:opacity-30"
                      >
                        <ChevronUpIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveChunkDown(index)}
                        disabled={index === chunks.length - 1}
                        className="h-6 w-6 p-0 text-text-muted hover:text-text-primary disabled:opacity-30"
                      >
                        <ChevronDownIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {/* Remove button */}
                  {chunks.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeChunk(chunk.id)}
                      className="h-6 text-xs text-text-muted hover:text-text-primary"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                value={chunk.text}
                onChange={(e) => updateChunk(chunk.id, 'text', e.target.value)}
                placeholder="Enter your story seed... (e.g., 'A middle-aged accountant discovers...')"
                className="min-h-[120px] bg-[rgba(15,23,42,0.5)] border-[#1e293b] text-text-primary placeholder:text-text-muted"
              />
            </ThemedCard>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addChunk}
            className="w-full bg-transparent border-[#1e293b] text-text-secondary hover:text-text-primary"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Another Part
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex justify-end">
          <Button
            onClick={() => {
              if (canProceed) setStep(1)
              else showToast('Please enter a story seed first')
            }}
            className="bg-primary hover:bg-primary-light text-white"
          >
            Next: Platform & Style
          </Button>
        </div>

        {/* Enhance Drawer */}
        {showEnhanceDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowEnhanceDrawer(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" />
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md h-full overflow-y-auto p-6 bg-[#0f172a] border-l border-[#1e293b] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-text-primary">Enhance Dreamscape</h3>
                <button onClick={() => setShowEnhanceDrawer(false)} className="text-text-muted hover:text-text-primary">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm mb-4 text-text-secondary">Pick an enhancement goal:</p>
              <div className="grid gap-2 mb-6">
                {ENHANCEMENT_GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setEnhanceGoal(g.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all"
                    style={{
                      background: enhanceGoal === g.id ? 'rgba(99,102,241,0.15)' : 'rgba(30,41,59,0.5)',
                      color: enhanceGoal === g.id ? '#a5b4fc' : '#cbd5e1',
                      border: enhanceGoal === g.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid #1e293b',
                    }}
                  >
                    <span className="text-lg">{g.icon}</span> {g.label}
                  </button>
                ))}
                {settings.powerUserMode && (
                  <button
                    onClick={() => setEnhanceGoal('custom')}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all"
                    style={{
                      background: enhanceGoal === 'custom' ? 'rgba(99,102,241,0.15)' : 'rgba(30,41,59,0.5)',
                      color: enhanceGoal === 'custom' ? '#a5b4fc' : '#cbd5e1',
                      border: enhanceGoal === 'custom' ? '1px solid rgba(99,102,241,0.3)' : '1px solid #1e293b',
                    }}
                  >
                    <span className="text-lg">✨</span> Custom enhancement
                  </button>
                )}
              </div>
              {enhanceGoal === 'custom' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Custom Enhancement Goal
                  </label>
                  <textarea
                    value={customEnhanceGoal}
                    onChange={(e) => setCustomEnhanceGoal(e.target.value)}
                    placeholder="e.g., Add more humor and wit to the dialogue"
                    className="w-full px-3 py-2 bg-surface-secondary border border-border-primary rounded-lg text-sm text-text-primary placeholder:text-text-muted resize-none"
                    rows={3}
                  />
                </div>
              )}
              <Button
                onClick={handleEnhance}
                disabled={!enhanceGoal || enhancing}
                className="w-full mb-4"
                style={{
                  background: enhanceGoal ? '#6366f1' : '#1e293b',
                  color: enhanceGoal ? '#fff' : '#475569',
                }}
              >
                {enhancing ? 'Enhancing...' : 'Apply Enhancement'}
              </Button>
              {enhancing && (
                <div className="mt-4">
                  <Skeleton className="h-32 w-full" />
                </div>
              )}
              {enhanceResult && (
                <div className="mt-4 space-y-3">
                  <ThemedCard className="bg-green-500/10 border-green-500/20">
                    <span className="text-xs font-medium mb-1 block text-green-500">Enhanced Preview</span>
                    <p className="text-sm whitespace-pre-wrap text-text-secondary">
                      {enhanceResult.stitchedSeed ||
                        enhanceResult.enhancedChunks?.map((c: any) => c.text).join('\n\n---\n\n')}
                    </p>
                  </ThemedCard>
                  <div className="flex gap-2">
                    <Button onClick={applyEnhancement} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      Accept
                    </Button>
                    <Button
                      onClick={() => setEnhanceResult(null)}
                      variant="outline"
                      className="flex-1 bg-transparent border-[#1e293b] text-text-secondary"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STEP B: Platform & Style */}
      <div style={{ display: step === 1 ? 'block' : 'none' }}>
        <h2 className="text-lg font-semibold mb-1 text-text-primary">Platform & Style</h2>
        <p className="text-sm mb-5 text-text-muted">
          Choose a preset to set the vibe for your story. Tweak details in Advanced.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {PRESETS.map((preset) => (
            <ThemedCard
              key={preset.id}
              onClick={() => selectPreset(preset.id)}
              className={`cursor-pointer transition-all ${
                selectedPreset === preset.id
                  ? 'border-primary bg-primary/10'
                  : 'border-[#1e293b] hover:border-[#334155]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{preset.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-text-primary mb-0.5">{preset.name}</h3>
                  <p className="text-xs text-text-muted">{preset.subtitle}</p>
                </div>
              </div>
            </ThemedCard>
          ))}
        </div>

        {/* Advanced Options */}
        <ThemedCard className="mb-6 overflow-hidden border-[#1e293b]">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-[rgba(15,23,42,0.5)] text-text-secondary hover:text-text-primary transition-colors"
          >
            <span>Advanced Options</span>
            {showAdvanced ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="p-4 space-y-5 bg-[rgba(15,23,42,0.3)]">
              {/* Word Count */}
              <LabeledSlider
                label="Word Count"
                value={dialState.wordCount}
                onChange={(v) => setDialState((s) => ({ ...s, wordCount: v }))}
                min={100}
                max={5000}
              />

              {/* Platform */}
              <div>
                <label className="text-xs font-medium mb-2 block text-text-secondary">Platform</label>
                <div className="flex gap-2 flex-wrap">
                  {PLATFORMS.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => setDialState((s) => ({ ...s, platform: pl.id as any }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: dialState.platform === pl.id ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.5)',
                        color: dialState.platform === pl.id ? '#a5b4fc' : '#94a3b8',
                        border: dialState.platform === pl.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid #334155',
                      }}
                    >
                      {pl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Format */}
              <div>
                <label className="text-xs font-medium mb-2 block text-text-secondary">Output Format</label>
                <div className="flex gap-2 flex-wrap">
                  {OUTPUT_FORMATS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setDialState((s) => ({ ...s, outputFormat: f.id as any }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: dialState.outputFormat === f.id ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.5)',
                        color: dialState.outputFormat === f.id ? '#a5b4fc' : '#94a3b8',
                        border: dialState.outputFormat === f.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid #334155',
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div>
                <label className="text-xs font-medium mb-2 block text-text-secondary">Tone</label>
                <div className="flex gap-2 flex-wrap">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setDialState((s) => ({ ...s, tone: t as any }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                      style={{
                        background: dialState.tone === t ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.5)',
                        color: dialState.tone === t ? '#a5b4fc' : '#94a3b8',
                        border: dialState.tone === t ? '1px solid rgba(99,102,241,0.3)' : '1px solid #334155',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre (Multi-Select) */}
              <div>
                <label className="text-xs font-medium mb-2 block text-text-secondary">
                  Genres (optional, select multiple)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {GENRES.map((g) => {
                    const isSelected = (dialState.genres || []).includes(g)
                    return (
                      <button
                        key={g}
                        onClick={() =>
                          setDialState((s) => ({
                            ...s,
                            genres: isSelected
                              ? (s.genres || []).filter((genre) => genre !== g)
                              : [...(s.genres || []), g],
                          }))
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: isSelected ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.5)',
                          color: isSelected ? '#a5b4fc' : '#94a3b8',
                          border: isSelected ? '1px solid rgba(99,102,241,0.3)' : '1px solid #334155',
                        }}
                      >
                        {g}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Intensity Dials */}
              <div>
                <label className="text-xs font-medium mb-3 block text-text-secondary">Intensity Dials</label>
                <div className="space-y-2">
                  {Object.entries(DIALS).map(([key, dial]) => (
                    <LabeledSlider
                      key={key}
                      label={dial.label}
                      value={dialState.intensity?.[key as keyof IntensityValues] || 5}
                      onChange={(v) =>
                        setDialState((s) => ({
                          ...s,
                          intensity: { ...s.intensity, [key]: v },
                        }))
                      }
                      min={dial.min}
                      max={dial.max}
                    />
                  ))}
                </div>
              </div>

              {/* Cohesion */}
              <LabeledSlider
                label="Cohesion Strictness"
                value={dialState.cohesionStrictness || 5}
                onChange={(v) => setDialState((s) => ({ ...s, cohesionStrictness: v }))}
                min={1}
                max={10}
              />

              {/* Avoid Phrases */}
              <div>
                <label className="text-xs font-medium mb-2 block text-text-secondary">Avoid Phrases</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {dialState.avoidPhrases.map((phrase, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}
                    >
                      {phrase}
                      <button
                        onClick={() =>
                          setDialState((s) => ({
                            ...s,
                            avoidPhrases: s.avoidPhrases.filter((_, j) => j !== i),
                          }))
                        }
                        className="ml-0.5"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  placeholder="Type phrase and press Enter"
                  className="bg-[rgba(15,23,42,0.6)] border-[#334155] text-text-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const value = e.currentTarget.value.trim()
                      if (value) {
                        setDialState((s) => ({
                          ...s,
                          avoidPhrases: [...(s.avoidPhrases || []), value],
                        }))
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>

              {/* Randomize Button */}
              <button
                onClick={randomizeDialIntensity}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{
                  background: 'rgba(30,41,59,0.6)',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                }}
              >
                🎲 Randomize Intensity Dials
              </button>
            </div>
          )}
        </ThemedCard>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(0)}
            className="bg-transparent border-[#1e293b] text-text-secondary"
          >
            Back
          </Button>
          <Button
            onClick={() => setStep(2)}
            className="bg-primary hover:bg-primary-light text-white"
          >
            Next: Generate Story
          </Button>
        </div>
      </div>

      {/* STEP C: Generate */}
      <div style={{ display: step === 2 ? 'block' : 'none' }}>
        <h2 className="text-lg font-semibold mb-1 text-text-primary">Generate Story</h2>
        <p className="text-sm mb-5 text-text-muted">
          We&apos;ll create 3 variants based on your dreamscape and preset.
        </p>

        <ThemedCard className="mb-6">
          <div className="mb-4">
            <h3 className="font-medium text-text-primary mb-2">Selected Preset</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {PRESETS.find((p) => p.id === selectedPreset)?.emoji}
              </span>
              <div>
                <p className="font-medium text-text-primary">
                  {PRESETS.find((p) => p.id === selectedPreset)?.name}
                </p>
                <p className="text-xs text-text-muted">
                  {PRESETS.find((p) => p.id === selectedPreset)?.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-text-primary mb-2">Dreamscape Preview</h3>
            <p className="text-sm text-text-muted whitespace-pre-wrap">
              {chunks.map((c) => c.text).join('\n\n---\n\n')}
            </p>
          </div>
        </ThemedCard>

        {generating && (
          <ThemedCard className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              <div>
                <p className="font-medium text-text-primary">Generating your stories...</p>
                <p className="text-sm text-text-muted">This may take 30-60 seconds</p>
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          </ThemedCard>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(1)}
            disabled={generating}
            className="bg-transparent border-[#1e293b] text-text-secondary"
          >
            Back
          </Button>
          <Button
            onClick={handleGenerateStory}
            disabled={generating}
            className="bg-primary hover:bg-primary-light text-white"
          >
            {generating ? 'Generating...' : 'Generate Stories'}
          </Button>
        </div>
      </div>

      {/* STEP D: Rate & Save */}
      <div style={{ display: step === 3 && generatedOutputs.length > 0 ? 'block' : 'none' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Your Variants</h2>
            <p className="text-sm text-text-muted">Rate, refine, and save.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setStep(2)
              setGeneratedOutputs([])
            }}
            className="bg-transparent border-[#334155] text-text-secondary"
          >
            <RefreshCwIcon className="w-3.5 h-3.5 mr-2" />
            Generate More
          </Button>
        </div>

        {/* Variant Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl bg-[rgba(15,23,42,0.5)]">
          {generatedOutputs.map((output, idx) => (
            <button
              key={idx}
              onClick={() => setActiveVariant(idx)}
              className="flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: activeVariant === idx ? '#6366f1' : 'transparent',
                color: activeVariant === idx ? '#fff' : '#94a3b8',
              }}
            >
              {output.label || `Variant ${String.fromCharCode(65 + idx)}`}
            </button>
          ))}
        </div>

        {/* Variant Content */}
        <ThemedCard className="mb-4 border-[#1e293b]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-muted">
              {generatedOutputs[activeVariant]?.text?.split(/\s+/).length || 0} words
            </span>
            <div className="flex items-center gap-2">
              <CopyButton text={generatedOutputs[activeVariant]?.text || ''} />
              <button
                onClick={() => {
                  // TODO: Implement regen variant
                  showToast('Regenerate variant coming soon')
                }}
                disabled={generating}
                className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-primary transition-all"
              >
                <RefreshCwIcon className="w-3.5 h-3.5" />
                Regen
              </button>
            </div>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2 text-text-primary">
            {generatedOutputs[activeVariant]?.text}
          </div>
        </ThemedCard>

        {/* Rating */}
        <ThemedCard className="mb-4 bg-[rgba(15,23,42,0.3)] border-[#1e293b]">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-xs font-medium text-text-secondary">Rating</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setRatings((prev) => ({ ...prev, [activeVariant]: i + 1 }))}
                  className="p-0.5 transition-all"
                >
                  <Star
                    className="w-5 h-5"
                    style={{
                      color: i < (ratings[activeVariant] || 0) ? '#eab308' : '#334155',
                      fill: i < (ratings[activeVariant] || 0) ? '#eab308' : 'none',
                    }}
                  />
                </button>
              ))}
            </div>
            {ratings[activeVariant] && (
              <span className="text-xs font-mono text-yellow-500">{ratings[activeVariant]}/10</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {FEEDBACK_CHIPS.map((chip) => {
              const isActive = (feedback[activeVariant] || []).includes(chip.id)
              return (
                <button
                  key={chip.id}
                  onClick={() =>
                    setFeedback((prev) => {
                      const current = prev[activeVariant] || []
                      return {
                        ...prev,
                        [activeVariant]: isActive
                          ? current.filter((x) => x !== chip.id)
                          : [...current, chip.id],
                      }
                    })
                  }
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: isActive
                      ? chip.positive
                        ? 'rgba(34,197,94,0.15)'
                        : 'rgba(239,68,68,0.15)'
                      : 'rgba(30,41,59,0.5)',
                    color: isActive ? (chip.positive ? '#4ade80' : '#f87171') : '#64748b',
                    border: isActive
                      ? chip.positive
                        ? '1px solid rgba(34,197,94,0.3)'
                        : '1px solid rgba(239,68,68,0.3)'
                      : '1px solid #334155',
                  }}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
          <Input
            value={notes[activeVariant] || ''}
            onChange={(e) => setNotes((prev) => ({ ...prev, [activeVariant]: e.target.value }))}
            placeholder="Add a note (optional)"
            className="bg-[rgba(15,23,42,0.6)] border-[#334155] text-text-primary"
          />
        </ThemedCard>

        {/* Save Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => {
              // TODO: Implement save to library with rating
              showToast('Saved to library!')
            }}
            className="bg-primary hover:bg-primary-light text-white"
          >
            <SaveIcon className="w-4 h-4 mr-2" />
            Save to Library
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setChunks([{ id: uid(), title: '', text: generatedOutputs[activeVariant]?.text || '' }])
              setGeneratedOutputs([])
              setStep(0)
            }}
            className="bg-[rgba(30,41,59,0.6)] border-[#334155] text-text-secondary"
          >
            Duplicate as new project
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const text = generatedOutputs[activeVariant]?.text || ''
              const blob = new Blob([text], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `story-${Date.now()}.txt`
              a.click()
              URL.revokeObjectURL(url)
              showToast('Downloaded!')
            }}
            className="bg-[rgba(30,41,59,0.6)] border-[#334155] text-text-secondary"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export .txt
          </Button>
        </div>
      </div>

      {toast && <Toast message={toast} show={!!toast} onClose={() => setToast('')} />}

      {/* Prompt Inspector (Developer Mode) */}
      {settings.developerMode && (
        <>
          <button
            onClick={() => setInspectorOpen(!inspectorOpen)}
            className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-40 transition-colors"
          >
            🔍 Prompt Inspector
            {step > 0 && <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded">Step {step}</span>}
          </button>

          <PromptInspector
            isOpen={inspectorOpen}
            onClose={() => setInspectorOpen(false)}
            promptData={inspectorPromptData}
          />
        </>
      )}
    </div>
  )
}
