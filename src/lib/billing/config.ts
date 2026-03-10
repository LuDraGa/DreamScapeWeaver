import { readFileSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import type { BillingConfig } from '@/lib/types'

let _config: BillingConfig | null = null

/**
 * Load and parse billing.yaml config.
 * Cached after first load — config is static per deploy.
 * Server-side only (uses fs).
 */
export function getBillingConfig(): BillingConfig {
  if (_config) return _config

  const configPath = join(process.cwd(), 'src/config/billing.yaml')
  const raw = readFileSync(configPath, 'utf-8')
  _config = parse(raw) as BillingConfig

  return _config
}

/**
 * Get subscription plan by ID, or null if not found.
 */
export function getSubscriptionPlan(planId: string) {
  const config = getBillingConfig()
  return config.subscriptions[planId] ?? null
}

/**
 * Get top-up pack by ID, or null if not found.
 */
export function getTopupPack(packId: string) {
  const config = getBillingConfig()
  return config.topup_packs[packId] ?? null
}

/**
 * Get credit cost for a given action type.
 */
export function getCreditCost(actionType: keyof BillingConfig['credit_costs']): number {
  const config = getBillingConfig()
  return config.credit_costs[actionType]
}

/**
 * Calculate discounted price for a top-up pack based on user's active plan.
 * Returns price in paise (INR smallest unit).
 */
export function getDiscountedTopupPrice(packId: string, activePlanId: string | null): number {
  const pack = getTopupPack(packId)
  if (!pack) throw new Error(`Unknown pack: ${packId}`)

  const basePricePaise = pack.base_price_inr * 100
  if (!activePlanId) return basePricePaise

  const plan = getSubscriptionPlan(activePlanId)
  if (!plan) return basePricePaise

  const discountMultiplier = 1 - plan.topup_discount_pct / 100
  return Math.round(basePricePaise * discountMultiplier)
}
