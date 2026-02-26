'use client'

import { useAppStore } from '@/store/app-store'
import { ThemedCard } from '@/components/design-system/themed-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PRESETS } from '@/lib/config'
import { XIcon } from '@/components/icons'
import { clearAllAppData } from '@/lib/persistence/local'

/**
 * Settings Page - Configure app preferences
 *
 * TODO: Break into feature components:
 * - PresetSelector
 * - AvoidPhrasesInput
 * - AutoAvoidToggle
 */
export default function SettingsPage() {
  const { settings, updateSettings } = useAppStore()

  const addAvoidPhrase = (phrase: string) => {
    if (!phrase.trim()) return
    updateSettings({
      avoidPhrases: [...settings.avoidPhrases, phrase],
    })
  }

  const removeAvoidPhrase = (index: number) => {
    updateSettings({
      avoidPhrases: settings.avoidPhrases.filter((_, i) => i !== index),
    })
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
          onValueChange={(value) => updateSettings({ defaultPreset: value })}
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

        {/* Phrase chips */}
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

        {/* Add phrase input */}
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
            onClick={() => updateSettings({ autoAvoidAI: !settings.autoAvoidAI })}
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
