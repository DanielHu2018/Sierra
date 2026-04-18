---
phase: 05-demo-hardening-polish
plan: "03"
subsystem: frontend-error-handling
tags: [error-state, api-hardening, heatmap, accessibility, DATA-04, DATA-06]
dependency_graph:
  requires: ["05-01"]
  provides: [sidebar-error-branch, vite-api-url-prefix, silent-geojson-errors, blue-red-heatmap, heatmap-legend]
  affects: [Sidebar, MapCanvas, OverlayLayers, useReasoningStream, useExportPdf]
tech_stack:
  added: []
  patterns: [VITE_API_URL prefix for all fetch calls, simulationStatus error branch pattern, onError silent swallow on react-map-gl Source]
key_files:
  created: []
  modified:
    - src/components/Sidebar/Sidebar.tsx
    - src/components/MapCanvas/OverlayLayers.tsx
    - src/components/MapCanvas/MapCanvas.tsx
    - src/hooks/useReasoningStream.ts
    - src/hooks/useExportPdf.ts
decisions:
  - "simulationStatus='error' branch is a separate early-return in Sidebar JSX, not folded into idle branch — keeps error state visually distinct and test-isolated"
  - "VITE_API_URL stored in const API at top of runSimulation closure — one read per call rather than repeated import.meta.env access"
  - "Heatmap legend placed in MapCanvas.tsx (not OverlayLayers.tsx) — MapCanvas has access to Zustand overlay toggle state needed for conditional render"
  - "onError on react-map-gl Source silently logs to console.warn — no user toast, no state mutation, keeps toggle interactive per DATA-04 spec"
metrics:
  duration: "~8 minutes"
  completed_date: "2026-04-18"
  tasks_completed: 2
  files_changed: 5
---

# Phase 5 Plan 03: Error Handling, VITE_API_URL & Heatmap Polish Summary

**One-liner:** Sidebar shows graceful error recovery on route failures, all fetch calls use VITE_API_URL for Railway production, and the friction heatmap renders a colorblind-accessible blue-to-red gradient with legend.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Sidebar error branch + VITE_API_URL prefix (DATA-04) | 84ef25e | Sidebar.tsx, useReasoningStream.ts, useExportPdf.ts |
| 2 | GeoJSON silent skip + blue-red heatmap gradient + legend (DATA-04 + DATA-06) | 0d1f9fa | OverlayLayers.tsx, MapCanvas.tsx |

## What Was Built

### Task 1: Sidebar Error Branch + VITE_API_URL Prefix

**Sidebar.tsx error branch:**
- Added `if (simulationStatus === 'error')` early-return that renders the full sidebar controls plus an error message panel
- Error panel shows "Route generation failed. Please retry." (exact text from DATA-04 spec)
- Retry button calls `useAppStore.getState().setSimulationStatus('idle')` — resets to idle only, no auto-retry

**useRunSimulation logic (inline in Sidebar.tsx):**
- Added `const API = import.meta.env.VITE_API_URL ?? ''` at top of `runSimulation`
- Updated all 9 fetch calls to use `${API}/api/...` prefix
- Added `if (!routesRes.ok) throw new Error('route-failed')` before parsing response body
- catch block now dispatches `useAppStore.getState().setSimulationStatus('error')`

**Other hooks:**
- `useReasoningStream.ts`: `/api/stream/reasoning` → `${import.meta.env.VITE_API_URL ?? ''}/api/stream/reasoning`
- `useExportPdf.ts`: `/api/export/pdf` → `${import.meta.env.VITE_API_URL ?? ''}/api/export/pdf`

### Task 2: GeoJSON Silent Skip + Heatmap Blue→Red + Legend

**OverlayLayers.tsx:**
- Added `onError={(e) => console.warn('[OverlayLayers] ... overlay failed to load', e)}` to all 4 `<Source>` components (ercot-grid, land-boundary, wildlife-habitat, topography)
- Replaced green→red heatmap-color interpolation with blue→red: transparent at 0, #3291FF at 0.1, #9B6FFF at 0.5, #FF4444 at 1.0
- Adjusted heatmap-opacity from 0.85 to 0.7 per spec

**MapCanvas.tsx:**
- Added `overlays` subscription from Zustand store
- Added conditional legend `{overlays.frictionHeatmap && (<div>...legend...</div>)}` inside the Map JSX
- Legend positioned at `bottom: 50, right: 10` with glassmorphism styling matching existing design system
- Shows "Low Friction" in #3291FF | gradient bar | "High Friction" in #FF4444

## Verification Results

```
Test Files  14 passed | 3 skipped (17)
Tests       84 passed | 15 todo (99)
TypeScript  0 errors (npx tsc --noEmit)
```

- Sidebar.test.tsx: Test A, B, C all green (error message, Retry button, idle exclusion)
- MapCanvas.test.tsx: still green (no regressions from OverlayLayers/MapCanvas changes)
- contrast.test.ts: 6/6 still green
- All pre-existing test.todo stubs remain untouched

## Success Criteria Verification

- [x] `npx vitest run src/components/Sidebar/Sidebar.test.tsx` — all 3 tests pass
- [x] `npx tsc --noEmit` — no TypeScript errors
- [x] Sidebar.tsx contains "Route generation failed" and "Retry" text
- [x] OverlayLayers.tsx contains '#3291FF' and '#FF4444' in heatmap paint
- [x] All `fetch('/api/...')` calls in src/ use VITE_API_URL prefix (Sidebar.tsx via const API, useReasoningStream.ts, useExportPdf.ts)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] useRunSimulation.ts file did not exist**
- **Found during:** Task 1, Step 1 (grep for file)
- **Issue:** Plan references `src/hooks/useRunSimulation.ts` as a separate hook file, but the runSimulation logic lives inline in `Sidebar.tsx` (it was never extracted to a separate hook in prior phases)
- **Fix:** Applied all changes (VITE_API_URL prefix, non-2xx check, error catch dispatch) directly to the `runSimulation` callback in Sidebar.tsx — same logical outcome, no new file needed
- **Files modified:** src/components/Sidebar/Sidebar.tsx
- **Impact:** Zero — plan's required behaviors are fully delivered; file name was incidental

## Self-Check: PASSED

All key files exist on disk. Both task commits (84ef25e, 0d1f9fa) confirmed in git log. Full test suite 84 passed / 0 failed. TypeScript clean.
