'use client'

import { useAppStore } from '@/store/app-store'

interface PartManagerProps {
  projectId: string
}

export function PartManager({ projectId }: PartManagerProps) {
  const { studioProjects, studioParts } = useAppStore()

  const project = studioProjects?.find((p) => p.id === projectId)
  const parts = studioParts?.filter((p) => p.projectId === projectId) || []

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">Project not found</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{project.title}</h1>
        {project.description && (
          <p className="text-sm text-text-muted mt-1">{project.description}</p>
        )}
      </div>

      {parts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">No parts in this project yet</p>
          <p className="text-sm text-text-secondary mt-2">
            Generate content to add parts
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            {parts.length} {parts.length === 1 ? 'part' : 'parts'}
          </p>
          {/* TODO: Render part cards */}
        </div>
      )}
    </div>
  )
}
