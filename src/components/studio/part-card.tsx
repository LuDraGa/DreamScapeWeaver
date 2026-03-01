'use client'

import { ThemedCard } from '@/components/design-system/themed-card'
import { TrashIcon } from '@/components/icons'
import type { Part } from '@/lib/types'
import { getPartType } from '@/lib/parts'
import { formatDistanceToNow } from 'date-fns'

interface PartCardProps {
  part: Part
  isActive?: boolean
  isSaved: boolean // Has projectId
  onClick: () => void
  onDelete: () => void
  onSave?: () => void // Only for unsaved parts
  onRegenerate?: () => void
}

export function PartCard({
  part,
  isActive = false,
  isSaved,
  onClick,
  onDelete,
  onSave,
  onRegenerate,
}: PartCardProps) {
  const partType = getPartType(part.type)
  const preview = part.content.slice(0, 80) + (part.content.length > 80 ? '...' : '')

  const getRelativeTime = () => {
    try {
      return formatDistanceToNow(new Date(part.createdAt), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSave?.()
  }

  const handleRegenerate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRegenerate?.()
  }

  return (
    <ThemedCard
      onClick={onClick}
      className={`
        cursor-pointer transition-all hover:border-primary/50 group relative
        ${isActive ? 'border-primary bg-primary/5' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <span className="text-2xl">{partType.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`
                font-semibold text-sm truncate
                ${isActive ? 'text-primary' : 'text-text-primary'}
              `}
            >
              {part.title}
            </h3>
            {!isSaved && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 shrink-0">
                UNSAVED
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1 line-clamp-2">{preview}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
        <span>{part.metadata.wordCount} words</span>
        <span>•</span>
        <span>{getRelativeTime()}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!isSaved && onSave && (
          <button
            onClick={handleSave}
            className="
              flex-1 px-3 py-1.5 text-xs rounded
              bg-primary hover:bg-primary-light text-white
              transition-colors
            "
          >
            💾 Save
          </button>
        )}
        {onRegenerate && (
          <button
            onClick={handleRegenerate}
            className="
              flex-1 px-3 py-1.5 text-xs rounded
              bg-transparent hover:bg-background-secondary
              border border-border-primary text-text-secondary
              transition-colors
            "
          >
            🔄 Regenerate
          </button>
        )}
        <button
          onClick={handleDelete}
          className="
            p-1.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-500
            transition-colors
          "
          aria-label="Delete part"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </ThemedCard>
  )
}
