import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dreamscape, OutputVariant, AppSettings, DialState, StudioProject, Part } from '@/lib/types'
import { getPersistenceAdapter } from '@/lib/persistence'
import { PRESETS } from '@/lib/config'
import { projectStorage, partStorage, activeProjectStorage } from '@/lib/storage'

interface AppState {
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

  // Studio state
  studioProjects: StudioProject[]
  studioParts: Part[]
  activeProjectId: string | null
  unsavedParts: Part[] // Temporary parts (not persisted)
  activePart: Part | null // Currently viewing part

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
  loadLibraryData: () => Promise<void>

  // Actions - Settings
  updateSettings: (settings: Partial<AppSettings>) => void

  // Actions - Studio (Projects & Saved Parts)
  loadStudioData: () => void
  createProject: (project: Omit<StudioProject, 'id' | 'createdAt' | 'updatedAt'>) => StudioProject
  updateProject: (id: string, updates: Partial<Omit<StudioProject, 'id' | 'createdAt'>>) => void
  deleteProject: (id: string) => void
  setActiveProject: (id: string | null) => void
  createPart: (part: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) => Part
  updatePart: (id: string, updates: Partial<Omit<Part, 'id' | 'createdAt'>>) => void
  deletePart: (id: string) => void

  // Actions - Unsaved Parts (Session Only)
  addUnsavedPart: (part: Part) => void
  removeUnsavedPart: (id: string) => void
  setActivePart: (part: Part | null) => void
  clearUnsavedParts: () => void

  // Helpers
  clearCreateFlow: () => void
}

/**
 * Main app store using Zustand
 *
 * Features:
 * - Persists to localStorage (guest mode)
 * - Ready for Supabase sync (Phase 2)
 * - Manages create flow, library, and settings
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
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
      studioProjects: [],
      studioParts: [],
      activeProjectId: null,
      unsavedParts: [],
      activePart: null,

      // Create flow actions
      setCurrentDreamscape: (dreamscape) => {
        const preset = PRESETS.find((p) => p.id === get().settings.defaultPreset) || PRESETS[0]
        set({
          currentDreamscape: dreamscape,
          // Initialize dialState when dreamscape is set
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
          activeVariantIndex: 0, // Reset to first variant
        }),

      setActiveVariantIndex: (index) => set({ activeVariantIndex: index }),

      // Library actions
      saveDreamscape: (dreamscape) => {
        const { savedDreamscapes } = get()
        const filtered = savedDreamscapes.filter((d) => d.id !== dreamscape.id)
        const updated = [dreamscape, ...filtered]
        set({ savedDreamscapes: updated })

        // Also persist to storage adapter (Phase 2 will use Supabase)
        const isGuest = true // TODO: Get from auth context
        const adapter = getPersistenceAdapter(isGuest)
        adapter.saveDreamscape(dreamscape).catch((error) => {
          console.error('Failed to persist dreamscape:', error)
        })
      },

      saveOutput: (output) => {
        const { savedOutputs } = get()
        const filtered = savedOutputs.filter((o) => o.id !== output.id)
        const updated = [output, ...filtered]
        set({ savedOutputs: updated })

        // Persist to storage adapter
        const isGuest = true // TODO: Get from auth context
        const adapter = getPersistenceAdapter(isGuest)
        adapter.saveOutput(output).catch((error) => {
          console.error('Failed to persist output:', error)
        })
      },

      deleteDreamscape: (id) => {
        const { savedDreamscapes } = get()
        const filtered = savedDreamscapes.filter((d) => d.id !== id)
        set({ savedDreamscapes: filtered })

        // Delete from storage adapter
        const isGuest = true // TODO: Get from auth context
        const adapter = getPersistenceAdapter(isGuest)
        adapter.deleteDreamscape(id).catch((error) => {
          console.error('Failed to delete dreamscape:', error)
        })
      },

      deleteOutput: (id) => {
        const { savedOutputs } = get()
        const filtered = savedOutputs.filter((o) => o.id !== id)
        set({ savedOutputs: filtered })

        // Delete from storage adapter
        const isGuest = true // TODO: Get from auth context
        const adapter = getPersistenceAdapter(isGuest)
        adapter.deleteOutput(id).catch((error) => {
          console.error('Failed to delete output:', error)
        })
      },

      loadLibraryData: async () => {
        // Load data from persistence adapter
        // Useful for initial load or refresh
        const isGuest = true // TODO: Get from auth context
        const adapter = getPersistenceAdapter(isGuest)

        try {
          const [dreamscapes, outputs, settings] = await Promise.all([
            adapter.getDreamscapes(),
            adapter.getOutputs(),
            adapter.getSettings(),
          ])

          set({
            savedDreamscapes: dreamscapes,
            savedOutputs: outputs,
            settings,
          })
        } catch (error) {
          console.error('Failed to load library data:', error)
        }
      },

      // Settings actions
      updateSettings: (newSettings) => {
        const { settings } = get()
        const updated = { ...settings, ...newSettings }
        set({ settings: updated })

        // Persist to storage adapter
        const isGuest = true // TODO: Get from auth context
        const adapter = getPersistenceAdapter(isGuest)
        adapter.saveSettings(updated).catch((error) => {
          console.error('Failed to persist settings:', error)
        })
      },

      // Studio actions
      loadStudioData: () => {
        const projects = projectStorage.getAll()
        const parts = partStorage.getAll()
        const activeProjectId = activeProjectStorage.get()
        set({
          studioProjects: projects,
          studioParts: parts,
          activeProjectId,
        })
      },

      createProject: (project) => {
        const newProject = projectStorage.create(project)
        const { studioProjects } = get()
        set({ studioProjects: [newProject, ...studioProjects] })
        return newProject
      },

      updateProject: (id, updates) => {
        const updated = projectStorage.update(id, updates)
        const { studioProjects } = get()
        set({
          studioProjects: studioProjects.map((p) => (p.id === id ? updated : p)),
        })
      },

      deleteProject: (id) => {
        projectStorage.delete(id)
        const { studioProjects, studioParts, activeProjectId } = get()
        const newActiveId = activeProjectId === id ? null : activeProjectId
        set({
          studioProjects: studioProjects.filter((p) => p.id !== id),
          studioParts: studioParts.filter((p) => p.projectId !== id),
          activeProjectId: newActiveId,
        })
        // Persist the cleared active project
        if (activeProjectId === id) {
          activeProjectStorage.set(null)
        }
      },

      setActiveProject: (id) => {
        set({ activeProjectId: id })
        activeProjectStorage.set(id)
      },

      createPart: (part) => {
        const newPart = partStorage.create(part)
        const { studioParts, studioProjects } = get()

        // Update parts list
        set({ studioParts: [newPart, ...studioParts] })

        // Update project's partIds in state
        const project = studioProjects.find((p) => p.id === part.projectId)
        if (project) {
          set({
            studioProjects: studioProjects.map((p) =>
              p.id === part.projectId
                ? { ...p, partIds: [...p.partIds, newPart.id] }
                : p
            ),
          })
        }

        return newPart
      },

      updatePart: (id, updates) => {
        const updated = partStorage.update(id, updates)
        const { studioParts } = get()
        set({
          studioParts: studioParts.map((p) => (p.id === id ? updated : p)),
        })
      },

      deletePart: (id) => {
        const part = partStorage.getById(id)
        partStorage.delete(id)
        const { studioParts, studioProjects } = get()

        // Update parts list
        set({ studioParts: studioParts.filter((p) => p.id !== id) })

        // Update project's partIds in state
        if (part) {
          set({
            studioProjects: studioProjects.map((p) =>
              p.id === part.projectId
                ? { ...p, partIds: p.partIds.filter((pid) => pid !== id) }
                : p
            ),
          })
        }
      },

      // Unsaved parts actions (session only, not persisted)
      addUnsavedPart: (part) => {
        const { unsavedParts } = get()
        set({ unsavedParts: [part, ...unsavedParts] })
      },

      removeUnsavedPart: (id) => {
        const { unsavedParts, activePart } = get()
        set({
          unsavedParts: unsavedParts.filter((p) => p.id !== id),
          // Clear activePart if deleting it
          activePart: activePart?.id === id ? null : activePart,
        })
      },

      setActivePart: (part) => set({ activePart: part }),

      clearUnsavedParts: () => set({ unsavedParts: [], activePart: null }),

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
      name: 'sg:store', // localStorage key
      // Only persist library and settings, not create flow state
      partialize: (state) => ({
        savedDreamscapes: state.savedDreamscapes,
        savedOutputs: state.savedOutputs,
        settings: state.settings,
      }),
    }
  )
)
