import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dreamscape, OutputVariant, AppSettings, DialState } from '@/lib/types'
import { getPersistenceAdapter } from '@/lib/persistence'
import { useLibraryCache } from '@/store/library-cache'
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

  // Create flow state (ephemeral — survives navigation within the flow)
  currentDreamscape: Dreamscape | null
  currentDialState: DialState | null
  generatedVariants: OutputVariant[]
  activeVariantIndex: number

  // Settings (needed by create flow — loaded from appropriate source on auth resolve)
  settings: AppSettings

  // Actions - Create flow
  setCurrentDreamscape: (dreamscape: Dreamscape | null) => void
  setCurrentDialState: (dialState: DialState) => void
  setGeneratedVariants: (variants: OutputVariant[]) => void
  setActiveVariantIndex: (index: number) => void

  // Actions - persist to backend (no in-memory array — library page owns its own data)
  saveDreamscape: (dreamscape: Dreamscape) => Promise<void>
  saveOutput: (output: OutputVariant) => Promise<void>

  // Actions - Settings
  loadSettings: () => Promise<void>
  updateSettings: (settings: Partial<AppSettings>) => void

  // Helpers
  clearCreateFlow: () => void
}

/**
 * Main app store using Zustand.
 *
 * For logged-in users this store is intentionally lean:
 * - No savedDreamscapes / savedOutputs arrays (library page fetches from Supabase directly)
 * - settings is hydrated from Supabase on auth resolve via loadSettings()
 * - saveDreamscape / saveOutput are thin adapter calls only
 *
 * For guests everything still flows through localStorage via the adapter.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isGuest: true,
      setUserAuthState: (isGuest) => {
        const wasGuest = get().isGuest
        set({ isGuest })
        // Auth state changed — invalidate library cache so next visit fetches fresh data
        if (wasGuest !== isGuest) useLibraryCache.getState().invalidate()
      },

      loginModalOpen: false,
      openLoginModal: () => set({ loginModalOpen: true }),
      closeLoginModal: () => set({ loginModalOpen: false }),

      currentDreamscape: null,
      currentDialState: null,
      generatedVariants: [],
      activeVariantIndex: 0,
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
          // Always reset dial + generated state — prevents stale values from a previous flow
          currentDialState: dreamscape
            ? {
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
          generatedVariants: [],
          activeVariantIndex: 0,
        })
      },

      setCurrentDialState: (dialState) => set({ currentDialState: dialState }),

      setGeneratedVariants: (variants) =>
        set({
          generatedVariants: variants,
          activeVariantIndex: 0,
        }),

      setActiveVariantIndex: (index) => set({ activeVariantIndex: index }),

      // Persistence actions — write to backend + update library cache optimistically
      saveDreamscape: async (dreamscape) => {
        useLibraryCache.getState().addDreamscape(dreamscape)
        const adapter = getPersistenceAdapter(get().isGuest)
        await adapter.saveDreamscape(dreamscape).catch((err) => {
          console.error('Failed to save dreamscape:', err)
        })
      },

      saveOutput: async (output) => {
        useLibraryCache.getState().addOutput(output)
        const adapter = getPersistenceAdapter(get().isGuest)
        await adapter.saveOutput(output).catch((err) => {
          console.error('Failed to save output:', err)
        })
      },

      // Settings
      loadSettings: async () => {
        try {
          const adapter = getPersistenceAdapter(get().isGuest)
          const settings = await adapter.getSettings()
          set({ settings })
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      },

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
        // Only persist create-flow ephemeral state and settings
        // savedDreamscapes / savedOutputs intentionally excluded — library fetches from source of truth
        currentDreamscape: state.currentDreamscape,
        currentDialState: state.currentDialState,
        settings: state.settings,
      }),
    }
  )
)
