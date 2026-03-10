-- =============================================================================
-- StoryWeaver — Phase 3 Billing RPC Functions
-- Migration: 20260310000000_billing_rpc_functions.sql
-- Schema:    storyweaver
-- =============================================================================
--
-- Atomic functions for credit operations. Called from API routes via
-- supabase.rpc() with service_role key (bypasses RLS).
--
-- Functions:
--   1. debit_credits     — atomic debit + ledger + generation_event
--   2. grant_credits     — grant credits (subscription renewal, top-up)
--   3. sweep_expired     — zero out expired subscription credits
-- =============================================================================


-- =============================================================================
-- FUNCTION: debit_credits
-- =============================================================================
-- Atomically debit credits from user's balance, write ledger rows, and
-- record a generation_event. Follows debit order: subscription first, then topup.
--
-- Returns JSON: { success: bool, error?: string, balance: { subscription, topup } }

CREATE OR REPLACE FUNCTION storyweaver.debit_credits(
  p_user_id           UUID,
  p_amount            INT,
  p_action_type       storyweaver.generation_action_type,
  p_model             TEXT DEFAULT 'gpt-4o',
  p_prompt_tokens     INT DEFAULT NULL,
  p_completion_tokens INT DEFAULT NULL,
  p_output_variant_id UUID DEFAULT NULL,
  p_langfuse_trace_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_sub_credits    INT;
  v_topup_credits  INT;
  v_sub_debit      INT := 0;
  v_topup_debit    INT := 0;
  v_remaining      INT;
  v_primary_bucket storyweaver.credit_bucket;
BEGIN
  -- Lock the balance row for this user (prevents concurrent debits)
  SELECT subscription_credits, topup_credits
  INTO v_sub_credits, v_topup_credits
  FROM storyweaver.credit_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- No balance row = no credits
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_balance_row',
      'balance', jsonb_build_object('subscription', 0, 'topup', 0)
    );
  END IF;

  -- Check total balance
  IF (v_sub_credits + v_topup_credits) < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'balance', jsonb_build_object('subscription', v_sub_credits, 'topup', v_topup_credits)
    );
  END IF;

  -- Debit order: subscription first, then topup
  v_remaining := p_amount;

  IF v_sub_credits > 0 THEN
    v_sub_debit := LEAST(v_sub_credits, v_remaining);
    v_remaining := v_remaining - v_sub_debit;
  END IF;

  IF v_remaining > 0 THEN
    v_topup_debit := v_remaining;
  END IF;

  -- Determine primary bucket (the one that got debited most)
  IF v_sub_debit >= v_topup_debit THEN
    v_primary_bucket := 'subscription';
  ELSE
    v_primary_bucket := 'topup';
  END IF;

  -- Update balance
  UPDATE storyweaver.credit_balance
  SET subscription_credits = subscription_credits - v_sub_debit,
      topup_credits = topup_credits - v_topup_debit
  WHERE user_id = p_user_id;

  -- Write ledger row(s)
  IF v_sub_debit > 0 THEN
    INSERT INTO storyweaver.credit_ledger (user_id, amount, type, credit_bucket, reference_id)
    VALUES (p_user_id, -v_sub_debit, 'generation_usage', 'subscription', p_output_variant_id::TEXT);
  END IF;

  IF v_topup_debit > 0 THEN
    INSERT INTO storyweaver.credit_ledger (user_id, amount, type, credit_bucket, reference_id)
    VALUES (p_user_id, -v_topup_debit, 'generation_usage', 'topup', p_output_variant_id::TEXT);
  END IF;

  -- Write generation_event
  INSERT INTO storyweaver.generation_events (
    user_id, output_variant_id, action_type, model,
    prompt_tokens, completion_tokens, credits_charged,
    credit_bucket, langfuse_trace_id
  ) VALUES (
    p_user_id, p_output_variant_id, p_action_type, p_model,
    p_prompt_tokens, p_completion_tokens, p_amount,
    v_primary_bucket, p_langfuse_trace_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'balance', jsonb_build_object(
      'subscription', v_sub_credits - v_sub_debit,
      'topup', v_topup_credits - v_topup_debit
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- FUNCTION: grant_credits
-- =============================================================================
-- Grant credits to a user's balance. Used by:
--   - Subscription activation/renewal (bucket = 'subscription')
--   - Top-up purchase (bucket = 'topup')
--   - Signup bonus (bucket = 'topup')

CREATE OR REPLACE FUNCTION storyweaver.grant_credits(
  p_user_id       UUID,
  p_amount        INT,
  p_type          storyweaver.credit_ledger_type,
  p_bucket        storyweaver.credit_bucket,
  p_reference_id  TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
  -- Ensure balance row exists
  INSERT INTO storyweaver.credit_balance (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update balance
  IF p_bucket = 'subscription' THEN
    UPDATE storyweaver.credit_balance
    SET subscription_credits = subscription_credits + p_amount
    WHERE user_id = p_user_id;
  ELSE
    UPDATE storyweaver.credit_balance
    SET topup_credits = topup_credits + p_amount
    WHERE user_id = p_user_id;
  END IF;

  -- Write ledger row
  INSERT INTO storyweaver.credit_ledger (user_id, amount, type, credit_bucket, reference_id)
  VALUES (p_user_id, p_amount, p_type, p_bucket, p_reference_id);

  -- Return updated balance
  RETURN (
    SELECT jsonb_build_object(
      'success', true,
      'balance', jsonb_build_object(
        'subscription', subscription_credits,
        'topup', topup_credits
      )
    )
    FROM storyweaver.credit_balance
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- FUNCTION: sweep_expired_credits
-- =============================================================================
-- Called by daily cron. For each subscription whose period has ended:
--   1. Zero out remaining subscription_credits
--   2. Write expiry_sweep ledger row
-- Returns count of users swept.

CREATE OR REPLACE FUNCTION storyweaver.sweep_expired_credits()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_rec   RECORD;
BEGIN
  FOR v_rec IN
    SELECT s.user_id, s.id AS subscription_id, cb.subscription_credits
    FROM storyweaver.subscriptions s
    JOIN storyweaver.credit_balance cb ON cb.user_id = s.user_id
    WHERE s.status = 'active'
      AND s.current_period_end < now()
      AND cb.subscription_credits > 0
  LOOP
    -- Write expiry ledger row
    INSERT INTO storyweaver.credit_ledger (user_id, amount, type, credit_bucket, reference_id)
    VALUES (v_rec.user_id, -v_rec.subscription_credits, 'expiry_sweep', 'subscription', v_rec.subscription_id::TEXT);

    -- Zero out subscription credits
    UPDATE storyweaver.credit_balance
    SET subscription_credits = 0
    WHERE user_id = v_rec.user_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
