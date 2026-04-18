---
phase: 04-pdf-dossier-export
plan: "04"
subsystem: narrative-pipeline
tags: [narrative, zustand, api-endpoint, tdd, sidebar]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [narrativeByRoute-zustand-state, POST-api-narrative, sidebar-narrative-wiring]
  affects: [04-06-pdf-export-button]
tech_stack:
  added: []
  patterns: [vi.hoisted-mock-pattern, express-router-unit-test, zustand-additive-extension]
key_files:
  created: []
  modified:
    - src/types.ts
    - src/store/useAppStore.ts
    - server/src/routes/aiEndpoints.ts
    - server/src/__tests__/narrative.test.ts
    - src/components/Sidebar/Sidebar.tsx
decisions:
  - "NarrativeByRoute stored as Partial<Record<'A'|'B'|'C', string>> in Zustand — partial because populated incrementally at simulation time"
  - "POST /api/narrative tested via vi.hoisted mock + router stack traversal — avoids supertest dependency while covering both success and fallback paths"
  - "Narrative calls added to existing Promise.all batch alongside triggers/alerts/summary — no additional latency, parallel execution"
metrics:
  duration_minutes: 4
  completed_date: "2026-04-18"
  tasks_completed: 3
  files_modified: 5
---

# Phase 04 Plan 04: Narrative Infrastructure Summary

**One-liner:** Pre-generation narrative pipeline wired end-to-end — POST /api/narrative endpoint with Claude + canned fallback, NarrativeByRoute Zustand type+state, and Sidebar.tsx Promise.all extended for all three routes A/B/C.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend types.ts and Zustand store with narrative fields | a04a037 | src/types.ts, src/store/useAppStore.ts |
| 2 | Add POST /api/narrative endpoint to server (TDD) | 6a28988 (RED), a173c12 (GREEN) | server/src/__tests__/narrative.test.ts, server/src/routes/aiEndpoints.ts |
| 3 | Wire POST /api/narrative into Sidebar.tsx runSimulation batch | 47851ec | src/components/Sidebar/Sidebar.tsx |

## What Was Built

### NarrativeByRoute Type (src/types.ts)
Additive export `NarrativeByRoute = Record<'A' | 'B' | 'C', string>` placed in a Phase 4 block above AppState. No existing types modified.

### Zustand Store Extension (src/store/useAppStore.ts)
- Added `NarrativeByRoute` to import list
- Added `narrativeByRoute: Partial<NarrativeByRoute>` field to AppStore interface (initialized as `{}`)
- Added `setNarrativeByRoute(routeId, narrative)` action — immutable spread update per route ID

### POST /api/narrative Endpoint (server/src/routes/aiEndpoints.ts)
Follows the exact same try/catch pattern as existing Phase 3 endpoints:
- Imports `CANNED_NARRATIVES` from `../data/canned-narrative.js`
- Claude prompt: 3-paragraph professional engineering report narrative (300-400 words) referencing Texas locations
- `max_tokens: 700` for substantial output
- On catch: silent fallback to `CANNED_NARRATIVES[routeId]`, no user-visible error

### Sidebar.tsx runSimulation Wiring (src/components/Sidebar/Sidebar.tsx)
- Added `setNarrativeByRoute` selector
- Extended Promise.all from `[triggers, alerts, summary]` to `[triggers, alerts, summary, narrativeA, narrativeB, narrativeC]`
- Three `/api/narrative` fetch calls (A/B/C) with `routeBody.constraints` passed as body
- Dispatch after resolve: `setNarrativeByRoute('A'/'B'/'C', narrativeX?.narrative ?? '')`
- `setNarrativeByRoute` added to useCallback dependency array

## Verification

- `npx tsc --noEmit` exits 0 (no TypeScript errors)
- `cd server && npx vitest run --reporter=dot` exits 0 (40/40 tests pass, 9 test files)
- NarrativeByRoute type exported from src/types.ts
- useAppStore has `narrativeByRoute` and `setNarrativeByRoute`
- server/src/routes/aiEndpoints.ts has POST /api/narrative with canned fallback
- Sidebar.tsx Promise.all includes /api/narrative calls for A, B, C

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.hoisted pattern required for Anthropic SDK mock in TDD tests**
- **Found during:** Task 2 RED phase
- **Issue:** `vi.mock('@anthropic-ai/sdk', ...)` hoists but `mockCreate` variable declared after was undefined in factory. Standard `vi.fn()` in describe body fails due to hoisting.
- **Fix:** Used `vi.hoisted(() => vi.fn())` to create `mockCreate` before hoisting, then referenced in `vi.mock` factory.
- **Files modified:** server/src/__tests__/narrative.test.ts
- **Commit:** 6a28988 (RED), a173c12 (GREEN)

## Self-Check: PASSED

- src/types.ts: FOUND
- src/store/useAppStore.ts: FOUND
- server/src/routes/aiEndpoints.ts: FOUND
- src/components/Sidebar/Sidebar.tsx: FOUND
- Commit a04a037: FOUND (Task 1 — types + store)
- Commit 6a28988: FOUND (Task 2 RED — failing tests)
- Commit a173c12: FOUND (Task 2 GREEN — endpoint implementation)
- Commit 47851ec: FOUND (Task 3 — Sidebar wiring)
