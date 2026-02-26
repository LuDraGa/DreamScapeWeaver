'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { ThemedCard } from '@/components/design-system/themed-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrashIcon } from '@/components/icons'
import { formatDate, truncate } from '@/lib/utils'

/**
 * Library Page - View saved dreamscapes and stories
 */
export default function LibraryPage() {
  const { savedDreamscapes, savedOutputs, deleteDreamscape, deleteOutput } = useAppStore()
  const [tab, setTab] = useState<'dreamscapes' | 'stories'>('dreamscapes')
  const [search, setSearch] = useState('')

  const filteredDreamscapes = savedDreamscapes.filter((d) =>
    search ? d.chunks?.some((c) => c.text.toLowerCase().includes(search.toLowerCase())) : true
  )

  const filteredStories = savedOutputs.filter((o) =>
    search
      ? o.text?.toLowerCase().includes(search.toLowerCase()) ||
        o.title?.toLowerCase().includes(search.toLowerCase())
      : true
  )

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-1 text-text-primary">Library</h1>
      <p className="text-sm mb-6 text-text-muted">Your saved dreamscapes and stories</p>

      {/* Search */}
      <Input
        placeholder="Search library..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 bg-[rgba(15,23,42,0.5)] border-[#1e293b] text-text-primary placeholder:text-text-muted"
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[rgba(15,23,42,0.5)]">
        <button
          onClick={() => setTab('dreamscapes')}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: tab === 'dreamscapes' ? '#6366f1' : 'transparent',
            color: tab === 'dreamscapes' ? '#fff' : '#94a3b8',
          }}
        >
          Dreamscapes ({savedDreamscapes.length})
        </button>
        <button
          onClick={() => setTab('stories')}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: tab === 'stories' ? '#6366f1' : 'transparent',
            color: tab === 'stories' ? '#fff' : '#94a3b8',
          }}
        >
          Stories ({savedOutputs.length})
        </button>
      </div>

      {/* Dreamscapes Tab */}
      {tab === 'dreamscapes' && (
        <div>
          {filteredDreamscapes.length === 0 ? (
            <ThemedCard>
              <p className="text-center text-text-muted py-8">
                {search ? 'No dreamscapes match your search' : 'No saved dreamscapes yet'}
              </p>
            </ThemedCard>
          ) : (
            <div className="space-y-3">
              {filteredDreamscapes.map((dreamscape) => (
                <ThemedCard key={dreamscape.id} className="border-[#1e293b]">
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
      )}

      {/* Stories Tab */}
      {tab === 'stories' && (
        <div>
          {filteredStories.length === 0 ? (
            <ThemedCard>
              <p className="text-center text-text-muted py-8">
                {search ? 'No stories match your search' : 'No saved stories yet'}
              </p>
            </ThemedCard>
          ) : (
            <div className="space-y-3">
              {filteredStories.map((output) => (
                <ThemedCard key={output.id} className="border-[#1e293b]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary mb-1">{output.title}</h3>
                      <p className="text-sm text-text-muted mb-2">{truncate(output.text, 200)}</p>
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
      )}
    </div>
  )
}
