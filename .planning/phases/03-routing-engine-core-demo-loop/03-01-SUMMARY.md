---
phase: 03-routing-engine-core-demo-loop
plan: 01
subsystem: test-scaffolding
tags: [tdd, test-stubs, recharts, ngraph, routing, wave-0]
dependency_graph:
  requires: []
  provides:
    - server/src/__tests__/routing.test.ts
    - server/src/__tests__/cannedFallback.test.ts
    - src/components/Sidebar/results/RouteCards.test.tsx
    - src/components/Sidebar/results/RadarChart.test.tsx
    - src/components/Sidebar/results/SierraRecommends.test.tsx
    - src/components/Sidebar/results/EnvTriggerPanel.test.tsx
    - src/components/Sidebar/results/SierraAlerts.test.tsx
    - src/components/Sidebar/results/ProjectSummary.test.tsx
    - src/components/MapCanvas/RouteLayer.test.tsx
  affects: []
tech_stack:
  added:
    - recharts (client — RadarChart component for route comparison)
    - ngraph.path (server — A* pathfinding algorithm)
    - ngraph.graph (server — graph data structure for ngraph.path)
  patterns:
    - test.todo stubs with vitest describe/test only imports (no missing module imports)
    - Wave 0 gate pattern — all test scaffolds before any production code
key_files:
  created:
    - server/src/__tests__/routing.test.ts
    - server/src/__tests__/cannedFallback.test.ts
    - src/components/Sidebar/results/RouteCards.test.tsx
    - src/components/Sidebar/results/RadarChart.test.tsx
    - src/components/Sidebar/results/SierraRecommends.test.tsx
    - src/components/Sidebar/results/EnvTriggerPanel.test.tsx
    - src/components/Sidebar/results/SierraAlerts.test.tsx
    - src/components/Sidebar/results/ProjectSummary.test.tsx
    - src/components/MapCanvas/RouteLayer.test.tsx
  modified:
    - package.json (recharts added)
    - server/package.json (ngraph.path, ngraph.graph added)
decisions:
  - "Wave 0 gate cleared: all 9 test scaffolds exist before any production code is written"
  - "test.todo pattern chosen over vi.stubGlobal — simplest approach that avoids missing module import errors"
metrics:
  duration: 1min
  completed_date: 2026-04-18
  tasks_completed: 3
  files_created: 9
  files_modified: 2
---

# Phase 3 Plan 1: Dependency Install + Test Scaffolds (Wave 0 Gate) Summary

**One-liner:** Installed recharts + ngraph.path/ngraph.graph, created 9 test.todo stub files across client and server to establish the Nyquist sampling contract before any production code.

## What Was Built

Wave 0 gate: all test scaffolds exist in RED state so subsequent implementation plans have verified `<automated>` commands to run against.

**Dependencies installed:**
- `recharts` — client-side radar/spider chart library for route comparison visualization
- `ngraph.path` + `ngraph.graph` — server-side A* pathfinding dependencies

**Server test scaffolds (2 files, 10 todo stubs):**
- `routing.test.ts` — A* engine: findRoute, three parallel routes, weight profiles, findNearestNode
- `cannedFallback.test.ts` — canned content shapes: reasoning stream, recommendation, triggers, alerts, segment justifications

**Client test scaffolds (7 files, 25 todo stubs):**
- `RouteCards.test.tsx` — card rendering + click interaction
- `RadarChart.test.tsx` — recharts radar structure with route colors
- `SierraRecommends.test.tsx` — recommendation panel with rationale
- `EnvTriggerPanel.test.tsx` — ESA/CWA/NHPA/NEPA trigger sections
- `SierraAlerts.test.tsx` — primary + secondary alert structure
- `ProjectSummary.test.tsx` — six-row timeline + disclaimer
- `RouteLayer.test.tsx` — hover justifications from Zustand store (not fetched on hover)

## Verification Results

- `npx vitest run` (client): 6 passed | 7 skipped (todo) — exits 0
- `cd server && npx vitest run` (server): 4 passed | 2 skipped (todo) — exits 0
- All 9 test files confirmed present on disk
- `recharts`, `ngraph.path`, `ngraph.graph` all confirmed in node_modules

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Install recharts + ngraph dependencies | 47c2aa0 |
| 2 | Server test scaffolds (routing + canned fallback) | 2e99f87 |
| 3 | Client component test scaffolds (7 files) | a46f134 |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

All 9 test files confirmed present. All 3 commits confirmed in git log. Both vitest runners exit 0.
