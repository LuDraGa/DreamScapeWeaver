// Core entities
export interface Project {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface Dreamscape {
  id: string
  projectId?: string
  title: string
  chunks: DreamscapeChunk[]
  createdAt: string
  updatedAt: string
}

export interface DreamscapeChunk {
  id: string
  title: string
  text: string
}

// Generation config
export interface DialState {
  presetId: string
  platform: Platform
  outputFormat: OutputFormat
  wordCount: number
  tone: Tone
  intensity: IntensityValues
  genrePrimary?: string
  genreSecondary?: string
  avoidPhrases: string[]
  cohesionStrictness: number // 1-10
}

export interface IntensityValues {
  stakes: number // 1-10
  darkness: number // 1-10
  pace: number // 1-10
  twist: number // 1-10
  realism: number // 1-10
  catharsis: number // 1-10
  moralClarity: number // 1-10
}

// Output
export interface OutputVariant {
  id: string
  projectId?: string
  dreamscapeId?: string
  title: string
  text: string
  dialState?: DialState // Config used to generate
  createdAt: string
  rating?: number // 1-5 stars
  feedback?: string[] // Feedback chip IDs
  notes?: string
  performanceSnapshots?: PerformanceSnapshot[]
}

export interface PerformanceSnapshot {
  id: string
  variantId: string
  cadence: 'day' | 'week' | 'month'
  platform: string
  metrics: Record<string, number>
  recordedAt: string
}

// Config types
export interface Preset {
  id: string
  name: string
  subtitle: string
  emoji: string
  platform: Platform
  outputFormat: OutputFormat
  wordCount: number
  tone: Tone
  intensity: IntensityValues
}

export interface Dial {
  label: string
  min: number
  max: number
  description?: string
}

export interface PlatformConfig {
  id: string
  name: string
  metrics: string[]
}

export interface EnhancementGoal {
  id: string
  label: string
  icon: string
}

export interface FeedbackChip {
  id: string
  label: string
  positive: boolean
}

// String unions
export type Platform = 'reddit' | 'reels' | 'tiktok' | 'blog'
export type OutputFormat = 'reddit-post' | 'reel-script' | 'short-story' | 'series'
export type Tone = 'narrative' | 'dialogue' | 'script' | 'mixed'
export type EnhancementGoalId = 'vivid' | 'conflict' | 'believable' | 'stitch' | 'less-ai'

// Settings
export interface AppSettings {
  defaultPreset: string
  avoidPhrases: string[]
  autoAvoidAI: boolean
  developerMode: boolean
  powerUserMode: boolean
}

// API interfaces
export interface GenerateDreamscapesParams {
  count: number
  vibe?: string
  intensity: IntensityValues
}

export interface EnhanceDreamscapeParams {
  chunks: DreamscapeChunk[]
  goalPreset: EnhancementGoalId
}

export interface EnhanceDreamscapeResult {
  stitchedSeed?: string
  enhancedChunks?: DreamscapeChunk[]
}

export interface GenerateOutputsParams {
  dreamscape: Dreamscape
  dialState: DialState
}

// Auth types (stub for Phase 1)
export interface User {
  id: string
  email: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  isGuest: boolean
  isLoading: boolean
}
