'use client'

import { SparklesIcon } from '@/components/icons'

export function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <SparklesIcon className="w-8 h-8 text-primary" />
        </div>

        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Welcome to Studio
        </h2>

        <p className="text-text-muted mb-4">
          Select a project from the sidebar to view its parts, or create a new project to get started.
        </p>

        <p className="text-sm text-text-secondary">
          Studio lets you transform any content into any other format — non-linearly.
        </p>
      </div>
    </div>
  )
}
