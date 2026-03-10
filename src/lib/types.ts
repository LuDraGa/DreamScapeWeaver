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
  origin?: 'manual' | 'generated' | 'derived'
  sourceOutputId?: string
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
  presetId?: string
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

// Billing — config types (parsed from billing.yaml)

export interface BillingConfig {
  currency: {
    primary: string
    secondary: string
    usd_to_inr_rate: number
  }
  subscriptions: Record<string, SubscriptionPlanConfig>
  topup_packs: Record<string, TopupPackConfig>
  credit_costs: {
    seed_generation: number
    enhancement: number
    output_generation: number
    part_transform: number
  }
  credit_rules: {
    debit_order: string[]
    subscription_credits_carry_over: boolean
    topup_credits_expire: boolean
    signup_bonus_credits: number
  }
  models: {
    default: string
    cost_per_1k_input_tokens_usd: number
    cost_per_1k_output_tokens_usd: number
  }
  observability: {
    langfuse_enabled: boolean
    generation_events_enabled: boolean
  }
}

export interface SubscriptionPlanConfig {
  name: string
  monthly_credits: number
  price_inr: number
  price_usd: number
  topup_discount_pct: number
  cashfree_plan_id: string
  description: string
  features: string[]
}

export interface TopupPackConfig {
  name: string
  credits: number
  base_price_inr: number
  base_price_usd: number
  description: string
}

// Billing — runtime types (DB rows)

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due'
export type CreditLedgerType = 'subscription_grant' | 'topup_purchase' | 'generation_usage' | 'expiry_sweep' | 'signup_bonus'
export type CreditBucket = 'subscription' | 'topup'
export type GenerationActionType = 'seed' | 'enhance' | 'output' | 'transform'

export interface Subscription {
  id: string
  userId: string
  planId: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cashfreeSubscriptionId: string | null
  cashfreePlanId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreditBalance {
  userId: string
  subscriptionCredits: number
  topupCredits: number
  updatedAt: string
}

export interface CreditLedgerEntry {
  id: string
  userId: string
  amount: number
  type: CreditLedgerType
  creditBucket: CreditBucket
  referenceId: string | null
  createdAt: string
}

export interface CreditPurchase {
  id: string
  userId: string
  packId: string
  creditsGranted: number
  amountPaidPaise: number
  discountPct: number
  cashfreeOrderId: string | null
  cashfreePaymentId: string | null
  createdAt: string
}

export interface GenerationEvent {
  id: string
  userId: string
  outputVariantId: string | null
  actionType: GenerationActionType
  model: string
  promptTokens: number | null
  completionTokens: number | null
  creditsCharged: number
  creditBucket: CreditBucket
  langfuseTraceId: string | null
  createdAt: string
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

// Auth types
export interface User {
  id: string
  email: string
  role: import('@/lib/auth/roles').UserRole
  createdAt: string
}

export interface AuthState {
  user: User | null
  isGuest: boolean
  isLoading: boolean
  role: import('@/lib/auth/roles').UserRole | null
}

