-- =============================================================================
-- StoryWeaver — Phase 3 Billing Tables
-- Migration: 20260307000000_phase3_billing_tables.sql
-- Schema:    storyweaver
-- =============================================================================
--
-- OVERVIEW:
--   Establishes the billing and credit system tables:
--     1. subscriptions        — user subscription state (Cashfree-managed)
--     2. credit_balance       — denormalized current balance (fast reads)
--     3. credit_ledger        — append-only audit trail of all credit changes
--     4. credit_purchases     — top-up payment records
--     5. generation_events    — per-generation billing + analytics events
--
-- DESIGN NOTES:
--   - credit_balance is denormalized: updated on every ledger write for O(1) reads.
--     Source of truth is credit_ledger (append-only, auditable).
--   - Subscription credits expire at period end. Top-up credits never expire.
--   - Debit order: subscription credits first, then top-up credits.
--   - All prices stored in paise (INR smallest unit) for Cashfree compatibility.
--   - generation_events links to Langfuse via langfuse_trace_id for observability.
--
-- RLS POLICY:
--   All tables use user_id = auth.uid() for row-level security.
--   Webhook/cron operations use service_role key (bypasses RLS).
-- =============================================================================


-- =============================================================================
-- ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE storyweaver.subscription_status AS ENUM (
    'active',
    'cancelled',
    'past_due'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE storyweaver.credit_ledger_type AS ENUM (
    'subscription_grant',
    'topup_purchase',
    'generation_usage',
    'expiry_sweep',
    'signup_bonus'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE storyweaver.credit_bucket AS ENUM (
    'subscription',
    'topup'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE storyweaver.generation_action_type AS ENUM (
    'seed',
    'enhance',
    'output',
    'transform'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =============================================================================
-- TABLE: storyweaver.subscriptions
-- =============================================================================
--
-- One active subscription per user (enforced by unique partial index).
-- Cashfree manages lifecycle; webhook events update status + period dates.

CREATE TABLE IF NOT EXISTS storyweaver.subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES storyweaver.profiles(id) ON DELETE CASCADE,
  plan_id                  TEXT NOT NULL,  -- 'starter' | 'pro' | 'studio' (matches billing.yaml keys)
  status                   storyweaver.subscription_status NOT NULL DEFAULT 'active',
  current_period_start     TIMESTAMPTZ NOT NULL,
  current_period_end       TIMESTAMPTZ NOT NULL,
  cashfree_subscription_id TEXT,
  cashfree_plan_id         TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one active subscription per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_active_user
  ON storyweaver.subscriptions (user_id)
  WHERE status = 'active';

-- Lookup by Cashfree subscription ID (webhook reconciliation)
CREATE INDEX IF NOT EXISTS idx_subscriptions_cashfree_id
  ON storyweaver.subscriptions (cashfree_subscription_id)
  WHERE cashfree_subscription_id IS NOT NULL;

-- Auto-update updated_at
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON storyweaver.subscriptions
  FOR EACH ROW EXECUTE FUNCTION storyweaver.set_updated_at();


-- =============================================================================
-- TABLE: storyweaver.credit_balance
-- =============================================================================
--
-- Denormalized balance for O(1) reads. Updated atomically on every ledger write.
-- Source of truth: credit_ledger. This table can be rebuilt from ledger if needed.

CREATE TABLE IF NOT EXISTS storyweaver.credit_balance (
  user_id              UUID PRIMARY KEY REFERENCES storyweaver.profiles(id) ON DELETE CASCADE,
  subscription_credits INT NOT NULL DEFAULT 0,
  topup_credits        INT NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT positive_subscription_credits CHECK (subscription_credits >= 0),
  CONSTRAINT positive_topup_credits CHECK (topup_credits >= 0)
);

CREATE TRIGGER set_credit_balance_updated_at
  BEFORE UPDATE ON storyweaver.credit_balance
  FOR EACH ROW EXECUTE FUNCTION storyweaver.set_updated_at();


-- =============================================================================
-- TABLE: storyweaver.credit_ledger
-- =============================================================================
--
-- Append-only audit trail. Every credit change is a row here.
-- Positive amount = grant, negative amount = usage/expiry.
-- IMMUTABLE: no updated_at, no is_archived.

CREATE TABLE IF NOT EXISTS storyweaver.credit_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES storyweaver.profiles(id) ON DELETE CASCADE,
  amount        INT NOT NULL,
  type          storyweaver.credit_ledger_type NOT NULL,
  credit_bucket storyweaver.credit_bucket NOT NULL,
  reference_id  TEXT,  -- output_variant_id, cashfree_payment_id, subscription_id, etc.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User's ledger history (newest first)
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_created
  ON storyweaver.credit_ledger (user_id, created_at DESC);


-- =============================================================================
-- TABLE: storyweaver.credit_purchases
-- =============================================================================
--
-- Record of top-up pack purchases. Linked to Cashfree payment IDs.

CREATE TABLE IF NOT EXISTS storyweaver.credit_purchases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES storyweaver.profiles(id) ON DELETE CASCADE,
  pack_id             TEXT NOT NULL,   -- 'micro' | 'small' | 'medium' | 'large' (matches billing.yaml)
  credits_granted     INT NOT NULL,
  amount_paid_paise   INT NOT NULL,    -- INR paise (Cashfree smallest unit)
  discount_pct        INT NOT NULL DEFAULT 0,
  cashfree_order_id   TEXT,
  cashfree_payment_id TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_purchases_user
  ON storyweaver.credit_purchases (user_id, created_at DESC);


-- =============================================================================
-- TABLE: storyweaver.generation_events
-- =============================================================================
--
-- Per-generation billing + analytics. Written by API routes after every LLM call.
-- Links to Langfuse trace for full prompt/response inspection.
-- This is the billing source of truth for "what did this user consume".

CREATE TABLE IF NOT EXISTS storyweaver.generation_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES storyweaver.profiles(id) ON DELETE CASCADE,
  output_variant_id UUID,  -- nullable: seed/enhance don't produce output_variant rows
  action_type       storyweaver.generation_action_type NOT NULL,
  model             TEXT NOT NULL,
  prompt_tokens     INT,
  completion_tokens INT,
  credits_charged   INT NOT NULL,
  credit_bucket     storyweaver.credit_bucket NOT NULL,
  langfuse_trace_id TEXT,  -- link to Langfuse trace for observability
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User's generation history
CREATE INDEX IF NOT EXISTS idx_generation_events_user_created
  ON storyweaver.generation_events (user_id, created_at DESC);

-- Analytics: aggregate by action_type
CREATE INDEX IF NOT EXISTS idx_generation_events_action_type
  ON storyweaver.generation_events (action_type, created_at DESC);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE storyweaver.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyweaver.credit_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyweaver.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyweaver.credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyweaver.generation_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own rows
CREATE POLICY subscriptions_select ON storyweaver.subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY credit_balance_select ON storyweaver.credit_balance
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY credit_ledger_select ON storyweaver.credit_ledger
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY credit_purchases_select ON storyweaver.credit_purchases
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY generation_events_select ON storyweaver.generation_events
  FOR SELECT USING (user_id = auth.uid());

-- Write operations use service_role key (API routes, webhooks, cron).
-- No INSERT/UPDATE/DELETE policies for authenticated users —
-- all mutations go through server-side API routes with service_role.


-- =============================================================================
-- FUNCTION: Initialize credit_balance row on first login
-- =============================================================================
--
-- Called from auth callback or signup flow. Idempotent via ON CONFLICT.
-- Grants signup bonus credits (read from billing.yaml by the calling code,
-- but the default here is 0 — the app code passes the actual value).

CREATE OR REPLACE FUNCTION storyweaver.init_credit_balance(
  p_user_id UUID,
  p_signup_bonus INT DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO storyweaver.credit_balance (user_id, topup_credits)
  VALUES (p_user_id, p_signup_bonus)
  ON CONFLICT (user_id) DO NOTHING;

  -- If signup bonus > 0 and row was just created, write ledger entry
  IF p_signup_bonus > 0 AND NOT EXISTS (
    SELECT 1 FROM storyweaver.credit_ledger
    WHERE user_id = p_user_id AND type = 'signup_bonus'
  ) THEN
    INSERT INTO storyweaver.credit_ledger (user_id, amount, type, credit_bucket, reference_id)
    VALUES (p_user_id, p_signup_bonus, 'signup_bonus', 'topup', 'initial_signup');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
