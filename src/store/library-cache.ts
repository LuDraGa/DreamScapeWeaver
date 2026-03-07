import { create } from 'zustand'
import type { Dreamscape, OutputVariant } from '@/lib/types'

const STALE_MS = 30_000 // 30 seconds

type PersistenceAdapter = {
  getDreamscapes(): Promise<Dreamscape[]>
  getOutputs(): Promise<OutputVariant[]>
}

interface LibraryCacheState {
  dreamscapes: Dreamscape[]
  outputs: OutputVariant[]
  fetchedAt: number | null
  isLoading: boolean
  isBackgroundRefresh: boolean

  load: (adapter: PersistenceAdapter) => Promise<void>
  invalidate: () => void

  // Optimistic mutation helpers
  addDreamscape: (d: Dreamscape) => void
  updateDreamscape: (d: Dreamscape) => void
  removeDreamscape: (id: string) => void
  addOutput: (o: OutputVariant) => void
  updateOutput: (o: OutputVariant) => void
  removeOutput: (id: string) => void
}

export const useLibraryCache = create<LibraryCacheState>()((set, get) => ({
  dreamscapes: [],
  outputs: [],
  fetchedAt: null,
  isLoading: false,
  isBackgroundRefresh: false,

  load: async (adapter) => {
    const { fetchedAt } = get()
    const now = Date.now()

    // Fresh cache — skip entirely
    if (fetchedAt && now - fetchedAt < STALE_MS) return

    // Stale cache exists — background refresh (no loading spinner)
    if (fetchedAt) {
      set({ isBackgroundRefresh: true })
    } else {
      // No cache — full loading state
      set({ isLoading: true })
    }

    try {
      const [ds, outs] = await Promise.all([
        adapter.getDreamscapes(),
        adapter.getOutputs(),
      ])
      set({
        dreamscapes: ds,
        outputs: outs,
        fetchedAt: Date.now(),
      })
    } catch (error) {
      console.error('Library cache fetch failed:', error)
    } finally {
      set({ isLoading: false, isBackgroundRefresh: false })
    }
  },

  invalidate: () => set({
    dreamscapes: [],
    outputs: [],
    fetchedAt: null,
    isLoading: false,
    isBackgroundRefresh: false,
  }),

  // Dreamscape mutations
  addDreamscape: (d) => set((s) => ({
    dreamscapes: [d, ...s.dreamscapes.filter((x) => x.id !== d.id)],
  })),

  updateDreamscape: (d) => set((s) => ({
    dreamscapes: s.dreamscapes.map((x) => x.id === d.id ? d : x),
  })),

  removeDreamscape: (id) => set((s) => ({
    dreamscapes: s.dreamscapes.filter((x) => x.id !== id),
  })),

  // Output mutations
  addOutput: (o) => set((s) => ({
    outputs: [o, ...s.outputs.filter((x) => x.id !== o.id)],
  })),

  updateOutput: (o) => set((s) => ({
    outputs: s.outputs.map((x) => x.id === o.id ? o : x),
  })),

  removeOutput: (id) => set((s) => ({
    outputs: s.outputs.filter((x) => x.id !== id),
  })),
}))
