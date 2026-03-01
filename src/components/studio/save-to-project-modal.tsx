'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ThemedCard } from '@/components/design-system/themed-card'
import { XIcon } from '@/components/icons'
import { useAppStore } from '@/store/app-store'
import type { Part } from '@/lib/types'

interface SaveToProjectModalProps {
  isOpen: boolean
  onClose: () => void
  partToSave: Part | null
}

export function SaveToProjectModal({ isOpen, onClose, partToSave }: SaveToProjectModalProps) {
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')

  const {
    studioProjects,
    createProject,
    createPart,
    removeUnsavedPart,
  } = useAppStore()

  // Auto-fill project name from part title when modal opens
  useEffect(() => {
    if (isOpen && partToSave) {
      setProjectName(partToSave.title || 'Untitled Project')
      // Default to 'new' if no projects, otherwise 'existing'
      setMode(studioProjects.length === 0 ? 'new' : 'existing')
      setSelectedProjectId(studioProjects[0]?.id || '')
    }
  }, [isOpen, partToSave, studioProjects])

  const handleSave = () => {
    if (!partToSave) return

    if (mode === 'new') {
      // Create new project
      if (!projectName.trim()) return

      const newProject = createProject({
        title: projectName.trim(),
        description: description.trim() || undefined,
        partIds: [],
      })

      // Save part with projectId
      const partWithProject = {
        ...partToSave,
        projectId: newProject.id,
      }
      createPart(partWithProject)

      // Remove from unsaved parts
      removeUnsavedPart(partToSave.id)

      // Don't navigate - let user continue working on unsaved parts
      // They can click the project in sidebar when ready to view it
    } else {
      // Add to existing project
      if (!selectedProjectId) return

      const partWithProject = {
        ...partToSave,
        projectId: selectedProjectId,
      }
      createPart(partWithProject)

      // Remove from unsaved parts
      removeUnsavedPart(partToSave.id)

      // Don't navigate - let user continue working
    }

    // Reset and close
    handleCancel()
  }

  const handleCancel = () => {
    setProjectName('')
    setDescription('')
    setSelectedProjectId('')
    onClose()
  }

  if (!isOpen || !partToSave) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleCancel} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <ThemedCard className="w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Save Part to Project</h2>
            <button
              onClick={handleCancel}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Part Preview */}
          <div className="mb-4 p-3 rounded bg-background-secondary border border-border-primary">
            <p className="text-xs text-text-muted mb-1">Saving:</p>
            <p className="text-sm font-medium text-text-primary truncate">{partToSave.title}</p>
          </div>

          {/* Mode Selection */}
          {studioProjects.length > 0 && (
            <div className="space-y-2 mb-4">
              <button
                onClick={() => setMode('new')}
                className={`
                  w-full p-3 rounded border text-left transition-all
                  ${
                    mode === 'new'
                      ? 'border-primary bg-primary/5 text-text-primary'
                      : 'border-border-primary bg-transparent text-text-secondary hover:border-primary/50'
                  }
                `}
              >
                <div className="font-medium text-sm">Create New Project</div>
                <div className="text-xs text-text-muted mt-1">
                  Start a new project with this part
                </div>
              </button>

              <button
                onClick={() => setMode('existing')}
                className={`
                  w-full p-3 rounded border text-left transition-all
                  ${
                    mode === 'existing'
                      ? 'border-primary bg-primary/5 text-text-primary'
                      : 'border-border-primary bg-transparent text-text-secondary hover:border-primary/50'
                  }
                `}
              >
                <div className="font-medium text-sm">Add to Existing Project</div>
                <div className="text-xs text-text-muted mt-1">
                  Add this part to one of your {studioProjects.length} projects
                </div>
              </button>
            </div>
          )}

          {/* Form */}
          {mode === 'new' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Project Name
                </label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Project"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description (optional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A collection of stories about..."
                  rows={2}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Select Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="
                  w-full px-3 py-2 rounded border border-border-primary
                  bg-background text-text-primary text-sm
                  focus:outline-none focus:border-primary
                "
              >
                {studioProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title} ({project.partIds.length}{' '}
                    {project.partIds.length === 1 ? 'part' : 'parts'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-transparent border-border-primary text-text-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={mode === 'new' ? !projectName.trim() : !selectedProjectId}
              className="flex-1 bg-primary hover:bg-primary-light text-white"
            >
              {mode === 'new' ? 'Create & Save' : 'Add to Project'}
            </Button>
          </div>
        </ThemedCard>
      </div>
    </>
  )
}
