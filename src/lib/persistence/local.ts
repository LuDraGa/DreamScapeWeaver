import type { Dreamscape, OutputVariant, AppSettings } from '@/lib/types'

const STORAGE_KEYS = {
  DREAMSCAPES: 'storyweaver_dreamscapes',
  OUTPUTS: 'storyweaver_outputs',
  SETTINGS: 'storyweaver_settings',
} as const

/**
 * localStorage persistence adapter
 * Used for guest users
 */
export const localStorageAdapter = {
  // Dreamscapes
  async getDreamscapes(): Promise<Dreamscape[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DREAMSCAPES)
      return raw ? JSON.parse(raw) : []
    } catch (error) {
      console.error('Failed to load dreamscapes from localStorage:', error)
      return []
    }
  },

  async saveDreamscape(dreamscape: Dreamscape): Promise<void> {
    try {
      const existing = await this.getDreamscapes()
      const filtered = existing.filter((d) => d.id !== dreamscape.id)
      const updated = [dreamscape, ...filtered]
      localStorage.setItem(STORAGE_KEYS.DREAMSCAPES, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save dreamscape to localStorage:', error)
      throw error
    }
  },

  async deleteDreamscape(id: string): Promise<void> {
    try {
      const existing = await this.getDreamscapes()
      const filtered = existing.filter((d) => d.id !== id)
      localStorage.setItem(STORAGE_KEYS.DREAMSCAPES, JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to delete dreamscape from localStorage:', error)
      throw error
    }
  },

  // Outputs
  async getOutputs(): Promise<OutputVariant[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OUTPUTS)
      return raw ? JSON.parse(raw) : []
    } catch (error) {
      console.error('Failed to load outputs from localStorage:', error)
      return []
    }
  },

  async saveOutput(output: OutputVariant): Promise<void> {
    try {
      const existing = await this.getOutputs()
      const filtered = existing.filter((o) => o.id !== output.id)
      const updated = [output, ...filtered]
      localStorage.setItem(STORAGE_KEYS.OUTPUTS, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save output to localStorage:', error)
      throw error
    }
  },

  async deleteOutput(id: string): Promise<void> {
    try {
      const existing = await this.getOutputs()
      const filtered = existing.filter((o) => o.id !== id)
      localStorage.setItem(STORAGE_KEYS.OUTPUTS, JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to delete output from localStorage:', error)
      throw error
    }
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      return raw
        ? JSON.parse(raw)
        : {
            defaultPreset: 'reddit-aitah',
            avoidPhrases: ["It's worth noting that", "I couldn't help but", 'Little did I know'],
            autoAvoidAI: true,
          }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error)
      return {
        defaultPreset: 'reddit-aitah',
        avoidPhrases: [],
        autoAvoidAI: true,
      }
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
      throw error
    }
  },
}
