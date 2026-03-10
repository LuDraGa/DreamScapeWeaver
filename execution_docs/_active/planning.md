# Billing & Credits System — Planning

**Date**: 2026-03-07
**Scope**: Phase 3 — Credits system, Cashfree payments, Langfuse observability, generation_events

---

## Decisions Locked

| Decision | Value |
|----------|-------|
| Payment provider | Cashfree (INR primary, USD reference only) |
| Gross margin target | 80% |
| Credit value | 1 credit = $0.0001 / ~₹0.0083 |
| Debit order | Subscription credits first, then top-up |
| Sub credit carryover | None — expire at period end |
| Top-up credit expiry | Never |
| LLM observability | Langfuse (traces, token cost, latency) |
| Billing source of truth | Self-hosted `generation_events` Supabase table |
| Weekly packs | No — small top-up packs instead |
| Credit deduction model | Flat per action type |
| Auth gate | Logged-in users only. Guests see login prompt, no usage. |
| Signup bonus | 10,000 credits on first login (configurable in billing.yaml) |
| Config-driven | ALL plan IDs, prices, credit costs live in billing.yaml only. No hardcoding in app code. |

---

## Credit Costs Per Action (80% gross margin)

| Action | Credits | API cost basis |
|--------|---------|---------------|
| Seed generation | 500 | $0.010 |
| Enhancement / stitch | 400 | $0.008 |
| Output generation (3 variants) | 1,150 | $0.023 |
| Part transform (Studio) | 300 | $0.006 |
| **Full workflow** | **~2,050** | **~$0.041** |

---

## Subscription Plans

| Plan | Price (INR) | Monthly Credits | Top-up Discount |
|------|-------------|----------------|-----------------|
| Starter | ₹1,250 | 100,000 | 0% |
| Pro | ₹3,350 | 300,000 | 15% |
| Studio | ₹6,700 | 900,000 | 30% |

## Top-up Packs (base price, discount per active plan)

| Pack | Credits | Base (INR) |
|------|---------|------------|
| Micro | 15,000 | ₹250 |
| Small | 50,000 | ₹750 |
| Medium | 150,000 | ₹2,100 |
| Large | 400,000 | ₹5,000 |

---

## DB Schema (new tables in `storyweaver` schema)

```sql
storyweaver.subscriptions
  id UUID PK, user_id UUID FK → profiles
  plan_id TEXT NOT NULL  -- 'starter' | 'pro' | 'studio'
  status TEXT NOT NULL DEFAULT 'active'  -- 'active' | 'cancelled' | 'past_due'
  current_period_start TIMESTAMPTZ, current_period_end TIMESTAMPTZ
  cashfree_subscription_id TEXT, cashfree_plan_id TEXT
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ

storyweaver.credit_balance
  user_id UUID PK FK → profiles
  subscription_credits INT DEFAULT 0   -- expire at period end
  topup_credits INT DEFAULT 0          -- never expire
  updated_at TIMESTAMPTZ

storyweaver.credit_ledger              -- append-only, auditable
  id UUID PK, user_id UUID FK
  amount INT         -- positive=grant, negative=usage
  type TEXT          -- 'subscription_grant' | 'topup_purchase' | 'generation_usage' | 'expiry_sweep' | 'signup_bonus'
  credit_bucket TEXT -- 'subscription' | 'topup'
  reference_id TEXT  -- output_variant_id | cashfree_payment_id
  created_at TIMESTAMPTZ

storyweaver.credit_purchases
  id UUID PK, user_id UUID FK
  pack_id TEXT, credits_granted INT
  amount_paid_paise INT   -- INR paise (Cashfree uses smallest unit)
  discount_pct INT DEFAULT 0
  cashfree_order_id TEXT, cashfree_payment_id TEXT
  created_at TIMESTAMPTZ

storyweaver.generation_events
  id UUID PK, user_id UUID FK
  output_variant_id UUID  -- nullable
  action_type TEXT        -- 'seed' | 'enhance' | 'output' | 'transform'
  model TEXT, prompt_tokens INT, completion_tokens INT
  credits_charged INT, credit_bucket TEXT
  langfuse_trace_id TEXT  -- link back to Langfuse trace
  created_at TIMESTAMPTZ
```

---

## Implementation Phases

### Phase A — Config & Schema (foundation)
- [ ] `src/config/billing.yaml` ✅ DONE
- [ ] `src/lib/billing/config.ts` — parse billing.yaml, export typed config
- [ ] Supabase migration for 5 new billing tables (above)
- [ ] Add billing TypeScript types to `src/lib/types.ts`
- [ ] Update `src/lib/env.ts` — LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_WEBHOOK_SECRET

### Phase B — Langfuse Integration (LLM observability)
- [ ] Install `langfuse` SDK
- [ ] Wrap OpenAI calls in `src/lib/adapters/openai.ts` with Langfuse trace
- [ ] Pass `langfuse_trace_id` through to generation_events rows
- [ ] Verify traces appear in Langfuse dashboard

### Phase C — Credit Tracking (core logic)
- [ ] `src/lib/billing/credits.ts`:
  - `getBalance(userId)` → reads credit_balance
  - `hasCredits(userId, amount)` → pre-check
  - `debitCredits(userId, amount, actionType, referenceId)` → debit from correct bucket, write ledger row, update balance
  - `grantSignupBonus(userId)` → one-time, idempotent via ledger check
- [ ] Update 4 API routes: pre-check balance → call LLM → debit + write generation_event
- [ ] `src/middleware.ts` — check auth for all /app/* API routes, return 401 for guests
- [ ] Return `{ error: 'insufficient_credits', balance }` (HTTP 402) when balance is zero

### Phase D — Cashfree Integration
- [ ] `src/lib/billing/cashfree.ts` — Cashfree SDK wrapper (all plan IDs read from billing.yaml config)
- [ ] `POST /api/billing/subscribe` — create subscription using plan_id from config
- [ ] `POST /api/billing/topup` — create Cashfree order using pack config + apply plan discount
- [ ] `POST /api/billing/webhook` — handle:
  - `SUBSCRIPTION_ACTIVATED` → grant monthly credits, subscription_grant ledger row
  - `SUBSCRIPTION_RENEWED` → expiry_sweep old sub credits + grant new month
  - `SUBSCRIPTION_CANCELLED` → update subscriptions.status
  - `PAYMENT_SUCCESS` (topup) → grant topup_credits, topup_purchase ledger row, write credit_purchases row
  - `PAYMENT_FAILED` → update subscription status to past_due
- [ ] `GET /api/billing/balance` — returns { subscription_credits, topup_credits, total }
- [ ] `GET /api/billing/history` — last 20 ledger entries

### Phase E — Monthly Credit Sweep (cron)
- [ ] `src/app/api/cron/billing-sweep/route.ts` — finds subscriptions with expired period, zeros sub credits, writes expiry_sweep ledger row
- [ ] `vercel.json` — daily cron schedule
- [ ] Webhook SUBSCRIPTION_RENEWED also handles sweep (belt + suspenders approach)

### Phase F — UI
- [ ] `src/app/app/billing/page.tsx`:
  - Current plan card + credit balance (sub + top-up separated)
  - Usage this period (generation_events count + credits used)
  - Subscription upgrade/downgrade
  - Top-up pack grid (shows discounted price based on active plan)
  - Ledger history table (last 20 entries)
- [ ] Add Billing link to nav
- [ ] Surface 402 errors in create/studio UI with "Top up credits" CTA

### Phase G — Auth enforcement for credit flows
- [ ] On any API generation attempt without auth: return 401 + { redirect: '/auth/login' }
- [ ] Frontend: intercept 401 on generation calls, show "Sign in to continue" modal

---

## Open Questions — RESOLVED

| # | Question | Answer |
|---|----------|--------|
| 1 | Cashfree plan IDs | Config-driven via billing.yaml — user fills after creating plans in dashboard |
| 2 | Auth gate | Logged-in only. Guests prompted to login. |
| 3 | Free tier | 10,000 signup bonus credits on first login (configurable) |
| 4 | Currency | INR primary via Cashfree. USD in config for future. |
| 5 | LLM observability | Langfuse (not Helicone) |

## Remaining Unknown
- Does user have Langfuse account / keys yet?
- Does user have Cashfree subscription plan types to create, or should we document the exact steps?
