'use client'

import { useAppStore } from '@/store/app-store'
import { ProjectCard } from './project-card'

export function ProjectList() {
  const { studioProjects, studioParts, activeProjectId, setActiveProject, deleteProject } =
    useAppStore()

  const getProjectStats = (projectId: string) => {
    const projectParts = studioParts.filter((p) => p.projectId === projectId)
    const partCount = projectParts.length
    const lastUpdated =
      projectParts.length > 0
        ? projectParts.reduce((latest, part) =>
            new Date(part.updatedAt) > new Date(latest) ? part.updatedAt : latest
          , projectParts[0].updatedAt)
        : undefined

    return { partCount, lastUpdated }
  }

  const handleDelete = (projectId: string) => {
    const project = studioProjects.find((p) => p.id === projectId)
    if (!project) return

    const confirmed = window.confirm(
      `Delete "${project.title}"?\n\nThis will delete all ${project.partIds.length} parts inside. This cannot be undone.`
    )

    if (confirmed) {
      deleteProject(projectId)
      // If deleting active project, clear selection
      if (activeProjectId === projectId) {
        setActiveProject(null)
      }
    }
  }

  if (!studioProjects || studioProjects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-text-muted">No projects yet</p>
        <p className="text-xs text-text-secondary mt-1">Generate and save content to create projects</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Playground Button */}
      <button
        onClick={() => setActiveProject(null)}
        className={`
          w-full p-3 rounded-lg border text-left transition-all
          ${
            activeProjectId === null
              ? 'border-primary bg-primary/5 text-text-primary'
              : 'border-border-primary bg-transparent text-text-secondary hover:border-primary/50'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <div className="flex-1">
            <div className="font-medium text-sm">Playground</div>
            <div className="text-xs text-text-muted">Unsaved parts & generation</div>
          </div>
        </div>
      </button>

      {studioProjects.map((project) => {
        const { partCount, lastUpdated } = getProjectStats(project.id)
        const isActive = activeProjectId === project.id
        return (
          <ProjectCard
            key={project.id}
            project={project}
            isActive={isActive}
            partCount={partCount}
            lastUpdated={lastUpdated}
            onClick={() => setActiveProject(isActive ? null : project.id)} // Toggle: click again to deselect
            onDelete={() => handleDelete(project.id)}
          />
        )
      })}
    </div>
  )
}
