'use client'

import { useAppStore } from '@/store/app-store'
import { ThemedCard } from '@/components/design-system/themed-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrashIcon } from '@/components/icons'
import { formatDate, truncate } from '@/lib/utils'

/**
 * Library Page - View saved dreamscapes and outputs
 *
 * TODO: Break into feature components:
 * - DreamscapeCard
 * - OutputCard
 * - PerformanceForm
 */
export default function LibraryPage() {
  const { savedDreamscapes, savedOutputs, deleteDreamscape, deleteOutput } = useAppStore()

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-1 text-text-primary">Library</h1>
      <p className="text-sm mb-6 text-text-muted">Your saved dreamscapes and outputs</p>

      {/* Search */}
      <Input
        placeholder="Search library..."
        className="mb-6 bg-[rgba(15,23,42,0.5)] border-[#1e293b] text-text-primary placeholder:text-text-muted"
      />

      {/* Dreamscapes Section */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4 text-text-primary">
          Dreamscapes ({savedDreamscapes.length})
        </h2>
        {savedDreamscapes.length === 0 ? (
          <ThemedCard>
            <p className="text-center text-text-muted py-8">No saved dreamscapes yet</p>
          </ThemedCard>
        ) : (
          <div className="space-y-3">
            {savedDreamscapes.map((dreamscape) => (
              <ThemedCard key={dreamscape.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary mb-1">{dreamscape.title}</h3>
                    <p className="text-sm text-text-muted mb-2">
                      {truncate(dreamscape.chunks[0]?.text || '', 150)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {dreamscape.chunks.length} part(s) • {formatDate(dreamscape.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteDreamscape(dreamscape.id)}
                    className="text-text-muted hover:text-red-400"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </ThemedCard>
            ))}
          </div>
        )}
      </div>

      {/* Outputs Section */}
      <div>
        <h2 className="text-lg font-medium mb-4 text-text-primary">Outputs ({savedOutputs.length})</h2>
        {savedOutputs.length === 0 ? (
          <ThemedCard>
            <p className="text-center text-text-muted py-8">No saved outputs yet</p>
          </ThemedCard>
        ) : (
          <div className="space-y-3">
            {savedOutputs.map((output) => (
              <ThemedCard key={output.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary mb-1">{output.title}</h3>
                    <p className="text-sm text-text-muted mb-2">
                      {truncate(output.text, 200)}
                    </p>
                    <p className="text-xs text-text-muted">{formatDate(output.createdAt)}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteOutput(output.id)}
                    className="text-text-muted hover:text-red-400"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </ThemedCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
