import type { Preset, Dial, PlatformConfig, EnhancementGoal, FeedbackChip } from './types'
import presetsJson from '@/config/presets.json'
import dialsJson from '@/config/dials.json'
import platformsJson from '@/config/platforms.json'
import enhancementGoalsJson from '@/config/enhancement-goals.json'
import feedbackChipsJson from '@/config/feedback-chips.json'
import genresJson from '@/config/genres.json'

export const PRESETS = presetsJson as Preset[]
export const DIALS = dialsJson as Record<string, Dial>
export const PLATFORMS = platformsJson as PlatformConfig[]
export const ENHANCEMENT_GOALS = enhancementGoalsJson as EnhancementGoal[]
export const FEEDBACK_CHIPS = feedbackChipsJson as FeedbackChip[]
export const GENRES = genresJson as string[]

export const OUTPUT_FORMATS = [
  { id: 'reddit-post', name: 'Reddit Post' },
  { id: 'reel-script', name: 'Reel Script' },
  { id: 'short-story', name: 'Short Story' },
  { id: 'series', name: 'Series (Multi-part)' },
] as const

export const TONES = ['narrative', 'dialogue', 'script', 'mixed'] as const

// Helper functions
export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}

export function getDial(key: string): Dial | undefined {
  return DIALS[key]
}

export function getPlatform(id: string): PlatformConfig | undefined {
  return PLATFORMS.find((p) => p.id === id)
}

export function getEnhancementGoal(id: string): EnhancementGoal | undefined {
  return ENHANCEMENT_GOALS.find((g) => g.id === id)
}

export function getFeedbackChip(id: string): FeedbackChip | undefined {
  return FEEDBACK_CHIPS.find((c) => c.id === id)
}
