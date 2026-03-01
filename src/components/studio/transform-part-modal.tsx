'use client'

import { useState } from 'react'
import { ThemedCard } from '@/components/design-system/themed-card'
import { Button } from '@/components/ui/button'
import { XIcon } from '@/components/icons'
import type { Part, PartType } from '@/lib/types'
import { getPartType } from '@/lib/parts'
import { getValidTargetTypes, getTransform } from '@/lib/transforms'

interface TransformPartModalProps {
  isOpen: boolean
  sourcePart: Part
  onClose: () => void
  onTransform: (targetType: PartType) => void
}

export function TransformPartModal({
  isOpen,
  sourcePart,
  onClose,
  onTransform,
}: TransformPartModalProps) {
  const [selectedTarget, setSelectedTarget] = useState<PartType | null>(null)
  const [generating, setGenerating] = useState(false)

  if (!isOpen) return null

  const sourcePartType = getPartType(sourcePart.type)
  const validTargets = getValidTargetTypes(sourcePart.type)

  const handleGenerate = async () => {
    if (!selectedTarget) return

    setGenerating(true)
    try {
      await onTransform(selectedTarget)
      onClose()
      setSelectedTarget(null)
    } catch (error) {
      console.error('Transform failed:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleCancel = () => {
    setSelectedTarget(null)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <ThemedCard className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Transform Part</h2>
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

          {/* Target Selection */}
          <div className="mb-6">
            <p className="text-sm text-text-secondary mb-3">Transform to:</p>
            {validTargets.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">
                No valid transformations available for this part type
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {validTargets.map((targetType) => {
                  const targetMeta = getPartType(targetType)
                  const transform = getTransform(sourcePart.type, targetType)
                  const isSelected = selectedTarget === targetType

                  return (
                    <button
                      key={targetType}
                      onClick={() => setSelectedTarget(targetType)}
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
                      {transform && (
                        <p className="text-xs text-text-secondary capitalize">
                          {transform.transformType}
                        </p>
                      )}
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
              className="flex-1 bg-primary hover:bg-primary-light text-white"
            >
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </ThemedCard>
      </div>
    </>
  )
}
