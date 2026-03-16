'use client'

import { useState, useEffect } from 'react'
import { PRESETS } from '@/lib/config'
import {
  buildPresetPrompt,
  buildSeedPrompt,
  buildEnhancementPrompt,
  buildOutputPrompt,
  type PromptData,
} from '@/lib/prompt-builders'
import { buildPromptFromTemplate } from '@/lib/templates'
import { uid } from '@/lib/utils'
import type { DialState, Template, Dreamscape, ReviewOutputParams } from '@/lib/types'
import { buildReviewSystemPrompt, buildReviewUserPrompt } from '@/lib/adapters/review-prompts'

export type InspectorFocus = 'default' | 'split' | 'continue' | 'review'

interface Chunk {
  id: string
  title: string
  text: string
}

interface UsePromptInspectorParams {
  enabled: boolean
  step: number
  powerUserMode: boolean
  dialState: DialState
  chunks: Chunk[]
  enhanceGoal: string | null
  customEnhanceGoal: string
  showEnhanceDrawer: boolean
  showGenPanel: boolean
  genVibe: string
  genCount: number
  selectedTemplate: Template | null
  generatedOutputs: any[]
  activeVariant: number
  splitGuidance: string
  continueGuidance: string
  reviewParams: ReviewOutputParams | null
}

export function usePromptInspector({
  enabled,
  step,
  powerUserMode,
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
  reviewParams,
}: UsePromptInspectorParams) {
  const [promptData, setPromptData] = useState<PromptData | null>(null)
  const [inspectorFocus, setInspectorFocus] = useState<InspectorFocus>('default')

  useEffect(() => {
    if (!enabled) return

    const currentPreset = PRESETS.find((p) => p.id === dialState.presetId) || PRESETS[0]
    const genres = dialState.genres || []
    const activeOutput = generatedOutputs[activeVariant]

    // Split focus — show the exact prompt that will be sent for split
    if (inspectorFocus === 'split' && activeOutput) {
      const storyText = activeOutput.text
      const systemPrompt = `You are a skilled story editor who specializes in structuring narrative content for serial consumption.`
      const userPrompt = `Split this story into 2-3 logical parts with natural break points:\n\n${storyText}\n\n${splitGuidance ? `USER GUIDANCE:\n${splitGuidance}\n\n` : ''}Return the story split into parts with [PART 1], [PART 2], [PART 3] markers.`
      setPromptData({
        step: 'Split Into Parts',
        messages: [
          { role: 'system', content: systemPrompt, variables: {} },
          { role: 'user', content: userPrompt, variables: { splitGuidance } },
        ],
        fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
      })
      return
    }

    // Continue focus — show the exact prompt that will be sent for continuation
    if (inspectorFocus === 'continue' && activeOutput) {
      const storyText = activeOutput.text
      const systemPrompt = `You are a skilled story writer who specializes in creating compelling story continuations that maintain narrative momentum.`
      const userPrompt = `Continue this story with a natural next part:\n\nEXISTING STORY:\n${storyText}\n\n${continueGuidance ? `USER GUIDANCE FOR NEXT PART:\n${continueGuidance}\n\n` : ''}Write the next part, continuing from where the story left off.`
      setPromptData({
        step: 'Continue Story',
        messages: [
          { role: 'system', content: systemPrompt, variables: {} },
          { role: 'user', content: userPrompt, variables: { continueGuidance } },
        ],
        fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
      })
      return
    }

    // Review focus — show the exact prompt that will be sent for AI review
    if (inspectorFocus === 'review' && reviewParams) {
      const systemPrompt = buildReviewSystemPrompt(reviewParams)
      const userPrompt = buildReviewUserPrompt(reviewParams)
      setPromptData({
        step: 'AI Review (GPT-5.4)',
        messages: [
          { role: 'system', content: systemPrompt, variables: {} },
          { role: 'user', content: userPrompt, variables: { templateName: reviewParams.templateName } },
        ],
        fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
      })
      return
    }

    // --- Default behavior: step-based logic ---

    // Enhancement prompts (highest priority — when enhance drawer is open)
    if (showEnhanceDrawer && enhanceGoal && chunks.length > 0) {
      setPromptData(
        buildEnhancementPrompt({
          chunks,
          goalPreset: enhanceGoal,
          customGoal: customEnhanceGoal,
          avoidPhrases: dialState.avoidPhrases,
        })
      )
    }
    // Step 0: Dreamscape — generation prompt when Gen panel is open
    else if (step === 0 && showGenPanel) {
      setPromptData(
        buildSeedPrompt({
          count: genCount,
          vibe: genVibe,
          seedPrompt: selectedTemplate?.seedPrompt,
          templateContext: selectedTemplate ? {
            displayName: selectedTemplate.displayName,
            category: selectedTemplate.category,
            description: selectedTemplate.description,
          } : undefined,
        })
      )
    }
    // Step 0: Dreamscape — chunk preview (default)
    else if (step === 0 && chunks.length > 0) {
      const systemPrompt = `You are viewing the Dreamscape step.`
      const userPrompt = `Current dreamscape chunks:\n\n${chunks
        .map(
          (c, i) =>
            `Chunk ${i + 1}:\n${c.title ? `Title: ${c.title}` : '(No title)'}\n${c.text ? `Text: ${c.text}` : '(No text yet)'}`
        )
        .join('\n\n')}\n\nTotal chunks: ${chunks.length}\n\nNext step: Select a preset and configure advanced settings.`
      setPromptData({
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
    // Step 1: Platform & Style
    else if (step === 1) {
      if (!powerUserMode && selectedTemplate && chunks.length > 0) {
        const tempDreamscape: Dreamscape = {
          id: 'preview',
          title: chunks[0].text.slice(0, 50) || 'Untitled',
          chunks,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        const { systemPrompt, userPrompt, characterSystemPrompt, characterUserPrompt } = buildPromptFromTemplate(selectedTemplate, tempDreamscape)

        // CoT templates: show character prompt + story prompt (with placeholder)
        if (characterSystemPrompt && characterUserPrompt) {
          setPromptData({
            step: 'Template (Step 1) — CoT: Character → Story',
            messages: [
              { role: 'system', content: '— CALL 1: CHARACTER GENERATION (gpt-5-mini) —', variables: {} },
              { role: 'system', content: characterSystemPrompt, variables: {} },
              { role: 'user', content: characterUserPrompt, variables: {} },
              { role: 'system', content: '— CALL 2: STORY GENERATION (gpt-5.4) —', variables: {} },
              { role: 'system', content: systemPrompt, variables: {} },
              { role: 'user', content: userPrompt, variables: {} },
            ],
            fullPrompt: `— CALL 1: CHARACTER (gpt-5-mini) —\n\n${characterSystemPrompt}\n\n${characterUserPrompt}\n\n— CALL 2: STORY (gpt-5.4) —\n\n${systemPrompt}\n\n${userPrompt}`,
          })
        } else {
          setPromptData({
            step: 'Template (Step 1)',
            messages: [
              { role: 'system', content: systemPrompt, variables: {} },
              { role: 'user', content: userPrompt, variables: {} },
            ],
            fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
          })
        }
      } else if (powerUserMode) {
        setPromptData(
          buildPresetPrompt({
            preset: currentPreset,
            platform: dialState.platform,
            format: dialState.outputFormat,
            genres,
            tone: dialState.tone,
            wordCount: dialState.wordCount,
          })
        )
      } else {
        setPromptData({
          step: 'Platform & Style (Step 1)',
          messages: [
            {
              role: 'system',
              content: 'No template selected yet. Choose a template above to see the prompt that will be used.',
              variables: {},
            },
          ],
          fullPrompt: 'No template selected yet.',
        })
      }
    }
    // Step 2: Generate (power user) OR Rate & Save (normal user with outputs)
    else if (step === 2 && chunks.length > 0) {
      if (powerUserMode) {
        const dreamscape: Dreamscape = { id: uid(), title: '', chunks, createdAt: '', updatedAt: '' }
        setPromptData(
          buildOutputPrompt({
            dreamscape,
            platform: dialState.platform,
            format: dialState.outputFormat,
            wordCount: dialState.wordCount,
            tone: dialState.tone,
            genres,
            avoidPhrases: dialState.avoidPhrases,
          })
        )
      } else if (selectedTemplate) {
        const tempDreamscape: Dreamscape = {
          id: 'preview',
          title: chunks[0].text.slice(0, 50) || 'Untitled',
          chunks,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        const { systemPrompt, userPrompt } = buildPromptFromTemplate(selectedTemplate, tempDreamscape)

        // If active output has a characterProfile, inject it into the system prompt to show what was actually sent
        const activeOutput = generatedOutputs[activeVariant]
        const charProfile = activeOutput?.characterProfile
        const resolvedSystemPrompt = charProfile
          ? systemPrompt.replace('{character}', charProfile)
          : systemPrompt

        if (charProfile) {
          setPromptData({
            step: 'Output Generation (Step 2) — CoT: character injected',
            messages: [
              { role: 'system', content: resolvedSystemPrompt, variables: {} },
              { role: 'user', content: userPrompt, variables: {} },
            ],
            fullPrompt: `${resolvedSystemPrompt}\n\n${userPrompt}`,
          })
        } else {
          setPromptData({
            step: 'Output Generation (Step 2)',
            messages: [
              { role: 'system', content: systemPrompt, variables: {} },
              { role: 'user', content: userPrompt, variables: {} },
            ],
            fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
          })
        }
      }
    }
    // Step 3: Rate & Save (power user mode only)
    else if (step === 3 && powerUserMode && chunks.length > 0) {
      const dreamscape: Dreamscape = { id: uid(), title: '', chunks, createdAt: '', updatedAt: '' }
      setPromptData(
        buildOutputPrompt({
          dreamscape,
          platform: dialState.platform,
          format: dialState.outputFormat,
          wordCount: dialState.wordCount,
          tone: dialState.tone,
          genres,
          avoidPhrases: dialState.avoidPhrases,
        })
      )
    }
  }, [
    enabled,
    inspectorFocus,
    step,
    dialState,
    enhanceGoal,
    customEnhanceGoal,
    chunks,
    showGenPanel,
    showEnhanceDrawer,
    genVibe,
    genCount,
    selectedTemplate,
    generatedOutputs,
    activeVariant,
    splitGuidance,
    continueGuidance,
    powerUserMode,
    reviewParams,
  ])

  return { promptData, setPromptData, inspectorFocus, setInspectorFocus }
}
