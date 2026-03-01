'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ThemedCard } from '@/components/design-system/themed-card'
import { XIcon } from '@/components/icons'
import { useAppStore } from '@/store/app-store'
import { uid } from '@/lib/utils'
import type { Part } from '@/lib/types'

interface GeneratePartModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GeneratePartModal({ isOpen, onClose }: GeneratePartModalProps) {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const addUnsavedPart = useAppStore((state) => state.addUnsavedPart)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setGenerating(true)
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create a mock dreamscape part
      const mockPart: Part = {
        id: uid(),
        projectId: '', // Empty for unsaved parts
        type: 'dreamscape',
        title: prompt.slice(0, 50) || 'Untitled Story',
        content: `# ${prompt}\n\nThis is a generated dreamscape based on your prompt.\n\n## Opening\n\nThe story begins with an intriguing premise...\n\n## Development\n\nCharacters are introduced and conflicts emerge...\n\n## Climax\n\nTension reaches its peak as the protagonist faces their biggest challenge...\n\n## Resolution\n\nLoose ends are tied up and the story concludes.\n\n---\n\n*This is a mock generation. Real AI integration coming soon.*`,
        metadata: {
          wordCount: 150,
          platform: 'universal',
          tone: 'narrative',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      addUnsavedPart(mockPart)

      // Reset and close
      setPrompt('')
      onClose()
    } catch (error) {
      console.error('Generation failed:', error)
      alert('Failed to generate. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCancel = () => {
    setPrompt('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleCancel} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <ThemedCard className="w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Generate New Part</h2>
            <button
              onClick={handleCancel}
              className="text-text-muted hover:text-text-primary transition-colors"
              disabled={generating}
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Describe your idea
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A detective story about a missing person in a small town..."
                rows={4}
                autoFocus
                disabled={generating}
              />
              <p className="text-xs text-text-muted mt-2">
                We&apos;ll generate a dreamscape (story seed) that you can then transform into any format.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={generating}
              className="flex-1 bg-transparent border-border-primary text-text-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="flex-1 bg-primary hover:bg-primary-light text-white"
            >
              {generating ? 'Generating...' : 'Generate Dreamscape'}
            </Button>
          </div>
        </ThemedCard>
      </div>
    </>
  )
}
