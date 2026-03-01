'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ThemedCard } from '@/components/design-system/themed-card'
import { XIcon } from '@/components/icons'
import { useAppStore } from '@/store/app-store'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const createProject = useAppStore((state) => state.createProject)

  const handleCreate = () => {
    if (!title.trim()) return

    createProject({
      title: title.trim(),
      description: description.trim() || undefined,
      partIds: [],
    })

    // Reset and close
    setTitle('')
    setDescription('')
    onClose()
  }

  const handleCancel = () => {
    setTitle('')
    setDescription('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <ThemedCard className="w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Create New Project</h2>
            <button
              onClick={handleCancel}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Project Name
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Amazing Project"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && title.trim()) {
                    handleCreate()
                  }
                }}
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
                rows={3}
              />
            </div>
          </div>

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
              onClick={handleCreate}
              disabled={!title.trim()}
              className="flex-1 bg-primary hover:bg-primary-light text-white"
            >
              Create Project
            </Button>
          </div>
        </ThemedCard>
      </div>
    </>
  )
}
