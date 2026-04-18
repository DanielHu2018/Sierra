---
phase: 04-pdf-dossier-export
plan: "06"
subsystem: client-pdf-export
tags: [hooks, zustand, pdf-export, topnav, fetch, blob-download]
dependency_graph:
  requires: [04-04, 04-05]
  provides: [client-pdf-trigger]
  affects: [TopNav, useExportPdf, Zustand-reads]
tech_stack:
  added: []
  patterns: [blob-url-download, zustand-selector-hook, silent-fail-demo]
key_files:
  created:
    - src/hooks/useExportPdf.ts
  modified:
    - src/components/TopNav/TopNav.tsx
    - src/components/TopNav/TopNav.test.tsx
decisions:
  - "useExportPdf reads all Zustand fields at hook call time, not inside the returned async function — React rules of hooks compliance"
  - "Silent fail pattern (try/catch + !res.ok return) used for demo stability — no toast/error UI"
  - "blob URL + synthetic anchor click pattern avoids popup blocker issue with window.open()"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-18"
  tasks_completed: 2
  files_changed: 3
---

# Phase 04 Plan 06: Client-Side PDF Export Trigger Summary

**One-liner:** useExportPdf hook reads all Zustand narrative + route content and POSTs to /api/export/pdf, triggering a blob URL browser download; TopNav Export PDF button now enabled when simulationStatus === 'complete'.

## What Was Built

### Task 1: useExportPdf hook (`src/hooks/useExportPdf.ts`)

Created `useExportPdf()` — a React hook that returns an async `exportPdf()` function. The hook reads these Zustand selectors at render time: `routes`, `selectedRoute`, `recommendation`, `triggers`, `alerts`, `projectSummary`, `narrativeByRoute`.

When `exportPdf()` is called:
1. Guards: returns early if `selectedRoute` is null or no matching route in `routes`
2. POSTs to `/api/export/pdf` with `{ routeId, route, recommendation, triggers, alerts, projectSummary, narrative }`
3. Silent-fails on network error or non-ok response
4. On success: `res.blob()` → `URL.createObjectURL` → synthetic anchor click → `URL.revokeObjectURL` (memory cleanup)
5. Download filename: `sierra-dossier-route-{routeId}.pdf`

### Task 2: TopNav wired (`src/components/TopNav/TopNav.tsx`)

Added imports for `useExportPdf` and used existing `useAppStore`. In the component:
- `const exportPdf = useExportPdf()`
- `const simulationStatus = useAppStore(s => s.simulationStatus)`
- `const isReady = simulationStatus === 'complete'`

Export PDF button updated:
- `onClick={isReady ? exportPdf : undefined}`
- `disabled={!isReady}`
- `opacity: isReady ? 1 : 0.4`
- `cursor: isReady ? 'pointer' : 'not-allowed'`

Removed hardcoded `cursor: 'not-allowed'` and `opacity: 0.4` from the static style constant; made them dynamic.

### Tests (`src/components/TopNav/TopNav.test.tsx`)

Replaced all `test.todo` stubs with a proper mock setup. Two tests implemented GREEN:
- "button is visible in TopNav render"
- "button is disabled when simulationStatus is 'idle'"

Four tests remain as `test.todo` (require per-test store mock override pattern — deferred per plan spec).

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | `a1b1aeb` | feat(04-06): create useExportPdf hook |
| Task 2 | `2e8b715` | feat(04-06): wire Export PDF button in TopNav |

## Verification Results

- `npx tsc --noEmit` — exits 0 (PASS)
- `npx vitest run src/components/TopNav/TopNav.test.tsx` — 2 passed, 4 todo (PASS per plan spec)
- `npx vitest run` (full suite) — 71 passed, 15 todo, 0 failed (PASS)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Pattern] TopNav lacked React imports for store/hook usage**
- **Found during:** Task 2
- **Issue:** TopNav.tsx had no import statements at all (used React global via JSX transform). Adding `useAppStore` and `useExportPdf` required explicit ES module imports.
- **Fix:** Added `import { useAppStore } from '../../store/useAppStore'` and `import { useExportPdf } from '../../hooks/useExportPdf'` at top of file.
- **Files modified:** `src/components/TopNav/TopNav.tsx`
- **Commit:** `2e8b715`

**2. [Rule 1 - Refactor] exportButtonStyle static constant renamed and de-hardcoded**
- **Found during:** Task 2
- **Issue:** Static `exportButtonStyle` had `cursor: 'not-allowed'` and `opacity: 0.4` hardcoded, incompatible with dynamic enabled/disabled state.
- **Fix:** Renamed to `exportButtonBaseStyle`, removed cursor/opacity, spread into button style object with dynamic values.
- **Files modified:** `src/components/TopNav/TopNav.tsx`
- **Commit:** `2e8b715`

## Self-Check: PASSED

Files exist:
- src/hooks/useExportPdf.ts — FOUND
- src/components/TopNav/TopNav.tsx — FOUND
- src/components/TopNav/TopNav.test.tsx — FOUND

Commits exist:
- a1b1aeb — FOUND
- 2e8b715 — FOUND
