'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { useAppStore } from '@/store/app-store'
import { getPersistenceAdapter } from '@/lib/persistence'
import { ThemedCard } from '@/components/design-system/themed-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PRESETS } from '@/lib/config'
import { XIcon } from '@/components/icons'
import { clearAllAppData } from '@/lib/persistence/local'
import type { AppSettings } from '@/lib/types'

const DEFAULT_SETTINGS: AppSettings = {
  defaultPreset: 'reddit-aitah',
  avoidPhrases: ["It's worth noting that", "I couldn't help but", 'Little did I know'],
  autoAvoidAI: true,
  developerMode: false,
  powerUserMode: false,
}

export default function SettingsPage() {
  const { isGuest } = useAuth()
  const { updateSettings: syncToStore } = useAppStore()

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const adapter = getPersistenceAdapter(isGuest)

  useEffect(() => {
    adapter.getSettings()
      .then((s) => setSettings(s))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isGuest])

  const persist = (updated: AppSettings) => {
    setSettings(updated)
    // Keep Zustand in sync so create flow picks up new settings immediately
    syncToStore(updated)
    adapter.saveSettings(updated).catch(console.error)
  }

  const addAvoidPhrase = (phrase: string) => {
    if (!phrase.trim()) return
    persist({ ...settings, avoidPhrases: [...settings.avoidPhrases, phrase] })
  }

  const removeAvoidPhrase = (index: number) => {
    persist({ ...settings, avoidPhrases: settings.avoidPhrases.filter((_, i) => i !== index) })
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold mb-1 text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-1 text-text-primary">Settings</h1>
      <p className="text-sm mb-6 text-text-muted">Configure your preferences</p>

      {/* Default Preset */}
      <ThemedCard className="mb-4">
        <h2 className="text-lg font-medium mb-4 text-text-primary">Default Preset</h2>
        <Select
          value={settings.defaultPreset}
          onValueChange={(value) => persist({ ...settings, defaultPreset: value })}
        >
          <SelectTrigger className="w-full bg-[rgba(15,23,42,0.5)] border-[#1e293b] text-text-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[rgba(15,23,42,0.95)] border-[#1e293b]">
            {PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id} className="text-text-primary">
                {preset.emoji} {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ThemedCard>

      {/* Avoid Phrases */}
      <ThemedCard className="mb-4">
        <h2 className="text-lg font-medium mb-2 text-text-primary">Avoid Phrases</h2>
        <p className="text-sm text-text-muted mb-4">
          AI will avoid using these phrases in generated content
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {settings.avoidPhrases.map((phrase, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(15,23,42,0.5)] border border-[#1e293b]"
            >
              <span className="text-sm text-text-secondary">{phrase}</span>
              <button
                onClick={() => removeAvoidPhrase(index)}
                className="text-text-muted hover:text-text-primary"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <Input
          placeholder="Add phrase to avoid... (press Enter)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addAvoidPhrase(e.currentTarget.value)
              e.currentTarget.value = ''
            }
          }}
          className="bg-[rgba(15,23,42,0.5)] border-[#1e293b] text-text-primary placeholder:text-text-muted"
        />
      </ThemedCard>

      {/* Auto-Avoid AI */}
      <ThemedCard className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-text-primary">Auto-Avoid AI-ish Language</h2>
            <p className="text-sm text-text-muted mt-1">
              Automatically remove common AI-generated phrases
            </p>
          </div>
          <Button
            variant={settings.autoAvoidAI ? 'default' : 'outline'}
            size="sm"
            onClick={() => persist({ ...settings, autoAvoidAI: !settings.autoAvoidAI })}
            className={
              settings.autoAvoidAI
                ? 'bg-primary hover:bg-primary-light text-white'
                : 'bg-transparent border-[#1e293b] text-text-secondary'
            }
          >
            {settings.autoAvoidAI ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </ThemedCard>

      {/* Power User Mode */}
      <ThemedCard className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-text-primary">Power User Mode</h2>
            <p className="text-sm text-text-muted mt-1">
              Show advanced controls and expert features
            </p>
          </div>
          <Button
            variant={settings.powerUserMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => persist({ ...settings, powerUserMode: !settings.powerUserMode })}
            className={
              settings.powerUserMode
                ? 'bg-primary hover:bg-primary-light text-white'
                : 'bg-transparent border-[#1e293b] text-text-secondary'
            }
          >
            {settings.powerUserMode ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </ThemedCard>

      {/* Developer Mode */}
      <ThemedCard className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-text-primary">Developer Mode</h2>
            <p className="text-sm text-text-muted mt-1">
              Show prompt inspector for debugging AI prompts
            </p>
          </div>
          <Button
            variant={settings.developerMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => persist({ ...settings, developerMode: !settings.developerMode })}
            className={
              settings.developerMode
                ? 'bg-primary hover:bg-primary-light text-white'
                : 'bg-transparent border-[#1e293b] text-text-secondary'
            }
          >
            {settings.developerMode ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </ThemedCard>

      {/* Reset Data */}
      <ThemedCard className="border-red-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-red-400">Reset All Local Data</h2>
            <p className="text-sm text-text-muted mt-1">
              Clear all saved dreamscapes, stories, and settings
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (
                confirm(
                  'Are you sure you want to reset all local data? This action cannot be undone.'
                )
              ) {
                clearAllAppData()
                window.location.reload()
              }
            }}
            className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            Reset Data
          </Button>
        </div>
      </ThemedCard>
    </div>
  )
}
