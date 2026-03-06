import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dreamscape, OutputVariant, AppSettings, DialState } from '@/lib/types'
import { getPersistenceAdapter } from '@/lib/persistence'
import { PRESETS } from '@/lib/config'
import { uid } from '@/lib/utils'

interface AppState {
  // Auth routing — set by AuthProvider when session resolves
  isGuest: boolean
  setUserAuthState: (isGuest: boolean) => void

  // UI state
  loginModalOpen: boolean
  openLoginModal: () => void
  closeLoginModal: () => void

  // Create flow state
  currentDreamscape: Dreamscape | null
  currentDialState: DialState | null
  generatedVariants: OutputVariant[]
  activeVariantIndex: number

  // Library state
  savedDreamscapes: Dreamscape[]
  savedOutputs: OutputVariant[]

  // Settings
  settings: AppSettings

  // Actions - Create flow
  setCurrentDreamscape: (dreamscape: Dreamscape | null) => void
  setCurrentDialState: (dialState: DialState) => void
  setGeneratedVariants: (variants: OutputVariant[]) => void
  setActiveVariantIndex: (index: number) => void

  // Actions - Library
  saveDreamscape: (dreamscape: Dreamscape) => void
  saveOutput: (output: OutputVariant) => void
  deleteDreamscape: (id: string) => void
  deleteOutput: (id: string) => void
  rateOutput: (id: string, rating: number) => void
  updateOutput: (id: string, updates: Partial<OutputVariant>) => void
  promoteToSeed: (outputId: string) => Dreamscape | null
  loadLibraryData: () => Promise<void>

  // Actions - Settings
  updateSettings: (settings: Partial<AppSettings>) => void

  // Helpers
  clearCreateFlow: () => void
}

/**
 * Main app store using Zustand
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isGuest: true, // optimistic — AuthProvider sets the real value on session resolve
      setUserAuthState: (isGuest) => set({ isGuest }),

      loginModalOpen: false,
      openLoginModal: () => set({ loginModalOpen: true }),
      closeLoginModal: () => set({ loginModalOpen: false }),

      currentDreamscape: null,
      currentDialState: null,
      generatedVariants: [],
      activeVariantIndex: 0,
      savedDreamscapes: [],
      savedOutputs: [],
      settings: {
        defaultPreset: 'reddit-aitah',
        avoidPhrases: ["It's worth noting that", "I couldn't help but", 'Little did I know'],
        autoAvoidAI: true,
        developerMode: false,
        powerUserMode: false,
      },

      // Create flow actions
      setCurrentDreamscape: (dreamscape) => {
        const preset = PRESETS.find((p) => p.id === get().settings.defaultPreset) || PRESETS[0]
        set({
          currentDreamscape: dreamscape,
          currentDialState: dreamscape
            ? get().currentDialState || {
                presetId: preset.id,
                platform: preset.platform,
                outputFormat: preset.outputFormat,
                wordCount: preset.wordCount,
                tone: preset.tone,
                intensity: preset.intensity,
                avoidPhrases: get().settings.avoidPhrases,
                cohesionStrictness: 5,
              }
            : null,
        })
      },

      setCurrentDialState: (dialState) => set({ currentDialState: dialState }),

      setGeneratedVariants: (variants) =>
        set({
          generatedVariants: variants,
          activeVariantIndex: 0,
        }),

      setActiveVariantIndex: (index) => set({ activeVariantIndex: index }),

      // Library actions
      saveDreamscape: (dreamscape) => {
        const { savedDreamscapes } = get()
        const filtered = savedDreamscapes.filter((d) => d.id !== dreamscape.id)
        const updated = [dreamscape, ...filtered]
        set({ savedDreamscapes: updated })

        const adapter = getPersistenceAdapter(get().isGuest)
        adapter.saveDreamscape(dreamscape).catch((error) => {
          console.error('Failed to persist dreamscape:', error)
        })
      },

      saveOutput: (output) => {
        const { savedOutputs } = get()
        const filtered = savedOutputs.filter((o) => o.id !== output.id)
        const updated = [output, ...filtered]
        set({ savedOutputs: updated })

        const adapter = getPersistenceAdapter(get().isGuest)
        adapter.saveOutput(output).catch((error) => {
          console.error('Failed to persist output:', error)
        })
      },

      deleteDreamscape: (id) => {
        const { savedDreamscapes } = get()
        set({ savedDreamscapes: savedDreamscapes.filter((d) => d.id !== id) })

        const adapter = getPersistenceAdapter(get().isGuest)
        adapter.deleteDreamscape(id).catch((error) => {
          console.error('Failed to delete dreamscape:', error)
        })
      },

      deleteOutput: (id) => {
        const { savedOutputs } = get()
        set({ savedOutputs: savedOutputs.filter((o) => o.id !== id) })

        const adapter = getPersistenceAdapter(get().isGuest)
        adapter.deleteOutput(id).catch((error) => {
          console.error('Failed to delete output:', error)
        })
      },

      rateOutput: (id, rating) => {
        const { savedOutputs } = get()
        const updated = savedOutputs.map((o) => (o.id === id ? { ...o, rating } : o))
        set({ savedOutputs: updated })

        const found = updated.find((o) => o.id === id)
        if (found) {
          getPersistenceAdapter(get().isGuest).saveOutput(found).catch((error) => {
            console.error('Failed to persist rating:', error)
          })
        }
      },

      updateOutput: (id, updates) => {
        const { savedOutputs } = get()
        const updated = savedOutputs.map((o) => (o.id === id ? { ...o, ...updates } : o))
        set({ savedOutputs: updated })

        const found = updated.find((o) => o.id === id)
        if (found) {
          getPersistenceAdapter(get().isGuest).saveOutput(found).catch((error) => {
            console.error('Failed to persist output update:', error)
          })
        }
      },

      promoteToSeed: (outputId) => {
        const { savedOutputs, savedDreamscapes } = get()
        const output = savedOutputs.find((o) => o.id === outputId)
        if (!output) return null

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

        const updated = [newDreamscape, ...savedDreamscapes]
        set({ savedDreamscapes: updated })

        const adapter = getPersistenceAdapter(get().isGuest)
        adapter.saveDreamscape(newDreamscape).catch((error) => {
          console.error('Failed to persist promoted dreamscape:', error)
        })

        return newDreamscape
      },

      loadLibraryData: async () => {
        const adapter = getPersistenceAdapter(get().isGuest)

        try {
          const [dreamscapes, outputs, settings] = await Promise.all([
            adapter.getDreamscapes(),
            adapter.getOutputs(),
            adapter.getSettings(),
          ])

          set({ savedDreamscapes: dreamscapes, savedOutputs: outputs, settings })
        } catch (error) {
          console.error('Failed to load library data:', error)
        }
      },

      // Settings actions
      updateSettings: (newSettings) => {
        const { settings } = get()
        const updated = { ...settings, ...newSettings }
        set({ settings: updated })

        const adapter = getPersistenceAdapter(get().isGuest)
        adapter.saveSettings(updated).catch((error) => {
          console.error('Failed to persist settings:', error)
        })
      },

      // Helpers
      clearCreateFlow: () =>
        set({
          currentDreamscape: null,
          currentDialState: null,
          generatedVariants: [],
          activeVariantIndex: 0,
        }),
    }),
    {
      name: 'sg:store',
      partialize: (state) => ({
        savedDreamscapes: state.savedDreamscapes,
        savedOutputs: state.savedOutputs,
        settings: state.settings,
      }),
    }
  )
)
