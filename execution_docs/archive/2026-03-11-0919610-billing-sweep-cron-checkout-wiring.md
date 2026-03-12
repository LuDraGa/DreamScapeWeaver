---
**Commit**: 0919610
**Date**: 2026-03-11 10:08:37
**Message**: feat: add billing sweep cron, frontend checkout wiring, and fixes
---

# StoryWeaver - Active Execution

## Task: Phase 3 — Billing (Phase E + Frontend Wiring)

**Session**: 2026-03-11
**Context**: Phase E (monthly sweep cron) + frontend wiring for Cashfree checkout on billing page.

## Execution Status

### ✅ Completed Tasks

**Phase E — Monthly Sweep**
- ✅ Create `src/app/api/cron/billing-sweep/route.ts` — calls `sweep_expired_credits()` RPC
- ✅ Create `vercel.json` — daily cron at midnight UTC (`0 0 * * *`)

**Frontend Wiring**
- ✅ Install `@cashfreepayments/cashfree-js` for in-page checkout
- ✅ Add type declarations for `@cashfreepayments/cashfree-js` (`src/types/cashfree-js.d.ts`)
- ✅ Wire top-up pack buttons → `POST /api/billing/topup` → Cashfree checkout
- ✅ Wire plan tier cards → `POST /api/billing/subscribe` → Cashfree subscription checkout
- ✅ Handle return URL params (success/failure toasts)
- ✅ Add loading states + disabled states during checkout
- ✅ Wrap `useSearchParams` in Suspense boundary (Next.js 15 requirement)
- ✅ Auto-refresh balance data after successful payment
- ✅ Build passes clean

## Changes Made

### Files Created
- `src/app/api/cron/billing-sweep/route.ts`
- `vercel.json`
- `src/types/cashfree-js.d.ts`

### Files Modified
- `package.json` — added `@cashfreepayments/cashfree-js`
- `pnpm-lock.yaml`
- `src/app/app/billing/page.tsx` — wired checkout flows + toasts + Suspense boundary

## Developer Actions Required
- [ ] Run `supabase db push` to apply all billing migrations
- [ ] Run `npx tsx scripts/sync-cashfree-plans.ts` to create plans in Cashfree
- [ ] Add `CASHFREE_APP_ID` + `CASHFREE_SECRET_KEY` to GitHub repo secrets
- [ ] Add `NEXT_PUBLIC_APP_URL` to Vercel env vars
- [ ] Add `NEXT_PUBLIC_CASHFREE_ENVIRONMENT=production` to Vercel env vars
- [ ] After deploying, configure webhook URL in Cashfree dashboard
- [ ] Set `CASHFREE_WEBHOOK_SECRET` in `.env.local` + Vercel
- [ ] Add `CRON_SECRET` to Vercel env vars (auto-set by Vercel for cron jobs)

---

*This document tracks active implementation progress*
