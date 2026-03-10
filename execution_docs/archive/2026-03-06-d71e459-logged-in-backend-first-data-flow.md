---
**Commit**: d71e459
**Date**: 2026-03-06 18:20:04
**Message**: refactor: backend-first data flow for logged-in users
---

# StoryWeaver - Active Execution

## Task: Logged-in user backend-first data flow

**Session**: 2026-03-06
**Context**: For logged-in users — library and settings pages fetch directly from Supabase (no Zustand), create flow ephemeral state stays in Zustand but resets cleanly on each new flow entry.

## Execution Status

### ✅ Completed Tasks
- Analysis of current broken state (loadLibraryData never called, persist middleware fights Supabase)

### 🔄 In Progress
- None

### ⏳ Pending Tasks
- None

## Changes Made

### Files Modified
- `src/store/app-store.ts` — removed savedDreamscapes/savedOutputs state, slimmed to create-flow + settings only, fixed setCurrentDreamscape to always reset ephemeral state, saveDreamscape/saveOutput are now thin async adapter calls
- `src/lib/auth/context.tsx` — added loadSettings() call on logged-in auth resolve
- `src/app/app/library/page.tsx` — full rewrite: fetches directly from adapter, local state for all data, mutations call adapter directly
- `src/app/app/settings/page.tsx` — fetches directly from adapter, local state, syncs to store on save for create flow

### Files Created
-

### Files Deleted
-

## Implementation Notes

### Architecture
- Logged-in users: Library/Settings = direct Supabase fetch, no Zustand for data
- Logged-in users: Create flow = Zustand ephemeral state (currentDreamscape, dialState, generatedOutputs)
- saveDreamscape/saveOutput = thin adapter calls only, no in-memory array updates
- settings stays in Zustand (needed by create flow), hydrated from Supabase on auth resolve
- Guest users: unchanged (localStorage + Zustand persist)

### Ephemeral reset
- setCurrentDreamscape always resets generatedVariants=[], activeVariantIndex=0, currentDialState=null (fresh from default preset)
- Prevents stale state bleeding from one flow into another

### persist partialize
- Drop savedDreamscapes, savedOutputs from persist
- Keep settings + create-flow state for guests (currentDreamscape etc can be kept for navigation)

---

*This document tracks active implementation progress*
