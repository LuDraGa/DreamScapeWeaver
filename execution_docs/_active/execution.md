# StoryWeaver - Active Execution

## Task: Speed Optimization — Route Skeletons, Prefetch, Bundle Analyzer

**Session**: 2026-03-11
**Context**: Adding perceived speed optimizations: loading.tsx skeletons for all 4 app routes, router.prefetch for likely next routes, and @next/bundle-analyzer setup.

## Execution Status

### ✅ Completed Tasks

- [x] Create loading.tsx for /app/app/create/
- [x] Create loading.tsx for /app/app/library/
- [x] Create loading.tsx for /app/app/billing/
- [x] Create loading.tsx for /app/app/settings/
- [x] Add router.prefetch('/app/create') in library page
- [x] Install and configure @next/bundle-analyzer
- [x] Build verified — all routes compile cleanly
- [x] Add empty state for Rate & Save step when no outputs generated

### 🔄 In Progress

*None*

### ⏳ Pending Tasks

*None*

## Changes Made

### Files Created
- src/app/app/create/loading.tsx — skeleton: title + step bar + chunk cards
- src/app/app/library/loading.tsx — skeleton: title + tabs + search + 6 card grid
- src/app/app/billing/loading.tsx — skeleton: title + 3 stat cards + topup grid + history
- src/app/app/settings/loading.tsx — skeleton: title + 4 settings cards with form fields

### Files Modified
- next.config.ts — added @next/bundle-analyzer (conditional on ANALYZE=true)
- package.json — added "analyze" script, added @next/bundle-analyzer devDep
- src/app/app/library/page.tsx — added router.prefetch('/app/create') on mount
- src/app/app/create/page.tsx — added empty state for Rate & Save step (icon + message + "Go to Platform & Style" button)

### Files Deleted
-

## Implementation Notes

### Key Technical Details
- loading.tsx files are Server Components — Next.js auto-wraps them as Suspense fallbacks during client-side navigation
- Skeletons use existing Skeleton component + inline card styles matching ThemedCard appearance
- Bundle analyzer opens browser treemaps for client + server bundles when `pnpm analyze` is run
- Prefetch in library ensures create page JS is already downloaded before user clicks "Continue" on a dreamscape
- Next.js Link components already prefetch visible links by default in production — sidebar nav benefits from this automatically

## Testing Notes
- Build passes cleanly with all new files
- Create page: 19.8 kB + 254 kB first load
- Library page: 6.5 kB + 212 kB first load
- Billing: 5.6 kB + 176 kB first load
- Settings: 4.05 kB + 203 kB first load

## Developer Actions Required
- [ ] Run `pnpm analyze` to see bundle treemap and identify optimization targets
- [ ] Test route transitions in dev to see skeletons (they flash briefly during navigation)
