-- =============================================================================
-- StoryWeaver — Phase 3D: Cashfree Integration Schema Updates
-- Migration: 20260310000001_billing_cashfree_columns.sql
-- Schema:    storyweaver
-- =============================================================================
--
-- Adds:
--   1. 'initialized' value to subscription_status enum (for pre-payment state)
--   2. 'status' column to credit_purchases (pending/completed/failed)
--   3. Index on credit_purchases.cashfree_order_id for webhook lookups

-- Add 'initialized' to subscription_status enum
ALTER TYPE storyweaver.subscription_status ADD VALUE IF NOT EXISTS 'initialized' BEFORE 'active';

-- Add status column to credit_purchases for payment tracking
ALTER TABLE storyweaver.credit_purchases
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Index for webhook order lookup
CREATE INDEX IF NOT EXISTS idx_credit_purchases_cashfree_order
  ON storyweaver.credit_purchases (cashfree_order_id)
  WHERE cashfree_order_id IS NOT NULL;
