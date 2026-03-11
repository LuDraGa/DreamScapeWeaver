/**
 * Sync subscription plans from billing.yaml to Cashfree.
 *
 * Reads plan definitions from billing.yaml and creates/updates them
 * in Cashfree via the Subscriptions API. Updates billing.yaml with
 * the assigned cashfree_plan_id if a new plan is created.
 *
 * Usage:
 *   npx tsx scripts/sync-cashfree-plans.ts
 *
 * Required env vars:
 *   CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENVIRONMENT
 */

import { config } from 'dotenv'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { parse, stringify } from 'yaml'
import { Cashfree, CFEnvironment } from 'cashfree-pg'

// Load .env.local so script can run standalone via `npx tsx`
config({ path: join(process.cwd(), '.env.local') })

const BILLING_YAML_PATH = join(process.cwd(), 'src/config/billing.yaml')

interface PlanConfig {
  name: string
  monthly_credits: number
  price_inr: number
  price_usd: number
  topup_discount_pct: number
  cashfree_plan_id: string
  description: string
  features: string[]
}

async function main() {
  console.log('=== Cashfree Plan Sync ===\n')

  // Validate env
  const appId = process.env.CASHFREE_APP_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY
  const environment = process.env.CASHFREE_ENVIRONMENT ?? 'sandbox'

  if (!appId || !secretKey) {
    console.error('Missing CASHFREE_APP_ID or CASHFREE_SECRET_KEY')
    process.exit(1)
  }

  const cfEnv = environment === 'production'
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX

  const cf = new Cashfree(cfEnv, appId, secretKey)

  // Read billing.yaml
  const rawYaml = readFileSync(BILLING_YAML_PATH, 'utf-8')
  const config = parse(rawYaml) as { subscriptions: Record<string, PlanConfig> }
  let yamlModified = false

  for (const [planKey, plan] of Object.entries(config.subscriptions)) {
    const cfPlanId = `sw_${planKey}_monthly`
    console.log(`\nPlan: ${plan.name} (${cfPlanId})`)
    console.log(`  Price: ₹${plan.price_inr}/mo, Credits: ${plan.monthly_credits}`)

    // Check if plan already exists in Cashfree
    try {
      const existing = await cf.SubsFetchPlan(cfPlanId)
      if (existing.data) {
        console.log(`  ✓ Already exists in Cashfree`)

        // Update billing.yaml if plan_id was empty
        if (!plan.cashfree_plan_id) {
          config.subscriptions[planKey].cashfree_plan_id = cfPlanId
          yamlModified = true
          console.log(`  → Updated billing.yaml with plan_id: ${cfPlanId}`)
        }
        continue
      }
    } catch {
      // Plan doesn't exist — create it
      console.log(`  → Creating in Cashfree...`)
    }

    try {
      await cf.SubsCreatePlan({
        plan_id: cfPlanId,
        plan_name: `StoryWeaver ${plan.name}`,
        plan_type: 'PERIODIC',
        plan_currency: 'INR',
        plan_recurring_amount: plan.price_inr,
        plan_max_amount: plan.price_inr,
        plan_intervals: 1,
        plan_interval_type: 'MONTH',
        plan_note: plan.description,
      })

      console.log(`  ✓ Created successfully`)

      // Update billing.yaml
      config.subscriptions[planKey].cashfree_plan_id = cfPlanId
      yamlModified = true
      console.log(`  → Updated billing.yaml with plan_id: ${cfPlanId}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  ✗ Failed to create: ${message}`)
    }
  }

  // Write back billing.yaml if modified
  if (yamlModified) {
    // Re-read to preserve comments structure, then update plan IDs
    const updatedRaw = readFileSync(BILLING_YAML_PATH, 'utf-8')
    let output = updatedRaw

    for (const [planKey, plan] of Object.entries(config.subscriptions)) {
      if (plan.cashfree_plan_id) {
        // Replace the cashfree_plan_id line for this plan
        const pattern = new RegExp(
          `(${planKey}:[\\s\\S]*?cashfree_plan_id:\\s*)"[^"]*"`,
          'm'
        )
        output = output.replace(pattern, `$1"${plan.cashfree_plan_id}"`)
      }
    }

    writeFileSync(BILLING_YAML_PATH, output, 'utf-8')
    console.log('\n✓ billing.yaml updated with Cashfree plan IDs')
  } else {
    console.log('\nNo changes needed in billing.yaml')
  }

  console.log('\n=== Sync complete ===')
}

main().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
