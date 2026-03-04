# Planning: Supabase Auth (Phase 2)

**Started:** 2026-03-04
**Context:** Wire up real auth using Supabase — Google OAuth + email/password. User roles: normal, admin, dev.

---

## Approach

Use `@supabase/supabase-js` + `@supabase/ssr` (the official Next.js integration).

**Auth methods:**
- Google OAuth (one-click)
- Email + password (traditional signup/login)
- NO magic links

**User roles** (stored in `profiles` table, not in auth.users metadata):
- `normal` — default for all new signups
- `admin` — can manage users, view usage, configure app-wide settings
- `dev` — access to dev tools (prompt inspector, mock adapter toggle, debug panels)
- `power_user` — NOT a role, this is a user preference stored in settings

---

## Files to Create / Modify

### New packages
```
@supabase/supabase-js
@supabase/ssr
```

### New files
```
src/lib/supabase/client.ts          # Browser Supabase client (singleton)
src/lib/supabase/server.ts          # Server Supabase client (for API routes + server components)
src/app/auth/login/page.tsx         # Login UI (email/password + Google button)
src/app/auth/signup/page.tsx        # Signup UI (email/password)
src/app/auth/callback/route.ts      # OAuth callback handler (Google redirects here)
src/lib/auth/roles.ts               # Role types, helpers, access guards
middleware.ts                        # Next.js middleware — protect /app/* routes, refresh sessions
```

### Modified files
```
src/lib/auth/context.tsx            # Replace stub with real Supabase session listener
src/lib/env.ts                      # Already has Supabase env var slots, just enable validation
```

### Supabase SQL (run in Supabase SQL Editor once)
```sql
-- Role enum
CREATE TYPE user_role AS ENUM ('normal', 'admin', 'dev');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT,
  role       user_role NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on new signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'normal');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update roles"
  ON profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
```

---

## Route Protection

```
/app/*          → requires authenticated user (any role)
/app/admin/*    → requires role = 'admin'
/               → public (landing page)
/auth/login     → public (redirects to /app if already logged in)
/auth/signup    → public
```

Handled in `middleware.ts` — checks session, redirects if not auth'd.

---

## Login Page Design

Two sections:
1. **Google button** (prominent, top)
2. **Divider** "or continue with email"
3. **Email + Password form** + forgot password link
4. Link to signup

---

## What I Need From the User (Blockers)

See execution.md for the checklist of what user needs to provide before implementation.

---

## Open Questions

- What should happen when an unauthenticated user tries to access `/app/*`? → Redirect to `/auth/login`
- Should the landing page (`/`) be public? → Yes
- First admin: how do we bootstrap the first admin user? → Manual SQL update in Supabase dashboard, document it
