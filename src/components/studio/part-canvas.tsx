'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/icons'
import { PartCard } from './part-card'
import { ThemedCard } from '@/components/design-system/themed-card'
import { GeneratePartModal } from './generate-part-modal'
import { SaveToProjectModal } from './save-to-project-modal'
import { TransformPartModal } from './transform-part-modal'
import type { Part, PartType } from '@/lib/types'

export function PartCanvas() {
  const { unsavedParts, removeUnsavedPart, setActivePart, addUnsavedPart } = useAppStore()
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [partToSave, setPartToSave] = useState<Part | null>(null)
  const [partToTransform, setPartToTransform] = useState<Part | null>(null)

  const handleDeletePart = (id: string) => {
    const confirmed = window.confirm('Delete this part? This cannot be undone.')
    if (confirmed) {
      removeUnsavedPart(id)
    }
  }

  const handleSavePart = (id: string) => {
    const part = unsavedParts.find((p) => p.id === id)
    if (part) {
      setPartToSave(part)
    }
  }

  const handleRegeneratePart = (id: string) => {
    // TODO: Implement regeneration
    alert('Regenerate (coming soon)')
  }

  const handleTransformPart = (id: string) => {
    const part = unsavedParts.find((p) => p.id === id)
    if (part) {
      setPartToTransform(part)
    }
  }

  const handleTransformGenerate = async (targetType: PartType) => {
    if (!partToTransform) return

    // Call transform API (Task 3.3)
    const response = await fetch('/api/parts/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourcePart: partToTransform,
        targetType,
      }),
    })

    const newPart = await response.json()
    addUnsavedPart(newPart)
  }

  // Empty state - no unsaved parts
  if (unsavedParts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <ThemedCard className="max-w-md text-center">
          <div className="mb-4">
            <span className="text-6xl">✨</span>
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Start Creating</h2>
          <p className="text-sm text-text-muted mb-6">
            Generate content freely. Save to a project when you&apos;re ready.
          </p>
          <Button
            onClick={() => setShowGenerateModal(true)}
            className="w-full bg-primary hover:bg-primary-light text-white"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Generate Part
          </Button>
        </ThemedCard>

        <GeneratePartModal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} />
        <SaveToProjectModal
          isOpen={partToSave !== null}
          onClose={() => setPartToSave(null)}
          partToSave={partToSave}
        />
      </div>
    )
  }

  // Has unsaved parts
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Your Parts</h2>
          <p className="text-sm text-text-muted">
            {unsavedParts.length} unsaved {unsavedParts.length === 1 ? 'part' : 'parts'}
          </p>
        </div>
        <Button
          onClick={() => setShowGenerateModal(true)}
          className="bg-primary hover:bg-primary-light text-white"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Generate Part
        </Button>
      </div>

      {/* Parts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {unsavedParts.map((part) => (
          <PartCard
            key={part.id}
            part={part}
            isSaved={false}
            onClick={() => setActivePart(part)}
            onDelete={() => handleDeletePart(part.id)}
            onSave={() => handleSavePart(part.id)}
            onRegenerate={() => handleRegeneratePart(part.id)}
            onTransform={() => handleTransformPart(part.id)}
          />
        ))}
      </div>

      <GeneratePartModal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} />
      <SaveToProjectModal
        isOpen={partToSave !== null}
        onClose={() => setPartToSave(null)}
        partToSave={partToSave}
      />
      {partToTransform && (
        <TransformPartModal
          isOpen={partToTransform !== null}
          sourcePart={partToTransform}
          onClose={() => setPartToTransform(null)}
          onTransform={handleTransformGenerate}
        />
      )}
    </div>
  )
}
