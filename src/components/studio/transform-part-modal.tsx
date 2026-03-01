'use client'

import { useState } from 'react'
import { ThemedCard } from '@/components/design-system/themed-card'
import { Button } from '@/components/ui/button'
import { XIcon } from '@/components/icons'
import type { Part, PartType } from '@/lib/types'
import { getPartType, type PartTypeMetadata } from '@/lib/parts'
import { getValidTargetTypes, getTransform } from '@/lib/transforms'

interface TransformPartModalProps {
  isOpen: boolean
  sourcePart: Part
  onClose: () => void
  onTransform: (targetType: PartType) => void
}

// Category metadata for UI display
const CATEGORIES = [
  {
    id: 'text-foundations' as const,
    name: 'Text Foundations',
    icon: '📚',
    description: 'Core narrative building blocks',
  },
  {
    id: 'short-form' as const,
    name: 'Short-Form Content',
    icon: '⚡',
    description: 'Quick, engaging social content',
  },
  {
    id: 'long-form' as const,
    name: 'Long-Form Content',
    icon: '📖',
    description: 'In-depth articles and scripts',
  },
  {
    id: 'video-production' as const,
    name: 'Video Production',
    icon: '🎬',
    description: 'Production documents for video',
  },
  {
    id: 'audio-production' as const,
    name: 'Audio Production',
    icon: '🎙️',
    description: 'Podcast and audio content',
  },
  {
    id: 'marketing' as const,
    name: 'Marketing & Commercial',
    icon: '💼',
    description: 'Sales and marketing materials',
  },
]

export function TransformPartModal({
  isOpen,
  sourcePart,
  onClose,
  onTransform,
}: TransformPartModalProps) {
  const [selectedTarget, setSelectedTarget] = useState<PartType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  if (!isOpen) return null

  const sourcePartType = getPartType(sourcePart.type)
  const validTargets = getValidTargetTypes(sourcePart.type)

  // Group valid targets by category
  const targetsByCategory = validTargets.reduce((acc, targetType) => {
    const meta = getPartType(targetType)
    if (!acc[meta.category]) {
      acc[meta.category] = []
    }
    acc[meta.category].push(meta)
    return acc
  }, {} as Record<string, PartTypeMetadata[]>)

  const handleGenerate = async () => {
    if (!selectedTarget) return

    setGenerating(true)
    try {
      await onTransform(selectedTarget)
      onClose()
      setSelectedTarget(null)
      setSelectedCategory(null)
    } catch (error) {
      console.error('Transform failed:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleCancel = () => {
    setSelectedTarget(null)
    setSelectedCategory(null)
    onClose()
  }

  // If category selected, show parts within that category
  const showingCategoryParts = selectedCategory !== null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <ThemedCard className="w-full max-w-4xl max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Transform Part</h2>
              {/* Breadcrumb trail */}
              <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                <span>Choose category</span>
                {selectedCategory && (
                  <>
                    <span>→</span>
                    <span>
                      {CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'Category'}
                    </span>
                  </>
                )}
                {selectedTarget && (
                  <>
                    <span>→</span>
                    <span className="text-primary font-medium">
                      {getPartType(selectedTarget).name}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Source Part */}
          <div className="mb-6">
            <p className="text-sm text-text-secondary mb-2">From:</p>
            <div className="flex items-center gap-2 p-3 bg-background-secondary rounded-lg">
              <span className="text-2xl">{sourcePartType.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-text-primary truncate">
                  {sourcePart.title}
                </p>
                <p className="text-xs text-text-muted">
                  {sourcePartType.name} • {sourcePart.metadata.wordCount} words
                </p>
              </div>
            </div>
          </div>

          {/* Breadcrumb navigation - always show if not at root */}
          {(showingCategoryParts || selectedTarget !== null) && (
            <button
              onClick={() => {
                if (selectedTarget !== null) {
                  // If a target is selected, go back to category parts view
                  setSelectedTarget(null)
                } else if (selectedCategory !== null) {
                  // If viewing category parts, go back to categories
                  setSelectedCategory(null)
                }
              }}
              className="flex items-center gap-2 mb-4 text-sm text-primary hover:text-primary-light transition-colors"
            >
              <span>←</span>
              <span>
                {selectedTarget !== null
                  ? 'Back to formats'
                  : 'Back to categories'}
              </span>
            </button>
          )}

          {/* Category Selection OR Part Selection */}
          <div className="mb-6">
            <p className="text-sm text-text-secondary mb-3">
              {showingCategoryParts ? 'Transform to:' : 'Select category:'}
            </p>

            {validTargets.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">
                No valid transformations available for this part type
              </p>
            ) : showingCategoryParts ? (
              // Show parts in selected category
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {targetsByCategory[selectedCategory]?.map((targetMeta) => {
                  const transform = getTransform(sourcePart.type, targetMeta.id)
                  const isSelected = selectedTarget === targetMeta.id

                  return (
                    <button
                      key={targetMeta.id}
                      onClick={() => setSelectedTarget(targetMeta.id)}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border-primary hover:border-primary/50 bg-background-secondary'
                        }
                      `}
                    >
                      <div className="text-2xl mb-2">{targetMeta.icon}</div>
                      <p className="font-medium text-sm text-text-primary mb-1">
                        {targetMeta.name}
                      </p>
                      <p className="text-xs text-text-secondary line-clamp-2 mb-1">
                        {targetMeta.description}
                      </p>
                      {transform && (
                        <p className="text-xs text-primary capitalize">
                          {transform.transformType}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              // Show categories
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((category) => {
                  const partsInCategory = targetsByCategory[category.id]?.length || 0
                  const hasPartsInCategory = partsInCategory > 0

                  return (
                    <button
                      key={category.id}
                      onClick={() => hasPartsInCategory && setSelectedCategory(category.id)}
                      disabled={!hasPartsInCategory}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${hasPartsInCategory
                          ? 'border-border-primary hover:border-primary/50 bg-background-secondary hover:bg-background-tertiary cursor-pointer'
                          : 'border-border-secondary bg-background-secondary/50 opacity-50 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{category.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-text-primary mb-1">
                            {category.name}
                          </p>
                          <p className="text-xs text-text-secondary mb-2">
                            {category.description}
                          </p>
                          <p className="text-xs text-text-muted">
                            {hasPartsInCategory
                              ? `${partsInCategory} ${partsInCategory === 1 ? 'format' : 'formats'} available`
                              : 'No formats available'
                            }
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
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
              disabled={!selectedTarget || generating}
              className="flex-1 bg-primary hover:bg-primary-light text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </ThemedCard>
      </div>
    </>
  )
}
