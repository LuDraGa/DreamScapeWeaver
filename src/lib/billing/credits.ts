import { createServiceClient } from '@/lib/supabase/service'
import { getBillingConfig, getCreditCost } from '@/lib/billing/config'
import type { CreditBalance, GenerationActionType } from '@/lib/types'

/**
 * Get user's current credit balance.
 * Returns null if user has no balance row (never initialized).
 */
export async function getBalance(userId: string): Promise<CreditBalance | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('credit_balance')
    .select('user_id, subscription_credits, topup_credits, updated_at')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  return {
    userId: data.user_id,
    subscriptionCredits: data.subscription_credits,
    topupCredits: data.topup_credits,
    updatedAt: data.updated_at,
  }
}

/**
 * Check if user has enough credits for a given action.
 */
export async function hasCreditsForAction(
  userId: string,
  actionType: GenerationActionType
): Promise<{ hasCredits: boolean, required: number, balance: CreditBalance | null }> {
  const costKey = actionTypeToCostKey(actionType)
  const required = getCreditCost(costKey)
  const balance = await getBalance(userId)

  if (!balance) {
    return { hasCredits: false, required, balance: null }
  }

  const total = balance.subscriptionCredits + balance.topupCredits
  return { hasCredits: total >= required, required, balance }
}

/**
 * Debit credits for a generation action. Atomic via Postgres RPC.
 * Writes: credit_balance update + credit_ledger row(s) + generation_events row.
 *
 * Call this AFTER a successful LLM call (so we never charge for failed generations).
 */
export async function debitCredits(params: {
  userId: string
  actionType: GenerationActionType
  model?: string
  promptTokens?: number
  completionTokens?: number
  outputVariantId?: string
  langfuseTraceId?: string
}): Promise<{ success: boolean, error?: string, balance: { subscription: number, topup: number } }> {
  const supabase = createServiceClient()
  const costKey = actionTypeToCostKey(params.actionType)
  const amount = getCreditCost(costKey)

  const { data, error } = await supabase.rpc('debit_credits', {
    p_user_id: params.userId,
    p_amount: amount,
    p_action_type: params.actionType,
    p_model: params.model ?? 'gpt-5-mini',
    p_prompt_tokens: params.promptTokens ?? null,
    p_completion_tokens: params.completionTokens ?? null,
    p_output_variant_id: params.outputVariantId ?? null,
    p_langfuse_trace_id: params.langfuseTraceId ?? null,
  })

  if (error) {
    console.error('debit_credits RPC error:', error)
    return { success: false, error: error.message, balance: { subscription: 0, topup: 0 } }
  }

  return data as { success: boolean, error?: string, balance: { subscription: number, topup: number } }
}

/**
 * Grant signup bonus credits. Idempotent — checks if already granted.
 * Called from auth callback on first login.
 */
export async function grantSignupBonus(userId: string): Promise<boolean> {
  const config = getBillingConfig()
  const bonus = config.credit_rules.signup_bonus_credits
  if (bonus <= 0) return false

  const supabase = createServiceClient()

  // Check if already granted (idempotent)
  const { data: existing } = await supabase
    .from('credit_ledger')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'signup_bonus')
    .limit(1)
    .single()

  if (existing) return false // Already granted

  const { data, error } = await supabase.rpc('grant_credits', {
    p_user_id: userId,
    p_amount: bonus,
    p_type: 'signup_bonus',
    p_bucket: 'topup',
    p_reference_id: 'initial_signup',
  })

  if (error) {
    console.error('grant_credits RPC error:', error)
    return false
  }

  return (data as { success: boolean }).success
}

/**
 * Map GenerationActionType to billing.yaml credit_costs key.
 */
function actionTypeToCostKey(actionType: GenerationActionType): keyof ReturnType<typeof getBillingConfig>['credit_costs'] {
  const map: Record<GenerationActionType, keyof ReturnType<typeof getBillingConfig>['credit_costs']> = {
    seed: 'seed_generation',
    enhance: 'enhancement',
    output: 'output_generation',
    transform: 'part_transform',
    review: 'ai_review',
  }
  return map[actionType]
}
