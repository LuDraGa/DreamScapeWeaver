# StoryWeaver - Active Execution

## Task: Phase 2b — Supabase persistence wiring

**Session**: 2026-03-06
**Context**: Wire supabase.ts adapter to live DB tables. Auth threading in store + implement
all 8 core adapter methods. Library-specific features (perf snapshots, version history) deferred.

## Execution Status

### ✅ Completed Tasks
- Read all relevant files: supabase.ts stub, local.ts, app-store.ts, types.ts, auth/context.tsx
- src/lib/persistence/supabase.ts — full implementation (all 8 adapter methods)
- src/store/app-store.ts — added isGuest state, setUserAuthState, replaced hardcoded true
- src/lib/auth/context.tsx — calls setUserAuthState on auth change
- TypeScript compilation clean (pnpm tsc --noEmit passes)
- Fix: dial_state cast uses `as unknown as DialState` (Record<string,unknown> doesn't overlap directly)

### ⏳ Pending Tasks
- [ ] Manual test: login → save dreamscape → reload → verify from Supabase
- [ ] Git commit the persistence wiring changes

## Changes Made

### Files Modified
- src/lib/persistence/supabase.ts
- src/store/app-store.ts
- src/lib/auth/context.tsx

## Implementation Notes

### Key Technical Details
- Chunk sync: DELETE all + INSERT (avoids UNIQUE (dreamscape_id, position) conflict on reorder)
- user_id must be in every upsert payload (RLS WITH CHECK enforces auth.uid() = user_id)
- feedback: string[] serialised as JSON.stringify → TEXT in DB, deserialised on read
- platform/format extracted from dialState on output save (NOT NULL columns)
- Version rows (chunk_versions, output_versions) NOT written yet — deferred with library work
- Performance snapshots NOT joined on getOutputs() — deferred with library work
- Settings: maybeSingle() + DEFAULT_SETTINGS fallback for lazy creation
- isGuest starts true in store, set to false when auth resolves in AuthProvider
- dial_state cast: `row.dial_state as unknown as DialState` (Record<string,unknown> → unknown → DialState)

### Deferred
- Performance snapshot JOIN on getOutputs
- dreamscape_chunk_versions / output_variant_versions write on save
- promoteToSeed DB wiring (still works, saves derived dreamscape via saveDreamscape)
