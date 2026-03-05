---
**Commit**: 5927da9
**Date**: 2026-03-05 11:52:45
**Message**: feat: modal-based login, guest access to create, sidebar auth section
---

# StoryWeaver - Active Execution

## Task: Auth UX — Login Modal + Guest-Only Create + Sidebar Auth Button

**Session**: 2026-03-05
**Context**: Replace redirect-based login with modal, grey-out nav for guests, add sidebar auth section (Sign in button / logged-in user row)

## Execution Status

### ✅ Completed Tasks
- Add `loginModalOpen` + `openLoginModal` + `closeLoginModal` to app-store
- Add `logout` + `refreshAuth` to AuthContext (new `AuthContextValue` interface)
- Create `src/components/auth/LoginModal.tsx` (Radix Dialog, mock + real auth modes)
- Update `src/app/app/layout.tsx` — sidebar auth section + greyed nav items (opacity-35, click→modal)
- Update `middleware.ts` — `/app/create` open to guests, protected routes redirect to `/app/create`
- Simplify `/auth/login/page.tsx` to instant redirect shell
- Build passes ✅

### 🔄 In Progress
*None*

### ⏳ Pending Tasks
*None — implementation complete, needs manual testing*

## Changes Made

### Files Modified
- `src/store/app-store.ts` — added loginModalOpen, openLoginModal, closeLoginModal
- `src/lib/auth/context.tsx` — added AuthContextValue, logout(), refreshAuth()
- `src/app/app/layout.tsx` — sidebar auth section + locked nav items
- `middleware.ts` — guest-friendly route config
- `src/app/auth/login/page.tsx` — simplified to redirect shell

### Files Created
- `src/components/auth/LoginModal.tsx`

## Implementation Notes

### Key Technical Details
- Modal state in Zustand (not persisted — excluded by `partialize`)
- Auth context exposes `logout()` (clears mock or signs out Supabase) and `refreshAuth()` (re-reads localStorage for mock mode)
- Greyed nav: `opacity-35`, renders as `<button>` not `<Link>`, calls `openLoginModal` on click
- Sign in button: full-width indigo gradient with glow (`boxShadow: 0 0 16px rgba(99,102,241,0.35)`)
- Logged in row: avatar initial circle + truncated email + logout icon button
- Middleware: only `PROTECTED_APP_PATHS = [studio, library, settings]` gated; create is open

## Developer Actions Required
- [ ] `pnpm dev` and test guest flow: Create works, clicking Studio/Library/Settings opens modal
- [ ] Test mock login: role picker appears in modal, selecting a role closes modal and updates sidebar
- [ ] Test mock logout: sidebar returns to Sign in button, nav items grey out
- [ ] Verify collapsed sidebar: Sign in shows icon-only, logged-in shows avatar-only

---

*This document tracks active implementation progress*
