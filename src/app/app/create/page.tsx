'use client'

import { useState, useMemo } from 'react'
import { usePromptInspector } from '@/hooks/usePromptInspector'
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
import { PRESETS, PLATFORMS, OUTPUT_FORMATS, TONES, GENRES } from '@/lib/config'
import type { Dreamscape, OutputVariant, DialState, Template, TemplateCategory, Platform, OutputFormat, AIReviewResult, ReviewOutputParams, SeedDetailLevel } from '@/lib/types'
import { LabeledSlider } from '@/components/design-system/labeled-slider'
import { CopyButton } from '@/components/design-system/copy-button'
import { PromptInspector } from '@/components/dev-tools/prompt-inspector'
import {
  buildPresetPrompt,
  buildEnhancementPrompt,
  buildOutputPrompt,
  type PromptData,
} from '@/lib/prompt-builders'
import { getTemplatesByCategory, buildPromptFromTemplate, checkTemplateCompatibility, isHeroCategory, getDefaultStyleVariant, getStyleVariant } from '@/lib/templates'
import { useAuth } from '@/lib/auth/context'
import { canAccessDevTools } from '@/lib/auth/roles'
import { ContentTypeSelector } from '@/components/create/content-type-selector'
import { TemplateGallery } from '@/components/create/template-gallery'
import { TemplatePreview } from '@/components/create/template-preview'

/**
 * Maps template category → the closest Platform/OutputFormat values in the DialState type.
 * Used so template-generated outputs are stored with a meaningful platform tag.
 * Note: templates have their own prompts, so this doesn't affect generation — only
 * storage/display (library badge, DB platform column, platform filter).
 */
const TEMPLATE_CATEGORY_DIAL: Record<TemplateCategory, { platform: Platform; outputFormat: OutputFormat }> = {
  'reddit':           { platform: 'reddit', outputFormat: 'reddit-post' },
  'short-form':       { platform: 'tiktok', outputFormat: 'reel-script' },
  'long-form':        { platform: 'blog',   outputFormat: 'series' },
  'video-production': { platform: 'blog',   outputFormat: 'series' },
  'audio-production': { platform: 'blog',   outputFormat: 'series' },
  'marketing':        { platform: 'blog',   outputFormat: 'short-story' },
}

/**
 * Apply word count override to prompt text.
 * Replaces all word count references (ranges, tildes, targets, expansion guidance)
 * with the override values to eliminate contradictions.
 */
function applyWordCountOverride(text: string, wc: number, lo: number, hi: number): string {
  return text
    .replace(/\d{3,5}\s*[-–]\s*\d{3,5}\s*words/g, `${lo}-${hi} words`)           // "1000-2000 words"
    .replace(/~\d{3,5}\s*words/g, `~${wc} words`)                                  // "~1500 words"
    .replace(/\(target\s*~\d{3,5}\)/g, `(target ~${wc})`)                          // "(target ~1500)"
    .replace(/\.\s*If (?:your draft is |)under \d{3,5},\s*expand by[^.]*\./g, '.') // strip expansion guidance
    .replace(/If under \d{3,5},\s*expand by[^.]*\./g, '')                          // strip expansion guidance
    .replace(/\s*Do NOT summarize more than two nights in a single sentence\./g, '') // strip summarize rule
    .replace(/under\s*\d{3,5}/g, `under ${lo}`)                                    // "under 1300"
    .replace(/below\s*\d{3,5}/g, `below ${lo}`)                                    // "below 1300"
}


/**
 * Create Page - 4-step story generation workflow
 */
export default function CreatePage() {
  const { currentDreamscape, setCurrentDreamscape, saveDreamscape, saveOutput, settings } = useAppStore()
  const { role } = useAuth()
  const isAdmin = role ? canAccessDevTools(role) : false

  // Step management — always start at step 0 (combined setup for normal users)
  // Pre-loaded dreamscapes from Library: setupTab defaults to 'format' so user picks a template
  const [step, setStep] = useState(0)

  // Normal user: Setup (tabbed) → Rate & Save
  // Power user: Dreamscape → Platform & Style → Generate → Rate & Save
  const steps = settings.powerUserMode
    ? [
        { label: 'Dreamscape', s: 'A' },
        { label: 'Platform & Style', s: 'B' },
        { label: 'Generate', s: 'C' },
        { label: 'Rate & Save', s: 'D' },
      ]
    : [
        { label: 'Setup', s: 'A' },
        { label: 'Rate & Save', s: 'B' },
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
  const [genDetailLevel, setGenDetailLevel] = useState<SeedDetailLevel>('vibe')
  const [genLoading, setGenLoading] = useState(false)
  const [genResults, setGenResults] = useState<Dreamscape[]>([])

  // Preset state (Step B) - Power User Mode
  const [selectedPreset, setSelectedPreset] = useState(settings.defaultPreset)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Template state - Normal User Mode
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedStyleVariant, setSelectedStyleVariant] = useState<string | undefined>(undefined)
  const [setupTab, setSetupTab] = useState<'idea' | 'format'>(() => currentDreamscape ? 'format' : 'idea')

  // Initialize dialState from selected preset
  const getInitialDialState = (): DialState => {
    const preset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0]
    return {
      // presetId intentionally omitted — only stamped when user explicitly picks a preset
      platform: preset.platform,
      outputFormat: preset.outputFormat,
      wordCount: preset.wordCount,
      tone: preset.tone,
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

  // Commenting system
  interface TextComment {
    id: string
    variantIndex: number
    startOffset: number
    endOffset: number
    selectedText: string
    commentText: string
    createdAt: string
    resolved?: boolean
  }
  const [comments, setComments] = useState<TextComment[]>([])
  const [selectedRange, setSelectedRange] = useState<{start: number, end: number, text: string} | null>(null)
  const [showCommentPopover, setShowCommentPopover] = useState(false)
  const [newCommentText, setNewCommentText] = useState('')
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(true)

  // Multi-part guidance (simple)
  const [splitGuidance, setSplitGuidance] = useState('')
  const [continueGuidance, setContinueGuidance] = useState('')

  // Admin prompt editing (Step 7)
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [editedSystemPrompt, setEditedSystemPrompt] = useState('')
  const [editedUserPrompt, setEditedUserPrompt] = useState('')
  const [editedWordCount, setEditedWordCount] = useState<number | null>(null)

  // AI Review state (admin-only)
  const [aiReview, setAiReview] = useState<AIReviewResult | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewExpanded, setReviewExpanded] = useState(false)
  const [reviewError, setReviewError] = useState('')

  // UI state
  const [toast, setToast] = useState('')

  // Prompt Inspector state (Developer Mode)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  // Build review params for prompt inspector preview
  const reviewParamsForInspector = useMemo<ReviewOutputParams | null>(() => {
    const output = generatedOutputs[activeVariant]
    if (!output || chunks.length === 0) return null

    let systemPrompt = ''
    let userPrompt = ''
    if (selectedTemplate) {
      const { systemPrompt: sp, userPrompt: up } = buildPromptFromTemplate(
        selectedTemplate,
        currentDreamscape || { id: '', title: '', chunks, createdAt: '', updatedAt: '' },
        selectedStyleVariant,
      )
      systemPrompt = editedSystemPrompt || sp
      userPrompt = editedUserPrompt || up

      // CoT: inject actual character profile for review context
      if (output.characterProfile) {
        systemPrompt = systemPrompt.replace('{character}', output.characterProfile)
      }

      // Reflect word count override in inspector preview (same logic as generation)
      if (isAdmin && editedWordCount !== null && editedWordCount !== selectedTemplate.wordCount) {
        const wc = editedWordCount
        const lo = Math.round(wc * 0.9)
        const hi = Math.round(wc * 1.1)
        systemPrompt = applyWordCountOverride(systemPrompt, wc, lo, hi)
        userPrompt = applyWordCountOverride(userPrompt, wc, lo, hi)
        systemPrompt += `\n\n⚠️ HARD WORD LIMIT: Your response MUST be ${lo}-${hi} words. Count carefully. Do NOT exceed ${hi} words under any circumstances. Cut scenes, compress details, or end earlier — but stay within ${lo}-${hi} words. This is the highest-priority constraint.`
        userPrompt = `⚠️ WORD LIMIT: ${lo}-${hi} words maximum. This overrides all other length instructions.\n\n` + userPrompt
      }
    } else {
      systemPrompt = editedSystemPrompt || 'Default generation prompt (no template)'
      userPrompt = editedUserPrompt || chunks.map((c) => c.text).join('\n\n')
    }

    const wcOverride = isAdmin && editedWordCount !== null && selectedTemplate && editedWordCount !== selectedTemplate.wordCount
    const effectiveWordCount = wcOverride ? editedWordCount : selectedTemplate?.wordCount
    let effectiveRubric = selectedTemplate?.selfCheckRubric
    if (wcOverride && effectiveRubric && editedWordCount !== null) {
      const lo = Math.round(editedWordCount * 0.9)
      const hi = Math.round(editedWordCount * 1.1)
      effectiveRubric = effectiveRubric.map((r) => applyWordCountOverride(r, editedWordCount, lo, hi))
    }

    return {
      dreamscapeText: chunks.map((c) => c.text).join('\n\n'),
      systemPrompt,
      userPrompt,
      outputText: output.text,
      templateName: selectedTemplate?.displayName,
      templateCategory: selectedTemplate?.category,
      templatePlatforms: selectedTemplate?.platforms,
      selfCheckRubric: effectiveRubric,
      styleVariantUsed: selectedStyleVariant
        ? selectedTemplate?.styleVariants?.find((v) => v.id === selectedStyleVariant)?.name
        : selectedTemplate?.styleVariants?.[0]?.name,
      wordCountTarget: effectiveWordCount,
    }
  }, [generatedOutputs, activeVariant, chunks, selectedTemplate, currentDreamscape, selectedStyleVariant, editedSystemPrompt, editedUserPrompt, editedWordCount, isAdmin])

  const {
    promptData: inspectorPromptData,
    setPromptData: setInspectorPromptData,
    inspectorFocus,
    setInspectorFocus,
  } = usePromptInspector({
    enabled: settings.developerMode,
    step,
    powerUserMode: settings.powerUserMode,
    dialState,
    chunks,
    enhanceGoal,
    customEnhanceGoal,
    showEnhanceDrawer,
    showGenPanel,
    genVibe,
    genCount,
    selectedTemplate,
    generatedOutputs,
    activeVariant,
    splitGuidance,
    continueGuidance,
    reviewParams: reviewParamsForInspector,
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  // ============================================================
  // Commenting & Selective Regeneration Functions
  // ============================================================

  /**
   * Handle text selection in content
   */
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setSelectedRange(null)
      setShowCommentPopover(false)
      return
    }

    const text = selection.toString()
    const range = selection.getRangeAt(0)
    const contentElement = document.getElementById(`variant-content-${activeVariant}`)

    if (!contentElement || !contentElement.contains(range.commonAncestorContainer)) {
      return
    }

    // Calculate offsets relative to content start
    const preRange = range.cloneRange()
    preRange.selectNodeContents(contentElement)
    preRange.setEnd(range.startContainer, range.startOffset)
    const start = preRange.toString().length

    setSelectedRange({
      start,
      end: start + text.length,
      text,
    })
    setShowCommentPopover(true)
  }

  /**
   * Add a comment to selected text
   */
  const handleAddComment = () => {
    if (!selectedRange || !newCommentText.trim()) return

    const comment: TextComment = {
      id: uid(),
      variantIndex: activeVariant,
      startOffset: selectedRange.start,
      endOffset: selectedRange.end,
      selectedText: selectedRange.text,
      commentText: newCommentText,
      createdAt: new Date().toISOString(),
      resolved: false,
    }

    setComments((prev) => [...prev, comment])
    setNewCommentText('')
    setShowCommentPopover(false)
    setSelectedRange(null)
    showToast('Comment added!')
  }

  /**
   * Regenerate selected text portion
   */
  const handleRegenerateSelection = async () => {
    if (!selectedRange) return

    const { start, end, text } = selectedRange
    const fullText = generatedOutputs[activeVariant].text

    // Get relevant comments for this selection
    const relevantComments = comments.filter(
      (c) =>
        c.variantIndex === activeVariant &&
        c.startOffset >= start &&
        c.endOffset <= end &&
        !c.resolved
    )

    const guidance = relevantComments.map((c) => `- ${c.commentText}`).join('\n')

    setGenerating(true)
    try {
      const beforeText = fullText.slice(0, start)
      const afterText = fullText.slice(end)

      const promptText = `CONTEXT BEFORE:
${beforeText.slice(-500)}

REGENERATE THIS SECTION:
${text}

CONTEXT AFTER:
${afterText.slice(0, 500)}

${guidance ? `USER GUIDANCE:\n${guidance}\n\nApply the guidance above when rewriting.` : ''}

Rewrite only the selected section, maintaining flow with surrounding context.`

      const dreamscape: Dreamscape = {
        id: uid(),
        title: 'Regenerate Section',
        chunks: [{ id: uid(), title: '', text: promptText }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const outputs = await api.outputs.generate({ dreamscape, dialState })
      const newSection = outputs[0].text

      // Splice back
      const updatedText = beforeText + newSection + afterText
      const updatedOutputs = [...generatedOutputs]
      updatedOutputs[activeVariant] = {
        ...updatedOutputs[activeVariant],
        text: updatedText,
      }

      setGeneratedOutputs(updatedOutputs)

      // Mark comments as resolved
      setComments((prev) =>
        prev.map((c) =>
          relevantComments.find((rc) => rc.id === c.id) ? { ...c, resolved: true } : c
        )
      )

      setSelectedRange(null)
      setShowCommentPopover(false)
      showToast('Section regenerated!')
    } catch (error) {
      showToast('Failed to regenerate section')
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  /**
   * Split story into parts
   */
  const handleSplitIntoParts = async () => {
    setGenerating(true)
    try {
      const fullText = generatedOutputs[activeVariant].text

      const promptText = `Split this story into 2-3 logical parts with natural break points:

${fullText}

${splitGuidance ? `USER GUIDANCE:\n${splitGuidance}` : ''}

Return the story split into parts with [PART 1], [PART 2], [PART 3] markers.`

      const dreamscape: Dreamscape = {
        id: uid(),
        title: 'Split Story',
        chunks: [{ id: uid(), title: '', text: promptText }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const outputs = await api.outputs.generate({ dreamscape, dialState })

      const updatedOutputs = [...generatedOutputs]
      updatedOutputs[activeVariant] = {
        ...updatedOutputs[activeVariant],
        text: outputs[0].text,
      }

      setGeneratedOutputs(updatedOutputs)
      setSplitGuidance('')
      showToast('Story split into parts!')
    } catch (error) {
      showToast('Failed to split story')
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  /**
   * Continue story (generate next part)
   */
  const handleContinueStory = async () => {
    setGenerating(true)
    try {
      const fullText = generatedOutputs[activeVariant].text

      const promptText = `Continue this story with a natural next part:

EXISTING STORY:
${fullText}

${continueGuidance ? `USER GUIDANCE FOR NEXT PART:\n${continueGuidance}` : ''}

Write the next part, continuing from where the story left off.`

      const dreamscape: Dreamscape = {
        id: uid(),
        title: 'Continue Story',
        chunks: [{ id: uid(), title: '', text: promptText }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const outputs = await api.outputs.generate({ dreamscape, dialState })

      const updatedText = `${fullText}\n\n[PART 2]\n${outputs[0].text}`
      const updatedOutputs = [...generatedOutputs]
      updatedOutputs[activeVariant] = {
        ...updatedOutputs[activeVariant],
        text: updatedText,
      }

      setGeneratedOutputs(updatedOutputs)
      setContinueGuidance('')
      showToast('Next part generated!')
    } catch (error) {
      showToast('Failed to continue story')
      console.error(error)
    } finally {
      setGenerating(false)
    }
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
    setGenLoading(true)
    try {
      const results = await api.dreamscapes.generate({
        count: genCount,
        vibe: genVibe,
        detailLevel: genDetailLevel,
        seedPrompt: selectedTemplate?.seedPrompt,
        templateId: selectedTemplate?.id,
        templateContext: selectedTemplate ? {
          displayName: selectedTemplate.displayName,
          category: selectedTemplate.category,
          description: selectedTemplate.description,
        } : undefined,
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
    const source = dreamscape.chunks[0]
    setChunks((prev) => {
      const firstChunk = prev[0]
      if (!firstChunk.text.trim()) {
        // Replace empty first chunk
        return [{ ...firstChunk, text: source.text, details: source.details }]
      }
      // Add as new chunk
      return [...prev, { id: uid(), title: '', text: source.text, details: source.details }]
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

  // Build an OutputVariant from current state for a given variant index.
  // Uses base.dialState (embedded by the API at generation time) so the saved record
  // reflects the actual template/preset/intensity used — not the current UI dial state,
  // which may differ (e.g. template flow never updates component dialState).
  // Pass overrides for rating/feedback since React state may not have flushed yet.
  const buildOutputVariant = (
    variantIndex: number,
    overrides: { rating?: number; feedback?: string[]; notes?: string } = {}
  ): OutputVariant => {
    const base = generatedOutputs[variantIndex]
    return {
      id: base.id,
      dreamscapeId: currentDreamscape?.id,
      title: base.title || 'Untitled',
      text: base.text,
      dialState: base.dialState ?? dialState, // prefer generation-time dialState; fall back to UI state
      rating: overrides.rating ?? ratings[variantIndex],
      feedback: overrides.feedback ?? feedback[variantIndex],
      notes: overrides.notes ?? notes[variantIndex],
      createdAt: base.createdAt || new Date().toISOString(),
    }
  }

  // AI Review handler (admin-only)
  const handleAIReview = async () => {
    const output = generatedOutputs[activeVariant]
    if (!output) return

    setInspectorFocus('review')
    setReviewLoading(true)
    setReviewError('')
    setAiReview(null)
    try {
      // Get the prompt that was used — reconstruct from template or use overrides
      let systemPrompt = ''
      let userPrompt = ''

      if (selectedTemplate) {
        const { systemPrompt: sp, userPrompt: up } = buildPromptFromTemplate(
          selectedTemplate,
          currentDreamscape || { id: '', title: '', chunks, createdAt: '', updatedAt: '' },
          selectedStyleVariant,
        )
        systemPrompt = (editedSystemPrompt || sp)
        userPrompt = (editedUserPrompt || up)

        // CoT: inject actual character profile into system prompt for review context
        if (output.characterProfile) {
          systemPrompt = systemPrompt.replace('{character}', output.characterProfile)
        }

        // Reflect word count override for AI review context (same logic as generation)
        if (isAdmin && editedWordCount !== null && editedWordCount !== selectedTemplate.wordCount) {
          const wc = editedWordCount
          const lo = Math.round(wc * 0.9)
          const hi = Math.round(wc * 1.1)
          systemPrompt = applyWordCountOverride(systemPrompt, wc, lo, hi)
          userPrompt = applyWordCountOverride(userPrompt, wc, lo, hi)
          systemPrompt += `\n\n⚠️ HARD WORD LIMIT: Your response MUST be ${lo}-${hi} words. Count carefully. Do NOT exceed ${hi} words under any circumstances. Cut scenes, compress details, or end earlier — but stay within ${lo}-${hi} words. This is the highest-priority constraint.`
          userPrompt = `⚠️ WORD LIMIT: ${lo}-${hi} words maximum. This overrides all other length instructions.\n\n` + userPrompt
        }
      } else {
        systemPrompt = editedSystemPrompt || 'Default generation prompt (no template)'
        userPrompt = editedUserPrompt || chunks.map((c) => c.text).join('\n\n')
      }

      const dreamscapeText = chunks.map((c) => c.text).join('\n\n')

      // When word count override is active, transform the rubric to match
      const wcOverrideActive = isAdmin && editedWordCount !== null && selectedTemplate && editedWordCount !== selectedTemplate.wordCount
      const effectiveWordCount = wcOverrideActive ? editedWordCount : selectedTemplate?.wordCount
      let effectiveRubric = selectedTemplate?.selfCheckRubric
      if (wcOverrideActive && effectiveRubric) {
        const wc = editedWordCount!
        const lo = Math.round(wc * 0.9)
        const hi = Math.round(wc * 1.1)
        effectiveRubric = effectiveRubric.map((r) => applyWordCountOverride(r, wc, lo, hi))
      }

      const review = await api.outputs.review({
        dreamscapeText,
        systemPrompt,
        userPrompt,
        outputText: output.text,
        templateName: selectedTemplate?.displayName,
        templateCategory: selectedTemplate?.category,
        templatePlatforms: selectedTemplate?.platforms,
        selfCheckRubric: effectiveRubric,
        styleVariantUsed: selectedStyleVariant
          ? selectedTemplate?.styleVariants?.find((v) => v.id === selectedStyleVariant)?.name
          : selectedTemplate?.styleVariants?.[0]?.name,
        wordCountTarget: effectiveWordCount,
      })

      setAiReview(review)
      setReviewExpanded(true)
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Failed to run AI review')
      console.error('AI Review error:', error)
    } finally {
      setReviewLoading(false)
    }
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
      genres: dialState.genres,
      avoidPhrases: dialState.avoidPhrases,
      cohesionStrictness: dialState.cohesionStrictness,
    })
  }

  // ============================================================
  // Step C: Generate handlers
  // ============================================================

  const handleGenerateStory = async () => {
    // Always build dreamscape from current chunks so edits are captured
    const dreamscape: Dreamscape = {
      id: currentDreamscape?.id || uid(),
      title: chunks[0].text.slice(0, 50) || 'Untitled',
      chunks,
      createdAt: currentDreamscape?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setCurrentDreamscape(dreamscape)

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
      setComments([])
      saveDreamscape(dreamscape)
      showToast('Story generated!')
      setStep(3) // Move to Rate & Save step
    } catch (error) {
      showToast('Failed to generate story')
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateFromTemplate = async (template: Template) => {
    // Always build dreamscape from current chunks so edits are captured
    const dreamscape: Dreamscape = {
      id: currentDreamscape?.id || uid(),
      title: chunks[0].text.slice(0, 50) || 'Untitled',
      chunks,
      createdAt: currentDreamscape?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setCurrentDreamscape(dreamscape)

    setGenerating(true)
    try {
      // Build prompts from template (with style variant + rubric + fewShot)
      const { systemPrompt, userPrompt, characterSystemPrompt, characterUserPrompt } = buildPromptFromTemplate(template, dreamscape, selectedStyleVariant)

      // Map template category → platform/format for storage and display
      const { platform, outputFormat } = TEMPLATE_CATEGORY_DIAL[template.category] ?? { platform: 'blog', outputFormat: 'series' }

      // Create dialState from template settings
      const templateDialState: DialState = {
        presetId: template.id,
        platform,
        outputFormat,
        wordCount: template.wordCount,
        tone: template.settings.tone,
        genres: template.settings.genres,
        avoidPhrases: template.settings.avoidPhrases,
        cohesionStrictness: 5,
      }

      // Use admin-edited prompts if available, otherwise use template prompts
      const usingAdminEdit = isAdmin && !!editedSystemPrompt
      let finalSystemPrompt = usingAdminEdit ? editedSystemPrompt : systemPrompt
      let finalUserPrompt = (isAdmin && editedUserPrompt) ? editedUserPrompt : userPrompt

      // Word count override — replaces all word count references in both prompts
      // AND appends a high-priority override as safety net
      const wordCountOverrideActive = isAdmin && editedWordCount !== null && editedWordCount !== template.wordCount
      if (wordCountOverrideActive) {
        const wc = editedWordCount!
        const lo = Math.round(wc * 0.9)
        const hi = Math.round(wc * 1.1)
        finalSystemPrompt = applyWordCountOverride(finalSystemPrompt, wc, lo, hi)
        finalUserPrompt = applyWordCountOverride(finalUserPrompt, wc, lo, hi)
        // Append hard constraint at end of system prompt
        finalSystemPrompt += `\n\n⚠️ HARD WORD LIMIT: Your response MUST be ${lo}-${hi} words. Count carefully. Do NOT exceed ${hi} words under any circumstances. Cut scenes, compress details, or end earlier — but stay within ${lo}-${hi} words. This is the highest-priority constraint.`
        // Also prepend reminder at start of user prompt
        finalUserPrompt = `⚠️ WORD LIMIT: ${lo}-${hi} words maximum. This overrides all other length instructions.\n\n` + finalUserPrompt
        templateDialState.wordCount = wc
        console.log('[Admin Edit] Word count override:', wc, '(template default:', template.wordCount, ')')
      }

      if (usingAdminEdit) {
        console.log('[Admin Edit] Using edited prompts for generation')
        console.log('[Admin Edit] System prompt length:', finalSystemPrompt.length, 'User prompt length:', finalUserPrompt.length)
      }

      // Generate using template — pass template prompts directly to LLM
      // CoT templates include character prompts for two-call flow
      const outputs = await api.outputs.generate({
        dreamscape,
        dialState: templateDialState,
        systemPromptOverride: finalSystemPrompt,
        userPromptOverride: finalUserPrompt,
        characterSystemPrompt,
        characterUserPrompt,
      })

      setGeneratedOutputs(outputs)
      setDialState(templateDialState) // sync UI dials to what was actually generated
      setActiveVariant(0)
      setRatings({})
      setFeedback({})
      setNotes({})
      setComments([])
      saveDreamscape(dreamscape)
      showToast('Story generated!')
      // Normal mode: step 1 = Rate & Save, Power mode: step 3 = Rate & Save
      setStep(settings.powerUserMode ? 3 : 1)
    } catch (error) {
      showToast('Failed to generate story')
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  /**
   * Generate More — appends new variants without clearing existing ones.
   * Uses the same template + settings + dreamscape as the original generation.
   */
  const handleGenerateMore = async () => {
    let dreamscape = currentDreamscape
    if (!dreamscape && chunks.length === 0) return
    if (!dreamscape) {
      dreamscape = {
        id: uid(),
        title: chunks[0].text.slice(0, 50) || 'Untitled',
        chunks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    setGenerating(true)
    try {
      let outputs: any[]
      if (selectedTemplate && !settings.powerUserMode) {
        const { platform, outputFormat } = TEMPLATE_CATEGORY_DIAL[selectedTemplate.category] ?? { platform: 'blog', outputFormat: 'series' }
        const templateDialState: DialState = {
          presetId: selectedTemplate.id,
          platform,
          outputFormat,
          wordCount: selectedTemplate.wordCount,
          tone: selectedTemplate.settings.tone,
          genres: selectedTemplate.settings.genres,
          avoidPhrases: selectedTemplate.settings.avoidPhrases,
          cohesionStrictness: 5,
        }
        outputs = await api.outputs.generate({ dreamscape, dialState: templateDialState })
      } else {
        outputs = await api.outputs.generate({ dreamscape, dialState })
      }

      // Re-label new variants alphabetically from the current offset (D, E, F…)
      const offset = generatedOutputs.length
      const relabeled = outputs.map((o: any, i: number) => ({
        ...o,
        title: `Variant ${String.fromCharCode(65 + offset + i)}`,
      }))

      setGeneratedOutputs((prev) => [...prev, ...relabeled])
      setActiveVariant(offset) // Jump to first new variant
      showToast('New version generated!')
    } catch (error) {
      showToast('Failed to generate more')
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
    setSelectedCategory(null)
    setSelectedTemplate(null)
    setSelectedStyleVariant(undefined)
    setSetupTab('idea')
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

      {/* STEP A: Template Selection (Normal) / Dreamscape (Power User) */}
      <div style={{ display: step === 0 ? 'block' : 'none' }}>

        {/* Normal User: Combined Setup — Tabbed (Your Idea | Choose Format) */}
        {!settings.powerUserMode && (
          <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 200px)' }}>
            {/* Tab Bar */}
            <div className="flex gap-1 mb-5 p-1 rounded-xl bg-[rgba(15,23,42,0.5)]">
              <button
                onClick={() => setSetupTab('idea')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: setupTab === 'idea' ? '#6366f1' : 'transparent',
                  color: setupTab === 'idea' ? '#fff' : '#94a3b8',
                }}
              >
                <span className="text-base">💡</span>
                Your Idea
                {canProceed && <span className="w-2 h-2 rounded-full bg-green-400 ml-1" />}
              </button>
              <button
                onClick={() => setSetupTab('format')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: setupTab === 'format' ? '#6366f1' : 'transparent',
                  color: setupTab === 'format' ? '#fff' : '#94a3b8',
                }}
              >
                <span className="text-base">📋</span>
                Choose Format
                {selectedTemplate && <span className="w-2 h-2 rounded-full bg-green-400 ml-1" />}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0">

              {/* === YOUR IDEA TAB === */}
              {setupTab === 'idea' && (
                <div>
                  {/* Generate Ideas Panel */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowGenPanel(!showGenPanel)}
                        className="bg-transparent border-primary/30 text-primary-muted"
                      >
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Generate Ideas {selectedTemplate?.seedPrompt ? `for ${selectedTemplate.displayName}` : ''}
                      </Button>
                      {!selectedTemplate && showGenPanel && (
                        <span className="text-xs text-amber-400">
                          Tip: Pick a format first for better seeds →
                        </span>
                      )}
                    </div>

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
                              placeholder={selectedTemplate?.category === 'reddit'
                                ? 'e.g. family drama, workplace conflict...'
                                : 'e.g. dark comedy, revenge...'}
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
                                {[1, 2, 3, 5].map((n) => (
                                  <SelectItem key={n} value={n.toString()}>
                                    {n}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block text-text-secondary">
                              Detail
                            </label>
                            <div className="flex rounded-md overflow-hidden border border-[#334155]">
                              {(['vibe', 'detailed'] as const).map((level) => (
                                <button
                                  key={level}
                                  onClick={() => setGenDetailLevel(level)}
                                  className={`px-3 py-[7px] text-xs font-medium capitalize transition-colors ${
                                    genDetailLevel === level
                                      ? 'bg-primary text-white'
                                      : 'bg-[rgba(15,23,42,0.6)] text-text-muted hover:text-text-primary'
                                  }`}
                                >
                                  {level === 'vibe' ? 'Vibe' : 'Detailed'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <Button
                            onClick={async () => {
                              setGenLoading(true)
                              try {
                                const results = await api.dreamscapes.generate({
                                  count: genCount,
                                  vibe: genVibe,
                                  detailLevel: genDetailLevel,
                                  seedPrompt: selectedTemplate?.seedPrompt,
                                  templateId: selectedTemplate?.id,
                                  templateContext: selectedTemplate ? {
                                    displayName: selectedTemplate.displayName,
                                    category: selectedTemplate.category,
                                    description: selectedTemplate.description,
                                  } : undefined,
                                })
                                setGenResults(results)
                                showToast(`Generated ${results.length} ideas!`)
                              } catch (error) {
                                showToast('Failed to generate ideas')
                                console.error(error)
                              } finally {
                                setGenLoading(false)
                              }
                            }}
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
                          <div className="grid gap-2 max-h-96 overflow-y-auto">
                            {genResults.map((d) => {
                              const chunk = d.chunks[0]
                              return (
                                <div
                                  key={d.id}
                                  className="p-3 rounded-lg flex gap-3 group bg-[rgba(15,23,42,0.6)] border border-[#1e293b]"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-text-secondary">{chunk?.text}</p>
                                    {chunk?.details && chunk.details.length > 0 && (
                                      <ul className="mt-2 space-y-1">
                                        {chunk.details.map((detail, i) => (
                                          <li key={i} className="text-xs text-text-muted flex gap-1.5">
                                            <span className="text-primary/60 shrink-0">-</span>
                                            <span>{detail}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
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
                              )
                            })}
                          </div>
                        )}
                      </ThemedCard>
                    )}
                  </div>

                  {/* Seed Text Input */}
                  <div className="space-y-4 mb-6">
                    {chunks.map((chunk, index) => (
                      <ThemedCard key={chunk.id}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-text-secondary">
                            {chunks.length > 1 ? `Part ${index + 1}` : 'Your idea'}
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
                          placeholder="Enter your story seed... (e.g., 'A woman refuses to attend her sister's wedding because...')"
                          className="min-h-[120px] bg-[rgba(15,23,42,0.5)] border-[#1e293b] text-text-primary placeholder:text-text-muted"
                        />
                        {chunk.details && chunk.details.length > 0 && (
                          <div className="mt-2 p-2.5 rounded-md bg-[rgba(15,23,42,0.3)] border border-[#1e293b]/50">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-text-muted">Story details</span>
                              <button
                                onClick={() => {
                                  setChunks((prev) => prev.map((c) =>
                                    c.id === chunk.id ? { ...c, details: undefined } : c
                                  ))
                                }}
                                className="text-xs text-text-muted hover:text-text-primary"
                              >
                                Clear
                              </button>
                            </div>
                            <ul className="space-y-1">
                              {chunk.details.map((detail, i) => (
                                <li key={i} className="text-xs text-text-muted flex gap-1.5">
                                  <span className="text-primary/60 shrink-0">-</span>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
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

                  {/* Admin Prompt Editor */}
                  {isAdmin && selectedTemplate && (
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          if (!showPromptEditor) {
                            const dreamscape = {
                              id: currentDreamscape?.id || uid(),
                              title: chunks[0].text.slice(0, 50) || 'Untitled',
                              chunks,
                              createdAt: currentDreamscape?.createdAt || new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            }
                            const { systemPrompt, userPrompt } = buildPromptFromTemplate(selectedTemplate, dreamscape, selectedStyleVariant)
                            setEditedSystemPrompt(systemPrompt)
                            setEditedUserPrompt(userPrompt)
                            setEditedWordCount(selectedTemplate.wordCount)
                          }
                          setShowPromptEditor(!showPromptEditor)
                        }}
                        className="flex items-center gap-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors mb-2"
                      >
                        {showPromptEditor ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                        Edit Prompt (Admin)
                      </button>

                      {showPromptEditor && (
                        <div className="space-y-3 p-3 rounded-lg bg-[rgba(15,23,42,0.4)] border border-amber-500/20">
                          <div>
                            <label className="text-xs font-medium text-amber-400 mb-1 block">System Prompt</label>
                            <textarea
                              value={editedSystemPrompt}
                              onChange={(e) => setEditedSystemPrompt(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-mono bg-[rgba(15,23,42,0.6)] border border-[#334155] rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500 resize-y"
                              rows={8}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-amber-400 mb-1 block">Word Count Override</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                min={100}
                                max={10000}
                                step={50}
                                value={editedWordCount ?? ''}
                                onChange={(e) => setEditedWordCount(e.target.value ? Number(e.target.value) : null)}
                                className="w-32 px-3 py-1.5 text-xs font-mono bg-[rgba(15,23,42,0.6)] border border-[#334155] rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500"
                                placeholder="e.g. 800"
                              />
                              <span className="text-[10px] text-text-muted">
                                Template default: {selectedTemplate.wordCount} — overrides all word count instructions in both prompts
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-amber-400 mb-1 block">User Prompt</label>
                            <textarea
                              value={editedUserPrompt}
                              onChange={(e) => setEditedUserPrompt(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-mono bg-[rgba(15,23,42,0.6)] border border-[#334155] rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500 resize-y"
                              rows={6}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* === CHOOSE FORMAT TAB === */}
              {setupTab === 'format' && (
                <div>
                  {/* Category Tabs */}
                  <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
                    {[
                      { id: 'reddit' as const, icon: '🗨️', label: 'Reddit Stories' },
                      { id: 'short-form' as const, icon: '📱', label: 'Short Videos' },
                      { id: 'long-form' as const, icon: '🎥', label: 'Long Videos' },
                      { id: 'video-production' as const, icon: '🎬', label: 'Video Production' },
                      { id: 'audio-production' as const, icon: '🎙️', label: 'Audio Production' },
                      { id: 'marketing' as const, icon: '💼', label: 'Marketing' },
                    ].filter((cat) => settings.powerUserMode || isHeroCategory(cat.id)).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id)
                          setSelectedTemplate(null)
                          setSelectedStyleVariant(undefined)
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0"
                        style={{
                          background: selectedCategory === cat.id ? '#6366f1' : 'rgba(30,41,59,0.5)',
                          color: selectedCategory === cat.id ? '#fff' : '#94a3b8',
                          border: selectedCategory === cat.id ? '1px solid #818cf8' : '1px solid #334155',
                        }}
                      >
                        <span className="text-lg">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Template Grid */}
                  {selectedCategory && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5 max-h-[40vh] overflow-y-auto pr-2">
                      {getTemplatesByCategory(selectedCategory, !settings.powerUserMode).map((template) => {
                        const isSelected = selectedTemplate?.id === template.id
                        return (
                          <ThemedCard
                            key={template.id}
                            onClick={() => {
                              setSelectedTemplate(template)
                              setSelectedStyleVariant(getDefaultStyleVariant(template))
                            }}
                            className={`cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/50'
                                : 'hover:border-primary/50 hover:bg-primary/5'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">{template.icon}</span>
                                <div>
                                  <h3 className={`font-semibold ${isSelected ? 'text-primary' : 'text-text-primary'} transition-colors`}>
                                    {template.displayName}
                                  </h3>
                                  <p className="text-xs text-text-muted">{template.duration} · ~{template.wordCount} words</p>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-text-secondary line-clamp-2">{template.description}</p>
                          </ThemedCard>
                        )
                      })}
                    </div>
                  )}

                  {/* Style Variant Picker (shown when template selected) */}
                  {selectedTemplate && selectedTemplate.styleVariants && selectedTemplate.styleVariants.length > 0 && (
                    <ThemedCard className="mb-5 border-primary/30 bg-primary/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{selectedTemplate.icon}</span>
                          <div>
                            <h3 className="font-semibold text-text-primary">{selectedTemplate.displayName}</h3>
                            <p className="text-xs text-text-muted">{selectedTemplate.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTemplate(null)
                            setSelectedStyleVariant(undefined)
                          }}
                          className="text-text-muted hover:text-text-primary transition-colors"
                        >
                          <XIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <label className="text-xs font-medium text-text-secondary mb-2 block">Style</label>
                      <div className="flex gap-2 flex-wrap">
                        {selectedTemplate.styleVariants.map((variant) => {
                          const isActive = selectedStyleVariant === variant.id
                          return (
                            <button
                              key={variant.id}
                              onClick={() => setSelectedStyleVariant(variant.id)}
                              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
                              style={{
                                background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.5)',
                                color: isActive ? '#a5b4fc' : '#94a3b8',
                                border: isActive ? '1px solid rgba(99,102,241,0.4)' : '1px solid #334155',
                              }}
                            >
                              <span className="block font-semibold">{variant.name}</span>
                              <span className="block text-xs mt-0.5 opacity-70">{variant.description}</span>
                            </button>
                          )
                        })}
                      </div>
                    </ThemedCard>
                  )}
                </div>
              )}
            </div>

            {/* Status Bar + Generate Button (always visible) */}
            <div className="mt-4 p-4 rounded-xl bg-[rgba(15,23,42,0.6)] border border-[#1e293b]">
              <div className="flex items-center gap-4 mb-3">
                {/* Seed Status */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${canProceed ? 'bg-green-400' : 'bg-[#334155]'}`} />
                  <span className="text-xs font-medium text-text-secondary shrink-0">Idea:</span>
                  {canProceed ? (
                    <button
                      onClick={() => setSetupTab('idea')}
                      className="text-xs text-text-primary truncate hover:text-primary transition-colors"
                    >
                      {chunks[0].text.slice(0, 60)}{chunks[0].text.length > 60 ? '...' : ''}
                    </button>
                  ) : (
                    <button
                      onClick={() => setSetupTab('idea')}
                      className="text-xs text-text-muted hover:text-text-primary transition-colors"
                    >
                      Not entered yet
                    </button>
                  )}
                </div>

                {/* Template Status */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${selectedTemplate ? 'bg-green-400' : 'bg-[#334155]'}`} />
                  <span className="text-xs font-medium text-text-secondary shrink-0">Format:</span>
                  {selectedTemplate ? (
                    <button
                      onClick={() => setSetupTab('format')}
                      className="text-xs text-text-primary truncate hover:text-primary transition-colors"
                    >
                      {selectedTemplate.icon} {selectedTemplate.displayName}
                      {selectedStyleVariant && selectedTemplate.styleVariants
                        ? ` — ${selectedTemplate.styleVariants.find((v) => v.id === selectedStyleVariant)?.name}`
                        : ''}
                    </button>
                  ) : (
                    <button
                      onClick={() => setSetupTab('format')}
                      className="text-xs text-text-muted hover:text-text-primary transition-colors"
                    >
                      Not selected yet
                    </button>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={() => selectedTemplate && handleGenerateFromTemplate(selectedTemplate)}
                disabled={generating || !canProceed || !selectedTemplate}
                size="lg"
                className="w-full bg-primary hover:bg-primary-light text-white disabled:opacity-50"
              >
                {generating ? 'Generating...' : !canProceed && !selectedTemplate ? 'Enter an idea & pick a format to generate' : !canProceed ? 'Enter your idea to generate' : !selectedTemplate ? 'Pick a format to generate' : 'Generate Story'}
              </Button>

              {generating && (
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-text-muted">Generating your story...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Power User: Dreamscape First (original behavior) */}
        {settings.powerUserMode && (
        <div>
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
            {settings.powerUserMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEnhanceDrawer(true)}
              className="bg-transparent border-purple-500/30 text-purple-400"
            >
              <WandIcon className="w-4 h-4 mr-2" />
              Enhance
            </Button>
            )}
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
              <div>
                <label className="text-xs font-medium mb-1 block text-text-secondary">
                  Detail
                </label>
                <div className="flex rounded-md overflow-hidden border border-[#334155]">
                  {(['vibe', 'detailed'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setGenDetailLevel(level)}
                      className={`px-3 py-[7px] text-xs font-medium capitalize transition-colors ${
                        genDetailLevel === level
                          ? 'bg-primary text-white'
                          : 'bg-[rgba(15,23,42,0.6)] text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {level === 'vibe' ? 'Vibe' : 'Detailed'}
                    </button>
                  ))}
                </div>
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
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {genResults.map((d) => {
                  const chunk = d.chunks[0]
                  return (
                    <div
                      key={d.id}
                      className="p-3 rounded-lg flex gap-3 group bg-[rgba(15,23,42,0.6)] border border-[#1e293b]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-secondary">{chunk?.text}</p>
                        {chunk?.details && chunk.details.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {chunk.details.map((detail, i) => (
                              <li key={i} className="text-xs text-text-muted flex gap-1.5">
                                <span className="text-primary/60 shrink-0">-</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
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
                  )
                })}
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
              {chunk.details && chunk.details.length > 0 && (
                <div className="mt-2 p-2.5 rounded-md bg-[rgba(15,23,42,0.3)] border border-[#1e293b]/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-text-muted">Story details</span>
                    <button
                      onClick={() => {
                        setChunks((prev) => prev.map((c) =>
                          c.id === chunk.id ? { ...c, details: undefined } : c
                        ))
                      }}
                      className="text-xs text-text-muted hover:text-text-primary"
                    >
                      Clear
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {chunk.details.map((detail, i) => (
                      <li key={i} className="text-xs text-text-muted flex gap-1.5">
                        <span className="text-primary/60 shrink-0">-</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
        )}
      </div>

      {/* STEP B: Platform & Style (Power User Only) */}
      <div style={{ display: step === 1 ? 'block' : 'none' }}>
        {/* Power User Mode: Original Preset UI */}
        {settings.powerUserMode && (
          <>
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
          </>
        )}
      </div>

      {/* STEP C: Generate (Power User Mode Only) */}
      {settings.powerUserMode && (
        <div style={{ display: step === 2 ? 'block' : 'none' }}>
        <h2 className="text-lg font-semibold mb-1 text-text-primary">Generate Story</h2>
        <p className="text-sm mb-5 text-text-muted">
          We&apos;ll generate a story based on your dreamscape and preset.
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
      )}

      {/* STEP D: Rate & Save (Step 1 in normal mode, Step 3 in power user mode) */}
      <div
        style={{
          display:
            ((!settings.powerUserMode && step === 1) || (settings.powerUserMode && step === 3))
              ? 'block'
              : 'none',
        }}
      >
      {generatedOutputs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(99,102,241,0.1)' }}
          >
            <SparklesIcon className="w-7 h-7" style={{ color: '#6366f1' }} />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">No stories generated yet</h2>
          <p className="text-sm text-text-muted mb-6 max-w-sm">
            Head back to the Platform & Style step and hit Generate to create your story variants.
          </p>
          <Button
            onClick={() => setStep(1)}
            className="bg-primary hover:bg-primary-light text-white"
          >
            Go to Platform & Style
          </Button>
        </div>
      ) : (
      <>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {generatedOutputs.length === 1 ? 'Your Story' : 'Your Variants'}
            </h2>
            <p className="text-sm text-text-muted">Rate, refine, and save.</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateMore}
              disabled={generating}
              className="bg-transparent border-[#334155] text-text-secondary disabled:opacity-50"
            >
              <RefreshCwIcon className="w-3.5 h-3.5 mr-2" />
              {generating ? 'Generating...' : 'Regenerate'}
            </Button>
          </div>
        </div>

        {/* Variant Tabs — only show when multiple outputs exist */}
        {generatedOutputs.length > 1 && (
        <div className="flex gap-1 mb-4 p-1 rounded-xl bg-[rgba(15,23,42,0.5)]">
          {generatedOutputs.map((output, idx) => (
            <button
              key={idx}
              onClick={() => { setActiveVariant(idx); setInspectorFocus('default'); setAiReview(null); setReviewError('') }}
              className="flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: activeVariant === idx ? '#6366f1' : 'transparent',
                color: activeVariant === idx ? '#fff' : '#94a3b8',
              }}
            >
              {output.title || `Variant ${String.fromCharCode(65 + idx)}`}
            </button>
          ))}
        </div>
        )}

        {/* Variant Content */}
        <ThemedCard className="mb-4 border-[#1e293b]">

          {/* Content Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-text-muted">
                {generatedOutputs[activeVariant]?.text?.split(/\s+/).length || 0} words
              </span>
              {comments.filter((c) => c.variantIndex === activeVariant && !c.resolved).length > 0 && (
                <span className="text-xs text-primary">
                  {comments.filter((c) => c.variantIndex === activeVariant && !c.resolved).length} comments
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCommentsSidebar(!showCommentsSidebar)}
                className={`flex items-center gap-1 text-xs font-medium transition-all ${
                  showCommentsSidebar ? 'text-primary' : 'text-text-muted hover:text-text-primary'
                }`}
                title="Toggle comments sidebar"
              >
                <span className="text-sm">💬</span>
                {showCommentsSidebar ? 'Hide' : 'Show'} Comments
              </button>
              <CopyButton text={generatedOutputs[activeVariant]?.text || ''} />
            </div>
          </div>

          {/* Content Display with Text Selection */}
          <div className="flex gap-4">
            {/* Main Content */}
            <div className="flex-1">
              <div
                id={`variant-content-${activeVariant}`}
                onMouseUp={handleTextSelection}
                className="text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2 text-text-primary select-text cursor-text"
              >
                {generatedOutputs[activeVariant]?.text}
              </div>

              {/* Floating Comment/Regenerate Popover */}
              {showCommentPopover && selectedRange && (
                <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-xs font-medium text-primary mb-2">
                    Selected: &quot;{selectedRange.text.slice(0, 50)}{selectedRange.text.length > 50 ? '...' : ''}&quot;
                  </p>
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Add a comment or regeneration guidance..."
                    className="w-full px-3 py-2 text-sm bg-[rgba(15,23,42,0.6)] border border-[#334155] rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none mb-2"
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleAddComment}
                      disabled={!newCommentText.trim()}
                      className="text-xs px-3 py-1.5 bg-primary hover:bg-primary-light text-white disabled:opacity-50"
                    >
                      💬 Add Comment
                    </Button>
                    <Button
                      onClick={handleRegenerateSelection}
                      disabled={generating}
                      className="text-xs px-3 py-1.5 bg-[rgba(30,41,59,0.5)] hover:bg-[rgba(30,41,59,0.7)] text-text-primary disabled:opacity-50"
                    >
                      <RefreshCwIcon className="w-3 h-3 inline mr-1" />
                      Regenerate Selection
                    </Button>
                    <button
                      onClick={() => {
                        setShowCommentPopover(false)
                        setSelectedRange(null)
                        setNewCommentText('')
                      }}
                      className="text-xs text-text-muted hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Comments Sidebar */}
            {showCommentsSidebar && (
              <div className="w-64 border-l border-[#1e293b] pl-4">
                <h4 className="text-xs font-medium text-text-secondary mb-3">Comments</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {comments
                    .filter((c) => c.variantIndex === activeVariant)
                    .map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-2 rounded-lg text-xs border ${
                          comment.resolved
                            ? 'bg-[rgba(15,23,42,0.3)] border-[#334155] opacity-60'
                            : 'bg-primary/5 border-primary/20'
                        }`}
                      >
                        <p className="text-text-muted mb-1 text-[10px]">
                          &quot;{comment.selectedText.slice(0, 30)}...&quot;
                        </p>
                        <p className="text-text-primary mb-2">{comment.commentText}</p>
                        {!comment.resolved && (
                          <button
                            onClick={() => {
                              setComments((prev) =>
                                prev.map((c) => (c.id === comment.id ? { ...c, resolved: true } : c))
                              )
                            }}
                            className="text-[10px] text-primary hover:text-primary-light"
                          >
                            Mark Resolved
                          </button>
                        )}
                        {comment.resolved && (
                          <span className="text-[10px] text-text-muted">✓ Resolved</span>
                        )}
                      </div>
                    ))}
                  {comments.filter((c) => c.variantIndex === activeVariant).length === 0 && (
                    <p className="text-xs text-text-muted italic">No comments yet. Select text to add one.</p>
                  )}
                </div>
              </div>
            )}
          </div>

        </ThemedCard>

        {/* Always-Visible Split/Continue Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Split into Parts */}
          <ThemedCard
            className={`border transition-colors ${inspectorFocus === 'split' && settings.developerMode ? 'border-indigo-500/50' : 'border-[#1e293b]'}`}
          >
            <h4 className="text-sm font-medium text-text-primary mb-3">✂️ Split into Parts</h4>
            <textarea
              value={splitGuidance}
              onChange={(e) => { setSplitGuidance(e.target.value); setInspectorFocus('split') }}
              onFocus={() => setInspectorFocus('split')}
              placeholder="Optional: How should the story be split? (e.g., 'Break at major plot points', 'Split into 3 equal parts')"
              className="w-full px-3 py-2 text-sm bg-[rgba(15,23,42,0.6)] border border-[#334155] rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none mb-3"
              rows={3}
            />
            <Button
              onClick={() => { setInspectorFocus('split'); handleSplitIntoParts() }}
              disabled={generating}
              className="w-full bg-[rgba(30,41,59,0.5)] hover:bg-[rgba(30,41,59,0.7)] text-text-primary disabled:opacity-50"
            >
              {generating ? 'Splitting...' : 'Split Story'}
            </Button>
          </ThemedCard>

          {/* Continue Story (Generate Next Part) */}
          <ThemedCard
            className={`border transition-colors ${inspectorFocus === 'continue' && settings.developerMode ? 'border-indigo-500/50' : 'border-[#1e293b]'}`}
          >
            <h4 className="text-sm font-medium text-text-primary mb-3">➡️ Continue Story</h4>
            <textarea
              value={continueGuidance}
              onChange={(e) => { setContinueGuidance(e.target.value); setInspectorFocus('continue') }}
              onFocus={() => setInspectorFocus('continue')}
              placeholder="Optional: What should happen next? (e.g., 'Focus on the aftermath', 'Introduce a new character')"
              className="w-full px-3 py-2 text-sm bg-[rgba(15,23,42,0.6)] border border-[#334155] rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary resize-none mb-3"
              rows={3}
            />
            <Button
              onClick={() => { setInspectorFocus('continue'); handleContinueStory() }}
              disabled={generating}
              className="w-full bg-[rgba(30,41,59,0.5)] hover:bg-[rgba(30,41,59,0.7)] text-text-primary disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Next Part'}
            </Button>
          </ThemedCard>
        </div>

        {/* AI Review (Admin-only) */}
        {isAdmin && (
        <ThemedCard className="mb-4 border-[#1e293b] bg-[rgba(99,102,241,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">AI Review</span>
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/20 text-primary">ADMIN</span>
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-500/20 text-purple-400">GPT-5.4</span>
            </div>
            <div className="flex items-center gap-2">
              {aiReview && (
                <>
                  <CopyButton
                    text={(() => {
                      const r = aiReview
                      const lines = [
                        `Overall: ${r.overallGrade} — ${r.verdict}`,
                        '',
                        'Rubric Scores:',
                        ...r.rubricScores.map((rs) => `  ${rs.rubric}: ${rs.score}/10`),
                        '',
                        'Weaknesses:',
                        ...r.weaknesses.map((w) => `  - ${w}`),
                        '',
                        'Strengths:',
                        ...r.strengths.map((s) => `  + ${s}`),
                        '',
                        'Prompt Suggestions:',
                        ...r.promptSuggestions.map((s) => `  * ${s}`),
                        ...(r.additionalNotes.length > 0 ? ['', 'Notes:', ...r.additionalNotes.map((n) => `  ${n}`)] : []),
                        '',
                        'Detailed Analysis:',
                        ...r.rubricAnalyses.map((ra) => `  [${ra.score}/10] ${ra.rubric}: ${ra.analysis}`),
                      ]
                      return lines.join('\n')
                    })()}
                  />
                  <button
                    onClick={() => setReviewExpanded(!reviewExpanded)}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
                  >
                    {reviewExpanded ? (
                      <><ChevronUpIcon className="w-3 h-3" /> Collapse</>
                    ) : (
                      <><ChevronDownIcon className="w-3 h-3" /> Expand</>
                    )}
                  </button>
                </>
              )}
              <Button
                size="sm"
                onClick={handleAIReview}
                disabled={reviewLoading || !generatedOutputs[activeVariant]}
                className="bg-primary hover:bg-primary-light text-white text-xs disabled:opacity-50"
              >
                <SparklesIcon className="w-3.5 h-3.5 mr-1.5" />
                {reviewLoading ? 'Reviewing...' : aiReview ? 'Re-review' : 'Run Review'}
              </Button>
            </div>
          </div>

          {reviewError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-3">
              {reviewError}
            </div>
          )}

          {reviewLoading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {aiReview && !reviewLoading && (
            <div className="space-y-4">
              {/* Overall Grade Banner */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-[rgba(15,23,42,0.4)]">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                  style={{
                    background: aiReview.overallGrade <= 'B'
                      ? 'rgba(34,197,94,0.15)'
                      : aiReview.overallGrade === 'C'
                        ? 'rgba(234,179,8,0.15)'
                        : 'rgba(239,68,68,0.15)',
                    color: aiReview.overallGrade <= 'B'
                      ? '#4ade80'
                      : aiReview.overallGrade === 'C'
                        ? '#eab308'
                        : '#f87171',
                  }}
                >
                  {aiReview.overallGrade}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{aiReview.verdict}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {aiReview.rubricScores.map((rs) => (
                      <span
                        key={rs.rubric}
                        className="px-2 py-0.5 rounded text-[10px] font-mono"
                        style={{
                          background: rs.score >= 8
                            ? 'rgba(34,197,94,0.12)'
                            : rs.score >= 5
                              ? 'rgba(234,179,8,0.12)'
                              : 'rgba(239,68,68,0.12)',
                          color: rs.score >= 8 ? '#4ade80' : rs.score >= 5 ? '#eab308' : '#f87171',
                        }}
                      >
                        {rs.rubric}: {rs.score}/10
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Review Body — Collapsible */}
              {reviewExpanded && (
              <>
              {/* Crisp Summary */}
              <div className="grid grid-cols-2 gap-3">
                {/* Weaknesses */}
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <h5 className="text-xs font-medium text-red-400 mb-2">Weaknesses to Fix</h5>
                  <ul className="space-y-1">
                    {aiReview.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-text-secondary flex gap-1.5">
                        <span className="text-red-400 shrink-0">-</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Strengths */}
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                  <h5 className="text-xs font-medium text-green-400 mb-2">Strengths to Preserve</h5>
                  <ul className="space-y-1">
                    {aiReview.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-text-secondary flex gap-1.5">
                        <span className="text-green-400 shrink-0">+</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Prompt Suggestions */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <h5 className="text-xs font-medium text-primary mb-2">Prompt Suggestions</h5>
                <ul className="space-y-1.5">
                  {aiReview.promptSuggestions.map((s, i) => (
                    <li key={i} className="text-xs text-text-secondary flex gap-1.5">
                      <span className="text-primary shrink-0">*</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Additional Notes */}
              {aiReview.additionalNotes.length > 0 && (
                <div className="p-3 rounded-lg bg-[rgba(15,23,42,0.3)]">
                  <h5 className="text-xs font-medium text-text-muted mb-2">Additional Notes</h5>
                  <ul className="space-y-1">
                    {aiReview.additionalNotes.map((n, i) => (
                      <li key={i} className="text-xs text-text-muted">{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed Rubric Analysis */}
              <div className="border-t border-[#1e293b] pt-4">
                <h5 className="text-xs font-medium text-text-secondary mb-3">Detailed Rubric Analysis</h5>
                <div className="space-y-3">
                  {aiReview.rubricAnalyses.map((ra) => (
                    <div key={ra.rubric} className="p-3 rounded-lg bg-[rgba(15,23,42,0.3)]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-text-primary">{ra.rubric}</span>
                        <span
                          className="text-xs font-mono font-medium"
                          style={{
                            color: ra.score >= 8 ? '#4ade80' : ra.score >= 5 ? '#eab308' : '#f87171',
                          }}
                        >
                          {ra.score}/10
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">{ra.analysis}</p>
                    </div>
                  ))}
                </div>
              </div>
              </>
              )}
            </div>
          )}
        </ThemedCard>
        )}

        {/* Rating */}
        <ThemedCard className="mb-4 bg-[rgba(15,23,42,0.3)] border-[#1e293b]">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-xs font-medium text-text-secondary">Rating</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const newRating = i + 1
                    setRatings((prev) => ({ ...prev, [activeVariant]: newRating }))
                    saveOutput(buildOutputVariant(activeVariant, { rating: newRating }))
                  }}
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
                  onClick={() => {
                    const current = feedback[activeVariant] || []
                    const newFeedback = isActive
                      ? current.filter((x) => x !== chip.id)
                      : [...current, chip.id]
                    setFeedback((prev) => ({ ...prev, [activeVariant]: newFeedback }))
                    saveOutput(buildOutputVariant(activeVariant, { feedback: newFeedback }))
                  }}
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
              saveOutput(buildOutputVariant(activeVariant))
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
              // Create new dreamscape from this output
              const outputText = generatedOutputs[activeVariant]?.text || ''
              const newDreamscape = {
                id: uid(),
                title: outputText.slice(0, 50) || 'Untitled',
                chunks: [{ id: uid(), title: '', text: outputText }],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }

              // Set as current dreamscape and go to Step 1 (Platform & Style)
              setCurrentDreamscape(newDreamscape)
              setChunks(newDreamscape.chunks)
              setGeneratedOutputs([])
              setActiveVariant(0)
              setRatings({})
              setFeedback({})
              setComments([])
              setSelectedCategory(null)
              setSelectedTemplate(null)
              setStep(1)
              showToast('Using output as new dreamscape! Select a template to continue.')
            }}
            className="bg-green-600 hover:bg-green-700 text-white border-green-700"
          >
            🔄 Use as Dreamscape
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
      </>
      )}
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
