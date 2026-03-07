'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { useAuth } from '@/lib/auth/context'
import { getPersistenceAdapter } from '@/lib/persistence'
import { useLibraryCache } from '@/store/library-cache'
import { ThemedCard } from '@/components/design-system/themed-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CopyButton } from '@/components/design-system/copy-button'
import { TrashIcon, Star } from '@/components/icons'
import { formatDate } from '@/lib/utils'
import { PRESETS } from '@/lib/config'
import { getTemplateById } from '@/lib/templates'
import { uid } from '@/lib/utils'
import type { Dreamscape, OutputVariant, TemplateCategory } from '@/lib/types'

// ── utils ─────────────────────────────────────────────────────────────────────

function extractHook(text: string, maxLen = 160): string {
  const first = text.match(/^[^.!?\n]+[.!?]?/)?.[0]?.trim() ?? text
  return first.length > maxLen ? first.slice(0, maxLen) + '…' : first
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

// ── inline rename ─────────────────────────────────────────────────────────────

function InlineTitle({
  title,
  className,
  onRename,
}: {
  title: string
  className?: string
  onRename: (t: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { onRename(value.trim() || title); setEditing(false) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { onRename(value.trim() || title); setEditing(false) }
          if (e.key === 'Escape') { setValue(title); setEditing(false) }
        }}
        className={`bg-transparent border-b border-[#6366f1] outline-none text-text-primary ${className ?? ''}`}
        style={{ minWidth: 120 }}
      />
    )
  }

  return (
    <span
      onDoubleClick={() => setEditing(true)}
      title="Double-click to rename"
      className={`cursor-text select-none ${className ?? ''}`}
    >
      {title}
    </span>
  )
}

// ── badges ────────────────────────────────────────────────────────────────────

function OriginBadge({ origin }: { origin?: Dreamscape['origin'] }) {
  const map = {
    manual: { label: 'Manual', bg: 'rgba(100,116,139,0.18)', color: '#94a3b8' },
    generated: { label: 'AI Generated', bg: 'rgba(99,102,241,0.14)', color: '#a5b4fc' },
    derived: { label: 'Derived', bg: 'rgba(168,85,247,0.14)', color: '#d8b4fe' },
  }
  const s = map[origin ?? 'manual']
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

const PLATFORM_COLORS: Record<string, { bg: string; color: string }> = {
  reddit: { bg: 'rgba(255,69,0,0.12)', color: '#ff9a6c' },
  reels:  { bg: 'rgba(236,72,153,0.12)', color: '#f9a8d4' },
  tiktok: { bg: 'rgba(20,184,166,0.12)', color: '#5eead4' },
  blog:   { bg: 'rgba(234,179,8,0.12)', color: '#fde047' },
}

const CATEGORY_COLORS: Record<TemplateCategory, { bg: string; color: string }> = {
  reddit:            { bg: 'rgba(255,69,0,0.12)',    color: '#ff9a6c' },
  'short-form':      { bg: 'rgba(20,184,166,0.12)',  color: '#5eead4' },
  'long-form':       { bg: 'rgba(234,179,8,0.12)',   color: '#fde047' },
  'video-production':{ bg: 'rgba(168,85,247,0.12)',  color: '#d8b4fe' },
  'audio-production':{ bg: 'rgba(236,72,153,0.12)',  color: '#f9a8d4' },
  marketing:         { bg: 'rgba(99,102,241,0.12)',  color: '#a5b4fc' },
}

function PlatformBadge({ platform, presetId }: { platform?: string; presetId?: string }) {
  const template = presetId ? getTemplateById(presetId) : undefined
  if (template) {
    const c = CATEGORY_COLORS[template.category] ?? { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' }
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
        style={{ background: c.bg, color: c.color }}>
        {template.icon} {template.displayName}
      </span>
    )
  }

  const preset = PRESETS.find((p) => p.id === presetId)
  const label = preset ? `${preset.emoji} ${preset.name}` : platform ?? 'Unknown'
  const c = PLATFORM_COLORS[platform ?? ''] ?? { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
      style={{ background: c.bg, color: c.color }}>
      {label}
    </span>
  )
}

// ── star rating ───────────────────────────────────────────────────────────────

function StarRating({ rating, outputId, onRate }: {
  rating?: number
  outputId: string
  onRate: (id: string, r: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button key={n}
          onClick={() => onRate(outputId, n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >
          <Star className="w-3 h-3 transition-colors" style={{
            color: n <= (hover || rating || 0) ? '#fbbf24' : '#334155',
            fill:  n <= (hover || rating || 0) ? '#fbbf24' : 'none',
          }} />
        </button>
      ))}
    </div>
  )
}

// ── multi-select filter ───────────────────────────────────────────────────────

type ChipState = Record<string, boolean | undefined>

function useMultiFilter() {
  const [chips, setChips] = useState<ChipState>({})

  const toggle = (id: string) => {
    setChips((prev) => {
      const cur = prev[id]
      if (cur === undefined) return { ...prev, [id]: true }
      if (cur === true)      return { ...prev, [id]: false }
      return { ...prev, [id]: undefined }
    })
  }

  const selected  = Object.entries(chips).filter(([, v]) => v === true).map(([k]) => k)
  const excluded  = Object.entries(chips).filter(([, v]) => v === false).map(([k]) => k)
  const hasActive = selected.length > 0 || excluded.length > 0

  const matches = (value: string | undefined) => {
    if (!value) return selected.length === 0
    if (excluded.includes(value)) return false
    if (selected.length > 0 && !selected.includes(value)) return false
    return true
  }

  const reset = () => setChips({})

  return { chips, toggle, selected, excluded, hasActive, matches, reset }
}

function MultiFilterChips({
  options,
  chips,
  onToggle,
  counts,
}: {
  options: { id: string; label: string }[]
  chips: ChipState
  onToggle: (id: string) => void
  counts?: Record<string, number>
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const state = chips[opt.id]
        const count = counts?.[opt.id] ?? 0
        const isEmpty = counts !== undefined && count === 0

        let bg = 'rgba(15,23,42,0.6)'
        let color = isEmpty ? '#334155' : '#64748b'
        let border = '#1e293b'

        if (state === true) {
          bg = '#6366f1'; color = '#fff'; border = '#6366f1'
        } else if (state === false) {
          bg = 'rgba(239,68,68,0.12)'; color = '#f87171'; border = '#ef4444'
        }

        return (
          <button
            key={opt.id}
            onClick={() => !isEmpty && onToggle(opt.id)}
            disabled={isEmpty}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 disabled:cursor-default"
            style={{ background: bg, color, border: `1px solid ${border}` }}
            title={state === true ? 'Click to exclude' : state === false ? 'Click to clear' : 'Click to include'}
          >
            {state === false && <span className="opacity-70">✕</span>}
            {opt.label}
            {counts !== undefined && (
              <span className="opacity-50 text-[10px]">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Seeds tab ─────────────────────────────────────────────────────────────────

function SeedsTab({
  dreamscapes,
  outputs,
  onDelete,
  onRename,
  onPromote,
}: {
  dreamscapes: Dreamscape[]
  outputs: OutputVariant[]
  onDelete: (id: string) => void
  onRename: (dreamscape: Dreamscape, title: string) => void
  onPromote: (outputId: string) => void
}) {
  const router = useRouter()
  const { setCurrentDreamscape } = useAppStore()
  const [search, setSearch] = useState('')
  const originFilter = useMultiFilter()

  const originOptions = [
    { id: 'manual',    label: 'Manual' },
    { id: 'generated', label: 'AI Generated' },
    { id: 'derived',   label: 'Derived' },
  ]

  const originCounts = useMemo(() => ({
    manual:    dreamscapes.filter((d) => (d.origin ?? 'manual') === 'manual').length,
    generated: dreamscapes.filter((d) => d.origin === 'generated').length,
    derived:   dreamscapes.filter((d) => d.origin === 'derived').length,
  }), [dreamscapes])

  const filtered = useMemo(() => {
    return dreamscapes.filter((d) => {
      if (!originFilter.matches(d.origin ?? 'manual')) return false
      if (search) {
        const q = search.toLowerCase()
        return d.title.toLowerCase().includes(q) || d.chunks.some((c) => c.text.toLowerCase().includes(q))
      }
      return true
    })
  }, [dreamscapes, originFilter.chips, search])

  const outputCountFor = (id: string) => outputs.filter((o) => o.dreamscapeId === id).length

  const sourceOutputFor = (sourceOutputId?: string) =>
    sourceOutputId ? outputs.find((o) => o.id === sourceOutputId) : null

  const handleContinue = (dreamscape: Dreamscape) => {
    // setCurrentDreamscape always resets all ephemeral flow state — clean slate
    setCurrentDreamscape(dreamscape)
    router.push('/app/create')
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search seeds…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-[rgba(15,23,42,0.5)] border-[#1e293b] text-text-primary placeholder:text-text-muted"
      />

      <div className="space-y-1.5">
        <p className="text-xs text-text-muted">Origin</p>
        <MultiFilterChips
          options={originOptions}
          chips={originFilter.chips}
          onToggle={originFilter.toggle}
          counts={originCounts}
        />
      </div>

      {originFilter.hasActive && (
        <button onClick={originFilter.reset} className="text-xs text-text-muted hover:text-text-primary underline">
          Clear filters
        </button>
      )}

      {filtered.length === 0 ? (
        <ThemedCard>
          <p className="text-center text-text-muted py-8 text-sm">
            {search || originFilter.hasActive ? 'No seeds match your filters' : 'No saved seeds yet'}
          </p>
        </ThemedCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((dreamscape) => {
            const outputCount = outputCountFor(dreamscape.id)
            const sourceOutput = sourceOutputFor(dreamscape.sourceOutputId)
            const hook = extractHook(dreamscape.chunks[0]?.text || '')

            return (
              <ThemedCard key={dreamscape.id} className="border-[#1e293b]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-medium mb-1.5 leading-snug">
                      &ldquo;{hook}&rdquo;
                    </p>

                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <InlineTitle
                        title={dreamscape.title}
                        className="text-xs text-text-muted"
                        onRename={(t) => onRename(dreamscape, t)}
                      />
                      <OriginBadge origin={dreamscape.origin} />
                    </div>

                    {sourceOutput && (
                      <p className="text-xs text-text-muted mb-1.5">
                        <span style={{ color: '#6366f1' }}>←</span>{' '}
                        from &ldquo;{truncate(sourceOutput.title, 40)}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span>{dreamscape.chunks.length} chunk{dreamscape.chunks.length !== 1 ? 's' : ''}</span>
                      {outputCount > 0 && (
                        <span style={{ color: '#6366f1' }}>
                          {outputCount} output{outputCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span>{formatDate(dreamscape.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleContinue(dreamscape)}
                      className="text-xs"
                      style={{
                        background: 'rgba(99,102,241,0.15)',
                        color: '#a5b4fc',
                        border: '1px solid rgba(99,102,241,0.25)',
                      }}
                    >
                      Continue →
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(dreamscape.id)}
                      className="text-text-muted hover:text-red-400 h-7 w-7"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </ThemedCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Content tab ───────────────────────────────────────────────────────────────

const ALL_PLATFORMS = [
  { id: 'reddit', label: 'Reddit' },
  { id: 'reels',  label: 'Reels' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'blog',   label: 'Blog' },
]

function ContentTab({
  outputs,
  dreamscapes,
  onDelete,
  onRate,
  onRename,
  onPromoteToSeed,
}: {
  outputs: OutputVariant[]
  dreamscapes: Dreamscape[]
  onDelete: (id: string) => void
  onRate: (id: string, rating: number) => void
  onRename: (id: string, title: string) => void
  onPromoteToSeed: (outputId: string) => void
}) {
  const [search, setSearch] = useState('')
  const [minRating, setMinRating] = useState<8 | 9 | null>(null)
  const platformFilter = useMultiFilter()
  const presetFilter   = useMultiFilter()

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    ALL_PLATFORMS.forEach(({ id }) => {
      counts[id] = outputs.filter((o) => o.dialState?.platform === id).length
    })
    return counts
  }, [outputs])

  const presetOptions = useMemo(() =>
    PRESETS.map((p) => ({ id: p.id, label: `${p.emoji} ${p.name}` }))
  , [])

  const presetCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    PRESETS.forEach((p) => {
      counts[p.id] = outputs.filter((o) => o.dialState?.presetId === p.id).length
    })
    return counts
  }, [outputs])

  const hasActiveFilters = platformFilter.hasActive || presetFilter.hasActive || minRating !== null

  const filtered = useMemo(() => {
    return outputs.filter((o) => {
      if (!platformFilter.matches(o.dialState?.platform)) return false
      if (!presetFilter.matches(o.dialState?.presetId))   return false
      if (minRating !== null && (o.rating ?? 0) < minRating) return false
      if (search) {
        const q = search.toLowerCase()
        return o.title?.toLowerCase().includes(q) || o.text?.toLowerCase().includes(q)
      }
      return true
    })
  }, [outputs, platformFilter.chips, presetFilter.chips, minRating, search])

  const sourceDreamscapeFor = (dreamscapeId?: string) =>
    dreamscapeId ? dreamscapes.find((d) => d.id === dreamscapeId) : null

  const resetAll = () => {
    platformFilter.reset()
    presetFilter.reset()
    setMinRating(null)
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search content…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-[rgba(15,23,42,0.5)] border-[#1e293b] text-text-primary placeholder:text-text-muted"
      />

      <div className="space-y-1.5">
        <p className="text-xs text-text-muted">Platform</p>
        <MultiFilterChips
          options={ALL_PLATFORMS}
          chips={platformFilter.chips}
          onToggle={platformFilter.toggle}
          counts={platformCounts}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-text-muted">Format</p>
        <MultiFilterChips
          options={presetOptions}
          chips={presetFilter.chips}
          onToggle={presetFilter.toggle}
          counts={presetCounts}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {([8, 9] as const).map((threshold) => (
          <button
            key={threshold}
            onClick={() => setMinRating(minRating === threshold ? null : threshold)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: minRating === threshold ? '#fbbf24' : 'rgba(15,23,42,0.6)',
              color: minRating === threshold ? '#000' : '#64748b',
              border: `1px solid ${minRating === threshold ? '#fbbf24' : '#1e293b'}`,
            }}
          >
            {threshold}★+
          </button>
        ))}
        {hasActiveFilters && (
          <button onClick={resetAll} className="text-xs text-text-muted hover:text-text-primary underline">
            Clear all
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <ThemedCard>
          <p className="text-center text-text-muted py-8 text-sm">
            {hasActiveFilters || search ? 'No content matches your filters' : 'No saved content yet'}
          </p>
        </ThemedCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((output) => {
            const source = sourceDreamscapeFor(output.dreamscapeId)
            const hook   = extractHook(output.text)

            return (
              <ThemedCard key={output.id} className="border-[#1e293b]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <PlatformBadge platform={output.dialState?.platform} presetId={output.dialState?.presetId} />
                    <StarRating rating={output.rating} outputId={output.id} onRate={onRate} />
                    <span className="text-xs text-text-muted ml-auto">{formatDate(output.createdAt)}</span>
                  </div>

                  <p className="text-sm text-text-primary font-medium mb-1.5 leading-snug">
                    &ldquo;{hook}&rdquo;
                  </p>

                  <div className="flex items-center gap-2 mb-1.5">
                    <InlineTitle
                      title={output.title}
                      className="text-xs text-text-muted"
                      onRename={(t) => onRename(output.id, t)}
                    />
                  </div>

                  {source && (
                    <p className="text-xs text-text-muted mb-2">
                      <span style={{ color: '#475569' }}>seed:</span>{' '}
                      {truncate(source.title, 50)}
                    </p>
                  )}

                  <div className="flex items-center gap-1 pt-1 border-t border-[#1e293b]">
                    <CopyButton text={output.text} />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onPromoteToSeed(output.id)}
                      className="text-xs text-text-muted hover:text-[#d8b4fe] h-7 px-2"
                      title="Promote to seed for further generation"
                    >
                      ↑ Use as seed
                    </Button>
                    <div className="flex-1" />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(output.id)}
                      className="text-text-muted hover:text-red-400 h-7 w-7"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </ThemedCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type LibraryTab = 'seeds' | 'content'

export default function LibraryPage() {
  const { isGuest } = useAuth()
  const { saveDreamscape } = useAppStore()

  const {
    dreamscapes,
    outputs,
    isLoading: loading,
    load: loadCache,
    addDreamscape: cacheAddDreamscape,
    updateDreamscape: cacheUpdateDreamscape,
    removeDreamscape: cacheRemoveDreamscape,
    addOutput: cacheAddOutput,
    updateOutput: cacheUpdateOutput,
    removeOutput: cacheRemoveOutput,
  } = useLibraryCache()

  const [tab, setTab] = useState<LibraryTab>('seeds')

  const adapter = getPersistenceAdapter(isGuest)

  useEffect(() => { loadCache(adapter) }, [isGuest])

  // ── dreamscape mutations ───────────────────────────────────────────────────

  const handleDeleteDreamscape = async (id: string) => {
    cacheRemoveDreamscape(id)
    await adapter.deleteDreamscape(id).catch(console.error)
  }

  const handleRenameDreamscape = async (dreamscape: Dreamscape, title: string) => {
    const updated = { ...dreamscape, title, updatedAt: new Date().toISOString() }
    cacheUpdateDreamscape(updated)
    await adapter.saveDreamscape(updated).catch(console.error)
  }

  // ── output mutations ───────────────────────────────────────────────────────

  const handleDeleteOutput = async (id: string) => {
    cacheRemoveOutput(id)
    await adapter.deleteOutput(id).catch(console.error)
  }

  const handleRateOutput = async (id: string, rating: number) => {
    const found = outputs.find((o) => o.id === id)
    if (!found) return
    cacheUpdateOutput({ ...found, rating })
    await adapter.saveOutput({ ...found, rating }).catch(console.error)
  }

  const handleRenameOutput = async (id: string, title: string) => {
    const found = outputs.find((o) => o.id === id)
    if (!found) return
    cacheUpdateOutput({ ...found, title })
    await adapter.saveOutput({ ...found, title }).catch(console.error)
  }

  const handlePromoteToSeed = async (outputId: string) => {
    const output = outputs.find((o) => o.id === outputId)
    if (!output) return

    const now = new Date().toISOString()
    const newDreamscape: Dreamscape = {
      id: uid(),
      title: `From: ${output.title}`,
      chunks: [{ id: uid(), title: 'Promoted seed', text: output.text }],
      origin: 'derived',
      sourceOutputId: outputId,
      createdAt: now,
      updatedAt: now,
    }

    cacheAddDreamscape(newDreamscape)
    await saveDreamscape(newDreamscape).catch(console.error)
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-1 text-text-primary">Library</h1>
      <p className="text-sm mb-6 text-text-muted">Browse seeds to continue generating, or review past content</p>

      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[rgba(15,23,42,0.5)]">
        <button
          onClick={() => setTab('seeds')}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: tab === 'seeds' ? '#6366f1' : 'transparent',
            color: tab === 'seeds' ? '#fff' : '#94a3b8',
          }}
        >
          Seeds ({dreamscapes.length})
        </button>
        <button
          onClick={() => setTab('content')}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: tab === 'content' ? '#6366f1' : 'transparent',
            color: tab === 'content' ? '#fff' : '#94a3b8',
          }}
        >
          Content ({outputs.length})
        </button>
      </div>

      {loading ? (
        <ThemedCard>
          <p className="text-center text-text-muted py-8 text-sm">Loading…</p>
        </ThemedCard>
      ) : tab === 'seeds' ? (
        <SeedsTab
          dreamscapes={dreamscapes}
          outputs={outputs}
          onDelete={handleDeleteDreamscape}
          onRename={handleRenameDreamscape}
          onPromote={handlePromoteToSeed}
        />
      ) : (
        <ContentTab
          outputs={outputs}
          dreamscapes={dreamscapes}
          onDelete={handleDeleteOutput}
          onRate={handleRateOutput}
          onRename={handleRenameOutput}
          onPromoteToSeed={handlePromoteToSeed}
        />
      )}
    </div>
  )
}
