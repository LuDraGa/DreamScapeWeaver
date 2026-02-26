# Planning: SSR-Safe Persistence for Next.js App Router

**Date**: 2026-02-26
**Task**: P1 Production MVP Item #6 - Make persistence SSR-safe
**Priority**: P0 - CRITICAL (blocks Vercel deployment)
**Estimated Effort**: 2-3 hours

## Problem Statement

The current localStorage persistence implementation will crash during Next.js SSR/SSG builds on Vercel because:

1. **No SSR guards**: All localStorage access in `src/lib/persistence/local.ts` directly calls `localStorage.getItem/setItem/removeItem` without checking `typeof window !== 'undefined'`
2. **Unsafe reset function**: Settings page uses `localStorage.clear()` which clears ALL browser storage (not just app data)
3. **Non-compliant key format**: Using `storyweaver_*` prefix instead of spec-compliant `sg:*` format

## Current State Analysis

### Files with localStorage issues:

**`src/lib/persistence/local.ts`** - 8 methods without SSR guards:
- `getDreamscapes()` - line 15
- `saveDreamscape()` - line 25
- `deleteDreamscape()` - line 37
- `getOutputs()` - line 49
- `saveOutput()` - line 59
- `deleteOutput()` - line 71
- `getSettings()` - line 83
- `saveSettings()` - line 103

**`src/app/app/settings/page.tsx`** - Unsafe reset:
- Line 140: `localStorage.clear()` - clears ALL localStorage including other apps' data

**`src/lib/persistence/local.ts`** - Wrong key format:
- Current: `STORAGE_KEYS = { DREAMSCAPES: 'storyweaver_dreamscapes', ... }`
- Required: `STORAGE_KEYS = { DREAMSCAPES: 'sg:dreamscapes', ... }`

**`src/store/app-store.ts`** - Wrong persist key:
- Current: `name: 'storyweaver-storage'`
- Required: `name: 'sg:store'`

## Proposed Solution

### Phase 1: Add SSR Guards (Critical - 45 min)

Add `typeof window !== 'undefined'` checks to all localStorage access:

```typescript
// Before:
async getDreamscapes(): Promise<Dreamscape[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DREAMSCAPES)
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    console.error('Failed to load dreamscapes:', error)
    return []
  }
}

// After:
async getDreamscapes(): Promise<Dreamscape[]> {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DREAMSCAPES)
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    console.error('Failed to load dreamscapes:', error)
    return []
  }
}
```

Apply this pattern to all 8 methods in `local.ts`.

### Phase 2: Namespaced Reset Function (High - 30 min)

Create safe reset function that only clears app data:

```typescript
// In src/lib/persistence/local.ts:
export function clearAllAppData(): void {
  if (typeof window === 'undefined') return

  // Clear all sg:* keys
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sg:')) {
      localStorage.removeItem(key)
    }
  })
}
```

Replace in settings page:

```typescript
// Before:
localStorage.clear()

// After:
import { clearAllAppData } from '@/lib/persistence/local'
clearAllAppData()
```

### Phase 3: Key Migration (Medium - 1 hour)

Update all storage keys to use `sg:*` format and migrate existing data:

```typescript
// Update STORAGE_KEYS constant:
const STORAGE_KEYS = {
  DREAMSCAPES: 'sg:dreamscapes',
  OUTPUTS: 'sg:outputs',
  SETTINGS: 'sg:settings',
} as const

// Add migration helper:
export function migrateStorageKeys(): void {
  if (typeof window === 'undefined') return

  const migrations = [
    { old: 'storyweaver_dreamscapes', new: 'sg:dreamscapes' },
    { old: 'storyweaver_outputs', new: 'sg:outputs' },
    { old: 'storyweaver_settings', new: 'sg:settings' },
    { old: 'storyweaver-storage', new: 'sg:store' },
  ]

  migrations.forEach(({ old, new: newKey }) => {
    const data = localStorage.getItem(old)
    if (data) {
      localStorage.setItem(newKey, data)
      localStorage.removeItem(old)
    }
  })
}
```

Call migration in root layout `useEffect` on client-side mount.

## Implementation Checklist

### Phase 1: SSR Guards ✅
- [ ] Add SSR guard to `getDreamscapes()`
- [ ] Add SSR guard to `saveDreamscape()`
- [ ] Add SSR guard to `deleteDreamscape()`
- [ ] Add SSR guard to `getOutputs()`
- [ ] Add SSR guard to `saveOutput()`
- [ ] Add SSR guard to `deleteOutput()`
- [ ] Add SSR guard to `getSettings()`
- [ ] Add SSR guard to `saveSettings()`
- [ ] Test SSR build: `pnpm build`

### Phase 2: Namespaced Reset ✅
- [ ] Create `clearAllAppData()` function in `local.ts`
- [ ] Export function from `local.ts`
- [ ] Import in `settings/page.tsx`
- [ ] Replace `localStorage.clear()` with `clearAllAppData()`
- [ ] Test reset functionality

### Phase 3: Key Migration ✅
- [ ] Update `STORAGE_KEYS` constants to `sg:*` format
- [ ] Create `migrateStorageKeys()` helper function
- [ ] Update Zustand persist key to `sg:store`
- [ ] Add migration call to root layout
- [ ] Test migration preserves existing user data

## Files to Modify

1. **`src/lib/persistence/local.ts`**
   - Add SSR guards to all 8 methods
   - Update `STORAGE_KEYS` to use `sg:*` format
   - Add `clearAllAppData()` function
   - Add `migrateStorageKeys()` function

2. **`src/app/app/settings/page.tsx`**
   - Import `clearAllAppData`
   - Replace `localStorage.clear()` (line 140)

3. **`src/store/app-store.ts`**
   - Update persist `name` to `'sg:store'` (line 198)

4. **`src/app/layout.tsx`** (root layout)
   - Add migration call on client mount

## Testing Strategy

### SSR Safety Tests:
1. `pnpm build` - Should complete without localStorage errors
2. Check `.next/server/` output - Pages should render
3. Browser console - No hydration errors

### Functional Tests:
1. Create flow - Verify dreamscape storage works
2. Library - Verify saved items load
3. Settings - Verify settings persist
4. Reset - Verify only app data cleared

### Migration Tests:
1. Create test data with old keys
2. Verify migration copies to new keys
3. Verify old keys removed
4. Verify no data loss

## Success Criteria

✅ `pnpm build` completes without errors
✅ All pages render during SSR
✅ No hydration errors in browser
✅ localStorage works in browser
✅ Reset only clears app data
✅ Storage keys use `sg:*` format
✅ Existing user data preserved

---

*Ready to implement*
