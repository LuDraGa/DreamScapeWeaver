import type { Dreamscape, OutputVariant, AppSettings } from '@/lib/types'

const STORAGE_KEYS = {
  DREAMSCAPES: 'sg:dreamscapes',
  OUTPUTS: 'sg:outputs',
  SETTINGS: 'sg:settings',
} as const

/**
 * localStorage persistence adapter
 * Used for guest users
 */
export const localStorageAdapter = {
  // Dreamscapes
  async getDreamscapes(): Promise<Dreamscape[]> {
    if (typeof window === 'undefined') return []

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DREAMSCAPES)
      return raw ? JSON.parse(raw) : []
    } catch (error) {
      console.error('Failed to load dreamscapes from localStorage:', error)
      return []
    }
  },

  async saveDreamscape(dreamscape: Dreamscape): Promise<void> {
    if (typeof window === 'undefined') return

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
    if (typeof window === 'undefined') return

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
    if (typeof window === 'undefined') return []

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OUTPUTS)
      return raw ? JSON.parse(raw) : []
    } catch (error) {
      console.error('Failed to load outputs from localStorage:', error)
      return []
    }
  },

  async saveOutput(output: OutputVariant): Promise<void> {
    if (typeof window === 'undefined') return

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
    if (typeof window === 'undefined') return

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
    if (typeof window === 'undefined') {
      return {
        defaultPreset: 'reddit-aitah',
        avoidPhrases: ["It's worth noting that", "I couldn't help but", 'Little did I know'],
        autoAvoidAI: true,
        developerMode: false,
        powerUserMode: false,
      }
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      return raw
        ? JSON.parse(raw)
        : {
            defaultPreset: 'reddit-aitah',
            avoidPhrases: ["It's worth noting that", "I couldn't help but", 'Little did I know'],
            autoAvoidAI: true,
            developerMode: false,
            powerUserMode: false,
          }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error)
      return {
        defaultPreset: 'reddit-aitah',
        avoidPhrases: [],
        autoAvoidAI: true,
        developerMode: false,
        powerUserMode: false,
      }
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
      throw error
    }
  },
}

/**
 * Clear all app data from localStorage
 * Only removes keys that start with 'sg:' prefix
 * Safe to call - won't affect other apps' localStorage
 */
export function clearAllAppData(): void {
  if (typeof window === 'undefined') return

  // Clear all sg:* keys
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('sg:')) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * Migrate old storage keys to new sg:* format
 * Call once on app initialization to preserve existing user data
 * TODO: Remove this migration code after 2026-03-26 (1 month)
 */
export function migrateStorageKeys(): void {
  if (typeof window === 'undefined') return

  const migrations = [
    { old: 'storyweaver_dreamscapes', new: 'sg:dreamscapes' },
    { old: 'storyweaver_outputs', new: 'sg:outputs' },
    { old: 'storyweaver_settings', new: 'sg:settings' },
    { old: 'storyweaver-storage', new: 'sg:store' },
  ]

  migrations.forEach(({ old, new: newKey }) => {
    const data = localStorage.getItem(old)
    if (data) {
      // Copy to new key
      localStorage.setItem(newKey, data)
      // Remove old key
      localStorage.removeItem(old)
    }
  })
}
