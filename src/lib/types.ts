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
  genres?: string[]
  avoidPhrases: string[]
  cohesionStrictness: number // 1-10
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
  characterProfile?: string // CoT character profile (from character-first generation)
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

export interface StyleVariant {
  id: string
  name: string
  description: string
  promptModifier: string
}

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
    avoidPhrases: string[]
  }
  promptTemplate: {
    system: string
    user: string
  }
  // CoT character-first generation (optional — triggers two-call flow)
  // Call 1: build OP character from seed (gpt-5-mini)
  // Call 2: write story as that character (gpt-5.4)
  characterPrompt?: {
    system: string
    user: string  // uses {dreamscape} variable
  }
  // Template-aware seed generation (optional — falls back to generic if absent)
  seedPrompt?: {
    system: string
    user: string
  }
  // Named style variants (2-3 per hero template)
  styleVariants?: StyleVariant[]
  // Quality criteria appended to generation prompt
  selfCheckRubric?: string[]
  // Condensed structural example for few-shot guidance
  fewShotExcerpt?: string
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
    character_generation: number
    part_transform: number
    ai_review: number
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
export type GenerationActionType = 'seed' | 'enhance' | 'output' | 'transform' | 'review' | 'character'

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

// AI Review (Admin-only quality analysis)
export interface AIReviewRubricScore {
  rubric: string
  score: number // 1-10
  analysis: string // Detailed assessment with evidence
}

export interface AIReviewResult {
  // Part A: Descriptive analysis
  rubricAnalyses: AIReviewRubricScore[]
  // Part B: Crisp summary
  overallGrade: string // A-F
  verdict: string // One-line summary
  rubricScores: Array<{ rubric: string; score: number }>
  weaknesses: string[] // Top issues to fix via prompt enhancement
  strengths: string[] // Top qualities to preserve
  promptSuggestions: string[] // Specific actionable prompt modifications
  additionalNotes: string[] // Anything else useful for admin reviewer
}

export interface ReviewOutputParams {
  dreamscapeText: string
  systemPrompt: string
  userPrompt: string
  outputText: string
  templateName?: string
  templateCategory?: string
  templatePlatforms?: string[]
  selfCheckRubric?: string[]
  styleVariantUsed?: string
  wordCountTarget?: number
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
  // Template-aware seed generation — overrides generic seed prompt
  seedPrompt?: {
    system: string
    user: string
  }
  templateId?: string
  // Template context for generic seed prompt (when no seedPrompt provided)
  templateContext?: {
    displayName: string
    category: string
    description: string
  }
}

export interface EnhanceDreamscapeParams {
  chunks: DreamscapeChunk[]
  goalPreset: EnhancementGoalId
  customGoal?: string
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
  systemPromptOverride?: string
  userPromptOverride?: string
  styleVariantId?: string
  // CoT character-first generation (two-call flow)
  characterSystemPrompt?: string
  characterUserPrompt?: string
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

