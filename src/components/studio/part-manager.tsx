'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { PartCard } from './part-card'
import { TransformPartModal } from './transform-part-modal'
import { formatDistanceToNow } from 'date-fns'
import type { Part, PartType } from '@/lib/types'

interface PartManagerProps {
  projectId: string
}

export function PartManager({ projectId }: PartManagerProps) {
  const { studioProjects, studioParts, deletePart, createPart, addUnsavedPart } = useAppStore()
  const [partToTransform, setPartToTransform] = useState<Part | null>(null)

  const project = studioProjects?.find((p) => p.id === projectId)
  const parts = studioParts?.filter((p) => p.projectId === projectId) || []

  // Sort by updatedAt descending (newest first)
  const sortedParts = [...parts].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  const handleDeletePart = (partId: string) => {
    const part = parts.find((p) => p.id === partId)
    if (!part) return

    const confirmed = window.confirm(
      `Delete this ${part.type.replace('-', ' ')}?\n\nThis cannot be undone.`
    )

    if (confirmed) {
      deletePart(partId)
    }
  }

  const handleTransformPart = (partId: string) => {
    const part = parts.find((p) => p.id === partId)
    if (part) {
      setPartToTransform(part)
    }
  }

  const handleTransformGenerate = async (targetType: PartType) => {
    if (!partToTransform) return

    // Call transform API
    const response = await fetch('/api/parts/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourcePart: partToTransform,
        targetType,
      }),
    })

    const newPart = await response.json()

    // Save to same project (user can move later if needed)
    const partWithProject = {
      ...newPart,
      projectId: projectId,
    }
    createPart(partWithProject)
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">Project not found</p>
      </div>
    )
  }

  // Calculate last updated
  const lastUpdated = parts.length > 0
    ? parts.reduce((latest, part) =>
        new Date(part.updatedAt) > new Date(latest) ? part.updatedAt : latest
      , parts[0].updatedAt)
    : null

  return (
    <div className="p-8">
      {/* Project Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">{project.title}</h1>
        {project.description && (
          <p className="text-sm text-text-muted mb-2">{project.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span>{parts.length} {parts.length === 1 ? 'part' : 'parts'}</span>
          {lastUpdated && (
            <span>Updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}</span>
          )}
        </div>
      </div>

      {/* Parts Grid */}
      {parts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">No parts in this project yet</p>
          <p className="text-sm text-text-secondary mt-2">
            Generate content in the playground and save it here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedParts.map((part) => (
            <PartCard
              key={part.id}
              part={part}
              isSaved={true}
              onDelete={() => handleDeletePart(part.id)}
              onTransform={() => handleTransformPart(part.id)}
            />
          ))}
        </div>
      )}

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
