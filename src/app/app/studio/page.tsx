'use client'

import React from 'react'
import { useAppStore } from '@/store/app-store'
import { ProjectList } from '@/components/studio/project-list'
import { PartManager } from '@/components/studio/part-manager'
import { PartCanvas } from '@/components/studio/part-canvas'

export default function StudioPage() {
  const { activeProjectId, loadStudioData } = useAppStore()

  // Load studio data on mount
  React.useEffect(() => {
    loadStudioData()
  }, [loadStudioData])

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-8">
      {/* Sidebar - Project List */}
      <aside className="w-80 border-r border-border-primary bg-surface-secondary/30 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Projects</h2>
          <ProjectList />
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeProjectId ? (
          <PartManager projectId={activeProjectId} />
        ) : (
          <PartCanvas />
        )}
      </main>
    </div>
  )
}
