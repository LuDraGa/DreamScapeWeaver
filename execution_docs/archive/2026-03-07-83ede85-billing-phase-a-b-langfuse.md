---
**Commit**: 83ede85
**Date**: 2026-03-07 19:21:01
**Message**: feat: add SWR-style library cache for instant page loads
---

# StoryWeaver - Active Execution

## Task: Phase 3 — Billing & Credits System

**Session**: 2026-03-07
**Context**: Implementing credits system with Cashfree payments, Langfuse LLM observability, and generation_events billing table

## Execution Status

### ✅ Completed Tasks

- ✅ Rename archived doc: `2026-03-06-d71e459-logged-in-backend-first-data-flow.md`
- ✅ Create `src/config/billing.yaml` — all pricing config (plans, packs, credit costs, rules)
- ✅ Add Langfuse env vars to `.env.local`
- ✅ Install `yaml` package for config parsing
- ✅ Create `src/lib/billing/config.ts` — parse billing.yaml, helper functions
- ✅ Update `src/lib/env.ts` — add Langfuse + Cashfree env var definitions
- ✅ Update `src/lib/types.ts` — add all billing TypeScript types (config + runtime)
- ✅ Create Supabase migration `20260307000000_phase3_billing_tables.sql`:
  - subscriptions, credit_balance, credit_ledger, credit_purchases, generation_events
  - Enums, indexes, RLS policies, init_credit_balance function

- ✅ Install `langfuse` SDK (v3.38.6)
- ✅ Create `src/lib/billing/langfuse.ts` — Langfuse singleton + `startLangfuseGeneration` helper
- ✅ Wrap all 5 OpenAI calls in `src/lib/adapters/openai.ts` with Langfuse traces:
  - `seed-generation` — generateDreamscapes
  - `enhancement-stitch` — enhanceDreamscape stitch path
  - `enhancement-{goal}` — enhanceDreamscape per-chunk path
  - `output-generation` — generateVariant (×3 per generateOutputs call)
- ✅ Build passes clean

### 🔄 In Progress

*Phases A+B complete. Phases C-F pending.*

### ⏳ Pending Tasks

**Phase C — Credit Tracking (core logic)**
- [ ] `src/lib/billing/credits.ts` — getBalance, debitCredits, grantSignupBonus
- [ ] Update 4 API routes with credit pre-check + debit + generation_event writes
- [ ] 402 response for insufficient credits

**Phase D — Cashfree Integration**
- [ ] `src/lib/billing/cashfree.ts`
- [ ] 5 billing API routes (subscribe, topup, webhook, balance, history)

**Phase E — Monthly Sweep**
- [ ] Cron route + vercel.json config

**Phase F — UI**
- [ ] Billing page
- [ ] Nav link
- [ ] 402 error surfacing in create/studio flows

## Changes Made

### Files Created
- `src/config/billing.yaml`
- `src/lib/billing/config.ts`
- `src/lib/billing/langfuse.ts`
- `supabase/migrations/20260307000000_phase3_billing_tables.sql`

### Files Modified
- `.env.local` — added Langfuse keys
- `src/lib/env.ts` — added langfuse + cashfree env sections
- `src/lib/types.ts` — added ~100 lines of billing types
- `src/lib/adapters/openai.ts` — wrapped all OpenAI calls with Langfuse traces
- `package.json` — added `yaml` + `langfuse` dependencies

## Implementation Notes

### Key Technical Details
- billing.yaml is read with `fs.readFileSync` and cached in-memory (server-side only)
- credit_balance is denormalized for O(1) reads; credit_ledger is append-only source of truth
- init_credit_balance() is a SECURITY DEFINER function (runs as owner, bypasses RLS)
- Signup bonus (10,000 credits) goes into topup bucket (never expires)
- Only one active subscription per user (enforced by unique partial index)
- All write operations to billing tables use service_role key (no INSERT RLS for users)

---

*This document tracks active implementation progress*
