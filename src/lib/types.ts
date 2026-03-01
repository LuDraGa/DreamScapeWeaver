// Core entities

// Studio Project (new non-linear system)
export interface StudioProject {
  id: string
  title: string
  description?: string
  thumbnail?: string // URL or base64
  createdAt: string
  updatedAt: string
  partIds: string[] // References to parts in this project
}

// Legacy Project (keep for backward compatibility with Create page)
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
  genres?: string[]
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
export type EnhancementGoalId = 'vivid' | 'conflict' | 'believable' | 'stitch' | 'less-ai' | 'custom'

// Templates (Normal User Mode)
export type TemplateCategory = 'short-form' | 'reddit' | 'long-form' | 'video-production' | 'audio-production' | 'marketing'
export type CompatibilityLevel = 'perfect' | 'good' | 'maybe'
export type CompatibilityCheckType = 'any' | 'story-based' | 'conflict-based' | 'opinion-based'

export interface Template {
  id: string
  displayName: string
  category: TemplateCategory
  icon: string
  description: string
  duration: string
  wordCount: number
  platforms: string[]
  subreddit?: string
  genre?: string
  settings: {
    tone: Tone
    genres: string[]
    intensity: IntensityValues
    avoidPhrases: string[]
  }
  promptTemplate: {
    system: string
    user: string
  }
  compatibility: {
    perfectMatch: string[]
    goodFit: string[]
    checkType: CompatibilityCheckType
    dreamscapeTypes: string[]
  }
  exampleOutput: string
}

export interface TemplateCompatibility {
  level: CompatibilityLevel
  message?: string
}

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
  customGoal?: string
  intensity: IntensityValues
  avoidPhrases: string[]
}

export interface EnhanceDreamscapeResult {
  stitchedSeed?: string
  enhancedChunks?: DreamscapeChunk[]
  promptData?: import('@/lib/prompt-builders').PromptData
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

// ============================================================
// Studio System - Part-Based Content Generation
// ============================================================

// Part Types (all content types in the system)
export type PartType =
  // Text Foundations
  | 'dreamscape'
  | 'logline'
  | 'synopsis'
  | 'beat-sheet'
  | 'character-profiles'
  | 'world-setting'
  | 'dialogue-snippets'
  | 'theme-statement'
  | 'conflict-map'
  | 'tone-document'
  // Short-Form Content
  | 'reel-script'
  | 'tiktok-script'
  | 'twitter-thread'
  | 'linkedin-post'
  | 'instagram-caption'
  | 'youtube-short-script'
  | 'podcast-teaser'
  | 'email-preview'
  | 'ad-copy'
  | 'quote-card'
  // Long-Form Content
  | 'reddit-post'
  | 'blog-article'
  | 'youtube-script'
  | 'podcast-script'
  | 'short-story'
  | 'newsletter'
  | 'case-study'
  | 'white-paper'
  | 'documentary-narration'
  | 'video-essay'
  // Video Production Parts
  | 'scene-breakdown'
  | 'shot-list'
  | 'cinematography-guide'
  | 'storyboard-descriptions'
  | 'director-notes'
  | 'broll-cues'
  | 'sound-design-notes'
  | 'editing-beat-sheet'
  | 'color-grade-palette'
  | 'vfx-requirements'
  // Audio Production Parts
  | 'podcast-outline'
  | 'interview-questions'
  | 'voiceover-script'
  | 'music-cues'
  | 'sound-effects-list'
  | 'ad-read-script'
  | 'intro-outro'
  | 'show-notes'
  | 'transcript'
  | 'audiogram-quotes'
  // Marketing/Commercial Parts
  | 'sales-page'
  | 'product-description'
  | 'landing-page'
  | 'email-sequence'
  | 'social-calendar'
  | 'press-release'
  | 'pitch-deck'
  | 'testimonial-request'
  | 'faq-section'
  | 'brand-story'

// Transform Types (how parts relate to each other)
export type TransformType =
  | 'expand'     // Short → Long (TikTok → YouTube)
  | 'condense'   // Long → Short (Blog → Twitter)
  | 'remix'      // Same length, different format (Reddit → LinkedIn)
  | 'extract'    // Pull concept out (YouTube → Dreamscape)
  | 'format'     // Same content, different structure (Script → Scene)

// Part (any piece of generated content)
export interface Part {
  id: string
  projectId: string
  type: PartType
  title: string
  content: string // The actual text/script
  metadata: {
    wordCount: number
    platform?: string
    duration?: string
    tone?: string
    genres?: string[]
    sourcePartId?: string // What part this was generated from
    transformType?: TransformType // How it was transformed from source
  }
  createdAt: string
  updatedAt: string
}

// Transform definition (compatibility between part types)
export interface Transform {
  sourceType: PartType
  targetType: PartType
  transformType: TransformType
  label: string // e.g., "Expand to YouTube script"
  description: string
}
