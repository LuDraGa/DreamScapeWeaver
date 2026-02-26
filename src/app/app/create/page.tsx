'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { ThemedCard } from '@/components/design-system/themed-card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/design-system/skeleton'
import { Toast } from '@/components/design-system/toast'
import { PlusIcon, WandIcon, SparklesIcon, SaveIcon, XIcon, ChevronDownIcon, ChevronUpIcon } from '@/components/icons'
import { uid } from '@/lib/utils'
import { api } from '@/lib/api'
import { PRESETS } from '@/lib/config'
import type { Dreamscape } from '@/lib/types'

/**
 * Create Page - 4-step story generation workflow
 */
export default function CreatePage() {
  const { currentDreamscape, setCurrentDreamscape, saveDreamscape, settings } = useAppStore()

  // Step management
  const [step, setStep] = useState(0)
  const steps = [
    { label: 'Dreamscape', s: 'A' },
    { label: 'Preset', s: 'B' },
    { label: 'Generate', s: 'C' },
    { label: 'Rate & Save', s: 'D' },
  ]

  // Dreamscape state (Step A)
  const [chunks, setChunks] = useState(
    currentDreamscape?.chunks || [{ id: uid(), title: '', text: '' }]
  )
  const [showGenPanel, setShowGenPanel] = useState(false)
  const [genVibe, setGenVibe] = useState('')
  const [genCount, setGenCount] = useState(3)
  const [genLoading, setGenLoading] = useState(false)
  const [genResults, setGenResults] = useState<Dreamscape[]>([])

  // Preset state (Step B)
  const [selectedPreset, setSelectedPreset] = useState(settings.defaultPreset)

  // Generate state (Step C)
  const [generating, setGenerating] = useState(false)

  // UI state
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

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

  const handleGenerateDreamscapes = async () => {
    setGenLoading(true)
    try {
      const results = await api.dreamscapes.generate({ count: genCount, vibe: genVibe })
      setGenResults(results)
      showToast(`Generated ${results.length} ideas!`)
    } catch (error) {
      showToast('Failed to generate ideas')
      console.error(error)
    } finally {
      setGenLoading(false)
    }
  }

  const useGeneratedIdea = (dreamscape: Dreamscape) => {
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

  // ============================================================
  // Step B: Preset handlers
  // ============================================================

  const selectPreset = (presetId: string) => {
    setSelectedPreset(presetId)
  }

  // ============================================================
  // Step C: Generate handlers
  // ============================================================

  const handleGenerateStory = async () => {
    if (!currentDreamscape) {
      showToast('Please save dreamscape first')
      return
    }

    setGenerating(true)
    try {
      const preset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0]
      const dialState = {
        presetId: preset.id,
        platform: preset.platform,
        outputFormat: preset.outputFormat,
        wordCount: preset.wordCount,
        tone: preset.tone,
        intensity: preset.intensity,
        avoidPhrases: settings.avoidPhrases,
        cohesionStrictness: 5,
      }

      const outputs = await api.outputs.generate({
        dreamscape: currentDreamscape,
        dialState,
      })

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
                        onClick={() => useGeneratedIdea(d)}
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

        {/* Chunks */}
        <div className="space-y-4 mb-6">
          {chunks.map((chunk, index) => (
            <ThemedCard key={chunk.id}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-secondary">
                  Part {index + 1}
                </label>
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
            Next: Choose Preset
          </Button>
        </div>
      </div>

      {/* STEP B: Presets */}
      <div style={{ display: step === 1 ? 'block' : 'none' }}>
        <h2 className="text-lg font-semibold mb-1 text-text-primary">Choose a Preset</h2>
        <p className="text-sm mb-5 text-text-muted">
          Sets the vibe for your story. Tweak details in Advanced.
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
          We'll create 3 variants based on your dreamscape and preset.
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
            disabled={generating || !currentDreamscape}
            className="bg-primary hover:bg-primary-light text-white"
          >
            {generating ? 'Generating...' : 'Generate Stories'}
          </Button>
        </div>
      </div>

      {/* STEP D: Rate & Save */}
      <div style={{ display: step === 3 ? 'block' : 'none' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Rate & Save</h2>
            <p className="text-sm text-text-muted">Review variants and provide feedback</p>
          </div>
        </div>

        <ThemedCard>
          <p className="text-center text-text-muted py-8">
            Story variants will appear here after generation
          </p>
        </ThemedCard>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(2)}
            className="bg-transparent border-[#1e293b] text-text-secondary"
          >
            Back to Generate
          </Button>
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  )
}
