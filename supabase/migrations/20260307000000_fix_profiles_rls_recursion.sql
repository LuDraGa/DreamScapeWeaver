-- =============================================================================
-- Fix: infinite recursion in profiles RLS policies
-- =============================================================================
--
-- ROOT CAUSE:
--   Phase 2a created admin policies on storyweaver.profiles that use a subquery
--   against the same table to check the current user's role:
--
--     "Admins can read all profiles":
--       USING ((SELECT role FROM storyweaver.profiles WHERE id = auth.uid()) = 'admin')
--
--     "Admins can update roles":
--       USING / WITH CHECK (same pattern)
--
--   PostgreSQL evaluates ALL applicable RLS policies on every query. So even
--   though the safe "Users can read own profile" policy allows the row, the
--   recursive admin policies are also evaluated, causing:
--
--     ERROR 42P17: infinite recursion detected in policy for relation "profiles"
--
--   Additionally, Phase 2a and Phase 2b migrations created duplicate owner
--   policies:
--     "Users can read own profile"  ≡  "profiles: owner read"
--     "Users can insert own profile" ≡  "profiles: owner insert"
--
-- FIX:
--   1. Create storyweaver.get_my_role() — SECURITY DEFINER, bypasses RLS
--      inside its body so the admin check never re-enters RLS evaluation.
--   2. Drop all Phase 2a policies (recursive admin + duplicate owner ones).
--   3. Recreate admin policies using the safe helper function.
--   (The Phase 2b "profiles: owner read/insert" policies remain and are enough
--   for regular users.)
-- =============================================================================

-- Step 1: SECURITY DEFINER helper — reads current user's role bypassing RLS.
-- Runs as the function owner (postgres superuser), so the SELECT inside never
-- triggers RLS on profiles, breaking the infinite recursion cycle.
CREATE OR REPLACE FUNCTION storyweaver.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = storyweaver
AS $$
  SELECT role FROM storyweaver.profiles WHERE id = auth.uid()
$$;

-- Step 2: Drop the recursive Phase 2a admin policies and the duplicate owner
-- policies that were superseded by the Phase 2b "profiles: owner *" ones.
DROP POLICY IF EXISTS "Admins can read all profiles"  ON storyweaver.profiles;
DROP POLICY IF EXISTS "Admins can update roles"        ON storyweaver.profiles;
DROP POLICY IF EXISTS "Users can read own profile"     ON storyweaver.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"   ON storyweaver.profiles;

-- Step 3: Recreate admin policies using the safe SECURITY DEFINER helper.
CREATE POLICY "profiles: admin read all"
  ON storyweaver.profiles
  FOR SELECT
  TO authenticated
  USING (storyweaver.get_my_role() = 'admin');

CREATE POLICY "profiles: admin update roles"
  ON storyweaver.profiles
  FOR UPDATE
  TO authenticated
  USING      (storyweaver.get_my_role() = 'admin')
  WITH CHECK (storyweaver.get_my_role() = 'admin');

-- Remaining active policies after this migration:
--   "profiles: owner read"    — SELECT where auth.uid() = id  (Phase 2b, safe)
--   "profiles: owner insert"  — INSERT where auth.uid() = id  (Phase 2b, safe)
--   "profiles: admin read all"        — SELECT for admins via get_my_role()
--   "profiles: admin update roles"    — UPDATE for admins via get_my_role()
