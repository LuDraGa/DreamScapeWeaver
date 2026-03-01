'use client'

import { ThemedCard } from '@/components/design-system/themed-card'
import { TrashIcon } from '@/components/icons'
import type { StudioProject } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface ProjectCardProps {
  project: StudioProject
  isActive: boolean
  partCount: number
  lastUpdated?: string
  onClick: () => void
  onDelete: () => void
}

export function ProjectCard({
  project,
  isActive,
  partCount,
  lastUpdated,
  onClick,
  onDelete,
}: ProjectCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    onDelete()
  }

  const getRelativeTime = () => {
    if (!lastUpdated) return 'No updates yet'
    try {
      return formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  return (
    <ThemedCard
      onClick={onClick}
      className={`
        cursor-pointer transition-all hover:border-primary/50 group relative
        ${isActive ? 'border-primary bg-primary/5' : ''}
      `}
    >
      {/* Project Info */}
      <div className="flex items-start gap-3">
        <span className="text-2xl">📁</span>
        <div className="flex-1 min-w-0">
          <h3
            className={`
              font-semibold text-sm mb-1 truncate
              ${isActive ? 'text-primary' : 'text-text-primary'}
            `}
          >
            {project.title}
          </h3>
          <p className="text-xs text-text-muted">
            {partCount} {partCount === 1 ? 'part' : 'parts'} • {getRelativeTime()}
          </p>
        </div>
      </div>

      {/* Delete Button (shows on hover) */}
      <button
        onClick={handleDelete}
        className="
          absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity
          p-1.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-500
        "
        aria-label="Delete project"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </ThemedCard>
  )
}
