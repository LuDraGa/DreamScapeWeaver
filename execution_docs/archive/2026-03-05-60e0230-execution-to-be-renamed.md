---
**Commit**: 60e0230
**Date**: 2026-03-05 00:30:43
**Message**: feat: supabase auth with google oauth + email/password, schema isolation, mock login for local dev
---

# StoryWeaver - Active Execution

## Task: Supabase Auth — Phase 2

**Session**: 2026-03-05
**Context**: Wiring up Supabase auth (Google OAuth + email/password) with schema isolation + mock login for local dev

## Execution Status

### ✅ Completed Tasks

- Installed `@supabase/supabase-js` + `@supabase/ssr`
- Created `src/lib/supabase/client.ts` — browser client (`storyweaver` schema)
- Created `src/lib/supabase/server.ts` — server client (API routes + server components)
- Created `src/lib/auth/roles.ts` — `UserRole` type + access guard helpers
- Created `src/lib/auth/mock.ts` — mock session helpers (get/set/clear from localStorage)
- Updated `src/lib/auth/context.tsx` — real Supabase session listener + mock fallback
- Updated `src/lib/types.ts` — added `role` to `User` and `AuthState`
- Created `src/app/auth/login/page.tsx` — mock role picker (dev) + real auth UI (prod)
- Created `src/app/auth/callback/route.ts` — OAuth code exchange + profile upsert
- Created `middleware.ts` — passthrough in mock mode, session guard in real mode
- Updated `src/lib/env.ts` — Supabase var validation when auth enabled
- Fixed pre-existing build errors (`create/page.tsx` unescaped entities, `transforms.ts` type error, `tsconfig.json` ES target)
- `.env.local` — Supabase credentials added
- Build passes ✅

### 🔄 In Progress

*Nothing*

### ⏳ Pending Tasks

- Add logout button to app sidebar
- Protect `/app/*` routes client-side when `NEXT_PUBLIC_ENABLE_AUTH=false` (optional — currently open in mock mode by design)
- Real auth UI tested on Vercel (NEXT_PUBLIC_ENABLE_AUTH=true + redirect URL configured)

## Changes Made

### Files Created
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/auth/roles.ts`
- `src/lib/auth/mock.ts`
- `src/app/auth/login/page.tsx`
- `src/app/auth/callback/route.ts`
- `middleware.ts`
- `docs/ROADMAP.md`

### Files Modified
- `src/lib/auth/context.tsx`
- `src/lib/types.ts`
- `src/lib/env.ts`
- `src/lib/transforms.ts` (pre-existing type error fix)
- `src/app/app/create/page.tsx` (pre-existing lint error fix)
- `tsconfig.json` (ES2017 → ES2020 for regex `s` flag support)
- `.env.local`
- `execution_docs/_active/planning.md`
- `CLAUDE.md`
- `docs/ARCHITECTURE.md`

## Developer Actions Required
- [ ] `pnpm dev` → go to `http://localhost:3000/auth/login` → pick a role → should land on `/app/create`
- [ ] Before Vercel deploy: set `NEXT_PUBLIC_ENABLE_AUTH=true` + add redirect URL in Supabase dashboard
- [ ] Bootstrap first admin: run `UPDATE storyweaver.profiles SET role = 'admin' WHERE email = 'your@email.com';` in Supabase SQL Editor
