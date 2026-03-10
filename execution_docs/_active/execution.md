# StoryWeaver - Active Execution

## Task: Phase 3 — Billing & Credits System (continued)

**Session**: 2026-03-10
**Context**: Phase C — Credit tracking core logic. Building on Phase A (config/schema) and Phase B (Langfuse) from previous session.

## Execution Status

### ✅ Completed Tasks

- ✅ Rename archived docs:
  - `2026-03-06-a42824c-auto-save-outputs-library-fixes.md`
  - `2026-03-07-83ede85-billing-phase-a-b-langfuse.md`
- ✅ Add Cashfree production keys to `.env.local`
- ✅ Create `src/lib/supabase/service.ts` — service_role client for billing writes (bypasses RLS)
- ✅ Create migration `20260310000000_billing_rpc_functions.sql`:
  - `debit_credits()` — atomic debit + ledger + generation_event (with row-level locking)
  - `grant_credits()` — grant subscription/topup/bonus credits
  - `sweep_expired_credits()` — cron-callable function for monthly expiry
- ✅ Create `src/lib/billing/credits.ts`:
  - `getBalance()` — read credit_balance
  - `hasCreditsForAction()` — pre-check with action type mapping
  - `debitCredits()` — calls RPC for atomic debit + generation_event write
  - `grantSignupBonus()` — idempotent first-login bonus (10,000 credits)
- ✅ Update 3 API routes with auth check + credit pre-check + debit:
  - `POST /api/dreamscapes/generate` — 401/402 gates + debit 500 credits (seed)
  - `POST /api/dreamscapes/enhance` — 401/402 gates + debit 400 credits (enhance)
  - `POST /api/outputs/generate` — 401/402 gates + debit 1150 credits (output)
- ✅ Wire `grantSignupBonus()` into auth callback (`src/app/auth/callback/route.ts`)
- ✅ Build passes clean
- ✅ Create `GET /api/billing/balance` — returns credit balance + active subscription
- ✅ Create `GET /api/billing/history` — returns ledger entries + usage stats
- ✅ Create `src/app/app/billing/page.tsx` — full billing dashboard:
  - Credit balance hero (total + subscription/topup breakdown)
  - Usage progress bar (subscription usage this period)
  - Current plan card with upgrade CTA
  - Plan tiers preview (for free users)
  - Top-up packs grid (Micro/Small/Medium/Large with tags)
  - Usage overview (action counts + total credits used)
  - Transaction history (recent ledger entries with time-ago)
- ✅ Add Billing nav link (Coins icon) to sidebar
- ✅ Add new icons to `src/components/icons.tsx` (Coins, Zap, TrendingUp, Clock)
- ✅ Build passes clean (all routes + page registered)

**Phase D — Cashfree Integration**
- ✅ Install `cashfree-pg@5.1.0` SDK
- ✅ Create `src/lib/billing/cashfree.ts` — SDK wrapper (orders, subscriptions, webhooks)
- ✅ Create `POST /api/billing/topup` — initiate top-up order via Cashfree Payment Gateway
- ✅ Create `POST /api/billing/subscribe` — create subscription via Cashfree Subscriptions API
- ✅ Create `POST /api/billing/webhook` — handle payment + subscription events
- ✅ Create `scripts/sync-cashfree-plans.ts` — config-driven plan sync to Cashfree
- ✅ Create `.github/workflows/sync-cashfree-plans.yml` — CI/CD on billing.yaml changes
- ✅ Create migration `20260310000001_billing_cashfree_columns.sql`:
  - Added `initialized` to `subscription_status` enum
  - Added `status` column to `credit_purchases`
  - Added index on `credit_purchases.cashfree_order_id`
- ✅ Build passes clean

### ⏳ Pending Tasks

**Phase E — Monthly Sweep**
- [ ] `src/app/api/cron/billing-sweep/route.ts` + vercel.json

**Developer Actions Required**
- [ ] Run `supabase db push` to apply migrations (20260310000000 + 20260310000001)
- [ ] Run `npx tsx scripts/sync-cashfree-plans.ts` to create plans in Cashfree
- [ ] Add `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` to GitHub repo secrets
- [ ] After webhook endpoint is deployed, configure Cashfree webhook URL in dashboard
- [ ] Set `CASHFREE_WEBHOOK_SECRET` in `.env.local` and Vercel env vars
- [ ] Add `NEXT_PUBLIC_APP_URL` to Vercel env vars (for return URLs)

## Changes Made

### Files Created
- `src/lib/supabase/service.ts`
- `src/lib/billing/credits.ts`
- `src/lib/billing/cashfree.ts`
- `supabase/migrations/20260310000000_billing_rpc_functions.sql`
- `supabase/migrations/20260310000001_billing_cashfree_columns.sql`
- `src/app/api/billing/balance/route.ts`
- `src/app/api/billing/history/route.ts`
- `src/app/api/billing/topup/route.ts`
- `src/app/api/billing/subscribe/route.ts`
- `src/app/api/billing/webhook/route.ts`
- `src/app/app/billing/page.tsx`
- `scripts/sync-cashfree-plans.ts`
- `.github/workflows/sync-cashfree-plans.yml`

### Files Modified
- `package.json` — added `cashfree-pg` dependency
- `.env.local` — added Cashfree production keys
- `src/app/api/dreamscapes/generate/route.ts` — auth + credit gates
- `src/app/api/dreamscapes/enhance/route.ts` — auth + credit gates
- `src/app/api/outputs/generate/route.ts` — auth + credit gates
- `src/app/auth/callback/route.ts` — signup bonus on first login
- `src/app/app/layout.tsx` — added Billing nav link + credit balance badge
- `src/components/icons.tsx` — added Coins, Zap, TrendingUp, Clock icons

## Implementation Notes

### Key Technical Details
- `debit_credits` RPC uses `SELECT ... FOR UPDATE` to lock the balance row — prevents race conditions on concurrent requests
- Debit order: subscription credits first (time-limited), then topup (permanent)
- Split debits write 2 ledger rows (one per bucket) for full auditability
- Auth + credit checks only active when `ENABLE_AUTH=true` / `NEXT_PUBLIC_ENABLE_AUTH=true`
- When auth is disabled (local dev), routes work without credits — no billing enforcement
- Signup bonus goes to topup bucket (never expires)
- Debit happens AFTER successful LLM call — we eat the cost on debit failure rather than charging for failed generations

### Design Decision: Post-generation debit
Credits are debited after the LLM call succeeds, not before. If the debit fails (DB error), the user got a free generation — this is the safer failure mode. The alternative (pre-debit + refund on failure) adds complexity and the "free generation" failure case is rare and low-cost.

---

*This document tracks active implementation progress*
