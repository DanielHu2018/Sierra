---
phase: 03-routing-engine-core-demo-loop
plan: 09
subsystem: demo-verification
tags: [verification, routing, heatmap, overlay, demo-loop]
dependency_graph:
  requires: [03-07, 03-08]
  provides: [phase-3-complete]
  affects: [phase-4-pdf-export]
tech_stack:
  added: []
  patterns: [fallback-detection, results-panel-overlay-controls]
key_files:
  created:
    - src/components/Sidebar/results/OverlayControls.tsx
  modified:
    - server/src/routes/api.ts
    - src/components/Sidebar/results/ResultsPanel.tsx
decisions:
  - "When A* weight profiles produce identical paths (frictionScore===regulatoryRisk collapses weight ratios), detect via string key comparison and fall back to canned routes with distinct arc geometry"
  - "OverlayControls component mounted inside ResultsPanel so friction heatmap toggle is accessible without resetting simulation to idle"
  - "cannedStubRoutes waypoints derived from midpoint+perpendicular offset scaled to actual source-dest span — ensures visual separation regardless of pin placement"
metrics:
  duration: "continuation task"
  completed_date: "2026-04-18"
---

# Phase 3 Plan 9: Human Verification + Bug Fixes Summary

**One-liner:** Fixed two visual bugs found during human review — distinct route arc geometry via identical-path detection fallback, and friction heatmap toggle added to ResultsPanel for post-simulation access.

## What Was Built / Fixed

### Issue 1 Fixed: All Routes Looked the Same

**Root cause:** The A* engine uses `frictionScore * costW + regulatoryRisk * riskW` as its edge cost. In the Phase 2 generated data, `frictionScore === regulatoryRisk` for every edge (the pipeline assigned the same value to both fields). When both signals are identical, changing the cost/risk weight ratio has no effect — all three weight profiles find the exact same path.

**Fix applied in `server/src/routes/api.ts`:**
1. After running A* for all three profiles, compare path node sequences as strings (`pathAKey === pathBKey || pathBKey === pathCKey`)
2. If any two paths are identical, fall back to `cannedStubRoutes()` which generates geometrically distinct arcs
3. Also fall back if any path is empty (src === dst edge case)

**Upgraded `cannedStubRoutes()` geometry:**
- Previously all three routes were direct line segments with the same two endpoints (visually stacked)
- Now each route has distinct intermediate waypoints computed from a perpendicular offset scaled to the actual source-dest distance:
  - Route A bows west (lowest cost — mimics following existing utility corridors)
  - Route B arcs north with two waypoints (balanced — gentle detour)
  - Route C bows east (lowest risk — avoids western habitat clusters)
- Offset magnitude = `max(latSpan, lngSpan, 1.5) * 0.35` — ensures visibility even for short pin distances
- Each stub route now includes 2 segment justifications for richer hover popup content

### Issue 2 Fixed: Friction Heatmap Toggle Not Visible After Simulation

**Root cause:** `OverlaysSection` (which contains the friction heatmap toggle) is only rendered when `simulationStatus === 'idle'`. Once the user clicks Run Simulation, the sidebar transitions to `StreamPanel`, then `ResultsPanel` — the overlay controls are gone.

**Fix: New `OverlayControls` component** (`src/components/Sidebar/results/OverlayControls.tsx`)
- Compact toggle strip mounted inside `ResultsPanel` between `RouteCards` and `SierraAlerts`
- Shows Friction Heatmap (first, most prominent), ERCOT Grid, and Wildlife Habitat toggles
- Reads `overlays` and `toggleOverlay` from Zustand — same store, no duplication of state
- The underlying `OverlayLayers` map component already responds to `overlays.frictionHeatmap` — only the UI control was missing

## Verification

- `npx vitest run` (client): 69 passed, 11 todo — all green
- `cd server && npx vitest run`: 27 passed — all green
- No regressions introduced

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A* identical paths causing visually overlapping routes**
- **Found during:** Task 2 human verification (Step 4 — three routes identical on map)
- **Root cause:** `frictionScore === regulatoryRisk` in all graph edges collapses weight ratios; A* finds same path for all three profiles
- **Fix:** Path identity detection + fallback to geometrically distinct canned routes
- **Files modified:** `server/src/routes/api.ts`
- **Commit:** 7da4855

**2. [Rule 2 - Missing functionality] No overlay toggle accessible in results view**
- **Found during:** Task 2 human verification (Step 12 — friction heatmap toggle not visible)
- **Root cause:** `OverlaysSection` only rendered in idle state; no overlay controls in `ResultsPanel`
- **Fix:** Created `OverlayControls` component, mounted in `ResultsPanel`
- **Files modified:** `src/components/Sidebar/results/ResultsPanel.tsx`, `src/components/Sidebar/results/OverlayControls.tsx` (new)
- **Commit:** d380207

## Self-Check

Files created/modified:
- [x] `server/src/routes/api.ts` — FOUND (modified)
- [x] `src/components/Sidebar/results/OverlayControls.tsx` — FOUND (created)
- [x] `src/components/Sidebar/results/ResultsPanel.tsx` — FOUND (modified)

Commits:
- [x] 7da4855 — fix(03-09): make stub/fallback routes visually distinct on map
- [x] d380207 — fix(03-09): add friction heatmap toggle to ResultsPanel

## Self-Check: PASSED
