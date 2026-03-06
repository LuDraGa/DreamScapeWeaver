-- Add missing RLS SELECT policy for profiles.
-- Phase 2a enabled RLS on profiles but only added an admin read-all policy.
-- Without a user-level SELECT policy, authenticated users cannot read their own
-- profile row, causing auth context to always default role to 'normal' and
-- blocking the profile upsert verification.

-- Users can read their own profile row.
CREATE POLICY "profiles: owner read"
  ON storyweaver.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile row (needed for the upsert-on-login flow).
CREATE POLICY "profiles: owner insert"
  ON storyweaver.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
